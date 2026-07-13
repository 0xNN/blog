import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCors, errorResponse } from "../_shared/cors.ts";
import { CATEGORIES } from "../_shared/constants.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BASE_URL = Deno.env.get("FRONTEND_URL") || "";

function xmlResponse(body: string): Response {
  return new Response(body, {
    headers: { ...corsHeaders, "Content-Type": "application/xml" },
  });
}

function textResponse(body: string): Response {
  return new Response(body, {
    headers: { ...corsHeaders, "Content-Type": "text/plain" },
  });
}

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const url = new URL(req.url);
  const path = url.pathname;

  // Route internally by path
  if (path.endsWith("/sitemap.xml")) return handleSitemap();
  if (path.endsWith("/rss.xml")) {
    const lang = url.searchParams.get("lang") || "id";
    return handleRss(lang);
  }
  if (path.endsWith("/ads.txt")) return handleAdsTxt();

  return errorResponse("Not found", 404);
});

async function handleSitemap() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: articles } = await supabase
    .from("articles")
    .select("content_id, content_en")
    .eq("status", "published");

  const urls: string[] = [];
  for (const lang of ["id", "en"]) {
    urls.push(`${BASE_URL}/${lang}`);
    for (const c of CATEGORIES) {
      urls.push(`${BASE_URL}/${lang}/category/${c.slug}`);
    }
    if (articles) {
      for (const a of articles) {
        const content = a[`content_${lang}` as keyof typeof a] as any;
        if (content?.slug) {
          urls.push(`${BASE_URL}/${lang}/blog/${content.slug}`);
        }
      }
    }
  }

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((u) => `  <url><loc>${u}</loc></url>`),
    "</urlset>",
  ].join("\n");

  return xmlResponse(body);
}

async function handleRss(lang: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: articles } = await supabase
    .from("articles")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(50);

  const siteTitle = `Developer Hub${lang === "id" ? " (Bahasa Indonesia)" : ""}`;
  const langCode = lang === "id" ? "id-ID" : "en-US";

  const items = (articles || [])
    .map((a: any) => {
      const c = a[`content_${lang}` as keyof typeof a] || a.content_id || a.content_en;
      if (!c?.slug) return "";
      const title = (c.title || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const excerpt = (c.excerpt || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const articleUrl = `${BASE_URL}/${lang}/blog/${c.slug}`;
      const pubDate = a.published_at || "";
      return [
        "    <item>",
        `      <title>${title}</title>`,
        `      <link>${articleUrl}</link>`,
        `      <guid isPermaLink='true'>${articleUrl}</guid>`,
        `      <pubDate>${pubDate}</pubDate>`,
        `      <description>${excerpt}</description>`,
        `      <author>${a.author_name || ""}</author>`,
        "    </item>",
      ].join("\n");
    })
    .filter(Boolean);

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0"><channel>',
    `  <title>${siteTitle}</title>`,
    `  <link>${BASE_URL}/${lang}</link>`,
    "  <description>Bilingual blog for developers</description>",
    `  <language>${langCode}</language>`,
    ...items,
    "</channel></rss>",
  ].join("\n");

  return xmlResponse(xml);
}

function handleAdsTxt() {
  return textResponse("# google.com, pub-XXXXXXX, DIRECT, f08c47fec0942fa0\n");
}
