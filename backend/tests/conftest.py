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
    from app.seed import seed_database
    seed_database(db, admin_email="admin@test.com")


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
        json={"email": "admin@test.com", "password": "admin123"},
    )
    return response.json()["access_token"]


@pytest.fixture
def user_token(client, user_data):
    client.post("/auth/register", json=user_data)
    response = client.post(
        "/auth/login",
        json={"email": user_data["email"], "password": user_data["password"]},
    )
    return response.json()["access_token"]
