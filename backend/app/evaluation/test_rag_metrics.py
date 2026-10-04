from app.evaluation.metrics import (
    precision_at_k,
    recall_at_k,
)


def test_recall_at_k():
    results = [
        {"document_title": "Account Policy"},
        {"document_title": "Shipping Policy"},
        {"document_title": "Refund Policy"},
    ]

    assert recall_at_k(
        results,
        "Refund Policy",
        3,
    ) == 1.0

    assert recall_at_k(
        results,
        "Refund Policy",
        2,
    ) == 0.0


def test_precision_at_k():
    results = [
        {"document_title": "Refund Policy"},
        {"document_title": "Account Policy"},
        {"document_title": "Shipping Policy"},
    ]

    assert precision_at_k(
        results,
        "Refund Policy",
        3,
    ) == 1 / 3


def test_irrelevant_query():
    results = []

    assert recall_at_k(
        results,
        None,
        5,
    ) == 1.0

    assert precision_at_k(
        results,
        None,
        5,
    ) == 1.0