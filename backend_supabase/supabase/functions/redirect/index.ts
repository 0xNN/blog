import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCors, jsonResponse, errorResponse } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const url = new URL(req.url);
  // Reachable as /r/<id> (via Vercel rewrite) or /redirect/<id> (direct) — take last segment.
  const linkId = url.pathname.split("/").filter(Boolean).pop() || "";
  const articleId = url.searchParams.get("article_id");

  if (!linkId) return errorResponse("Link ID required", 400);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: link } = await supabase
    .from("affiliate_links")
    .select("*")
    .eq("id", linkId)
    .single();

  if (!link || !link.active) return errorResponse("Affiliate link not found", 404);

  // Track click
  await supabase.from("affiliate_clicks").insert({
    link_id: linkId,
    article_id: articleId || null,
    ip: req.headers.get("x-forwarded-for") || "unknown",
  });
  await supabase
    .from("affiliate_links")
    .update({ clicks: (link.clicks || 0) + 1, updated_at: new Date().toISOString() })
    .eq("id", linkId);

  // Per-article attribution is already recorded in affiliate_clicks.article_id above.

  return new Response(null, {
    status: 302,
    headers: {
      Location: link.url,
      "Cache-Control": "no-store",
      ...corsHeaders,
    },
  });
});
