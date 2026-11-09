import uuid

from groq import (
    APIConnectionError,
    APIStatusError,
    APITimeoutError,
    AsyncGroq,
    RateLimitError,
)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_settings
from app.models import User

GROQ_MODEL = "openai/gpt-oss-120b"

LANGUAGE_NAMES = {
    "english": "English",
    "russian": "Russian",
    "kyrgyz": "Kyrgyz",
}

SYSTEM_PROMPTS = {
    "generate": (
        "Ты — делопроизводитель Международного университета Ала-Тоо "
        "(Ala-Too International University, Бишкек). "
        "Официальное название только такое: «Международный университет Ала-Тоо». "
        "Не пиши «Алатауский», «Ала-Тооский» и другие варианты. "
        "Составь только текст просьбы и обоснования на указанном языке. "
        "Не пиши адресата, шапку, заголовок «ЗАЯВЛЕНИЕ», дату и подпись: их добавит шаблон PDF. "
        "Не повторяй ФИО, ID, факультет и группу: они уже есть в шапке. "
        "Верни только абзацы заявления, без markdown и комментариев."
    ),
    "translate": (
        "Ты — переводчик официальных документов Ala-Too International University. "
        "Переведи текст на указанный язык, сохранив официально-деловой стиль, структуру, "
        "имена собственные, university ID и смысл. Ничего не добавляй и не сокращай. "
        "Верни только перевод, без markdown и комментариев."
    ),
}


class AIServiceError(Exception):
    """Base error for document text generation."""


class AIConfigurationError(AIServiceError):
    """GROQ_API_KEY is missing."""


class AIProviderError(AIServiceError):
    """Groq API is unavailable or returned an unusable response."""


class StudentNotFoundError(AIServiceError):
    """Requested student does not exist."""


def _build_user_prompt(student: User, prompt: str, language: str) -> str:
    language_name = LANGUAGE_NAMES.get(language, LANGUAGE_NAMES["russian"])
    faculty = student.faculty or "не указан"
    group_name = student.group_name or "не указана"
    return (
        f"Язык заявления: {language_name}.\n"
        f"ФИО студента: {student.full_name}\n"
        f"University ID: {student.university_id}\n"
        f"Факультет: {faculty}\n"
        f"Группа: {group_name}\n"
        f"Описание заявки:\n{prompt.strip()}"
    )


async def _complete(system_prompt: str, user_prompt: str) -> str:
    settings = get_settings()
    api_key = (settings.groq_api_key or "").strip()
    if not api_key:
        raise AIConfigurationError("GROQ_API_KEY is not set")

    client = AsyncGroq(api_key=api_key, timeout=60.0)
    model = settings.groq_model or GROQ_MODEL
    request = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.2,
        "max_tokens": 4000,
    }
    try:
        try:
            completion = await client.chat.completions.create(
                **request,
                reasoning_effort="low",
            )
        except TypeError:
            completion = await client.chat.completions.create(**request)
    except (APIConnectionError, APITimeoutError, RateLimitError, APIStatusError) as exc:
        print(f"GROQ_ERROR model={model}: {exc}")
        raise AIProviderError(f"Groq API is unavailable: {exc}") from exc
    except Exception as exc:
        print(f"GROQ_ERROR model={model}: {exc}")
        raise AIProviderError(f"Groq API request failed: {exc}") from exc

    generated_text = ""
    if completion.choices:
        message = completion.choices[0].message
        generated_text = (message.content or "").strip()
        if not generated_text:
            generated_text = str(getattr(message, "reasoning", "") or "").strip()
    if not generated_text:
        print(f"GROQ_EMPTY model={model} raw={completion}")
        raise AIProviderError("Groq API returned an empty response")
    return generated_text


async def generate_document_text(
    prompt: str,
    user_id: uuid.UUID,
    db: AsyncSession,
    *,
    language: str = "russian",
) -> str:
    cleaned_prompt = prompt.strip()
    if not cleaned_prompt:
        raise ValueError("Application description is empty")

    settings = get_settings()
    api_key = (settings.groq_api_key or "").strip()
    if not api_key:
        raise AIConfigurationError("GROQ_API_KEY is not set")

    result = await db.execute(select(User).where(User.id == user_id))
    student = result.scalar_one_or_none()
    if student is None:
        raise StudentNotFoundError("Student not found")

    return await _complete(
        SYSTEM_PROMPTS["generate"],
        _build_user_prompt(student, cleaned_prompt, language),
    )


async def translate_document_text(text: str, language: str = "russian") -> str:
    cleaned_text = text.strip()
    if not cleaned_text:
        raise ValueError("Document text is empty")

    language_name = LANGUAGE_NAMES.get(language, LANGUAGE_NAMES["russian"])
    return await _complete(
        SYSTEM_PROMPTS["translate"],
        f"Целевой язык: {language_name}.\n\n{cleaned_text}",
    )
