from fastapi.testclient import TestClient
from urllib.parse import quote

from src.app import app


client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    # Expect some known activities exist
    assert "Soccer Team" in data
    assert isinstance(data["Soccer Team"]["participants"], list)


def test_signup_and_unregister_cycle():
    activity = "Chess Club"
    email = "tester@example.com"

    # Ensure email not present initially
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    participants = data[activity]["participants"]
    assert email not in participants

    # Signup
    resp = client.post(f"/activities/{quote(activity)}/signup?email={quote(email)}")
    assert resp.status_code == 200
    j = resp.json()
    assert "Signed up" in j.get("message", "")

    # Verify added
    resp = client.get("/activities")
    data = resp.json()
    assert email in data[activity]["participants"]

    # Unregister
    resp = client.delete(f"/activities/{quote(activity)}/unregister?email={quote(email)}")
    assert resp.status_code == 200
    j = resp.json()
    assert "Unregistered" in j.get("message", "")

    # Verify removed
    resp = client.get("/activities")
    data = resp.json()
    assert email not in data[activity]["participants"]
