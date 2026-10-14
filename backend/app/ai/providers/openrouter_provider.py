import json
from openai import AsyncOpenAI

from app.ai.prompts import (
    SYSTEM_PROMPT,
    build_ticket_prompt,
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
        rag_context: str,
    ) -> TicketAIAnalysisResult:

        prompt = build_ticket_prompt(subject=subject,description=description,rag_context=rag_context)
        
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
        try:
            return TicketAIAnalysisResult.model_validate_json(content)
        except ValueError as exc:
            raise ValueError(
                f"AI returned an invalid analysis: {exc}"
            ) from exc

    async def agent_completion(
        self,
        messages: list[dict],
        tools: list[dict],
    ):
        response = await self.client.chat.completions.create(
            model=settings.OPENROUTER_MODEL,
            messages=messages,
            tools=tools,
            tool_choice="auto",
        )

        return response