from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.knowledge.service import KnowledgeService


class RAGService:

    def __init__(
        self,
        knowledge_service: KnowledgeService,
    ):
        self.knowledge_service = (
            knowledge_service
        )

    async def retrieve(
        self,
        db: AsyncSession,
        organization_id: UUID,
        query: str,
        limit: int = 5,
        min_similarity: float = 0.55,
    ):

        results = await self.knowledge_service.search(
            db=db,
            organization_id=organization_id,
            query=query,
            limit=limit * 3,
            min_similarity=min_similarity,
        )

        selected = []
        document_ids = set()

        for result in results:
            document_id = result["document_id"]
            if document_id in document_ids:
                continue
            selected.append(result)
            document_ids.add(document_id)
            if len(selected) >= limit:
                break

        return selected

def build_rag_context(
    results: list[dict],
) -> str:

    if not results:
        return (
            "No relevant knowledge base "
            "information was found."
        )

    sections = []

    for index, result in enumerate(
        results,
        start=1,
    ):

        sections.append(
            f"""
SOURCE {index}

Document:
{result["document_title"]}

Chunk:
{result["chunk_index"] + 1}

Similarity:
{result["similarity"]:.3f}

Content:
{result["content"]}
""".strip()
        )

    return "\n\n".join(sections)
    