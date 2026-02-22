import json
import re
import unicodedata
import warnings
from typing import Any

# Suprimir warnings de deprecação
warnings.filterwarnings('ignore', category=FutureWarning, module='google.generativeai')
warnings.filterwarnings('ignore', category=DeprecationWarning)

import google.generativeai as genai
from google.generativeai.generative_models import GenerativeModel
from google.api_core import exceptions as google_exceptions
from pydantic import ValidationError

from app.core.settings import get_settings
from app.models.schemas import ResumeData


PROMPT_TEMPLATE = """
Você é um assistente de extração de dados de currículos. Sua ÚNICA função é extrair informações que REALMENTE EXISTEM no currículo fornecido.

REGRAS ABSOLUTAS - VIOLAÇÕES INVALIDARÃO A RESPOSTA:

1. FIDELIDADE TOTAL AO TEXTO ORIGINAL:
   - Copie EXATAMENTE como está escrito, palavra por palavra, incluindo pontuação, maiúsculas, acentos e formatação
   - NUNCA parafraseie, resuma, reescreva, melhore ou ajuste o texto
   - NUNCA traduza termos técnicos ou nomes próprios
   - NUNCA corrija erros de português ou gramática do currículo original
   - Se o currículo diz "Desenvolvi feature X", escreva "Desenvolvi feature X" (não "Desenvolvimento de feature X")
   - Se o currículo diz "React", não escreva "React.js" ou "ReactJS"

2. NÃO INVENTE, DEDUZA OU INFIRA:
   - Se um dado NÃO está explicitamente no currículo, use null ou []
   - NÃO adicione habilidades que "provavelmente a pessoa tem" baseado no cargo
   - NÃO complete informações faltantes com base em experiências anteriores
   - NÃO invente datas, localizações, tecnologias ou responsabilidades
   - NÃO deduza soft skills que não estejam explícitas
   - NÃO adicione projetos, certificações ou idiomas que não estejam listados

3. PRESERVAÇÃO DE NOMES E IDENTIDADES:
   - Nomes de empresas: copie EXATAMENTE (ex: "L.U.M.I.N.A" não é "LUMINA", "Dev Tech" não é "DevTech")
   - Nomes de ligas/organizações: preservar pontos, espaços e abreviações
   - Nomes de tecnologias: manter capitalização original (Python, not python; JavaScript, not javascript)
   - Cargos: copiar exatamente como listado (não normalizar ou padronizar)

4. QUANDO USAR null OU [] (LISTA VAZIA):
   - Campo NÃO existe no currículo → null ou []
   - Campo existe mas está vazio → null ou []
   - Informação parcial ou ambígua → extrair apenas o que está claro, resto null
   - Dúvida entre duas interpretações → use null, não invente

5. ESTRUTURA JSON:
Retorne APENAS JSON válido (sem ```json, sem markdown) com esta estrutura:

{
  "personal_info": {
    "full_name": "Nome EXATO do topo do currículo",
    "headline": "Cargo/título EXATO se houver logo após o nome",
    "email": "email@exato.com ou null",
    "phone": "telefone exato ou null",
    "location": "localização exata ou null",
    "linkedin": "URL completa https://... ou null",
    "github": "URL completa https://... ou null",
    "portfolio": "URL completa https://... ou null"
  },
  "summary": "Copiar resumo/objetivo INTEGRALMENTE do currículo, ou null se não houver",
  "experiences": [
    {
      "company": "Nome EXATO da empresa como escrito",
      "position": "Cargo EXATO",
      "location": "Local exato ou null",
      "start_date": "YYYY-MM formato quando disponível",
      "end_date": "YYYY-MM ou 'Atual' se atual, ou null",
      "current": true/false,
      "achievements": ["Item 1 EXATO", "Item 2 EXATO", "..."]
    }
  ],
  "extracurricular_experiences": "Mesma estrutura de experiences, para ligas, voluntariado, projetos acadêmicos",
  "education": [
    {
      "institution": "Nome EXATO da instituição",
      "degree": "Nome EXATO do curso/grau",
      "field": "Área exata ou null",
      "start_date": "YYYY quando possível",
      "end_date": "YYYY ou 'Cursando' ou null",
      "current": true/false
    }
  ],
  "skills": {
    "technical": ["Cópias EXATAS de skills técnicas"],
    "tools": ["Ferramentas EXATAS listadas"],
    "soft": ["Soft skills EXATAS se explicitamente listadas"],
    "categorized": {
      "linguagens": "Lista separada por vírgula SE categoria existir, null caso contrário",
      "frontend": "Lista separada por vírgula SE categoria existir, null caso contrário",
      "backend": "...",
      "frameworks": "...",
      "banco_de_dados": "...",
      "ferramentas": "...",
      "praticas": "..."
    }
  },
  "certifications": [
    {
      "name": "Nome EXATO do certificado",
      "institution": "Instituição EXATA ou null",
      "date": "YYYY ou YYYY-MM quando disponível, ou null"
    }
  ],
  "projects": [
    {
      "name": "Nome EXATO do projeto",
      "description": "Descrição INTEGRAL copiada do currículo",
      "highlights": ["Destaques EXATOS se houver"],
      "technologies": ["Tecnologias EXATAS mencionadas"],
      "url": "URL completa https://... ou null"
    }
  ],
  "languages": [
    {
      "language": "Idioma EXATO",
      "proficiency": "Nível EXATO como descrito"
    }
  ]
}

6. EXEMPLOS DO QUE NÃO FAZER:
   ❌ Currículo: "Implementei API REST" → Você: "Desenvolveu APIs RESTful para..."
   ✅ Correto: "Implementei API REST"
   
   ❌ Currículo não menciona "Docker" → Você adiciona porque viu "containers"
   ✅ Correto: Não adicionar Docker
   
   ❌ Currículo: "L.I.G.A." → Você: "LIGA"
   ✅ Correto: "L.I.G.A."
   
   ❌ Currículo: cargo vazio → Você: "Desenvolvedor" (baseado em responsabilidades)
   ✅ Correto: null

CURRÍCULO A SER EXTRAÍDO:
[[CURRICULO_TEXT]]

LEMBRE-SE: Sua resposta será validada. Qualquer dado que não esteja explicitamente no currículo acima resultará em falha total da extração.
"""

RETRY_SUFFIX = """

⚠️ ATENÇÃO - NOVA TENTATIVA:
- A resposta anterior foi truncada (excedeu limite de tokens)
- Gere novamente o JSON COMPLETO com TODAS as informações do currículo
- Mantenha FIDELIDADE ABSOLUTA: copie textos exatamente como estão, não invente nada
- NÃO omita experiências, projetos, certificações, educação ou habilidades
- NÃO resuma ou parafraseie - copie integralmente
- Se precisar priorizar: inclua TODOS os dados estruturais, mesmo que precise encurtar descriptions/achievements ligeiramente
- Retorne SOMENTE JSON válido, sem markdown
"""

PRIMARY_MAX_OUTPUT_TOKENS = 12288
RETRY_MAX_OUTPUT_TOKENS = 16384


def _clean_json_response(raw_text: str) -> str:
    content = raw_text.strip()
    content = re.sub(r"^```(?:json)?\s*", "", content, flags=re.IGNORECASE)
    content = re.sub(r"\s*```$", "", content)
    content = content.strip()

    if content.startswith("{") and content.endswith("}"):
        return content

    first = content.find("{")
    last = content.rfind("}")
    if first != -1 and last != -1 and last > first:
        return content[first : last + 1]

    return content


def _is_quota_or_rate_error(error_text: str) -> bool:
    lowered = error_text.lower()
    keywords = [
        "quota",
        "quota exceeded",
        "exceeded your current quota",
        "rate limit",
        "resource exhausted",
        "resource_exhausted",
        "429",
        "too many requests",
        "free_tier",
    ]
    return any(keyword in lowered for keyword in keywords)


def _ensure_list(value: object) -> list[object]:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        stripped = value.strip()
        if not stripped:
            return []
        if "," in stripped:
            return [part.strip() for part in stripped.split(",") if part.strip()]
        return [stripped]
    return [value]


def _to_str_required(value: object, fallback: str = "") -> str:
    if value is None:
        return fallback
    if isinstance(value, str):
        return value.strip()
    return str(value).strip()


def _to_str_optional(value: object) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        stripped = value.strip()
        return stripped if stripped else None
    converted = str(value).strip()
    return converted if converted else None


def _normalize_url(value: object) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str):
        return None

    url = value.strip()
    if not url:
        return None
    if url.lower() in {"null", "none", "n/a", "na", "-"}:
        return None
    if url.startswith(("http://", "https://")):
        return url

    # Common case: linkedin.com/in/..., github.com/...
    if re.match(r"^[a-z0-9.-]+\.[a-z]{2,}(/.*)?$", url, re.IGNORECASE):
        return f"https://{url}"

    return None


def _normalize_for_match(value: str) -> str:
    if not value:
        return ""
    value = (
        value.replace("â€“", "-")
        .replace("â€”", "-")
        .replace("–", "-")
        .replace("—", "-")
        .replace("−", "-")
    )
    normalized = unicodedata.normalize("NFKD", value)
    without_marks = "".join(char for char in normalized if not unicodedata.combining(char))
    lowered = without_marks.lower()
    lowered = re.sub(r"[^a-z0-9\s:/|.-]", "", lowered)
    lowered = re.sub(r"\s{2,}", " ", lowered)
    return lowered.strip()


def _looks_extracurricular(exp: dict) -> bool:
    combined = " ".join(
        [
            str(exp.get("company", "")),
            str(exp.get("position", "")),
            str(exp.get("location", "")),
            " ".join(str(a) for a in exp.get("achievements", [])),
        ]
    )
    combined = _normalize_for_match(combined)
    keywords = [
        "extracurricular",
        "liga",
        "volunt",
        "academica",
        "acadêmica",
        "membro",
        "diretoria",
        "centro academico",
        "projeto academico",
    ]
    return any(keyword in combined for keyword in keywords)


def _normalize_experience_item(item: dict, headline: str | None = None) -> dict:
    exp = dict(item)
    exp["company"] = _to_str_required(
        exp.get("company")
        or exp.get("organization")
        or exp.get("institution")
        or exp.get("org")
    )
    position = _to_str_required(exp.get("position"))
    if not position:
        position = _to_str_required(headline, "Cargo nao informado")
    exp["position"] = position
    exp["location"] = _to_str_optional(exp.get("location"))
    exp["start_date"] = _to_str_required(exp.get("start_date"))
    exp["end_date"] = _to_str_optional(exp.get("end_date"))
    exp["achievements"] = _join_fragmented_achievements(
        [str(x).strip() for x in _ensure_list(exp.get("achievements")) if str(x).strip()]
    )
    current = exp.get("current")
    if isinstance(current, str):
        exp["current"] = current.strip().lower() in {"true", "1", "yes", "sim", "atual", "presente"}
    else:
        exp["current"] = bool(current)
    end_date_lower = (exp.get("end_date") or "").strip().lower()
    if end_date_lower in {"atual", "presente", "current"}:
        exp["current"] = True
        exp["end_date"] = "Atual"
    if exp.get("current") and not exp.get("end_date"):
        exp["end_date"] = "Atual"
    return exp


def _join_fragmented_achievements(achievements: list[str]) -> list[str]:
    """Une linhas de achievement que sao continuacao uma da outra (quebras de linha do PDF)."""
    if not achievements:
        return achievements
    result: list[str] = []
    for raw in achievements:
        line = re.sub(r"^[-\u2013\u2022\xb7]\s*", "", raw.strip()).strip()
        if not line:
            continue
        if result and line[0].islower() and not result[-1].rstrip().endswith("."):
            result[-1] = result[-1].rstrip() + " " + line
        else:
            result.append(line)
    return result


def _normalize_company_name(value: str) -> str:
    cleaned = value.strip(" -|:;")
    return re.sub(r"\s{2,}", " ", cleaned)


def _dedupe_keep_order(items: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for item in items:
        normalized = item.strip()
        if not normalized:
            continue
        key = normalized.lower()
        if key in seen:
            continue
        seen.add(key)
        result.append(normalized)
    return result


def _extract_lines(raw_text: str) -> list[str]:
    return [line.strip() for line in raw_text.splitlines() if line.strip()]


def _find_first_line(lines: list[str], patterns: list[str]) -> str | None:
    lowered_patterns = [_normalize_for_match(pattern) for pattern in patterns if pattern]
    for line in lines:
        lowered = _normalize_for_match(line)
        if any(pattern in lowered for pattern in lowered_patterns):
            return line
    return None


def _find_anchor_index(lines: list[str], anchors: list[str]) -> int | None:
    lowered_anchors = [
        _normalize_for_match(anchor) for anchor in anchors if anchor and len(anchor.strip()) >= 3
    ]
    for i, line in enumerate(lines):
        lowered = _normalize_for_match(line)
        if any(anchor in lowered for anchor in lowered_anchors):
            return i
    return None


def _extract_achievement_candidates(lines: list[str], anchor_idx: int | None) -> list[str]:
    if anchor_idx is None:
        return []

    ignored_prefixes = ("email:", "telefone:", "linkedin:", "github:", "cidade:", "tecnologias:")

    candidates: list[str] = []
    for line in lines[anchor_idx + 1 : anchor_idx + 40]:
        lowered = _normalize_for_match(line)
        if _detect_section_key(lowered):
            break
        if any(lowered.startswith(prefix) for prefix in ignored_prefixes):
            continue
        if len(line) < 20:
            continue
        text = line.lstrip("- ").strip() if line.startswith("-") else line
        candidates.append(text)
        if len(candidates) >= 10:
            break

    return _dedupe_keep_order(candidates)


def _extract_languages_from_text(lines: list[str]) -> list[dict]:
    results: list[dict] = []
    for line in lines:
        normalized = _normalize_for_match(line)
        if normalized.startswith("idiomas"):
            continue
        if ":" in line and any(token in normalized for token in ("ingl", "espanh", "franc", "alema")):
            language, proficiency = line.split(":", 1)
            results.append(
                {
                    "language": language.strip(),
                    "proficiency": proficiency.strip(),
                }
            )
    return results


SECTION_KEYS = {
    "summary": "summary",
    "skills": "skills",
    "experience": "experience",
    "extracurricular": "extracurricular",
    "projects": "projects",
    "education": "education",
    "courses": "courses",
    "languages": "languages",
}


def _split_technologies_line(value: str) -> list[str]:
    if not value:
        return []
    parts = re.split(r"\s*[·•|;,]\s*", value)
    return [part.strip() for part in parts if part.strip()]


def _detect_section_key(normalized_line: str) -> str | None:
    line = normalized_line.strip().rstrip(":")
    if not line:
        return None

    if "resumo" in line and "prof" in line:
        return "summary"
    if "habil" in line or line in {"skills", "skill"}:
        return "skills"
    if "exper" in line and ("extrac" in line or "extra" in line):
        return "extracurricular"
    if "liga" in line and ("academ" in line or "acad" in line):
        return "extracurricular"
    if "exper" in line and ("prof" in line or "trabalh" in line):
        return "experience"
    if line.startswith("projet"):
        return "projects"
    if ("forma" in line and ("academ" in line or "acad" in line)) or "educa" in line:
        return "education"
    if "curso" in line and ("complement" in line or "certif" in line or len(line.split()) <= 3):
        return "courses"
    if line.startswith("idiom") or "idioma" in line or "lingua" in line:
        return "languages"
    return None


def _split_sections_from_text(raw_text: str) -> dict[str, list[str]]:
    lines = _extract_lines(raw_text)
    sections = {
        "header": [],
        "summary": [],
        "skills": [],
        "experience": [],
        "extracurricular": [],
        "projects": [],
        "education": [],
        "courses": [],
        "languages": [],
    }

    current = "header"
    for line in lines:
        normalized = _normalize_for_match(line)
        matched_key = _detect_section_key(normalized)
        if matched_key:
            current = matched_key
            continue
        sections[current].append(line)

    return sections


def _merge_list_unique(base: list[str], extra: list[str]) -> list[str]:
    return _dedupe_keep_order([*base, *extra])


def _parse_dates_from_period(period_line: str) -> tuple[str, str | None, bool]:
    normalized = _normalize_for_match(period_line)
    month_map = {
        "jan": "01",
        "fev": "02",
        "mar": "03",
        "abr": "04",
        "mai": "05",
        "jun": "06",
        "jul": "07",
        "ago": "08",
        "set": "09",
        "out": "10",
        "nov": "11",
        "dez": "12",
    }
    month_pattern = r"(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)"
    month_range = re.search(
        rf"{month_pattern}\s*(\d{{4}})\s*[-]\s*(atual|presente|{month_pattern}\s*(\d{{4}})|\d{{4}})",
        normalized,
    )
    if month_range:
        start_month = month_map.get(month_range.group(1), "")
        start_year = month_range.group(2)
        start_date = f"{start_year}-{start_month}" if start_month and start_year else start_year
        end_token = (month_range.group(3) or "").strip()
        if end_token in {"atual", "presente"}:
            return start_date, "Atual", True
        end_month_match = re.search(rf"{month_pattern}\s*(\d{{4}})", end_token)
        if end_month_match:
            end_month = month_map.get(end_month_match.group(1), "")
            end_year = end_month_match.group(2)
            end_date = f"{end_year}-{end_month}" if end_month else end_year
            return start_date, end_date, False
        year_match = re.search(r"(19|20)\d{2}", end_token)
        if year_match:
            return start_date, year_match.group(0), False
        return start_date, None, False

    year_range = re.search(r"((?:19|20)\d{2})\s*[-]\s*(atual|presente|(?:19|20)\d{2})", normalized)
    if year_range:
        start_year = year_range.group(1)
        end_token = year_range.group(2)
        if end_token in {"atual", "presente"}:
            return start_year, "Atual", True
        return start_year, end_token, False

    return "", None, False


def _is_experience_header_line(line: str) -> bool:
    normalized = _normalize_for_match(line)
    if line.startswith("-"):
        return False
    has_year = bool(re.search(r"(19|20)\d{2}", normalized))
    has_month = any(m in normalized for m in ("jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"))
    has_current = "atual" in normalized or "presente" in normalized
    if "|" in line and (has_year or has_month):
        return True
    if len(line) <= 100 and has_year and has_current:
        return True
    return False


def _parse_experience_section(lines: list[str], default_position: str, fallback_company: str) -> list[dict]:
    if not lines:
        return []

    entries: list[dict] = []
    current: dict | None = None

    for raw_line in lines:
        line = raw_line.strip()
        if not line:
            continue

        if _is_experience_header_line(line):
            if current and (current.get("company") or current.get("achievements")):
                current["achievements"] = _dedupe_keep_order(current.get("achievements", []))
                entries.append(current)

            company = _normalize_company_name(line.split("|", 1)[0] if "|" in line else line)
            start_date, end_date, is_current = _parse_dates_from_period(line)
            current = {
                "company": company or fallback_company or "Experiencia profissional",
                "position": default_position or "Cargo nao informado",
                "location": None,
                "start_date": start_date,
                "end_date": end_date,
                "current": is_current,
                "achievements": [],
            }
            continue

        if current is None:
            current = {
                "company": fallback_company or "Experiencia profissional",
                "position": default_position or "Cargo nao informado",
                "location": None,
                "start_date": "",
                "end_date": None,
                "current": False,
                "achievements": [],
            }

        current["achievements"].append(line)

    if current and (current.get("company") or current.get("achievements")):
        current["achievements"] = _dedupe_keep_order(current.get("achievements", []))
        entries.append(current)

    return entries


def _parse_extracurricular_section(lines: list[str], default_position: str) -> list[dict]:
    if not lines:
        return []

    company = ""
    position = default_position or "Cargo nao informado"
    location: str | None = None
    start_date = ""
    end_date: str | None = None
    current = False
    achievements: list[str] = []

    for line in lines:
        normalized = _normalize_for_match(line)
        if "l.u.m.i.n.a" in normalized or "liga academica" in normalized:
            company = line.strip()
            break
    if not company:
        company = lines[0].strip()

    for line in lines:
        if "?" in line or "-" in line:
            splitter = "?" if "?" in line else "-"
            parts = line.split(splitter, 1)
            if len(parts) == 2 and parts[1].strip():
                position = parts[1].strip()
            break

    date_line_idx = None
    for idx, line in enumerate(lines):
        normalized = _normalize_for_match(line)
        if _is_experience_header_line(line) or any(month in normalized for month in ("jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez")):
            start_date, end_date, current = _parse_dates_from_period(line)
            parts = re.split(r"[?|]", line)
            for part in parts:
                part_norm = _normalize_for_match(part)
                if any(city_marker in part_norm for city_marker in ("sao luis", "sp", "rj", "ma")) and not re.search(r"\d{4}", part):
                    location = part.strip()
            date_line_idx = idx
            break

    for idx, line in enumerate(lines):
        stripped = line.strip()
        if not stripped:
            continue
        if idx == 0:
            continue
        if date_line_idx is not None and idx <= date_line_idx:
            continue
        if stripped.startswith("-"):
            achievements.append(stripped)
            continue
        if _is_experience_header_line(stripped):
            continue
        if stripped == company or stripped == position:
            continue
        achievements.append(stripped)

    return [
        {
            "company": company,
            "position": position,
            "location": location,
            "start_date": start_date,
            "end_date": end_date,
            "current": current,
            "achievements": _dedupe_keep_order(achievements),
        }
    ]


def _parse_skills_section(lines: list[str]) -> tuple[dict[str, str], dict]:
    categorized: dict[str, str] = {}
    technical: list[str] = []
    tools: list[str] = []
    soft: list[str] = []

    for line in lines:
        if ":" not in line:
            continue
        label, value = line.split(":", 1)
        value = value.strip()
        normalized_label = _normalize_for_match(label)
        if not value:
            continue

        if normalized_label.startswith("linguagens"):
            categorized["linguagens"] = value
            technical.extend([x.strip() for x in value.split(",") if x.strip()])
        elif normalized_label.startswith("frontend"):
            categorized["frontend"] = value
            technical.extend([x.strip() for x in value.split(",") if x.strip()])
        elif normalized_label.startswith("backend"):
            categorized["backend"] = value
            technical.extend([x.strip() for x in value.split(",") if x.strip()])
        elif normalized_label.startswith("frameworks"):
            categorized["frameworks"] = value
            technical.extend([x.strip() for x in value.split(",") if x.strip()])
        elif normalized_label.startswith("banco de dados"):
            categorized["banco_de_dados"] = value
            technical.extend([x.strip() for x in value.split(",") if x.strip()])
        elif normalized_label.startswith("ferramentas"):
            categorized["ferramentas"] = value
            tools.extend([x.strip() for x in value.split(",") if x.strip()])
        elif normalized_label.startswith("praticas"):
            categorized["praticas"] = value
            soft.extend([x.strip() for x in value.split(",") if x.strip()])

    return categorized, {
        "technical": _dedupe_keep_order(technical),
        "tools": _dedupe_keep_order(tools),
        "soft": _dedupe_keep_order(soft),
        "categorized": categorized,
    }


def _parse_projects_section(lines: list[str]) -> list[dict]:
    projects: list[dict] = []
    if not lines:
        return projects

    def is_project_title(line: str) -> bool:
        normalized = _normalize_for_match(line)
        if not line or line.startswith("-"):
            return False
        if "destaq" in normalized and ("tecn" in normalized or "tcn" in normalized):
            return False
        if normalized.startswith(("tecnologias", "tecnolog")):
            return False
        if normalized.startswith(
            (
                "projeto desenvolvido",
                "projeto academico",
                "projeto pessoal",
                "plataforma web desenvolvida",
                "aplicacao funcional",
            )
        ):
            return False
        if line.endswith("."):
            return False
        return len(line) <= 160

    def is_tech_list_line(line: str) -> bool:
        normalized = _normalize_for_match(line)
        if not line:
            return False
        if "tecnologias" in normalized or "tecnolog" in normalized:
            return True
        return "·" in line or "," in line or "|" in line

    i = 0
    current: dict | None = None
    mode = "desc"
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            i += 1
            continue

        normalized = _normalize_for_match(line)

        if "destaq" in normalized and ("tecn" in normalized or "tcn" in normalized):
            mode = "highlights"
            i += 1
            continue

        if normalized.startswith(("tecnologias", "tecnolog")):
            mode = "tech"
            if current is not None:
                after_colon = line.split(":", 1)[1].strip() if ":" in line else ""
                if after_colon:
                    current["technologies"].extend(_split_technologies_line(after_colon))
            i += 1
            continue

        if current is None:
            current = {"name": line, "description": [], "highlights": [], "technologies": [], "url": None}
            mode = "desc"
            i += 1
            continue

        if mode == "tech":
            if is_tech_list_line(line):
                current["technologies"].extend(_split_technologies_line(line.replace("Tecnologias:", "").strip()))
                i += 1
                continue
            if is_project_title(line):
                current["highlights"] = _dedupe_keep_order(current["highlights"])
                current["technologies"] = _dedupe_keep_order(current["technologies"])
                current["description"] = " ".join(current["description"]).strip()
                projects.append(current)
                current = {"name": line, "description": [], "highlights": [], "technologies": [], "url": None}
                mode = "desc"
                i += 1
                continue

        if is_project_title(line) and (current["description"] or current["highlights"] or current["technologies"]):
            current["highlights"] = _dedupe_keep_order(current["highlights"])
            current["technologies"] = _dedupe_keep_order(current["technologies"])
            current["description"] = " ".join(current["description"]).strip()
            projects.append(current)
            current = {"name": line, "description": [], "highlights": [], "technologies": [], "url": None}
            mode = "desc"
            i += 1
            continue

        if mode == "highlights":
            current["highlights"].append(line if line.startswith("-") else f"- {line}")
        elif mode == "tech":
            current["technologies"].extend(_split_technologies_line(line))
        else:
            current["description"].append(line)
        i += 1

    if current is not None:
        current["highlights"] = _dedupe_keep_order(current["highlights"])
        current["technologies"] = _dedupe_keep_order(current["technologies"])
        current["description"] = " ".join(current["description"]).strip()
        projects.append(current)

    return projects


def _parse_courses_section(lines: list[str]) -> list[dict]:
    courses: list[dict] = []
    for line in lines:
        text = line.lstrip("- ").strip()
        if not text:
            continue
        parts = re.split(r"\s+[–-]\s+", text, maxsplit=1)
        if len(parts) == 2:
            name, issuer = parts
        else:
            name, issuer = text, ""
        courses.append({"name": name.strip(), "issuer": issuer.strip(), "date": "", "url": None})
    return courses


def _parse_education_section(lines: list[str]) -> list[dict]:
    if not lines:
        return []
    degree = lines[0].strip() if lines else ""
    institution = lines[1].strip() if len(lines) > 1 else ""
    period_line = lines[2].strip() if len(lines) > 2 else ""
    year_match = re.search(r"(20\d{2})", period_line)
    end_date = year_match.group(1) if year_match else None
    return [
        {
            "institution": institution,
            "degree": degree,
            "location": None,
            "start_date": "",
            "end_date": end_date,
        }
    ]


def _extract_structured_from_sections(raw_text: str) -> dict:
    sections = _split_sections_from_text(raw_text)
    header = sections["header"]

    personal_info: dict = {}
    if header:
        personal_info["full_name"] = header[0].strip()
    if len(header) > 1:
        personal_info["headline"] = header[1].strip()
    for line in header:
        normalized = _normalize_for_match(line)
        if normalized.startswith("email:"):
            personal_info["email"] = line.split(":", 1)[1].strip()
        elif normalized.startswith("telefone:"):
            personal_info["phone"] = line.split(":", 1)[1].strip()
        elif normalized.startswith("linkedin:"):
            personal_info["linkedin"] = line.split(":", 1)[1].strip()
        elif normalized.startswith("github:"):
            personal_info["github"] = line.split(":", 1)[1].strip()
        elif normalized.startswith("cidade:"):
            personal_info["location"] = line.split(":", 1)[1].strip()

    summary = " ".join(sections["summary"]).strip() if sections["summary"] else None
    categorized, skills = _parse_skills_section(sections["skills"])
    skills["categorized"] = categorized

    return {
        "personal_info": personal_info,
        "summary": summary,
        "experiences": _parse_experience_section(
            sections["experience"], personal_info.get("headline", ""), "Experiencia profissional"
        ),
        "extracurricular_experiences": _parse_extracurricular_section(
            sections["extracurricular"], personal_info.get("headline", "")
        ),
        "skills": skills,
        "projects": _parse_projects_section(sections["projects"]),
        "education": _parse_education_section(sections["education"]),
        "certifications": _parse_courses_section(sections["courses"]),
        "languages": _extract_languages_from_text(sections["languages"]),
    }
def _extract_company_line_from_section(lines: list[str], section_title: str) -> str | None:
    section_idx = _find_anchor_index(lines, [section_title])
    if section_idx is None:
        return None

    month_tokens = ("jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez")
    for line in lines[section_idx + 1 : section_idx + 12]:
        normalized = _normalize_for_match(line)
        if "|" in line and any(token in normalized for token in month_tokens):
            return _normalize_company_name(line.split("|", 1)[0])
    return None


def _rebalance_skills(skills_obj: dict) -> dict:
    technical = [item for item in skills_obj.get("technical", []) if item and item.strip()]
    tools = [item for item in skills_obj.get("tools", []) if item and item.strip()]
    soft = [item for item in skills_obj.get("soft", []) if item and item.strip()]
    categorized = skills_obj.get("categorized", {})
    if not isinstance(categorized, dict):
        categorized = {}

    technical_hints = (
        "html",
        "css",
        "javascript",
        "typescript",
        "react",
        "next",
        "node",
        "express",
        "flask",
        "api",
        "sql",
        "mysql",
        "postgres",
        "python",
        "php",
        "orm",
        "jwt",
        "oauth",
        "rest",
        "docker",
    )
    tool_hints = (
        "git",
        "github",
        "figma",
        "postman",
        "supabase",
        "tailwind",
        "bootstrap",
        "opencv",
        "numpy",
        "pdf2image",
        "poppler",
        "cli",
        "scriptcase",
        "localstorage",
    )

    move_to_technical: list[str] = []
    keep_tools: list[str] = []
    for item in tools:
        lowered = item.lower()
        if any(hint in lowered for hint in technical_hints) and not any(hint in lowered for hint in tool_hints):
            move_to_technical.append(item)
        else:
            keep_tools.append(item)

    move_to_tools: list[str] = []
    keep_technical: list[str] = []
    for item in technical:
        lowered = item.lower()
        if any(hint in lowered for hint in tool_hints) and not any(hint in lowered for hint in technical_hints):
            move_to_tools.append(item)
        else:
            keep_technical.append(item)

    # Se soft vazio, popular de categorized.praticas
    if not soft and categorized.get("praticas"):
        soft = [p.strip() for p in categorized["praticas"].split(",") if p.strip()]

    return {
        "technical": _dedupe_keep_order(keep_technical + move_to_technical),
        "tools": _dedupe_keep_order(keep_tools + move_to_tools),
        "soft": _dedupe_keep_order(soft),
        "categorized": categorized,
    }


def _normalize_resume_payload(parsed: object) -> dict:
    if isinstance(parsed, list):
        parsed = parsed[0] if parsed else {}
    if not isinstance(parsed, dict):
        return {}

    data = dict(parsed)

    personal_info = data.get("personal_info")
    if isinstance(personal_info, dict):
        personal_info["full_name"] = _to_str_required(personal_info.get("full_name"))
        personal_info["headline"] = _to_str_optional(personal_info.get("headline"))
        personal_info["email"] = _to_str_required(personal_info.get("email"))
        personal_info["phone"] = _to_str_required(personal_info.get("phone"))
        personal_info["location"] = _to_str_required(personal_info.get("location"), "Nao informado")
        for field in ("linkedin", "github", "portfolio"):
            personal_info[field] = _normalize_url(personal_info.get(field))
    else:
        personal_info = {
            "full_name": "",
            "headline": None,
            "email": "",
            "phone": "",
            "location": "Nao informado",
            "linkedin": None,
            "github": None,
            "portfolio": None,
        }
    data["personal_info"] = personal_info

    experiences = []
    for item in _ensure_list(data.get("experiences")):
        if not isinstance(item, dict):
            continue
        experiences.append(_normalize_experience_item(item, personal_info.get("headline")))
    data["experiences"] = experiences

    extracurricular = []
    raw_extracurricular = (
        data.get("extracurricular_experiences")
        or data.get("extracurricular")
        or data.get("experiencias_extracurriculares")
    )
    for item in _ensure_list(raw_extracurricular):
        if not isinstance(item, dict):
            continue
        extracurricular.append(_normalize_experience_item(item, personal_info.get("headline")))

    if not extracurricular and experiences:
        regular = []
        for exp in experiences:
            if _looks_extracurricular(exp):
                extracurricular.append(exp)
            else:
                regular.append(exp)
        data["experiences"] = regular if regular else experiences

    data["extracurricular_experiences"] = extracurricular

    education = []
    for item in _ensure_list(data.get("education")):
        if not isinstance(item, dict):
            continue
        edu = dict(item)
        edu["institution"] = _to_str_required(edu.get("institution"))
        edu["degree"] = _to_str_required(edu.get("degree"))
        edu["location"] = _to_str_optional(edu.get("location"))
        edu["start_date"] = _to_str_required(edu.get("start_date"))
        edu["end_date"] = _to_str_optional(edu.get("end_date"))
        education.append(edu)
    data["education"] = education

    skills = data.get("skills")
    if isinstance(skills, dict):
        categorized_raw = (
            skills.get("categorized")
            or skills.get("categories")
            or skills.get("by_category")
            or {}
        )
        categorized = {}
        if isinstance(categorized_raw, dict):
            for key, value in categorized_raw.items():
                if not isinstance(key, str):
                    continue
                val = _to_str_optional(value)
                if val:
                    categorized[key] = val
        skills_obj = {
            "technical": [str(x).strip() for x in _ensure_list(skills.get("technical")) if str(x).strip()],
            "tools": [str(x).strip() for x in _ensure_list(skills.get("tools")) if str(x).strip()],
            "soft": [str(x).strip() for x in _ensure_list(skills.get("soft")) if str(x).strip()],
            "categorized": categorized,
        }
    elif isinstance(skills, list):
        skills_obj = {
            "technical": [str(x).strip() for x in skills if str(x).strip()],
            "tools": [],
            "soft": [],
        }
    elif isinstance(skills, str):
        skills_obj = {
            "technical": [part.strip() for part in skills.split(",") if part.strip()],
            "tools": [],
            "soft": [],
            "categorized": {},
        }
    else:
        skills_obj = {"technical": [], "tools": [], "soft": [], "categorized": {}}
    data["skills"] = _rebalance_skills(skills_obj)

    certifications = []
    for item in _ensure_list(data.get("certifications")):
        if not isinstance(item, dict):
            continue
        cert = dict(item)
        cert["name"] = _to_str_required(cert.get("name"))
        cert["issuer"] = _to_str_required(cert.get("issuer"))
        cert["date"] = _to_str_required(cert.get("date"))
        cert["url"] = _normalize_url(cert.get("url"))
        certifications.append(cert)
    data["certifications"] = certifications

    projects = []
    for item in _ensure_list(data.get("projects")):
        if not isinstance(item, dict):
            continue
        proj = dict(item)
        proj["name"] = _to_str_required(proj.get("name"))
        proj["description"] = _to_str_required(proj.get("description"))
        highlights_source = proj.get("highlights")
        if highlights_source is None:
            highlights_source = proj.get("achievements")
        proj["highlights"] = [str(x).strip() for x in _ensure_list(highlights_source) if str(x).strip()]
        proj["technologies"] = [str(x).strip() for x in _ensure_list(proj.get("technologies")) if str(x).strip()]
        proj["url"] = _normalize_url(proj.get("url"))
        projects.append(proj)
    data["projects"] = projects

    languages = []
    for item in _ensure_list(data.get("languages")):
        if not isinstance(item, dict):
            continue
        lang = dict(item)
        lang["language"] = _to_str_required(lang.get("language"))
        lang["proficiency"] = _to_str_required(lang.get("proficiency"))
        if not lang["language"] and not lang["proficiency"]:
            continue
        if not lang["language"]:
            lang["language"] = "Nao informado"
        if not lang["proficiency"]:
            lang["proficiency"] = "Nao informado"
        languages.append(lang)
    data["languages"] = languages

    if "summary" not in data:
        data["summary"] = None
    if not data["personal_info"].get("headline"):
        for exp in data.get("experiences", []):
            if exp.get("position"):
                data["personal_info"]["headline"] = exp["position"]
                break
    if data["personal_info"].get("location", "").strip().lower() in {"", "nao informado", "não informado"}:
        for exp in data.get("experiences", []) + data.get("extracurricular_experiences", []):
            candidate = (exp.get("location") or "").strip()
            if candidate:
                data["personal_info"]["location"] = candidate
                break

    return data


def _company_is_date_string(value: str) -> bool:
    """Retorna True se o valor parece string de data/periodo, nao nome de empresa."""
    normalized = _normalize_for_match(value)
    has_year = bool(re.search(r"\d{4}", normalized))
    has_period = any(m in normalized for m in (
        "jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez",
        "atual", "presente",
    ))
    return has_year and has_period


def _is_valid_project_name(name: str) -> bool:
    """Retorna False se o nome parece fragmento de frase, nao titulo de projeto."""
    if not name or not name.strip():
        return False
    stripped = name.strip()
    if stripped[0].islower():
        return False
    if stripped[0] in ("-", "\u2013", "\u2022", "\xb7", "\u2014"):
        return False
    return True


def _experience_identity(item: dict) -> str:
    company = _normalize_for_match(str(item.get("company", "")))
    position = _normalize_for_match(str(item.get("position", "")))
    if not company:
        return position
    return f"{company}|{position}"


def _merge_experience_collections(current_items: list[dict], section_items: list[dict]) -> list[dict]:
    if not current_items:
        return section_items
    if not section_items:
        return current_items

    merged = [dict(item) for item in current_items]
    index_by_key = {_experience_identity(item): idx for idx, item in enumerate(merged)}

    for section_item in section_items:
        key = _experience_identity(section_item)
        idx = index_by_key.get(key)

        # Fallback: se section_item tem company mas nao ha match exato,
        # tenta casar por position com itens que tenham company vazia.
        if idx is None and section_item.get("company"):
            sec_position = _normalize_for_match(str(section_item.get("position", "")))
            for i, m in enumerate(merged):
                if not m.get("company") and _normalize_for_match(str(m.get("position", ""))) == sec_position:
                    idx = i
                    break

        if idx is None:
            merged.append(dict(section_item))
            index_by_key[key] = len(merged) - 1
            continue

        target = merged[idx]
        for field in ("company", "position", "location", "start_date", "end_date"):
            if not target.get(field) and section_item.get(field):
                target[field] = section_item.get(field)
        target["current"] = bool(target.get("current")) or bool(section_item.get("current"))
        target["achievements"] = _merge_list_unique(
            target.get("achievements", []), section_item.get("achievements", [])
        )

    return merged


def _project_identity(item: dict) -> str:
    return _normalize_for_match(str(item.get("name", "")))


def _merge_projects(current_projects: list[dict], section_projects: list[dict]) -> list[dict]:
    if not current_projects:
        return section_projects
    if not section_projects:
        return current_projects

    merged = [dict(item) for item in current_projects]
    index_by_key = {_project_identity(item): idx for idx, item in enumerate(merged)}

    for section_item in section_projects:
        key = _project_identity(section_item)
        idx = index_by_key.get(key)
        if idx is None:
            if not _is_valid_project_name(str(section_item.get("name", ""))):
                continue
            merged.append(dict(section_item))
            index_by_key[key] = len(merged) - 1
            continue

        target = merged[idx]
        current_desc = str(target.get("description") or "")
        section_desc = str(section_item.get("description") or "")
        if len(section_desc) > len(current_desc):
            target["description"] = section_desc
        target["highlights"] = _merge_list_unique(
            target.get("highlights", []), section_item.get("highlights", [])
        )
        target["technologies"] = _merge_list_unique(
            target.get("technologies", []), section_item.get("technologies", [])
        )
        if not target.get("url") and section_item.get("url"):
            target["url"] = section_item.get("url")

    return merged


def _enrich_payload_with_text_hints(data: dict, raw_text: str) -> dict:
    lines = _extract_lines(raw_text)
    if not lines:
        return data

    section_data = _extract_structured_from_sections(raw_text)

    personal_info = data.get("personal_info", {})
    section_personal = section_data.get("personal_info", {})
    for field in ("full_name", "headline", "email", "phone", "location", "linkedin", "github", "portfolio"):
        section_value = section_personal.get(field)
        if section_value and (not personal_info.get(field) or personal_info.get(field) in {"Nao informado", "nao informado"}):
            personal_info[field] = section_value

    if not personal_info.get("headline") and len(lines) > 1:
        second_line = lines[1]
        lowered = _normalize_for_match(second_line)
        if not lowered.startswith(("email:", "telefone:", "linkedin:", "github:")):
            personal_info["headline"] = second_line
    data["personal_info"] = personal_info

    section_summary = section_data.get("summary")
    if section_summary and len(section_summary) > len(data.get("summary") or ""):
        data["summary"] = section_summary

    section_skills = section_data.get("skills", {})
    current_skills = data.get("skills", {})
    merged_categorized = dict(current_skills.get("categorized", {}))
    merged_categorized.update(section_skills.get("categorized", {}))
    data["skills"] = {
        "technical": _merge_list_unique(current_skills.get("technical", []), section_skills.get("technical", [])),
        "tools": _merge_list_unique(current_skills.get("tools", []), section_skills.get("tools", [])),
        "soft": _merge_list_unique(current_skills.get("soft", []), section_skills.get("soft", [])),
        "categorized": merged_categorized,
    }

    experiences = data.get("experiences", [])
    extracurricular = data.get("extracurricular_experiences", [])
    section_experiences = section_data.get("experiences", [])
    section_extracurricular = section_data.get("extracurricular_experiences", [])

    experiences = _merge_experience_collections(experiences, section_experiences)
    extracurricular = _merge_experience_collections(extracurricular, section_extracurricular)

    # Remover entradas onde company é string de data/periodo (artefato do PDF duplicado)
    extracurricular = [
        exp for exp in extracurricular
        if not _company_is_date_string(str(exp.get("company", "")))
    ]

    for exp in experiences:
        if not exp.get("company"):
            company_line = _find_first_line(lines, ["dev tech", "empresa", "freela"])
            if company_line:
                exp["company"] = _normalize_company_name(company_line.split("|")[0])
            else:
                section_company = _extract_company_line_from_section(lines, "experiencia profissional")
                if section_company:
                    exp["company"] = section_company
        if not exp.get("achievements"):
            anchor_idx = _find_anchor_index(lines, [exp.get("company", ""), exp.get("position", "")])
            exp["achievements"] = _extract_achievement_candidates(lines, anchor_idx)

    for exp in extracurricular:
        if not exp.get("company"):
            company_line = _find_first_line(lines, [
                "l.u.m.i.n.a", "l . u . m . i . n . a", "lumina",
                "liga acadêmica", "liga academica",
            ])
            if company_line:
                exp["company"] = _normalize_company_name(company_line.split("|")[0])
            else:
                exp["company"] = "Experiência Extracurricular"
        if not exp.get("achievements"):
            anchor_idx = _find_anchor_index(lines, [exp.get("company", ""), "liga", "diretoria"])
            exp["achievements"] = _extract_achievement_candidates(lines, anchor_idx)

    data["experiences"] = experiences
    data["extracurricular_experiences"] = extracurricular

    section_projects = section_data.get("projects", [])
    current_projects = data.get("projects", [])
    data["projects"] = _merge_projects(current_projects, section_projects)

    section_education = section_data.get("education", [])
    if section_education and (not data.get("education")):
        data["education"] = section_education

    section_courses = section_data.get("certifications", [])
    if section_courses and len(section_courses) > len(data.get("certifications", [])):
        data["certifications"] = section_courses

    languages = data.get("languages", [])
    needs_language_fallback = not languages or all(
        _normalize_for_match(str(lang.get("language", ""))) in {"", "nao informado"}
        for lang in languages
        if isinstance(lang, dict)
    )
    if needs_language_fallback:
        extracted_languages = section_data.get("languages") or _extract_languages_from_text(lines)
        if extracted_languages:
            data["languages"] = extracted_languages

    return data


def _finish_reason_name(response: object) -> str | None:
    try:
        candidates = getattr(response, "candidates", None) or []
        if not candidates:
            return None
        candidate = candidates[0]
        finish_reason = getattr(candidate, "finish_reason", None)
        if finish_reason is None:
            return None
        return candidate.FinishReason(finish_reason).name
    except Exception:
        return None


def _generate_json_content(model: Any, prompt: str, max_output_tokens: int) -> tuple[str, str | None]:
    response = model.generate_content(
        prompt,
        generation_config={
            "temperature": 0.0,  # Máxima determinística - zero criatividade
            "top_p": 0.1,  # Restringe amostragem para previsibilidade
            "top_k": 1,  # Sempre escolhe o token mais provável
            "max_output_tokens": max_output_tokens,
            "response_mime_type": "application/json",
        },
    )
    content = (response.text or "").strip()
    return content, _finish_reason_name(response)


async def extract_resume_data(text: str) -> ResumeData:
    settings = get_settings()
    if not settings.gemini_api_key:
        raise RuntimeError("Servico de IA nao configurado. Defina GEMINI_API_KEY no backend/.env.")

    genai.configure(api_key=settings.gemini_api_key)  # type: ignore[attr-defined]
    model = GenerativeModel(settings.gemini_model)

    try:
        prompt = PROMPT_TEMPLATE.replace("[[CURRICULO_TEXT]]", text)
        content, finish_reason = _generate_json_content(
            model=model,
            prompt=prompt,
            max_output_tokens=PRIMARY_MAX_OUTPUT_TOKENS,
        )

        # Retry once with a stricter compact prompt when truncated.
        if finish_reason == "MAX_TOKENS":
            retry_prompt = f"{prompt}{RETRY_SUFFIX}"
            content, _ = _generate_json_content(
                model=model,
                prompt=retry_prompt,
                max_output_tokens=RETRY_MAX_OUTPUT_TOKENS,
            )
    except Exception as exc:
        message = str(exc)
        lowered = message.lower()
        if isinstance(exc, google_exceptions.ResourceExhausted):
            raise RuntimeError(
                "Servico de IA temporariamente indisponivel por limite de uso. Tente novamente em alguns minutos."
            ) from exc
        if isinstance(exc, google_exceptions.NotFound):
            raise RuntimeError(
                f"Modelo Gemini '{settings.gemini_model}' nao esta disponivel para esta chave/API."
            ) from exc
        if isinstance(exc, (google_exceptions.PermissionDenied, google_exceptions.Unauthenticated)):
            raise RuntimeError("GEMINI_API_KEY invalida ou sem permissao para este modelo.") from exc
        if _is_quota_or_rate_error(message):
            raise RuntimeError(
                "Servico de IA temporariamente indisponivel por limite de uso. Tente novamente em alguns minutos."
            ) from exc
        if "not found" in lowered and "model" in lowered:
            raise RuntimeError(
                f"Modelo Gemini '{settings.gemini_model}' nao esta disponivel para esta chave/API."
            ) from exc
        if "api key not valid" in lowered or "permission denied" in lowered or "403" in lowered:
            raise RuntimeError("GEMINI_API_KEY invalida ou sem permissao para este modelo.") from exc
        raise RuntimeError("Falha ao comunicar com o Gemini. Tente novamente.") from exc

    if not content:
        raise RuntimeError(
            "Não conseguimos processar seu currículo no momento. "
            "Isso pode acontecer com currículos muito extensos ou com formatação complexa. "
            "Tente novamente em alguns instantes."
        )

    cleaned = _clean_json_response(content)

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise RuntimeError(
            "Tivemos dificuldade em interpretar seu currículo. "
            "Isso pode acontecer se o documento tiver formatação muito complexa (tabelas, gráficos, múltiplas colunas). "
            "💡 Dica: tente simplificar o layout ou converter para um formato mais limpo."
        ) from exc

    try:
        normalized = _normalize_resume_payload(parsed)
        normalized = _enrich_payload_with_text_hints(normalized, text)
        return ResumeData(**normalized)
    except ValidationError as exc:
        issues = []
        for err in exc.errors()[:3]:
            loc = ".".join(str(part) for part in err.get("loc", []))
            msg = err.get("msg", "valor invalido")
            issues.append(f"{loc}: {msg}" if loc else msg)
        suffix = f" Campos invalidos: {', '.join(issues)}." if issues else ""
        raise RuntimeError(f"Gemini retornou dados fora do formato esperado.{suffix}") from exc
    except Exception as exc:
        raise RuntimeError("Gemini retornou dados fora do formato esperado. Tente novamente.") from exc
