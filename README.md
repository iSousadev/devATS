# DevATS

Sistema full stack para transformar currículos em formatos ATS-friendly usando IA (Gemini), com autenticação e persistência no Supabase.

## 📌 Visão geral

O DevATS permite dois fluxos principais:

1. **Adaptar currículo existente** (PDF/DOCX)
   - Faz upload do arquivo
   - Extrai texto
   - Estrutura os dados com IA
   - Permite revisão
   - Gera e baixa um DOCX ATS-friendly

2. **Criar currículo do zero**
   - Preenche formulário em múltiplas etapas
   - Seleciona template
   - Gera e baixa DOCX

Além disso, o usuário autenticado pode salvar e gerenciar currículos no dashboard.

---

## 🧱 Arquitetura

- **Frontend**: Next.js 16 + React 19 + TypeScript + Tailwind + shadcn/ui
- **Backend**: FastAPI + Pydantic + docxtpl/python-docx + parsers de PDF/DOCX
- **IA**: Google Gemini (`gemini-2.5-pro` por padrão)
- **Banco/Auth**: Supabase (Auth + Postgres + RLS)

### Estrutura de alto nível

- `frontend/`: app web (UI, autenticação, dashboard, upload/criação)
- `backend/`: API de parse/extract/generate
- `SUPABASE_SCHEMA.sql`: schema, policies RLS e triggers
- `scripts/test-rls.ts`: validação de isolamento por usuário
- `Templates/`: arquivos de exemplo

---

## ⚙️ Pré-requisitos

- **Node.js** 20+
- **npm** 10+
- **Python** 3.11+ (recomendado)
- Conta no **Supabase**
- Chave de API do **Google Gemini**

---

## 🚀 Configuração rápida (ambiente local)

## 1) Clonar e instalar dependências

```bash
git clone https://github.com/iSousadev/devATS.git
cd devATS

# dependências do root (scripts utilitários)
npm install

# frontend
cd frontend
npm install
cd ..

# backend
cd backend
python -m venv .venv
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate
pip install -r requirements.txt
cd ..
```

## 2) Configurar variáveis de ambiente

### Root (`.env`) — usado pelo script de teste RLS

Copie `.env.example` para `.env` e preencha:

```dotenv
SUPABASE_URL=
SUPABASE_ANON_KEY=

TEST_USER_A_EMAIL=
TEST_USER_A_PASSWORD=
TEST_USER_B_EMAIL=
TEST_USER_B_PASSWORD=
```

### Backend (`backend/.env`)

Copie `backend/.env.example` para `backend/.env` e preencha:

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

### Frontend (`frontend/.env.local`)

Crie o arquivo `frontend/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

---

## 🗄️ Configuração do Supabase

1. Crie um projeto no Supabase.
2. Execute o SQL de `SUPABASE_SCHEMA.sql` no SQL Editor.
3. Verifique que as tabelas/políticas foram criadas:
   - `public.profiles`
   - `public.resumes`
   - RLS ativa com políticas por `auth.uid()`
4. (Opcional) Crie 2 usuários de teste para rodar `test:rls`.

### O que o schema já inclui

- Tabelas `profiles` e `resumes`
- Índices de performance
- Trigger de `updated_at`
- Bucket privado `resumes`
- Policies de storage por pasta do usuário

---

## ▶️ Como rodar o projeto

## Backend

```bash
cd backend
# ative sua venv se necessário
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Health check: `http://localhost:8000/health`
- Docs Swagger: `http://localhost:8000/docs`

## Frontend

```bash
cd frontend
npm run dev
```

- App: `http://localhost:3000`

---

## 🔌 API (Backend)

Base URL local: `http://localhost:8000`

### `POST /api/parse`

Recebe PDF ou DOCX (multipart), valida magic bytes e retorna texto extraído.

- Limite: **5MB**
- Suporta: PDF e DOCX

Resposta (exemplo):

```json
{
  "success": true,
  "filename": "cv.pdf",
  "detected_type": "pdf",
  "text": "...",
  "message": "Texto extraido com sucesso. Agora envie para a IA."
}
```

### `POST /api/extract`

Extrai dados estruturados via Gemini a partir do texto bruto.

Body:

```json
{
  "text": "texto extraído do currículo"
}
```

Retorno:

```json
{
  "success": true,
  "data": { "personal_info": {}, "experiences": [], "skills": {} },
  "message": "Dados extraidos com sucesso. Revise antes de gerar o curriculo."
}
```

### `POST /api/generate`

Gera DOCX final com base em `template_id` + dados do currículo.

Aceita dois formatos:

1. Formato normal:

```json
{
  "template_id": "template-frontend-jr",
  "resume_data": { "...": "..." }
}
```

2. Envelope compatível com retorno do `/api/extract`:

```json
{
  "template_id": "template-frontend-jr",
  "success": true,
  "data": { "...": "..." },
  "message": "..."
}
```

Retorno: stream de arquivo DOCX (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`).

---

## 🧠 Como funciona a IA no projeto

- A rota `/api/extract` usa `google-generativeai`.
- O prompt força **fidelidade ao texto original** do currículo.
- O backend normaliza saída para aderir ao schema Pydantic (`ResumeData`).
- Erros comuns tratados:
  - chave Gemini ausente/inválida
  - quota/rate limit
  - JSON inválido/truncado

---

## 🧾 Templates DOCX

Os templates ficam em `backend/app/templates/`.

IDs atualmente presentes no projeto:

- `template-frontend-jr`
- `template-frontend`
- `template-backend`

Observação: o backend aceita `template_id` com ou sem sufixo `.docx`.

---

## 🖥️ Fluxo da aplicação (usuário)

1. Usuário cria conta/login no frontend (Supabase Auth).
2. Vai para o dashboard.
3. Escolhe:
   - **Adaptar currículo** (`/dashboard/upload`) ou
   - **Criar do zero** (`/dashboard/create`)
4. Gera DOCX final e faz download automático.
5. Currículo pode ser salvo na tabela `resumes` para gestão posterior.

---

## ✅ Testes utilitários

### Teste de RLS

O script valida se um usuário não consegue inserir currículo com `user_id` de outro.

```bash
npm run test:rls
```

Pré-condições:

- `.env` da raiz configurado
- dois usuários válidos no Supabase
- schema/policies aplicados

---

## 🛠️ Scripts disponíveis

### Raiz

- `npm run test:rls` — teste de políticas RLS

### Frontend (`frontend/package.json`)

- `npm run dev` — desenvolvimento
- `npm run build` — build de produção
- `npm run start` — start produção
- `npm run lint` — lint

### Backend

- Sem script npm; execução via `uvicorn app.main:app --reload`

---

## 🧯 Troubleshooting

### Erro “Servico de IA nao configurado”

- Verifique `GEMINI_API_KEY` em `backend/.env`.

### CORS no frontend

- Ajuste `ALLOWED_ORIGINS` no `backend/.env` para incluir a URL do frontend.

### Falha no login/cadastro

- Verifique `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` em `frontend/.env.local`.

### Erro ao gerar DOCX

- Confirme se o `template_id` existe em `backend/app/templates/`.
- Revise se o payload contém dados mínimos válidos (`personal_info`, `skills`, etc.).

### PDF sem texto extraível

- PDFs escaneados/imagem podem falhar no parse.
- O sistema retorna erro indicando ausência de texto extraível.

---

## 🔒 Segurança e boas práticas

- Nunca versionar `.env` com segredos.
- Usar RLS no Supabase (já previsto no schema).
- Preferir chave `service_role` apenas no backend (nunca no frontend).

---

## 📈 Próximos passos sugeridos

- Adicionar pipeline CI (lint + build frontend + checagens backend)
- Implementar testes automatizados para rotas FastAPI
- Incluir upload do DOCX final em storage e versionamento de currículo

---

## 📄 Licença

Defina a licença do projeto (ex.: MIT) conforme sua preferência.
