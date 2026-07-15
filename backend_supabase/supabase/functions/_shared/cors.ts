const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "";

function getAllowedOrigin(req: Request): string {
  if (!FRONTEND_URL) return "*";
  const origin = req.headers.get("Origin") || "";
  return origin === FRONTEND_URL ? FRONTEND_URL : "";
}

export function corsHeaders(req: Request): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": getAllowedOrigin(req),
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Client-Info, apikey",
    "Access-Control-Expose-Headers": "Content-Length, X-Cache",
    "Vary": "Origin",
  };
}

const securityHeaders: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-XSS-Protection": "0",
};

export function handleCors(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { ...corsHeaders(req), ...securityHeaders } });
  }
  return null;
}

export function jsonResponse(data: unknown, status = 200, req?: Request): Response {
  const ch = req ? corsHeaders(req) : { "Access-Control-Allow-Origin": FRONTEND_URL || "*" };
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...ch, ...securityHeaders, "Content-Type": "application/json" },
  });
}

export function errorResponse(message: string, status = 400, req?: Request): Response {
  return jsonResponse({ error: message }, status, req);
}
