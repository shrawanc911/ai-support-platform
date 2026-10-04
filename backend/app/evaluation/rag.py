import asyncio
from statistics import mean

from sqlalchemy import select

from app.ai.rag import RAGService
from app.core.database import AsyncSessionLocal
from app.evaluation.dataset import EVALUATION_CASES
from app.evaluation.metrics import precision_at_k, recall_at_k
from app.knowledge.service import KnowledgeService
from app.models.organization import Organization

THRESHOLDS = [
    0.40,
    0.45,
    0.50,
    0.55,
    0.60,
    0.65,
    0.70,
]

async def evaluate():
    knowledge_service = KnowledgeService()
    rag_service = RAGService(knowledge_service)

    async with AsyncSessionLocal() as db:
        organization = await db.scalar(
            select(Organization).order_by(Organization.created_at)
        )

        if not organization:
            raise RuntimeError(
                "No organization found. Create an organization first."
            )

        print()
        print("RAG Evaluation")
        print("=" * 60)
        print(f"Organization: {organization.name}")
        print(f"Queries: {len(EVALUATION_CASES)}")
        print()

        all_results = []

        for case in EVALUATION_CASES:
            results = await knowledge_service.search(
                db=db,
                organization_id=organization.id,
                query=case["query"],
                limit=5,
                min_similarity=0.0,
            )

            all_results.append(
                {
                    "query": case["query"],
                    "expected_document": case["expected_document"],
                    "results": results,
                }
            )

        print()
        print("Threshold Evaluation")
        print("-" * 60)

        for threshold in THRESHOLDS:
            passed = 0
            total = len(all_results)

            for case in all_results:
                expected = case["expected_document"]

                filtered_results = [
                    result
                    for result in case["results"]
                    if result["similarity"] >= threshold
                ]

                if expected is None:
                    case_passed = len(filtered_results) == 0
                else:
                    case_passed = any(
                        result["document_title"] == expected
                        for result in filtered_results[:5]
                    )

                if case_passed:
                    passed += 1

            accuracy = passed / total

            print(
                f"Threshold {threshold:.2f} "
                f"-> {accuracy:.2%}"
            )

        for k in [1, 3, 5]:
            recall_scores = []
            precision_scores = []

            for case in all_results:
                expected = case["expected_document"]
                results = case["results"]

                recall_scores.append(
                    recall_at_k(
                        results,
                        expected,
                        k,
                    )
                )

                precision_scores.append(
                    precision_at_k(
                        results,
                        expected,
                        k,
                    )
                )

            print(
                f"Recall@{k}: "
                f"{mean(recall_scores):.2f}"
            )

            print(
                f"Precision@{k}: "
                f"{mean(precision_scores):.2f}"
            )
            print()

        similarity_values = [
            result["similarity"]
            for case in all_results
            for result in case["results"]
        ]

        if similarity_values:
            print(
                f"Average similarity: "
                f"{mean(similarity_values):.3f}"
            )

            print(
                f"Minimum similarity: "
                f"{min(similarity_values):.3f}"
            )

            print(
                f"Maximum similarity: "
                f"{max(similarity_values):.3f}"
            )

        print()
        print("Evaluation Cases")
        print("-" * 60)

        for case in all_results:
            expected = case["expected_document"]
            results = case["results"]

            retrieved = (
                results[0]["document_title"]
                if results
                else "NONE"
            )

            if expected is None:
                passed = not results
            else:
                passed = any(
                    result["document_title"] == expected
                    for result in results[:5]
                )

            status = "PASS" if passed else "FAIL"

            print(f"[{status}] {case['query']}")
            print(f"  Expected: {expected or 'NONE'}")
            print(f"  Top result: {retrieved}")

            if results:
                print(
                    f"  Similarity: "
                    f"{results[0]['similarity']:.3f}"
                )

            print()

        print("Failed Cases")
        print("-" * 60)

        failures = 0

        for case in all_results:
            expected = case["expected_document"]
            results = case["results"]

            if expected is None:
                passed = not results
            else:
                passed = any(
                    result["document_title"] == expected
                    for result in results[:5]
                )

            if not passed:
                failures += 1

                print(f"Query: {case['query']}")
                print(f"Expected: {expected or 'NONE'}")

                print("Retrieved:")

                for result in results[:5]:
                    print(
                        f"  - {result['document_title']} "
                        f"({result['similarity']:.3f})"
                    )

                print()

        if failures == 0:
            print("No failed cases.")
        else:
            print(f"Total failures: {failures}")


if __name__ == "__main__":
    asyncio.run(evaluate())