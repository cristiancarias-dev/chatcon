from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://prueba:prueba123@db:5432/prueba"
    jwt_secret: str = "supersecretkeychangeinproduction"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
