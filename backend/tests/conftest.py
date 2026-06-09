import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


def seed_test_data(db):
    from app.auth import hash_password
    from app.models.role import Permission, Role
    from app.models.user import User

    permissions_data = [
        ("read_user", "View users"),
        ("create_user", "Create users"),
        ("update_user", "Update users"),
        ("delete_user", "Delete users"),
        ("read_role", "View roles"),
        ("create_role", "Create roles"),
        ("update_role", "Update roles"),
        ("delete_role", "Delete roles"),
    ]
    perm_objects = {}
    for codename, desc in permissions_data:
        perm = Permission(codename=codename, description=desc)
        db.add(perm)
        perm_objects[codename] = perm
    db.flush()

    admin_role = Role(name="admin", description="Administrator with full access")
    user_role = Role(name="user", description="Regular user")
    db.add(admin_role)
    db.add(user_role)
    db.flush()

    admin_role.permissions = list(perm_objects.values())
    user_role.permissions = [perm_objects["read_user"], perm_objects["update_user"]]
    db.flush()

    admin_user = User(
        email="admin@test.com",
        hashed_password=hash_password("admin123"),
        name="Admin",
        is_active=True,
        is_superuser=True,
    )
    db.add(admin_user)
    db.flush()
    admin_user.roles = [admin_role]
    db.commit()


@pytest.fixture
def client():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    seed_test_data(db)
    db.close()
    yield TestClient(app)
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    seed_test_data(db)
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def user_data():
    return {"email": "test@example.com", "password": "testpass123", "name": "Test User"}


@pytest.fixture
def admin_token(client):
    response = client.post(
        "/auth/login",
        json={"email": "admin@test.com", "password": "admin123", "name": ""},
    )
    return response.json()["access_token"]


@pytest.fixture
def user_token(client, user_data):
    client.post("/auth/register", json=user_data)
    response = client.post("/auth/login", json=user_data)
    return response.json()["access_token"]
