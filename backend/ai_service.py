"""AI writing assistant using Claude Sonnet 4.5 via Emergent LLM key."""
import os
import uuid
import logging
from emergentintegrations.llm.chat import LlmChat, UserMessage

logger = logging.getLogger(__name__)

MODEL_PROVIDER = "anthropic"
MODEL_NAME = "claude-sonnet-4-5-20250929"

SYSTEM_PROMPTS = {
    "draft": (
        "You are an expert technical writer for a developer blog called Developer Hub. "
        "Write clear, engaging, SEO-friendly articles for developers. "
        "Use Markdown formatting with proper headings (##, ###), code blocks with language tags, "
        "bullet lists, and short paragraphs. Include practical examples."
    ),
    "translate": (
        "You are a professional translator specializing in developer content. "
        "Translate the given text preserving all Markdown formatting, code blocks (do NOT translate code), "
        "technical terms, and tone. Return ONLY the translated text without commentary."
    ),
    "improve": (
        "You are an experienced editor for a developer blog. Improve the given draft for clarity, "
        "flow, and SEO. Keep the author's voice, preserve Markdown, code blocks, and structure. "
        "Return ONLY the improved text without commentary."
    ),
    "meta": (
        "You are an SEO expert. Given article content, generate a concise 150-160 character meta "
        "description that captures the essence and includes primary keywords. Return ONLY the meta "
        "description, no quotes, no commentary."
    ),
}


async def ai_generate(mode: str, prompt: str, source_text: str | None = None, target_lang: str | None = None) -> str:
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise RuntimeError("EMERGENT_LLM_KEY not set")

    system = SYSTEM_PROMPTS.get(mode, SYSTEM_PROMPTS["draft"])
    session_id = f"ai-{uuid.uuid4()}"

    chat = LlmChat(api_key=api_key, session_id=session_id, system_message=system) \
        .with_model(MODEL_PROVIDER, MODEL_NAME) \
        .with_params(max_tokens=4000)

    if mode == "translate":
        lang_name = "Indonesian (Bahasa Indonesia)" if target_lang == "id" else "English"
        user_text = f"Translate the following to {lang_name}:\n\n{source_text or prompt}"
    elif mode == "improve":
        user_text = f"Improve this draft:\n\n{source_text or prompt}"
    elif mode == "meta":
        user_text = f"Generate meta description for this article:\n\n{source_text or prompt}"
    else:
        user_text = prompt

    msg = UserMessage(text=user_text)
    response = await chat.send_message(msg)
    return response if isinstance(response, str) else str(response)
