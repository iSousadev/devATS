import warnings

# Suprimir warnings de bibliotecas deprecadas
warnings.filterwarnings('ignore', category=FutureWarning)
try:
    from cryptography.utils import CryptographyDeprecationWarning
    warnings.filterwarnings('ignore', category=CryptographyDeprecationWarning)
except ImportError:
    pass

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.settings import get_settings
from app.routers import extract, generate, parse

settings = get_settings()

app = FastAPI(
    title="ResumeATS API",
    description="API to transform problematic resumes into ATS-friendly resumes.",
    version=settings.app_version,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=False if "*" in settings.allowed_origins_list else True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(parse.router, prefix="/api", tags=["Parse"])
app.include_router(extract.router, prefix="/api", tags=["Extract"])
app.include_router(generate.router, prefix="/api", tags=["Generate"])


@app.get("/")
async def root() -> dict:
    return {
        "message": "ResumeATS API",
        "env": settings.app_env,
        "docs": "/docs",
    }


@app.get("/health")
async def health() -> dict:
    return {"status": "healthy"}
