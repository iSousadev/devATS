from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"
    app_version: str = "0.1.0"
    allowed_origins: str = "http://localhost:3000"

    supabase_url: str | None = None
    supabase_anon_key: str | None = None
    supabase_service_role_key: str | None = None

    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.5-pro"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def allowed_origins_list(self) -> list[str]:
        value = (self.allowed_origins or "").strip()
        if not value:
            return ["http://localhost:3000"]
        if value == "*":
            return ["*"]
        return [origin.strip() for origin in value.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
