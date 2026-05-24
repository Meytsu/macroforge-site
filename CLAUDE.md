# CLAUDE.md — macroforge-site (subcomponente)

Este arquivo é o **CLAUDE.md específico do site Next.js**. Cobre só particularidades deste subcomponente.

**Hierarquia de CLAUDE.md** (estrutura do projeto inteiro, vista do repo privado `macroforge`):

```
macroforge/CLAUDE.md       ← overview + regras gerais + workflow trabalho↔casa
macroforge/app/CLAUDE.md   ← Android nativo Java
macroforge/site/CLAUDE.md  ← este (Next.js)  — commit no repo macroforge-site público
```

**Contexto geral** (perfil do dev, regras de IA, workflow, convenções de docs) → ver `../CLAUDE.md` (raiz do repo `macroforge` privado).

**Documentação do projeto** (`decisions.md`, `bugs.md`, `issues.md`, `key_facts.md`) → centralizada em `macroforge/docs/project_notes/` no repo privado. **Não duplicar aqui.**

---

## O que é este repo

Site Next.js do MacroForge:
- **Landing page** (`/`)
- **Cadastro** (`/cadastro`) — nome + email + senha (bcrypt)
- **Login** (`/login`) — sessão em sessionStorage
- **Recuperação de senha** (`/recuperar`) — 3 etapas com código 6-dígitos via Resend
- **Painel do cliente** (`/painel`) — licenças ativas, device_id, dados pessoais
- **Planos** (`/planos`) — 3 cards (mensal/trimestral/semestral)
- **Páginas de retorno** (`/sucesso`, `/falha`, `/pendente`) — pós-pagamento
- **API routes** (`/api/*`) — checkout MP, webhook, login, registro, recuperação, reset-device, etc.

---

## Stack

| Item | Valor |
|------|-------|
| Framework | Next.js 16.2.4 (App Router) |
| UI | React 19.2.4 + TypeScript 5 |
| Styling | Tailwind CSS 4 + PostCSS |
| Hosting | Vercel (auto-deploy no push pro `master`) |
| URL produção | `https://macroforge-app.vercel.app` |

### Dependências principais

```json
"dependencies": {
  "@vercel/analytics": "^2.0.1",
  "bcryptjs": "^3.0.3",      // hash de senhas (10 rounds)
  "mercadopago": "^2.12.0",   // checkout pro + webhook
  "next": "16.2.4",
  "react": "19.2.4",
  "react-dom": "19.2.4",
  "resend": "^6.12.2"         // email transacional
}
```

---

## ⚠️ Next.js 16 — não é o Next que você conhece

**Atenção:** esta é uma versão nova do Next.js, com breaking changes em APIs, convenções e estrutura de arquivos.

- **NÃO** assumir conhecimento prévio (versões 13/14/15). Verificar antes de escrever código.
- **Consultar** `node_modules/next/dist/docs/` (docs locais, instaladas com o pacote) antes de mexer em qualquer API do Next.
- **Respeitar avisos de deprecation** que aparecerem no terminal.

Padrões que **sabemos** que funcionam neste projeto (do código existente):
- App Router (`app/` em vez de `pages/`)
- Server Components por padrão
- Client Components com `"use client"` no topo
- API routes em `app/api/<rota>/route.ts` (named exports `GET`/`POST`/`PUT`/etc.)
- `process.env.<VAR>` em server-side, `process.env.NEXT_PUBLIC_<VAR>` exposto ao client

---

## Variáveis de ambiente esperadas

```bash
# .env.local (NÃO commitar)
SUPABASE_URL=https://fiavpdyrusxzrlrbsztm.supabase.co
SUPABASE_SERVICE_KEY=<segredo — SERVICE_ROLE key do Supabase>
MP_ACCESS_TOKEN=<token do Mercado Pago>
RESEND_API_KEY=<api key do Resend>
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # fallback se faltar
```

**Onde cada uma é usada:**
- `SUPABASE_URL` + `SUPABASE_SERVICE_KEY`: 13 API routes (login, registro, checkout, webhook, recuperar-senha, alterar-senha, atualizar-dados, check-email, nova-senha, reset-device, verificar-codigo, etc.)
- `MP_ACCESS_TOKEN`: `/api/checkout` (cria sessão Checkout Pro) + `/api/webhook` (recebe confirmação)
- `RESEND_API_KEY`: `/api/recuperar-senha`, `/api/webhook` (envia email pós-pagamento), `/api/test-email`
- `NEXT_PUBLIC_SITE_URL`: fallback pra URL no `/api/checkout` (em prod é `https://macroforge-app.vercel.app`)

**Sem `.env.local`:** site sobe (`npm run dev`), páginas estáticas carregam, mas API routes dão erro 500 (variáveis `!` no TypeScript explodem).

---

## Comandos

```bash
npm install            # instala deps (~300 MB em node_modules)
npm run dev            # dev server em http://localhost:3000
npm run build          # build de produção (gera .next/)
npm run start          # serve o build
npm run lint           # ESLint
```

---

## Pontos de atenção / pegadinhas

### 1. Sessão em sessionStorage (não persiste)
A sessão é guardada em `sessionStorage` (some quando fecha a aba). Decisão: ADR-MF-SITE-002. UX trade-off conhecido.

### 2. Resend sem domínio próprio
Hoje, Resend está configurado sem domínio próprio (`macroforge.com.br` ainda não comprado). Limitação:
- Só envia email pro **email do dono da conta Resend** (Henrique)
- Outros usuários **não recebem** o email de recuperação de senha automaticamente
- Solução em ISSUE-MF-009 (comprar domínio)

### 3. Email caindo em spam (Outlook)
BUG aberto: emails de `noreply@macroforge.com.br` caem em spam no Outlook. Causa: DMARC não configurado. Ver BUG-FR-004 no `bugs.md` do repo privado.

### 4. Sessão de pagamento — webhook é a fonte da verdade
A sessão de pagamento do MP gera redirect pras páginas `/sucesso`, `/falha`, `/pendente`. **NÃO confiar nesses redirects** pra confirmar pagamento — usuário pode fechar a aba antes. **Confiar só no webhook** (`/api/webhook`) que dispara independente do redirect.

### 5. Validação no client + no server
Toda validação (email único, força de senha, etc.) precisa rodar **no servidor** também — client-side é só pra UX. API routes não devem confiar em validação só do front.

---

## Estrutura de pastas

```
site/
├── app/
│   ├── page.tsx                 ← landing
│   ├── layout.tsx               ← layout raiz
│   ├── cadastro/page.tsx
│   ├── login/page.tsx
│   ├── recuperar/page.tsx
│   ├── painel/page.tsx
│   ├── planos/page.tsx
│   ├── sucesso/page.tsx
│   ├── falha/page.tsx
│   ├── pendente/page.tsx
│   ├── components/              ← Header, CheckoutButton, CountrySelect, etc.
│   └── api/
│       ├── login/route.ts
│       ├── registro/route.ts
│       ├── recuperar-senha/route.ts
│       ├── verificar-codigo/route.ts
│       ├── nova-senha/route.ts
│       ├── alterar-senha/route.ts
│       ├── atualizar-dados/route.ts
│       ├── check-email/route.ts
│       ├── reset-device/route.ts
│       ├── checkout/route.ts
│       ├── webhook/route.ts
│       └── test-email/route.ts
├── public/
│   └── icon.png
├── package.json
├── tsconfig.json
├── next.config.ts
├── eslint.config.mjs
├── postcss.config.mjs
└── CLAUDE.md                    ← este arquivo
```

---

## Convenções

- **PT-BR** em todo conteúdo visível (textos, labels, mensagens de erro pro usuário)
- **TypeScript** sempre (`.ts` / `.tsx`, evitar `.js`)
- **Tailwind utility classes** (evitar CSS-in-JS ou CSS separado a menos que necessário)
- **API routes**: validar input no início, retornar 400 com mensagem clara em PT-BR; usar `try/catch` com 500 amplo no fim

---

## Onde registrar mudanças no site

Decisões, bugs, e tarefas relacionados ao site vão pro repo **privado `macroforge`**:
- `docs/project_notes/decisions.md` — usar prefixo `ADR-MF-SITE-NNN`
- `docs/project_notes/bugs.md` — usar tag `[SITE]` no título
- `docs/project_notes/issues.md` — usar tag `[SITE]` no título
- `docs/notes.md` — adicionar entrada cronológica

**Não duplicar essas docs aqui no `macroforge-site` público** (a menos que algum dia o site vire um produto separado).
