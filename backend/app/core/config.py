from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # 🔥 FORCE DB (temporary fix)
    DATABASE_URL: str = "postgresql://postgres:postgres@127.0.0.1:5433/stationery"

    # Optional configs
    app_env: str = "development"
    # Comma-separated list of allowed CORS origins.
    # Default covers local dev. Override via CORS_ORIGINS env var in production.
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    gemini_api_key: str = "dummy_key"
    faiss_index_path: str = "./data/faiss.index"
    secret_key: str = "your_secret_key"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    jwt_issuer: str = "stationery-store-api"
    shop_owner_email: str = "owner@gmail.com"
    shop_owner_name: str = "owner"
    shop_owner_password: str = "123456"
    contact_smtp_host: str = ""
    contact_smtp_port: int = 587
    contact_smtp_user: str = ""
    contact_smtp_password: str = ""
    contact_smtp_use_tls: bool = True
    contact_notification_email: str = "owner@gmail.com"


# single instance
settings = Settings()