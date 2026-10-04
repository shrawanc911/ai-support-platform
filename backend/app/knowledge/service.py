from uuid import UUID

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.embeddings import embedding_service
from app.knowledge.chunker import chunk_text
from app.models.knowledge_chunk import KnowledgeChunk
from app.models.knowledge_document import KnowledgeDocument


class KnowledgeService:

    async def create_document(
        self,
        db: AsyncSession,
        organization_id: UUID,
        title: str,
        content: str,
        source: str | None,
    ) -> KnowledgeDocument:

        document = KnowledgeDocument(
            organization_id=organization_id,
            title=title,
            content=content,
            source=source,
        )

        db.add(document)

        await db.flush()

        chunks = chunk_text(content)

        embeddings = (
            embedding_service.embed_many(
                chunks
            )
        )

        for index, (
            chunk_content,
            embedding,
        ) in enumerate(
            zip(chunks, embeddings)
        ):

            db.add(
                KnowledgeChunk(
                    organization_id=document.organization_id,
                    document_id=document.id,
                    chunk_index=index,
                    content=chunk_content,
                    embedding=embedding,
                    char_count=len(content)
                )
            )

        await db.commit()

        await db.refresh(document)

        return document

    async def search(
        self,
        db: AsyncSession,
        organization_id: UUID,
        query: str,
        limit: int = 5,
        min_similarity: float = 0.55,
    ) -> list[dict]:

        query_embedding = (
            embedding_service.embed(query)
        )

        similarity = (
            1
            - KnowledgeChunk.embedding.cosine_distance(
                query_embedding
            )
        )

        statement = (
            select(
                KnowledgeChunk.id.label("chunk_id"),
                KnowledgeChunk.document_id,
                KnowledgeDocument.title.label(
                    "document_title"
                ),
                KnowledgeChunk.content,
                similarity.label("similarity"),
            )
            .join(
                KnowledgeDocument,
                KnowledgeDocument.id
                == KnowledgeChunk.document_id,
            )
            .where(
                KnowledgeChunk.organization_id
                == organization_id,
                KnowledgeDocument.organization_id
                == organization_id,
                similarity >= min_similarity,
            )
            .order_by(
                similarity.desc()
            )
            .limit(limit)
        )

        result = await db.execute(statement)

        rows = result.all()

        return [
            {
                "chunk_id": row.chunk_id,
                "document_id": row.document_id,
                "document_title": row.document_title,
                "content": row.content,
                "similarity": float(row.similarity),
                "chunk_index": row.chunk_index,
            }
            for row in result
        ]

    async def list_documents(
        self,
        db: AsyncSession,
        organization_id: UUID,
    ) -> list[KnowledgeDocument]:

        result = await db.scalars(
            select(KnowledgeDocument)
            .where(
                KnowledgeDocument.organization_id == organization_id
            )
            .order_by(
                KnowledgeDocument.created_at.desc()
            )
        )

        return list(result.all())

    async def get_document(
        self,
        db: AsyncSession,
        organization_id: UUID,
        document_id: UUID,
    ) -> KnowledgeDocument | None:

        result = await db.scalar(
            select(KnowledgeDocument)
            .where(
                KnowledgeDocument.id == document_id,
                KnowledgeDocument.organization_id == organization_id,
            )
        )

        return result

    async def delete_document(
        self,
        db: AsyncSession,
        organization_id: UUID,
        document_id: UUID,
    ) -> bool:

        document = await self.get_document(
            db=db,
            organization_id=organization_id,
            document_id=document_id,
        )

        if not document:
            return False

        await db.delete(document)
        await db.commit()

        return True

    async def reindex_document(
        self,
        db: AsyncSession,
        organization_id: UUID,
        document_id: UUID,
    ) -> KnowledgeDocument | None:

        document = await self.get_document(
            db=db,
            organization_id=organization_id,
            document_id=document_id,
        )

        if not document:
            return None

        await db.execute(
            delete(KnowledgeChunk).where(
                KnowledgeChunk.document_id == document.id
            )
        )

        chunks = chunk_text(document.content)

        embeddings = embedding_service.embed_many(chunks)

        for index, (content, embedding) in enumerate(
            zip(chunks, embeddings)
        ):
            db.add(
                KnowledgeChunk(
                    organization_id=document.organization_id,
                    document_id=document.id,
                    chunk_index=index,
                    content=content,
                    embedding=embedding,
                    char_count=len(content)
                )
            )

        await db.commit()

        await db.refresh(document)

        return document