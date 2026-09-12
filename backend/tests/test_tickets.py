from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_create_ticket_requires_subject():
    response = client.post(
        "/tickets",
        json={
            "organization_id": "00000000-0000-0000-0000-000000000000",
            "customer_id": "00000000-0000-0000-0000-000000000000",
            "description": "Payment failed.",
        },
    )

    assert response.status_code == 422