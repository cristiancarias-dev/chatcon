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
    ("read_contact", "View contacts"),
    ("create_contact", "Create contacts"),
    ("update_contact", "Update contacts"),
    ("delete_contact", "Delete contacts"),
    ("read_conversation", "View conversations"),
    ("create_conversation", "Create conversations"),
    ("update_conversation", "Update conversations"),
    ("send_message", "Send messages in conversations"),
    ("manage_whatsapp_accounts", "Manage WhatsApp accounts"),
]

AGENT_PERMS = [
    "read_contact",
    "create_contact",
    "update_contact",
    "read_conversation",
    "create_conversation",
    "send_message",
]


def seed_database(db, admin_email: str = "admin@prueba.com"):
    existing = db.query(User).filter(User.email == admin_email).first()
    if existing:
        sync_permissions(db)
        return

    perm_objects = {}
    for codename, desc in PERMISSIONS_DATA:
        perm = Permission(codename=codename, description=desc)
        db.add(perm)
        perm_objects[codename] = perm
    db.flush()

    admin_role = Role(name="admin", description="Administrator with full access")
    user_role = Role(name="user", description="Regular user")
    agent_role = Role(
        name="agent",
        description="Agent who manages assigned contacts",
    )
    db.add(admin_role)
    db.add(user_role)
    db.add(agent_role)
    db.flush()

    admin_role.permissions = list(perm_objects.values())
    user_role.permissions = [perm_objects["read_user"], perm_objects["update_user"]]
    agent_role.permissions = [perm_objects[c] for c in AGENT_PERMS]
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


def sync_permissions(db):
    all_codenames = {c for c, _ in PERMISSIONS_DATA}
    existing_perms = {
        p.codename: p
        for p in db.query(Permission).filter(Permission.codename.in_(all_codenames)).all()
    }
    missing = all_codenames - set(existing_perms.keys())
    if not missing:
        return

    for codename, desc in PERMISSIONS_DATA:
        if codename in missing:
            perm = Permission(codename=codename, description=desc)
            db.add(perm)
            existing_perms[codename] = perm
    db.flush()

    admin_role = db.query(Role).filter(Role.name == "admin").first()
    agent_role = db.query(Role).filter(Role.name == "agent").first()

    if admin_role:
        admin_role_codenames = {p.codename for p in admin_role.permissions}
        for codename in missing:
            if codename in existing_perms and codename not in admin_role_codenames:
                admin_role.permissions.append(existing_perms[codename])

    if agent_role:
        agent_role_codenames = {p.codename for p in agent_role.permissions}
        for codename in AGENT_PERMS:
            if codename in missing and codename not in agent_role_codenames:
                agent_role.permissions.append(existing_perms[codename])

    db.commit()
