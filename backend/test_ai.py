import asyncio

from app.ai.providers.openrouter_provider import (
    OpenRouterProvider,
)


async def main():
    provider = OpenRouterProvider()

    result = await provider.analyze_ticket(
        subject="Payment deducted but order cancelled",
        description=(
            "I paid ₹999 for my order. "
            "The money was deducted from my bank account "
            "but the order was cancelled. "
            "I have not received my refund."
        ),
    )

    print(result)
    print(result.model_dump_json(indent=2))


if __name__ == "__main__":
    asyncio.run(main())