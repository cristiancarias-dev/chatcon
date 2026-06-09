from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.database import Base, engine

app = FastAPI(title="Prueba API", version="0.1.0")


@app.on_event("startup")
def on_startup():
    from app.auth import hash_password
    from app.database import SessionLocal
    from app.models.user import User

    from app.database import Base, engine
    Base.metadata.create_all(bind=engine)

    try:
        db = SessionLocal()
        existing = db.query(User).filter(User.email == "admin@prueba.com").first()
        if not existing:
            db.add(
                User(
                    email="admin@prueba.com",
                    hashed_password=hash_password("admin123"),
                    name="Admin",
                    is_active=True,
                )
            )
            db.commit()
    finally:
        db.close()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
