from cryptography.fernet import Fernet

from app.config import settings

_fernet: Fernet | None = None


def get_fernet() -> Fernet:
    global _fernet
    if _fernet is not None:
        return _fernet
    key = settings.encryption_key
    if not key:
        key = Fernet.generate_key().decode()
        _write_env_key(key)
        settings.encryption_key = key
    _fernet = Fernet(key.encode() if isinstance(key, str) else key)
    return _fernet


def encrypt_value(value: str) -> str:
    f = get_fernet()
    return f.encrypt(value.encode()).decode()


def decrypt_value(encrypted: str) -> str:
    f = get_fernet()
    return f.decrypt(encrypted.encode()).decode()


def _write_env_key(key: str):
    env_path = ".env"
    try:
        with open(env_path) as f:
            content = f.read().rstrip("\n")
    except FileNotFoundError:
        content = ""
    if "ENCRYPTION_KEY=" in content:
        return
    with open(env_path, "a") as f:
        prefix = "\n" if content else ""
        f.write(f"{prefix}ENCRYPTION_KEY={key}\n")
