from app.auth import hash_password
from app.models.role import Permission, Role
from app.models.user import User


PERMISSIONS_DATA = [
    ("read_user", "View users"),
    ("create_user", "Create users"),
    ("update_user", "Update users"),
    ("delete_user", "Delete users"),
    ("read_role", "View roles"),
    ("create_role", "Create roles"),
    ("update_role", "Update roles"),
    ("delete_role", "Delete roles"),
]


def seed_database(db, admin_email: str = "admin@prueba.com"):
    existing = db.query(User).filter(User.email == admin_email).first()
    if existing:
        return

    perm_objects = {}
    for codename, desc in PERMISSIONS_DATA:
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
        email=admin_email,
        hashed_password=hash_password("admin123"),
        name="Admin",
        is_active=True,
        is_superuser=True,
    )
    db.add(admin_user)
    db.flush()
    admin_user.roles = [admin_role]
    db.commit()
