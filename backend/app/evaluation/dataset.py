# backend/app/evaluation/dataset.py

EVALUATION_CASES = [
    {
        "query": "I was charged twice for the same payment",
        "expected_document": "Refund Policy",
    },
    {
        "query": "How long does an approved refund take?",
        "expected_document": "Refund Policy",
    },
    {
        "query": "Where is my package?",
        "expected_document": "Shipping Policy",
    },
    {
        "query": "My order has not arrived yet",
        "expected_document": "Shipping Policy",
    },
    {
        "query": "How can I change my email address?",
        "expected_document": "Account Policy",
    },
    {
        "query": "I want to update my account email",
        "expected_document": "Account Policy",
    },
    {
        "query": "How do I cancel my subscription?",
        "expected_document": "Subscription Policy",
    },
    {
        "query": "Can I get a refund for my subscription?",
        "expected_document": "Subscription Policy",
    },
    {
        "query": "What is the weather today?",
        "expected_document": None,
    },
    {
        "query": "How do I cook pasta?",
        "expected_document": None,
    },
]