# ARCHITECTURE.md — Procura-Vaga

> Ferramenta **pessoal** do Rodrigo (não-comercial). Web app hospedado, privado (login único), que acha vagas **abertas** no Brasil por curso+sub-área+local+tipo, adapta currículo ATS-safe, ajuda a abordar o time de contratação e manda digest diário das vagas novas. Plano canônico: `PLANEJAMENTO.md`. Estado de execução: `PROGRESSO.md`.

## Stack
Next.js 15 (App Router) + React 19 · Tailwind · **Neon Postgres** (via Vercel Marketplace) + **Drizzle ORM** · **Auth.js v5** magic-link (allowlist 1 email) · **GitHub Actions** (cron diário) · **Resend** (magic-link + digest) · **LLM agnóstico** (Gemini default; anthropic|groq alternáveis) · **PWA** · `pdf-lib` + `pdfjs-dist` (round-trip ATS). Deploy: Vercel. Gerenciador: `pnpm`.

## Componentes e fluxo de dados
```
Fontes ──► Connectors ──► Normalização ──► Catálogo (Neon) ──► Busca ──► UI (PWA)
  │         (sources/)      (jobs/, taxonomy/)    (jobs)          (api/)     (page.tsx)
  │                                                   │
  │                                                   ├──► Validação no clique (api/jobs/[id]/validate)
  └─ ATS público: greenhouse/lever/ashby/workable          └─ classifyJobStatus (freshness/)
     Scraper BR: gupy                                  └──► Digest diário (notify/) ──► Resend
     [Wave 3] agregadores: jsearch/adzuna/jooble
```

- **Sourcing** (`src/lib/sources/`): cada fonte implementa `JobSource.fetchJobs(company) → RawJobFromATS[]`. Contrato cru congelado em `sources/types.ts`; o mapeamento `RawJobFromATS → NewJob` (insert do banco) preenche `titleNorm`, `employmentType`, `cineArea`, etc. Validação de shape com Zod — falha barulhento por fonte, **sem abortar as demais**.
- **Normalização** (`src/lib/jobs/`, `src/lib/taxonomy/`): `location` (UF/cidade/remote; ambíguo→`unknown`), `dedup` (cluster empresa+título_norm+UF; duplicata só marca), `classify` (tipo/senioridade, fail-safe `unknown`), `taxonomy/match` (curso→área CINE→keywords).
- **Catálogo** (`jobs`): upsert idempotente; fechar vaga = `status` para fechado por **`last_seen_at` defasado** (nunca `DELETE`); circuit-breaker contra coleta parcial.
- **Frescor**: validação no clique (`freshness/closeSignals` + adaptador fetch→`ValidationInput` com anti-SSRF) — o coração da garantia "nunca exibir vaga fechada".
- **CV** (`src/lib/cv/`): `tailor` (adapter LLM) com `semanticGuardrail` (nunca infla/inventa) + `pdfRoundtrip` (prova que o ATS lê). Chave LLM **só no servidor**.
- **Auth** (`src/auth.ts` + `middleware.ts`): magic-link, allowlist server-side, protege páginas e `/api`. Dev sem Resend → magic-link no console (fail-closed: nunca em produção).
- **Banco** (`src/lib/db/`): cliente Drizzle **lazy** (`getDb()`) sobre `neon-http`; jobs que exigem transação usam `neon-serverless` (Pool) em módulo próprio.

## Decisões-chave (ver `PROGRESSO.md` §Decisões travadas)
Uso pessoal → LGPD N/A · Banco Neon · LLM Gemini default (código agnóstico) · login único magic-link · garantia central: validação no clique. UTF-8 preservado em todo SQL/dado PT-BR.

## Pipeline de execução
Construção em ondas governadas pela Pipeline A+ (`/pipeline`): cada onda recebe a trilha proporcional (LITE/PADRÃO/CRÍTICA), TDD nos núcleos, verificação ao-vivo onde há superfície observável, e gate `pnpm test`+`typecheck`+`lint`+`build` antes de cada commit atômico.
