import io
from datetime import datetime

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.models.schemas import GenerateFromExtractRequest, GenerateRequest
from app.services.docx_generator import build_filename, generate_docx

router = APIRouter()

DEFAULT_TEMPLATE_ID = "template-frontend-jr"
GeneratePayload = GenerateRequest | GenerateFromExtractRequest


def _normalize_generate_request(request: GeneratePayload) -> GenerateRequest:
    if isinstance(request, GenerateRequest):
        return request

    template_id = (request.template_id or DEFAULT_TEMPLATE_ID).strip() or DEFAULT_TEMPLATE_ID
    return GenerateRequest(template_id=template_id, resume_data=request.data)


@router.post("/generate")
async def generate_resume(request: GeneratePayload) -> StreamingResponse:
    """
    Generate ATS-friendly DOCX.
    Accepts:
    - { "template_id": "...", "resume_data": { ... } }
    - /api/extract envelope { "success": true, "data": { ... }, "message": "..." }
    """
    normalized_request = _normalize_generate_request(request)

    try:
        docx_bytes = await generate_docx(normalized_request.template_id, normalized_request.resume_data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception:
        raise HTTPException(status_code=500, detail="Erro inesperado ao gerar DOCX.")

    today = datetime.now().strftime("%Y%m%d")
    filename = build_filename(normalized_request.resume_data.personal_info.full_name, today)

    return StreamingResponse(
        io.BytesIO(docx_bytes),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
