from openai import AsyncOpenAI

from app.ai.prompts import (
    SYSTEM_PROMPT,
    USER_PROMPT_TEMPLATE,
)
from app.ai.schemas import TicketAIAnalysisResult
from app.core.config import settings


class OpenRouterProvider:

    def __init__(self):
        self.client = AsyncOpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=settings.OPENROUTER_API_KEY,
        )

    async def analyze_ticket(
        self,
        subject: str,
        description: str,
    ) -> TicketAIAnalysisResult:

        prompt = USER_PROMPT_TEMPLATE.format(
            subject=subject,
            description=description,
        )

        response = await self.client.chat.completions.create(
            model=settings.OPENROUTER_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT,
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            response_format={
                "type": "json_object",
            },
        )

        content = response.choices[0].message.content

        if not content:
            raise ValueError(
                "AI returned an empty response"
            )
        return TicketAIAnalysisResult.model_validate_json(
            content
        )