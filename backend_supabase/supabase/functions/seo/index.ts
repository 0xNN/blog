import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCors, errorResponse } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BASE_URL = (Deno.env.get("FRONTEND_URL") || "https://blog.msncode.dev").replace(/\/+$/, "");

const securityHeaders: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

function xmlResponse(body: string, req: Request): Response {
  return new Response(body, {
    headers: {
      ...corsHeaders(req),
      ...securityHeaders,
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=900, s-maxage=3600",
    },
  });
}

function textResponse(body: string, req: Request): Response {
  return new Response(body, {
    headers: {
      ...corsHeaders(req),
      ...securityHeaders,
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}

function escapeXml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const url = new URL(req.url);
  const path = url.pathname;

  // Route internally by path
  if (path.endsWith("/sitemap.xml")) return handleSitemap(req);
  if (path.endsWith("/rss.xml")) {
    const lang = url.searchParams.get("lang") || "id";
    return handleRss(lang, req);
  }
  if (path.endsWith("/ads.txt")) return handleAdsTxt(req);

  return errorResponse("Not found", 404, req);
});

async function handleSitemap(req: Request) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: articles, error } = await supabase
    .from("articles")
    .select("content_id, content_en, category_slug, author_slug, published_at, updated_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) return errorResponse("Unable to build sitemap", 503, req);

  const today = new Date().toISOString().split("T")[0];

  const urlEntries: string[] = [];

  function addUrl(loc: string, opts: { priority?: string; changefreq?: string; lastmod?: string } = {}) {
    const { priority = "0.5", changefreq = "weekly", lastmod = today } = opts;
    urlEntries.push(
      `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${escapeXml(lastmod)}</lastmod>\n    <changefreq>${escapeXml(changefreq)}</changefreq>\n    <priority>${escapeXml(priority)}</priority>\n  </url>`
    );
  }

  for (const lang of ["id", "en"]) {
    addUrl(`${BASE_URL}/${lang}`, { priority: "1.0", changefreq: "daily" });
    addUrl(`${BASE_URL}/${lang}/blog`, { priority: "0.9", changefreq: "daily" });
    for (const page of ["about", "contact", "authors", "privacy", "terms"]) {
      addUrl(`${BASE_URL}/${lang}/${page}`, { priority: "0.5", changefreq: "monthly" });
    }

    const activeCategories = new Set<string>();
    const activeAuthors = new Set<string>();
    if (articles) {
      for (const a of articles) {
        const content = a[`content_${lang}` as keyof typeof a] as any;
        if (content?.slug) {
          const lastmod = (a.updated_at || a.published_at || today).split("T")[0];
          addUrl(`${BASE_URL}/${lang}/blog/${content.slug}`, { priority: "0.8", changefreq: "monthly", lastmod });
          if (a.category_slug) activeCategories.add(a.category_slug);
          if (a.author_slug) activeAuthors.add(a.author_slug);
        }
      }
    }
    for (const category of activeCategories) {
      addUrl(`${BASE_URL}/${lang}/category/${category}`, { priority: "0.7", changefreq: "weekly" });
    }
    for (const author of activeAuthors) {
      addUrl(`${BASE_URL}/${lang}/author/${author}`, { priority: "0.6", changefreq: "monthly" });
    }
  }

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urlEntries,
    "</urlset>",
  ].join("\n");

  return xmlResponse(body, req);
}

async function handleRss(lang: string, req: Request) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: articles, error } = await supabase
    .from("articles")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(50);

  if (error) return errorResponse("Unable to build RSS feed", 503, req);

  const siteTitle = `MSNCode${lang === "id" ? " (Bahasa Indonesia)" : ""}`;
  const langCode = lang === "id" ? "id-ID" : "en-US";

  const items = (articles || [])
    .map((a: any) => {
      const c = a[`content_${lang}` as keyof typeof a] || a.content_id || a.content_en;
      if (!c?.slug) return "";
      const title = escapeXml(c.title);
      const excerpt = escapeXml(c.excerpt);
      const articleUrl = `${BASE_URL}/${lang}/blog/${c.slug}`;
      const pubDate = a.published_at ? new Date(a.published_at).toUTCString() : "";
      return [
        "    <item>",
        `      <title>${title}</title>`,
        `      <link>${articleUrl}</link>`,
        `      <guid isPermaLink='true'>${articleUrl}</guid>`,
        `      <pubDate>${pubDate}</pubDate>`,
        `      <description>${excerpt}</description>`,
        `      <author>${escapeXml(a.author_name)}</author>`,
        "    </item>",
      ].join("\n");
    })
    .filter(Boolean);

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0"><channel>',
    `  <title>${siteTitle}</title>`,
    `  <link>${BASE_URL}/${lang}</link>`,
    "  <description>Developer blog in Indonesian & English</description>",
    `  <language>${langCode}</language>`,
    ...items,
    "</channel></rss>",
  ].join("\n");

  return xmlResponse(xml, req);
}

function handleAdsTxt(req: Request) {
  return textResponse("google.com, pub-1997030082284033, DIRECT, f08c47fec0942fa0\n", req);
}
