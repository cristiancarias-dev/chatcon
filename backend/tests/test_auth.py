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


def test_admin_list_users(client, admin_token, user_data):
    client.post("/auth/register", json=user_data)
    response = client.get(
        "/users/",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    assert any(u["email"] == "admin@test.com" for u in data)
    assert any(u["email"] == "test@example.com" for u in data)


def test_user_cannot_list_users(client, user_token):
    response = client.get(
        "/users/",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 403


def test_admin_read_user(client, admin_token, user_data):
    reg = client.post("/auth/register", json=user_data)
    user_id = reg.json()["id"]
    response = client.get(
        f"/users/{user_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.json()["email"] == user_data["email"]


def test_admin_delete_user(client, admin_token, user_data):
    reg = client.post("/auth/register", json=user_data)
    user_id = reg.json()["id"]
    response = client.delete(
        f"/users/{user_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 204


def test_user_cannot_delete_user(client, user_token, user_data):
    client.post("/auth/register", json=user_data)
    response = client.delete(
        "/users/1",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 403


def test_admin_list_roles(client, admin_token):
    response = client.get(
        "/roles/",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert any(r["name"] == "admin" for r in data)
    assert any(r["name"] == "user" for r in data)


def test_admin_create_role(client, admin_token):
    response = client.post(
        "/roles/",
        json={"name": "moderator", "description": "Moderator role"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 201
    assert response.json()["name"] == "moderator"


def test_user_cannot_create_role(client, user_token):
    response = client.post(
        "/roles/",
        json={"name": "moderator", "description": ""},
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 403


def test_admin_list_permissions(client, admin_token):
    response = client.get(
        "/permissions/",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    codenames = [p["codename"] for p in data]
    assert "read_user" in codenames
    assert "create_role" in codenames


def test_admin_update_user_roles(client, admin_token):
    response = client.put(
        "/users/1/roles",
        json=[1],
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert any(r["id"] == 1 for r in data["roles"])


def test_me_returns_roles(client, user_token):
    response = client.get(
        "/users/me",
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 200
    assert "roles" in response.json()


def test_admin_update_user(client, admin_token):
    response = client.put(
        "/users/1",
        json={"name": "Updated Admin", "is_superuser": True},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Admin"


def test_admin_delete_role(client, admin_token):
    role = client.post(
        "/roles/",
        json={"name": "temp", "description": ""},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    role_id = role.json()["id"]
    response = client.delete(
        f"/roles/{role_id}",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 204


def test_admin_update_role_permissions(client, admin_token):
    response = client.put(
        "/roles/1/permissions",
        json={"permission_ids": [1, 2]},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    perm_ids = [p["id"] for p in response.json()["permissions"]]
    assert 1 in perm_ids
    assert 2 in perm_ids
