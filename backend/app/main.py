from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router

app = FastAPI(title="Prueba API", version="0.1.0")


def seed_defaults():
    from app.auth import hash_password
    from app.database import Base, SessionLocal, engine
    from app.models.role import Permission, Role
    from app.models.user import User

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == "admin@prueba.com").first()
        if existing:
            return

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
        read_user = perm_objects["read_user"]
        update_user = perm_objects["update_user"]
        user_role.permissions = [read_user, update_user]
        db.flush()

        admin_user = User(
            email="admin@prueba.com",
            hashed_password=hash_password("admin123"),
            name="Admin",
            is_active=True,
            is_superuser=True,
        )
        db.add(admin_user)
        db.flush()
        admin_user.roles = [admin_role]
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


@app.on_event("startup")
def on_startup():
    seed_defaults()


@app.get("/health")
def health_check():
    return {"status": "ok"}
