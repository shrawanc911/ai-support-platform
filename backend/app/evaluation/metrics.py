def recall_at_k(
    results: list[dict],
    expected_document: str | None,
    k: int,
) -> float:
    if expected_document is None:
        return 1.0 if len(results[:k]) == 0 else 0.0

    top_results = results[:k]

    return float(
        any(
            result["document_title"] == expected_document
            for result in top_results
        )
    )


def precision_at_k(
    results: list[dict],
    expected_document: str | None,
    k: int,
) -> float:
    top_results = results[:k]

    if not top_results:
        return 1.0 if expected_document is None else 0.0

    if expected_document is None:
        relevant = 0
    else:
        relevant = sum(
            result["document_title"] == expected_document
            for result in top_results
        )

    return relevant / len(top_results)