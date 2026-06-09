from app.auth import create_access_token, hash_password, verify_password


def test_register(client, user_data):
    response = client.post("/auth/register", json=user_data)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == user_data["email"]
    assert data["name"] == user_data["name"]
    assert "password" not in data
    assert "hashed_password" not in data


def test_register_duplicate_email(client, user_data):
    client.post("/auth/register", json=user_data)
    response = client.post("/auth/register", json=user_data)
    assert response.status_code == 409
    assert "already registered" in response.json()["detail"]


def test_login_success(client, user_data):
    client.post("/auth/register", json=user_data)
    response = client.post("/auth/login", json=user_data)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_password(client, user_data):
    client.post("/auth/register", json=user_data)
    response = client.post(
        "/auth/login",
        json={"email": user_data["email"], "password": "wrongpass", "name": ""},
    )
    assert response.status_code == 401


def test_login_invalid_email(client):
    response = client.post(
        "/auth/login",
        json={"email": "noexist@test.com", "password": "pass123", "name": ""},
    )
    assert response.status_code == 401


def test_get_current_user_with_token(client, user_data):
    resp = client.post("/auth/register", json=user_data)
    user_id = resp.json()["id"]

    login_resp = client.post("/auth/login", json=user_data)
    token = login_resp.json()["access_token"]

    response = client.get("/users/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["id"] == user_id


def test_get_current_user_no_token(client):
    response = client.get("/users/me")
    assert response.status_code == 401


def test_get_current_user_invalid_token(client):
    response = client.get(
        "/users/me", headers={"Authorization": "Bearer invalidtoken"}
    )
    assert response.status_code == 401


def test_hash_and_verify():
    hashed = hash_password("mypassword")
    assert verify_password("mypassword", hashed)
    assert not verify_password("wrong", hashed)


def test_create_access_token():
    token = create_access_token({"sub": "test@example.com"})
    assert token is not None
    assert isinstance(token, str)
    assert len(token.split(".")) == 3
