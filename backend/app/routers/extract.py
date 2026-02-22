from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.ai_extractor import extract_resume_data

router = APIRouter()


class ExtractRequest(BaseModel):
    text: str


@router.post("/extract")
async def extract_data(request: ExtractRequest) -> dict:
    """
    Extract structured resume data using Gemini Pro.
    """
    if not request.text or len(request.text.strip()) < 50:
        raise HTTPException(status_code=400, detail="Texto muito curto ou vazio.")

    try:
        resume_data = await extract_resume_data(request.text)
        return {
            "success": True,
            "data": resume_data.model_dump(mode="json"),
            "message": "Dados extraidos com sucesso. Revise antes de gerar o curriculo.",
        }
    except RuntimeError as exc:
        detail = str(exc)
        if "fora do formato esperado" in detail or "JSON invalido" in detail:
            raise HTTPException(status_code=422, detail=detail) from exc
        raise HTTPException(status_code=503, detail=detail) from exc
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Erro inesperado ao extrair dados com IA.",
        )
