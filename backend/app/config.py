import os
from typing import Optional, List
from pydantic_settings import BaseSettings
from pydantic import ConfigDict, model_validator

DEFAULT_DEV_JWT_SECRET = "supersecretjwtkeythatisextremelysecureandlongenoughfor2026"

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://vendoriq_user:vendoriq_secure_pass_2026@db:5432/vendoriq_db"
    JWT_SECRET: str = DEFAULT_DEV_JWT_SECRET
    SECRET_KEY: Optional[str] = None  # Alias for JWT_SECRET
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    ENV_MODE: str = "development"
    FRONTEND_URL: str = "http://localhost:4200"
    CORS_ORIGINS: str = "http://localhost:4200,http://localhost:80,http://localhost"

    # SMTP Settings
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "no-reply@vendoriq.com"
    SMTP_USE_TLS: bool = True

    # SMS Settings
    SMS_PROVIDER: str = ""
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""

    # File Upload Settings
    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE_MB: int = 10

    # Allow custom .env reading if it exists
    model_config = ConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @model_validator(mode="after")
    def validate_production_security(self) -> "Settings":
        # Resolve SECRET_KEY alias if provided
        if self.SECRET_KEY and self.JWT_SECRET == DEFAULT_DEV_JWT_SECRET:
            self.JWT_SECRET = self.SECRET_KEY

        env = (self.ENV_MODE or "development").strip().lower()
        if env in ("production", "prod"):
            secret = (self.JWT_SECRET or "").strip()
            if not secret or secret == DEFAULT_DEV_JWT_SECRET:
                raise ValueError(
                    "FATAL: Insecure or default JWT_SECRET detected in production mode. "
                    "The default development secret cannot be used in production."
                )
            if len(secret) < 32:
                raise ValueError(
                    "FATAL: JWT_SECRET must be at least 32 characters long in production mode."
                )
        return self

    @property
    def avatars_dir(self) -> str:
        return os.path.join(self.UPLOAD_DIR, "avatars")

    @property
    def parsed_cors_origins(self) -> List[str]:
        origins = [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]
        env = (self.ENV_MODE or "development").strip().lower()
        if env in ("production", "prod"):
            # Wildcard is strictly forbidden in production with credentials
            origins = [o for o in origins if o != "*"]
        return origins

settings = Settings()

