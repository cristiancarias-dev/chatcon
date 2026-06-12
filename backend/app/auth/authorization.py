from app.models.user import User


def is_admin(user: User) -> bool:
    """Check if a user has admin privileges (superuser or admin role)."""
    return user.is_superuser or any(r.name == "admin" for r in user.roles)
