import os
from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://prueba:prueba123@db:5432/prueba"
    jwt_secret: str = "supersecretkeychangeinproduction"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    encryption_key: str = ""
    whatsapp_webhook_verify_token: str = "chatcon_verify_2024"

    model_config = {"env_file": ".env", "extra": "ignore"}

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.encryption_key:
            env_path = Path(".env")
            if env_path.exists():
                content = env_path.read_text()
                for line in content.splitlines():
                    if line.startswith("ENCRYPTION_KEY="):
                        val = line.split("=", 1)[1].strip()
                        if val:
                            self.encryption_key = val
                            break


settings = Settings()
