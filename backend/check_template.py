"""Script para verificar o conteúdo do template DOCX"""
from docx import Document
from pathlib import Path

template_path = Path("app/templates/template-frontend-jr.docx")

if not template_path.exists():
    print(f"❌ Template não encontrado: {template_path}")
    exit(1)

doc = Document(str(template_path))

print("=" * 80)
print("📄 CONTEÚDO DO TEMPLATE")
print("=" * 80)

# Extrair texto completo do documento
full_text = []
for para in doc.paragraphs:
    if para.text.strip():
        full_text.append(para.text)

print("\n".join(full_text))

print("\n" + "=" * 80)
print("🔍 VARIÁVEIS JINJA2 ENCONTRADAS:")
print("=" * 80)

# Procurar por variáveis {{ }} no texto
import re
jinja_vars = set()
for text in full_text:
    matches = re.findall(r'\{\{\s*([^}]+)\s*\}\}', text)
    jinja_vars.update(matches)

if jinja_vars:
    for var in sorted(jinja_vars):
        print(f"  • {{ {var} }}")
else:
    print("⚠️  NENHUMA VARIÁVEL JINJA2 ENCONTRADA!")
    print("O template tem dados hardcoded em vez de variáveis dinâmicas!")

print("\n" + "=" * 80)
