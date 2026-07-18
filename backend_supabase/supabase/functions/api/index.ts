import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { CATEGORIES, type Role, type Status, type CommentStatus, type Lang } from "../_shared/constants.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "";
const EMERGENT_LLM_KEY = Deno.env.get("EMERGENT_LLM_KEY") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";

function getSupabaseAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

// --------------- Rate limiting ---------------
const rateMap = new Map<string, { count: number; reset: number }>();

function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateMap.get(key);
  if (!entry || now > entry.reset) {
    rateMap.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

// --------------- Validation helpers ---------------
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return ["http:", "https:"].includes(u.protocol);
  } catch {
    return false;
  }
}

function validatePassword(password: string): string | null {
  if (!password || password.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password)) return "Password must contain an uppercase letter";
  if (!/[a-z]/.test(password)) return "Password must contain a lowercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain a number";
  return null;
}

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

// --------------- Auth helpers ---------------
function decodeJwt(token: string): any {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(part.padEnd(part.length + (4 - part.length % 4) % 4, "="));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

async function getUser(req: Request, requireAuth = true) {
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    if (requireAuth) throw new Error("Not authenticated");
    return null;
  }
  // Validate signature/expiry against the auth server.
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await client.auth.getUser(token);
  if (error) {
    if (requireAuth) throw new Error("Not authenticated");
    return null;
  }
  let user: any = data?.user || null;
  // The SDK user object came back without id/email in this runtime, so derive
  // them directly from the (already-validated) JWT.
  if (!user?.id) {
    const p = decodeJwt(token);
    user = p?.sub ? { id: p.sub, email: p.email, user_metadata: p.user_metadata || {} } : null;
  }
  if (!user?.id) {
    if (requireAuth) throw new Error("Not authenticated");
    return null;
  }
  return user;
}

async function requireRole(user: any, ...roles: Role[]) {
  if (!user) throw new Error("Not authenticated");
  const { data } = await getSupabaseAdmin()
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!data || !roles.includes(data.role as Role)) {
    throw new Error("Insufficient permissions");
  }
}

// --------------- Slugify ---------------
function slugify(text: string): string {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// GET /users/me — current user from Supabase auth
async function handleMe(req: Request, _m: any, user: any) {
  return jsonResponse(user, 200, req);
}

// GET /users/me/profile — user profile from user_profiles table
async function handleMyProfile(req: Request, _m: any, user: any) {
  const supabase = getSupabaseAdmin();
  let { data } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Self-heal: if the signup trigger didn't create a profile, create it now
  // (default role 'reader'). This makes login resilient to a missing/broken trigger.
  if (!data) {
    const meta = user.user_metadata || {};
    const name = meta.name || meta.full_name || (user.email || "user").split("@")[0];
    let slug = slugify(name) || `user-${String(user.id).slice(0, 8)}`;
    const { data: clash } = await supabase
      .from("user_profiles").select("id").eq("slug", slug).maybeSingle();
    if (clash) slug = `${slug}-${String(user.id).slice(0, 4)}`;
    const ins = await supabase
      .from("user_profiles")
      .insert({
        id: user.id,
        email: user.email,
        name,
        slug,
        role: "reader",
        avatar_url: meta.avatar_url || meta.picture || "",
      })
      .select()
      .single();
    data = ins.data;
  }

  if (!data) return errorResponse("Profile not found", 404, req);
  return jsonResponse(data, 200, req);
}

// --------------- ADMIN COMMENTS ---------------
// GET /admin/comments
async function handleAdminListComments(req: Request, _m: any, user: any) {
  await requireRole(user, "owner", "editor");
  const supabase = getSupabaseAdmin();
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "200"), 500);

  let query = supabase.from("comments").select("*").order("created_at", { ascending: false }).limit(limit);
  if (status) query = query.eq("status", status);
  const { data } = await query;
  return jsonResponse(data || [], 200, req);
}

// PATCH /admin/comments/:id
async function handleModerateComment(req: Request, match: RegExpExecArray, user: any) {
  await requireRole(user, "owner", "editor");
  const supabase = getSupabaseAdmin();
  const commentId = match[1];
  const body = await req.json();
  if (!["approved", "spam", "pending"].includes(body.status)) {
    return errorResponse("Invalid status", 400, req);
  }
  const { data, error } = await supabase
    .from("comments")
    .update({ status: body.status })
    .eq("id", commentId)
    .select()
    .single();
  if (error || !data) return errorResponse("Comment not found", 404, req);
  return jsonResponse({ success: true }, 200, req);
}

// --------------- INVITES ---------------
async function handleInvites(req: Request, match: RegExpExecArray | null, user: any) {
  const supabase = getSupabaseAdmin();
  const token = match?.[1];
  const url = new URL(req.url);

  // Public: GET /invites/token/:token — check invite validity
  if (req.method === "GET" && token && !url.pathname.includes("/accept")) {
    await requireRole(user, "owner", "editor");
    const { data: invite } = await supabase
      .from("invites")
      .select("*")
      .eq("token", token)
      .single();
    if (!invite) return errorResponse("Invite not found", 404, req);
    if (invite.status !== "pending") return errorResponse("Invite already used or revoked", 400, req);
    if (new Date(invite.expires_at) < new Date()) return errorResponse("Invite expired", 400, req);
    return jsonResponse({
      email: invite.email,
      name: invite.name,
      role: invite.role,
      invited_by: invite.invited_by,
    });
  }

  // Protected: CRUD management
  await requireRole(user, "owner", "editor");

  // GET /invites — list all
  if (req.method === "GET" && !token) {
    const { data } = await supabase
      .from("invites")
      .select("*")
      .order("created_at", { ascending: false });
    return jsonResponse(data || [], 200, req);
  }

  // POST /invites — create new
  if (req.method === "POST") {
    const body = await req.json();
    if (!["author", "editor"].includes(body.role)) {
      return errorResponse("Invalid role", 400, req);
    }
    const email = body.email?.toLowerCase().trim();
    if (!email || !isValidEmail(email)) {
      return errorResponse("Valid email required", 400, req);
    }

    // Check existing user
    const { data: existingUser } = await supabase
      .from("user_profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (existingUser) return errorResponse("A user with this email already exists", 400, req);

    const inviteToken = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: invite, error } = await supabase
      .from("invites")
      .insert({
        token: inviteToken,
        email,
        name: body.name,
        role: body.role,
        invited_by: user.user_metadata?.name || "Admin",
        invited_by_id: user.id,
        status: "pending",
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) return errorResponse("Internal server error", 500, req);
    const acceptUrl = `${FRONTEND_URL}/id/invite/${inviteToken}`;
    return jsonResponse({
      success: true,
      invite_id: invite.id,
      accept_url: acceptUrl,
    }, 201);
  }

  // DELETE /invites/:id
  if (req.method === "DELETE" && token) {
    const { error } = await supabase.from("invites").delete().eq("id", token);
    if (error) return errorResponse("Invite not found", 404, req);
    return jsonResponse({ success: true }, 200, req);
  }

  return errorResponse("Method not allowed", 405, req);
}

// POST /invites/token/:token/accept — accept invite & create auth user
async function handleAcceptInvite(req: Request, match: RegExpExecArray) {
  const supabase = getSupabaseAdmin();
  const inviteToken = match[1];
  const body = await req.json();

  // Rate limit: 5 attempts per 15 min per IP
  const ip = getClientIp(req);
  if (!rateLimit(`invite-accept:${ip}`, 5, 15 * 60 * 1000)) {
    return errorResponse("Too many attempts. Please try again later.", 429, req);
  }

  const pwError = validatePassword(body.password || "");
  if (pwError) return errorResponse(pwError, 400, req);

  const { data: invite } = await supabase
    .from("invites")
    .select("*")
    .eq("token", inviteToken)
    .single();

  if (!invite) return errorResponse("Invite not found", 404, req);
  if (invite.status !== "pending") return errorResponse("Invite already used", 400, req);
  if (new Date(invite.expires_at) < new Date()) return errorResponse("Invite expired", 400, req);

  // Create auth user
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: invite.email,
    password: body.password,
    email_confirm: true,
    user_metadata: {
      name: invite.name,
      slug: slugify(invite.name) || `user-${crypto.randomUUID().slice(0, 8)}`,
      role: invite.role,
    },
  });

  if (authError) return errorResponse("Failed to create user account", 500, req);

  // Apply the invited role. The signup trigger creates every profile as 'author';
  // elevate here via service_role (clients cannot set role themselves).
  await supabase
    .from("user_profiles")
    .update({ role: invite.role })
    .eq("id", authUser.user.id);

  // Mark invite as accepted
  await supabase
    .from("invites")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("token", inviteToken);

  // Get profile
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", authUser.user.id)
    .single();

  return jsonResponse(profile || { success: true }, 200, req);
}

// GET /subscribers (admin)
async function handleSubscribersList(req: Request, _m: any, user: any) {
  await requireRole(user, "owner", "editor");
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("subscribers")
    .select("*")
    .order("created_at", { ascending: false });
  return jsonResponse(data || [], 200, req);
}

// --------------- HANDLERS ---------------

// GET /categories
async function handleCategories(req: Request, match: RegExpExecArray) {
  const supabase = getSupabaseAdmin();
  const results = [];
  for (const c of CATEGORIES) {
    const { count } = await supabase
      .from("articles")
      .select("*", { count: "exact", head: true })
      .eq("status", "published")
      .eq("category_slug", c.slug);
    results.push({ ...c, count: count || 0 });
  }
  return jsonResponse(results, 200, req);
}

// GET /articles
async function handleListArticles(req: Request) {
  const supabase = getSupabaseAdmin();
  const url = new URL(req.url);
  const lang = url.searchParams.get("lang") || "id";
  const category = url.searchParams.get("category");
  const tag = url.searchParams.get("tag");
  const author = url.searchParams.get("author");
  const q = url.searchParams.get("q");
  let status = url.searchParams.get("status") || "published";
  // Only authenticated users may list non-published (draft/review) articles;
  // otherwise anyone could scrape unpublished content via ?status=draft.
  if (status !== "published") {
    const authUser = await getUser(req, false).catch(() => null);
    if (!authUser) status = "published";
  }
  const featured = url.searchParams.get("featured");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
  // `page` takes precedence over `skip` for paginated clients. Page is 1-indexed.
  const pageParam = parseInt(url.searchParams.get("page") || "0", 10);
  const skip = pageParam > 0 ? (pageParam - 1) * limit : parseInt(url.searchParams.get("skip") || "0");
  const paginated = url.searchParams.get("paginated") === "true";

  // count: "exact" returns total row count alongside the page slice — 1 query, not 2.
  const selectOpts = paginated ? { count: "exact" as const } : undefined;
  let query = supabase
    .from("articles")
    .select("*", selectOpts)
    .eq("status", status)
    .order("published_at", { ascending: false, nullsFirst: false })
    .range(skip, skip + limit - 1);

  if (category) query = query.eq("category_slug", category);
  if (tag) query = query.contains("tags", [tag]);
  if (author) query = query.eq("author_slug", author);
  if (featured === "true") query = query.eq("featured", true);

  if (q) {
    const field = `content_${lang}`;
    // Strip chars that would break/inject the PostgREST `.or()` filter string.
    const safeQ = q.replace(/[%,().\\{}]/g, " ").trim();
    if (safeQ) {
      query = query.or(
        `${field}->>title.ilike.%${safeQ}%,${field}->>excerpt.ilike.%${safeQ}%,tags.cs.{${safeQ}}`
      );
    }
  }

  const { data, error, count } = await query;
  if (error) return errorResponse("Internal server error", 500, req);

  // Backward compatible: non-paginated callers (Home, Dashboard, Editor, Authors)
  // still receive a bare array. Paginated callers (ArticleList) opt-in to a
  // structured response with total count for server-side pagination.
  if (paginated) {
    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return jsonResponse({
      data: data || [],
      pagination: {
        page: pageParam > 0 ? pageParam : 1,
        limit,
        total,
        totalPages,
        hasNext: skip + limit < total,
        hasPrev: skip > 0,
      },
    }, 200, req);
  }
  return jsonResponse(data || [], 200, req);
}

// GET /articles/featured
async function handleFeaturedArticles(req: Request) {
  const supabase = getSupabaseAdmin();
  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") || "3");
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("status", "published")
    .eq("featured", true)
    .order("published_at", { ascending: false })
    .limit(limit);
  if (error) return errorResponse("Internal server error", 500, req);
  return jsonResponse(data || [], 200, req);
}

// GET /articles/popular
async function handlePopularArticles(req: Request) {
  const supabase = getSupabaseAdmin();
  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") || "6");
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("status", "published")
    .order("views", { ascending: false })
    .limit(limit);
  if (error) return errorResponse("Internal server error", 500, req);
  return jsonResponse(data || [], 200, req);
}

// GET /articles/:slug
async function handleGetArticle(req: Request, match: RegExpExecArray) {
  const supabase = getSupabaseAdmin();
  const url = new URL(req.url);
  const lang = url.searchParams.get("lang") || "id";
  const slug = match[1];
  const slugField = `content_${lang}` as any;

  let { data: article, error } = await supabase
    .from("articles")
    .select("*")
    .eq(`${slugField}->>slug`, slug)
    .single();

  if (!article) {
    // Try other lang
    const otherLang = lang === "id" ? "en" : "id";
    const otherField = `content_${otherLang}` as any;
    const result = await supabase
      .from("articles")
      .select("*")
      .eq(`${otherField}->>slug`, slug)
      .single();
    article = result.data;
    error = result.error;
  }

  if (error || !article) return errorResponse("Article not found", 404, req);

  // Increment view with IP dedup (30 min window)
  const clientIp = req.headers.get("x-forwarded-for") || "unknown";
  const viewKey = `${clientIp}:${article.id}`;
  const { data: existing } = await supabase
    .from("article_views")
    .select("key")
    .eq("key", viewKey)
    .maybeSingle();

  if (!existing) {
    await supabase.from("article_views").insert({
      key: viewKey,
      article_id: article.id,
      ip: clientIp,
    });
    await supabase
      .from("articles")
      .update({ views: (article.views || 0) + 1 })
      .eq("id", article.id);
    article.views = (article.views || 0) + 1;
  }

  return jsonResponse(article, 200, req);
}

// GET /articles/:id/related
async function handleRelatedArticles(req: Request, match: RegExpExecArray) {
  const supabase = getSupabaseAdmin();
  const articleId = match[1];
  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") || "3");

  const { data: article } = await supabase
    .from("articles")
    .select("tags, category_slug, id")
    .eq("id", articleId)
    .single();

  if (!article) return errorResponse("Article not found", 404, req);

  const tags = article.tags || [];
  const category = article.category_slug;
  const seen = new Set([articleId]);
  const result: any[] = [];

  if (tags.length > 0) {
    const { data: candidates } = await supabase
      .from("articles")
      .select("*")
      .eq("status", "published")
      .neq("id", articleId)
      .overlaps("tags", tags)
      .order("published_at", { ascending: false })
      .limit(limit * 2);

    if (candidates) {
      // Sort by shared tag count
      candidates.sort((a, b) => {
        const aMatch = (a.tags || []).filter((t: string) => tags.includes(t)).length;
        const bMatch = (b.tags || []).filter((t: string) => tags.includes(t)).length;
        return bMatch - aMatch;
      });
      for (const a of candidates) {
        if (!seen.has(a.id)) {
          result.push(a);
          seen.add(a.id);
          if (result.length >= limit) break;
        }
      }
    }
  }

  if (result.length < limit && category) {
    const need = limit - result.length;
    const { data: fallback } = await supabase
      .from("articles")
      .select("*")
      .eq("status", "published")
      .eq("category_slug", category)
      .not("id", "in", `(${Array.from(seen).join(",")})`)
      .order("published_at", { ascending: false })
      .limit(need);
    if (fallback) result.push(...fallback);
  }

  return jsonResponse(result.slice(0, limit), 200, req);
}

// GET /articles/:id/siblings
async function handleArticleSiblings(req: Request, match: RegExpExecArray) {
  const supabase = getSupabaseAdmin();
  const articleId = match[1];
  const { data: article } = await supabase
    .from("articles")
    .select("content_id, content_en")
    .eq("id", articleId)
    .single();
  if (!article) return errorResponse("Article not found", 404, req);
  return jsonResponse({
    id_slug: (article.content_id as any)?.slug || null,
    en_slug: (article.content_en as any)?.slug || null,
  });
}

// GET /authors
async function handleListAuthors() {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("user_profiles")
    .select("id, name, slug, bio, avatar_url, twitter, github, website, created_at")
    .in("role", ["owner", "editor", "author"]); // exclude readers from the authors list
  return jsonResponse(data || [], 200, req);
}

// GET /authors/:slug
async function handleGetAuthor(req: Request, match: RegExpExecArray) {
  const supabase = getSupabaseAdmin();
  const slug = match[1];
  const { data: author } = await supabase
    .from("user_profiles")
    .select("id, name, slug, bio, avatar_url, twitter, github, website, created_at")
    .eq("slug", slug)
    .single();
  if (!author) return errorResponse("Author not found", 404, req);
  const { data: articles } = await supabase
    .from("articles")
    .select("*")
    .eq("author_slug", slug)
    .eq("status", "published")
    .order("published_at", { ascending: false });
  return jsonResponse({ author, articles: articles || [] }, 200, req);
}

// POST /articles
async function handleCreateArticle(req: Request, _m: any, user: any) {
  await requireRole(user, "owner", "editor", "author"); // readers cannot write articles
  const supabase = getSupabaseAdmin();
  const body = await req.json();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return errorResponse("User profile not found", 404, req);

  // Validate category_slug
  const validSlugs = CATEGORIES.map((c) => c.slug);
  if (!body.category_slug || !validSlugs.includes(body.category_slug)) {
    return errorResponse("Invalid category_slug", 400, req);
  }
  // Validate cover_image URL if provided
  if (body.cover_image && !isValidUrl(body.cover_image)) {
    return errorResponse("Invalid cover_image URL", 400, req);
  }

  const article = {
    author_id: user.id,
    author_name: profile.name,
    author_slug: profile.slug,
    author_avatar: profile.avatar_url,
    category_slug: body.category_slug,
    tags: body.tags || [],
    cover_image: body.cover_image || "",
    ads_enabled: body.ads_enabled ?? true,
    featured: body.featured ?? false,
    status: body.status || "draft",
    views: 0,
    reading_time: body.reading_time || 3,
    content_id: body.content_id || null,
    content_en: body.content_en || null,
    published_at: body.status === "published" ? new Date().toISOString() : null,
  };

  // Auto-slug
  for (const lang of ["id", "en"]) {
    const content = article[`content_${lang}` as keyof typeof article] as any;
    if (content && !content.slug && content.title) {
      content.slug = slugify(content.title);
    }
  }

  const { data, error } = await supabase.from("articles").insert(article).select().single();
  if (error) return errorResponse("Internal server error", 500, req);
  return jsonResponse(data, 201, req);
}

// PUT /articles/:id
async function handleUpdateArticle(req: Request, match: RegExpExecArray, user: any) {
  const supabase = getSupabaseAdmin();
  const articleId = match[1];
  const body = await req.json();

  const { data: existing } = await supabase
    .from("articles")
    .select("*")
    .eq("id", articleId)
    .single();
  if (!existing) return errorResponse("Article not found", 404, req);

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!["owner", "editor"].includes(profile?.role || "") && existing.author_id !== user.id) {
    return errorResponse("Not allowed", 403, req);
  }

  const updates: any = { ...body, updated_at: new Date().toISOString() };
  if (updates.status === "published" && !existing.published_at) {
    updates.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("articles")
    .update(updates)
    .eq("id", articleId)
    .select()
    .single();
  if (error) return errorResponse("Internal server error", 500, req);
  return jsonResponse(data, 200, req);
}

// DELETE /articles/:id
async function handleDeleteArticle(req: Request, match: RegExpExecArray, user: any) {
  const supabase = getSupabaseAdmin();
  const articleId = match[1];
  const { data: existing } = await supabase
    .from("articles")
    .select("author_id")
    .eq("id", articleId)
    .single();
  if (!existing) return errorResponse("Article not found", 404, req);

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!["owner", "editor"].includes(profile?.role || "") && existing.author_id !== user.id) {
    return errorResponse("Not allowed", 403, req);
  }

  const { error } = await supabase.from("articles").delete().eq("id", articleId);
  if (error) return errorResponse("Internal server error", 500, req);
  return jsonResponse({ success: true }, 200, req);
}

// GET /comments/:articleId
async function handleListComments(req: Request, match: RegExpExecArray) {
  const supabase = getSupabaseAdmin();
  const articleId = match[1];
  const { data } = await supabase
    .from("comments")
    .select("*")
    .eq("article_id", articleId)
    .neq("status", "spam")
    .order("created_at");
  return jsonResponse(data || [], 200, req);
}

// POST /comments
async function handleCreateComment(req: Request, _m: any, user: any) {
  const supabase = getSupabaseAdmin();
  const body = await req.json();

  // Rate limit: 10 comments per 5 min per user
  if (!rateLimit(`comment:${user.id}`, 10, 5 * 60 * 1000)) {
    return errorResponse("Too many comments. Please slow down.", 429, req);
  }

  // Validate input
  if (!body.article_id) return errorResponse("article_id is required", 400, req);
  if (!body.body || typeof body.body !== "string" || body.body.trim().length === 0) {
    return errorResponse("Comment body is required", 400, req);
  }
  if (body.body.length > 2000) {
    return errorResponse("Comment must be 2000 characters or less", 400, req);
  }

  const comment = {
    article_id: body.article_id,
    user_id: user.id,
    user_name: user.user_metadata?.name || "Anonymous",
    user_avatar: user.user_metadata?.avatar_url || "",
    body: body.body,
    parent_id: body.parent_id || null,
    upvotes: 0,
    status: "approved",
  };
  const { data, error } = await supabase.from("comments").insert(comment).select().single();
  if (error) return errorResponse("Internal server error", 500, req);
  return jsonResponse(data, 201, req);
}

// DELETE /comments/:id
async function handleDeleteComment(req: Request, match: RegExpExecArray, user: any) {
  const supabase = getSupabaseAdmin();
  const commentId = match[1];
  const { data: existing } = await supabase
    .from("comments")
    .select("user_id")
    .eq("id", commentId)
    .single();
  if (!existing) return errorResponse("Comment not found", 404, req);

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!["owner", "editor"].includes(profile?.role || "") && existing.user_id !== user.id) {
    return errorResponse("Not allowed", 403, req);
  }

  await supabase.from("comments").delete().eq("id", commentId);
  return jsonResponse({ success: true }, 200, req);
}

// POST /subscribe
async function handleSubscribe(req: Request) {
  const supabase = getSupabaseAdmin();
  const body = await req.json();
  const email = body.email?.toLowerCase().trim();
  if (!email || !isValidEmail(email)) return errorResponse("Valid email required", 400, req);

  const { data: existing } = await supabase
    .from("subscribers")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) return jsonResponse({ success: true, message: "Already subscribed" }, 200, req);

  await supabase.from("subscribers").insert({ email, active: true });
  return jsonResponse({ success: true, message: "Subscribed" }, 201, req);
}

// GET /analytics/summary
async function handleAnalytics(_req: Request, _m: any, user: any) {
  const supabase = getSupabaseAdmin();
  await requireRole(user, "owner", "editor");

  const { count: totalArticles } = await supabase
    .from("articles").select("*", { count: "exact", head: true });
  const { count: published } = await supabase
    .from("articles").select("*", { count: "exact", head: true }).eq("status", "published");
  const { data: viewsData } = await supabase
    .from("articles").select("views");
  const totalViews = viewsData?.reduce((sum, a: any) => sum + (a.views || 0), 0) || 0;
  const { count: totalSubs } = await supabase
    .from("subscribers").select("*", { count: "exact", head: true }).eq("active", true);
  const { count: totalComments } = await supabase
    .from("comments").select("*", { count: "exact", head: true });
  const { count: totalAuthors } = await supabase
    .from("user_profiles").select("*", { count: "exact", head: true }).neq("role", "reader");

  const { data: topArticles } = await supabase
    .from("articles")
    .select("id, content_id, content_en, views")
    .eq("status", "published")
    .order("views", { ascending: false })
    .limit(5);

  return jsonResponse({
    total_articles: totalArticles || 0,
    published: published || 0,
    total_views: totalViews,
    total_subscribers: totalSubs || 0,
    total_comments: totalComments || 0,
    total_authors: totalAuthors || 0,
    top_articles: topArticles || [],
  });
}

// POST /ai/generate
async function handleAiGenerate(req: Request, _m: any, user: any) {
  // Rate limit: 20 requests per hour per user
  if (!rateLimit(`ai:${user.id}`, 20, 60 * 60 * 1000)) {
    return errorResponse("AI request limit reached. Please try again later.", 429, req);
  }

  if (!EMERGENT_LLM_KEY) {
    return errorResponse("AI service not configured", 500, req);
  }
  const body = await req.json();
  const { mode, prompt, source_text, target_lang } = body;

  // Validate mode
  if (!["draft", "translate", "improve", "meta"].includes(mode)) {
    return errorResponse("Invalid AI mode", 400, req);
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": EMERGENT_LLM_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 4000,
        system: "You are an expert technical writer for a developer blog. Write clear, engaging, SEO-friendly content. Use Markdown.",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    return jsonResponse({ result: data.content?.[0]?.text || "" }, 200, req);
  } catch (e: any) {
    return errorResponse("AI service error", 500, req);
  }
}

// POST /upload
async function handleUpload(req: Request, _m: any, user: any) {
  const supabase = getSupabaseAdmin();
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return errorResponse("No file provided", 400, req);

  // Validate MIME type (not just extension) to prevent disguised uploads
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return errorResponse("Only image files are allowed (JPEG, PNG, GIF, WebP)", 400, req);
  }
  const ext = file.name?.split(".").pop()?.toLowerCase() || "bin";
  if (!["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
    return errorResponse("Only image files are allowed", 400, req);
  }
  if (file.size > 5 * 1024 * 1024) {
    return errorResponse("File too large (max 5MB)", 413, req);
  }

  const path = `uploads/${user.id}/${crypto.randomUUID()}.${ext}`;
  const { data, error } = await supabase.storage
    .from("blog-images")
    .upload(path, file, { contentType: file.type });

  if (error) return errorResponse("Upload failed", 500, req);

  const { data: { publicUrl } } = supabase.storage
    .from("blog-images")
    .getPublicUrl(path);

  return jsonResponse({
    id: path,
    path,
    url: publicUrl,
  }, 201);
}

// GET /files/:fileId
async function handleDownloadFile(req: Request, match: RegExpExecArray) {
  const supabase = getSupabaseAdmin();
  const fileId = match[1];
  const { data } = supabase.storage.from("blog-images").getPublicUrl(fileId);
  // Redirect to public URL
  return new Response(null, {
    status: 302,
    headers: { Location: data.publicUrl },
  });
}

// Affiliate link CRUD
async function handleAffiliateLinks(req: Request, match: RegExpExecArray | null, user: any) {
  const supabase = getSupabaseAdmin();
  const url = new URL(req.url);
  const linkId = match?.[1];

  if (req.method === "GET" && !linkId) {
    // Owner-only admin listing: ALL links (incl. inactive, all categories).
    if (url.searchParams.get("all") === "1") {
      const owner = await getUser(req, true);
      await requireRole(owner, "owner");
      const { data } = await supabase
        .from("affiliate_links")
        .select("*")
        .order("created_at", { ascending: false });
      return jsonResponse(data || [], 200, req);
    }
    // Public: only active links, optionally filtered by category (for AffiliateBox).
    const category = url.searchParams.get("category");
    let query = supabase.from("affiliate_links").select("*");
    if (category) query = query.eq("category_slug", category);
    query = query.eq("active", true).order("created_at", { ascending: false });
    const { data } = await query;
    return jsonResponse(data || [], 200, req);
  }

  if (req.method === "POST") {
    await requireRole(user, "owner"); // affiliate = owner only
    const body = await req.json();
    // Validate URL
    if (!body.url || !isValidUrl(body.url)) {
      return errorResponse("A valid HTTP(S) URL is required", 400, req);
    }
    const { data, error } = await supabase
      .from("affiliate_links")
      .insert({ ...body, clicks: 0, active: true })
      .select()
      .single();
    if (error) return errorResponse("Internal server error", 500, req);
    return jsonResponse(data, 201, req);
  }

  if (req.method === "PUT" && linkId) {
    await requireRole(user, "owner"); // affiliate = owner only
    const body = await req.json();
    // Validate URL if provided
    if (body.url && !isValidUrl(body.url)) {
      return errorResponse("A valid HTTP(S) URL is required", 400, req);
    }
    const { data, error } = await supabase
      .from("affiliate_links")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("id", linkId)
      .select()
      .single();
    if (error) return errorResponse("Internal server error", 500, req);
    return jsonResponse(data, 200, req);
  }

  if (req.method === "DELETE" && linkId) {
    await requireRole(user, "owner"); // affiliate = owner only
    const { error } = await supabase.from("affiliate_links").delete().eq("id", linkId);
    if (error) return errorResponse("Internal server error", 500, req);
    return jsonResponse({ success: true }, 200, req);
  }

  return errorResponse("Method not allowed", 405, req);
}

// --------------- ROUTER ---------------
const routes: Array<{
  pattern: RegExp;
  methods: string[];
  handler: (req: Request, match: RegExpExecArray, user?: any) => Promise<Response>;
  requireAuth?: boolean;
  requireRoles?: Role[];
}> = [
  { pattern: /^\/categories$/, methods: ["GET"], handler: handleCategories },
  { pattern: /^\/articles\/featured$/, methods: ["GET"], handler: handleFeaturedArticles },
  { pattern: /^\/articles\/popular$/, methods: ["GET"], handler: handlePopularArticles },
  { pattern: /^\/articles\/([a-f0-9-]+)\/related$/, methods: ["GET"], handler: handleRelatedArticles },
  { pattern: /^\/articles\/([a-f0-9-]+)\/siblings$/, methods: ["GET"], handler: handleArticleSiblings },
  { pattern: /^\/articles\/([^/]+)$/, methods: ["GET"], handler: handleGetArticle },
  { pattern: /^\/articles$/, methods: ["GET"], handler: handleListArticles },
  { pattern: /^\/articles$/, methods: ["POST"], handler: handleCreateArticle, requireAuth: true },
  { pattern: /^\/articles\/([a-f0-9-]+)$/, methods: ["PUT"], handler: handleUpdateArticle, requireAuth: true },
  { pattern: /^\/articles\/([a-f0-9-]+)$/, methods: ["DELETE"], handler: handleDeleteArticle, requireAuth: true },
  { pattern: /^\/authors$/, methods: ["GET"], handler: handleListAuthors },
  { pattern: /^\/authors\/([^/]+)$/, methods: ["GET"], handler: handleGetAuthor },
  { pattern: /^\/comments\/([a-f0-9-]+)$/, methods: ["GET"], handler: handleListComments },
  { pattern: /^\/comments$/, methods: ["POST"], handler: handleCreateComment, requireAuth: true },
  { pattern: /^\/comments\/([a-f0-9-]+)$/, methods: ["DELETE"], handler: handleDeleteComment, requireAuth: true },
  { pattern: /^\/subscribe$/, methods: ["POST"], handler: handleSubscribe },
  { pattern: /^\/analytics\/summary$/, methods: ["GET"], handler: handleAnalytics, requireAuth: true },
  { pattern: /^\/ai\/generate$/, methods: ["POST"], handler: handleAiGenerate, requireAuth: true },
  { pattern: /^\/upload$/, methods: ["POST"], handler: handleUpload, requireAuth: true },
  { pattern: /^\/files\/(.+)$/, methods: ["GET"], handler: handleDownloadFile },
  { pattern: /^\/affiliate-links\/([a-f0-9-]+)$/, methods: ["GET", "PUT", "DELETE"], handler: handleAffiliateLinks, requireAuth: true },
  { pattern: /^\/affiliate-links$/, methods: ["POST"], handler: handleAffiliateLinks, requireAuth: true },
  { pattern: /^\/affiliate-links$/, methods: ["GET"], handler: handleAffiliateLinks },
  { pattern: /^\/users\/me\/profile$/, methods: ["GET"], handler: handleMyProfile, requireAuth: true },
  { pattern: /^\/users\/me$/, methods: ["GET"], handler: handleMe, requireAuth: true },
  { pattern: /^\/admin\/comments$/, methods: ["GET"], handler: handleAdminListComments, requireAuth: true },
  { pattern: /^\/admin\/comments\/([a-f0-9-]+)$/, methods: ["PATCH"], handler: handleModerateComment, requireAuth: true },
  { pattern: /^\/invites\/token\/([^/]+)\/accept$/, methods: ["POST"], handler: handleAcceptInvite },
  { pattern: /^\/invites\/([a-f0-9-]+)$/, methods: ["GET", "DELETE"], handler: handleInvites, requireAuth: true },
  { pattern: /^\/invites$/, methods: ["GET", "POST"], handler: handleInvites, requireAuth: true },
  { pattern: /^\/subscribers$/, methods: ["GET"], handler: handleSubscribersList, requireAuth: true },
  { pattern: /^\/$/, methods: ["GET"], handler: () => jsonResponse({ name: "Developer Hub API", version: "2.0" }) },
];

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api/, "") || "/";

  for (const route of routes) {
    const match = route.pattern.exec(path);
    if (!match) continue;
    if (!route.methods.includes(req.method)) continue;

    try {
      let user: any = null;
      if (route.requireAuth) {
        user = await getUser(req, true);
        if (route.requireRoles?.length) {
          await requireRole(user, ...route.requireRoles);
        }
      }
      return await route.handler(req, match, user);
    } catch (e: any) {
      const isAuth = e.message === "Not authenticated";
      const isForbidden = e.message === "Insufficient permissions";
      const status = isAuth ? 401 : isForbidden ? 403 : 500;
      const message = isAuth || isForbidden ? e.message : "Internal server error";
      if (status === 500) console.error(`[${req.method} ${path}] Error:`, e.message);
      return errorResponse(message, status, req);
    }
  }

  return errorResponse("Not found", 404, req);
});
