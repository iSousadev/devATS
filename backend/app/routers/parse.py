from fastapi import APIRouter, File, HTTPException, UploadFile

from app.services.docx_parser import parse_docx
from app.services.pdf_parser import parse_pdf

router = APIRouter()

MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5MB


def detect_file_type(content: bytes) -> str | None:
    if content.startswith(b"%PDF"):
        return "pdf"

    if content.startswith(b"PK\x03\x04"):
        return "docx"

    return None


@router.post("/parse")
async def parse_resume(file: UploadFile = File(...)) -> dict:
    """
    Upload and parse PDF/DOCX resume content.
    File type is validated by magic bytes (not by content_type).
    """
    content = await file.read()

    if not content:
        raise HTTPException(status_code=400, detail="Arquivo vazio.")

    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="Arquivo muito grande. Maximo: 5MB.")

    detected_type = detect_file_type(content)
    if detected_type is None:
        raise HTTPException(status_code=400, detail="Formato nao suportado. Use PDF ou DOCX.")

    try:
        text = await parse_pdf(content) if detected_type == "pdf" else await parse_docx(content)
        return {
            "success": True,
            "filename": file.filename,
            "detected_type": detected_type,
            "text": text,
            "message": "Texto extraido com sucesso. Agora envie para a IA.",
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Erro ao processar arquivo: {exc}") from exc
