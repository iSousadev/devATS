import io

import pdfplumber
from pypdf import PdfReader


async def parse_pdf(file_content: bytes) -> str:
    """
    Extract plain text from PDF.
    Primary parser: pdfplumber
    Fallback parser: pypdf
    """
    parts: list[str] = []

    try:
        with pdfplumber.open(io.BytesIO(file_content)) as pdf:
            for page in pdf.pages:
                text = (page.extract_text() or "").strip()
                if text:
                    parts.append(text)
    except Exception:
        parts = []

    if parts:
        return "\n".join(parts).strip()

    try:
        reader = PdfReader(io.BytesIO(file_content))
        for page in reader.pages:
            text = (page.extract_text() or "").strip()
            if text:
                parts.append(text)
    except Exception as exc:
        raise ValueError(f"Nao foi possivel extrair texto do PDF: {exc}") from exc

    if not parts:
        raise ValueError("PDF nao contem texto extraivel (provavel PDF escaneado/imagem).")

    return "\n".join(parts).strip()
