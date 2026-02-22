# DevATS Hacheando o Sistema

> Transforme currículos em documentos ATS-friendly com IA — em segundos.

DevATS é um projeto pessoal full stack que usa o **Google Gemini** para extrair, estruturar e gerar currículos otimizados para sistemas de triagem automatizada (ATS). O usuário pode tanto adaptar um currículo existente quanto criar um do zero, com download direto em `.docx`.

---

## ✨ Funcionalidades

- **Upload e adaptação** de currículos em PDF ou DOCX
- **Extração inteligente** de dados com Google Gemini (`gemini-2.5-pro`)
- **Geração de DOCX ATS-friendly** com templates profissionais
- **Criação de currículo do zero** via formulário guiado em etapas
- **Dashboard pessoal** para salvar e gerenciar currículos
- **Autenticação segura** com Supabase Auth
- **Isolamento de dados por usuário** via Row Level Security (RLS)

---

## 🖥️ Demo do fluxo

```
Login → Dashboard → Upload de currículo (PDF/DOCX)
                 → IA extrai e estrutura os dados
                 → Usuário revisa e ajusta
                 → Download do .docx ATS-friendly ✅

              ou → Formulário passo a passo
                 → Escolha de template
                 → Download do .docx ATS-friendly ✅
```

---

## 🧱 Stack

| Camada     | Tecnologias                                              |
|------------|----------------------------------------------------------|
| Frontend   | Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui |
| Backend    | FastAPI, Pydantic, python-docx / docxtpl                 |
| IA         | Google Gemini API (`gemini-2.5-pro`)                     |
| Auth / DB  | Supabase (Auth + PostgreSQL + Storage + RLS)             |

---

## 📁 Estrutura do projeto

```
devATS/
├── frontend/           # App Next.js (UI, auth, dashboard)
├── backend/            # API FastAPI (parse, extract, generate)
├── SUPABASE_SCHEMA.sql # Schema, RLS policies e triggers
├── scripts/
│   └── test-rls.ts     # Validação de isolamento por usuário
└── Templates/          # Exemplos de templates DOCX
```

---

## ⚙️ Pré-requisitos

- Node.js 20+ e npm 10+
- Python 3.11+
- Conta no [Supabase](https://supabase.com)
- Chave de API do [Google Gemini](https://aistudio.google.com)

---

## 🚀 Instalação e configuração

### 1. Clonar o repositório

```bash
git clone https://github.com/iSousadev/devATS.git
cd devATS
```

### 2. Instalar dependências

```bash
# Scripts utilitários da raiz
npm install

# Frontend
cd frontend && npm install && cd ..

# Backend
cd backend
python -m venv .venv

# Ativar venv:
# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1
# macOS / Linux:
# source .venv/bin/activate

pip install -r requirements.txt
cd ..
```

### 3. Configurar variáveis de ambiente

**Raiz — `.env`** (usado pelo script de teste RLS)

```dotenv
SUPABASE_URL=
SUPABASE_ANON_KEY=

TEST_USER_A_EMAIL=
TEST_USER_A_PASSWORD=
TEST_USER_B_EMAIL=
TEST_USER_B_PASSWORD=
```

**Backend — `backend/.env`**

```dotenv
APP_ENV=development
APP_VERSION=0.1.0
ALLOWED_ORIGINS=http://localhost:3000

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

GEMINI_MODEL=gemini-2.5-pro
GEMINI_API_KEY=
```

**Frontend — `frontend/.env.local`**

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### 4. Configurar o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Execute o conteúdo de `SUPABASE_SCHEMA.sql` no SQL Editor do painel.
3. Confirme que foram criados:
   - Tabelas `public.profiles` e `public.resumes`
   - RLS ativa com políticas por `auth.uid()`
   - Bucket privado `resumes` com políticas de storage por pasta do usuário

---

## ▶️ Rodando localmente

**Backend**

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Health check: [http://localhost:8000/health](http://localhost:8000/health)  
- Documentação Swagger: [http://localhost:8000/docs](http://localhost:8000/docs)

**Frontend**

```bash
cd frontend
npm run dev
```

- App: [http://localhost:3000](http://localhost:3000)

---

## 🔌 API Reference

### `POST /api/parse`

Recebe um arquivo PDF ou DOCX (multipart/form-data), valida os magic bytes e retorna o texto extraído.

- Tamanho máximo: **5 MB**

```json
// Resposta
{
  "success": true,
  "filename": "cv.pdf",
  "detected_type": "pdf",
  "text": "...",
  "message": "Texto extraído com sucesso."
}
```

### `POST /api/extract`

Envia o texto bruto para o Gemini e retorna os dados estruturados do currículo.

```json
// Body
{ "text": "texto extraído do currículo" }

// Resposta
{
  "success": true,
  "data": {
    "personal_info": {},
    "experiences": [],
    "skills": {}
  },
  "message": "Dados extraídos com sucesso. Revise antes de gerar."
}
```

### `POST /api/generate`

Gera o arquivo DOCX final a partir de um `template_id` e dos dados do currículo.

```json
// Body
{
  "template_id": "template-frontend-jr",
  "resume_data": { "...": "..." }
}
```

Retorno: stream do arquivo `.docx`.

> O endpoint também aceita o envelope retornado diretamente por `/api/extract`, sem necessidade de reformatar o payload.

---

## 🧾 Templates disponíveis

Os templates ficam em `backend/app/templates/`. IDs disponíveis:

- `template-frontend-jr`
- `template-frontend`
- `template-backend`

O backend aceita o `template_id` com ou sem a extensão `.docx`.

---

## 🧠 Como a IA funciona

A rota `/api/extract` usa a SDK `google-generativeai`. O prompt instrui o modelo a manter **fidelidade estrita ao conteúdo original** do currículo — sem inventar informações. A saída é normalizada e validada via Pydantic (`ResumeData`) antes de ser retornada. Casos de erro tratados incluem chave ausente/inválida, rate limit e JSON malformado ou truncado.

---

## ✅ Testes

### Teste de RLS

Valida que um usuário autenticado não consegue inserir um currículo com o `user_id` de outro usuário.

```bash
npm run test:rls
```

> Requer dois usuários cadastrados no Supabase e o `.env` da raiz configurado.

---

## 🛠️ Scripts disponíveis

| Contexto       | Comando                            | Descrição                  |
|----------------|------------------------------------|----------------------------|
| Raiz           | `npm run test:rls`                 | Teste de políticas RLS     |
| Frontend       | `npm run dev`                      | Servidor de desenvolvimento|
| Frontend       | `npm run build`                    | Build de produção          |
| Frontend       | `npm run start`                    | Start em produção          |
| Frontend       | `npm run lint`                     | Lint do código             |
| Backend        | `uvicorn app.main:app --reload`    | Servidor de desenvolvimento|

---

## 🧯 Troubleshooting

| Sintoma | Solução |
|---|---|
| "Serviço de IA não configurado" | Verifique `GEMINI_API_KEY` em `backend/.env` |
| Erros de CORS | Adicione a URL do frontend em `ALLOWED_ORIGINS` no `backend/.env` |
| Falha no login/cadastro | Confirme `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Erro ao gerar DOCX | Verifique se o `template_id` existe e se o payload contém `personal_info` e `skills` |
| PDF sem texto | PDFs baseados em imagem/scan não são suportados — o sistema retornará erro indicando ausência de texto extraível |

## 👤 Autor

Desenvolvido por **[iSousadev](https://github.com/iSousadev)** como projeto pessoal.  
Feedbacks e sugestões são bem-vindos via Issues ou PRs.

---

## 📄 Licença

Distribuído sob a licença **MIT**. Veja o arquivo `LICENSE` para mais detalhes.
