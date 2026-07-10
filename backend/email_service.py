"""Resend email service.
Gracefully no-ops when RESEND_API_KEY is empty so the app still works in dev.
"""
import os
import asyncio
import logging
from typing import Optional

import resend

logger = logging.getLogger(__name__)

DEFAULT_SENDER = "onboarding@resend.dev"


def _is_configured() -> bool:
    key = os.environ.get("RESEND_API_KEY", "").strip()
    return bool(key and key.startswith("re_"))


def _prime() -> None:
    resend.api_key = os.environ.get("RESEND_API_KEY", "").strip()


async def send_email(to: str, subject: str, html: str, sender: Optional[str] = None) -> dict:
    """Send an HTML email via Resend. If not configured, returns a no-op success."""
    if not _is_configured():
        logger.info(f"[resend:noop] would send to={to} subject={subject!r}")
        return {"status": "skipped", "reason": "RESEND_API_KEY not configured"}

    _prime()
    params = {
        "from": sender or os.environ.get("SENDER_EMAIL", DEFAULT_SENDER),
        "to": [to],
        "subject": subject,
        "html": html,
    }
    try:
        result = await asyncio.to_thread(resend.Emails.send, params)
        return {"status": "sent", "id": result.get("id") if isinstance(result, dict) else None}
    except Exception as e:
        # e.g. Resend free-tier restriction to sender's email — log but never break flow
        logger.warning(f"Resend send failed: {e}")
        return {"status": "error", "error": str(e)}


# -------------------- Templates --------------------
def _wrap(title: str, body_html: str, cta_url: str | None = None, cta_label: str | None = None) -> str:
    cta = ""
    if cta_url and cta_label:
        cta = f'''
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0">
          <tr><td style="border-radius: 999px; background: #0055FF;">
            <a href="{cta_url}" style="display:inline-block; padding: 12px 24px; color: #fff; text-decoration: none; font-weight: 600; font-family: Arial, sans-serif;">{cta_label}</a>
          </td></tr>
        </table>
        '''
    return f'''<!doctype html><html><body style="margin:0;background:#fafafa;font-family:Arial,sans-serif;color:#0a0a0a">
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#fafafa;padding:32px 0">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e4e4e7;border-radius:16px;padding:32px">
      <tr><td>
        <div style="font-weight:900;font-size:20px;letter-spacing:-0.02em;margin-bottom:20px">
          <span style="color:#0055FF">●</span> devhub<span style="color:#0055FF">.</span>
        </div>
        <h1 style="font-size:22px;margin:0 0 12px 0;color:#0a0a0a">{title}</h1>
        <div style="font-size:15px;line-height:1.6;color:#3f3f46">{body_html}</div>
        {cta}
        <hr style="border:0;border-top:1px solid #e4e4e7;margin:28px 0" />
        <p style="font-size:12px;color:#71717a;margin:0">Developer Hub · A bilingual blog for developers</p>
      </td></tr>
    </table>
  </td></tr>
</table></body></html>'''


async def send_newsletter_welcome(to: str) -> dict:
    html = _wrap(
        "Welcome to Developer Hub 👋",
        "<p>Thanks for subscribing! We'll deliver the best dev tutorials, error fixes, "
        "and indie hacker stories straight to your inbox — bilingual (ID & EN).</p>"
        "<p>No spam. Unsubscribe anytime.</p>",
    )
    return await send_email(to, "Welcome to Developer Hub", html)


async def send_author_invite(to: str, inviter_name: str, accept_url: str) -> dict:
    html = _wrap(
        "You've been invited to write for Developer Hub",
        f"<p><strong>{inviter_name}</strong> invited you to become an author on Developer Hub — "
        "a bilingual (ID + EN) blog for developers.</p>"
        "<p>Click the button below to set your password and start writing.</p>"
        "<p style='font-size:12px;color:#71717a'>This invite link expires in 7 days.</p>",
        cta_url=accept_url,
        cta_label="Accept invitation",
    )
    return await send_email(to, "You're invited to Developer Hub", html)
