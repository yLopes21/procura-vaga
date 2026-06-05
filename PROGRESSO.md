# PROGRESSO — Procura-Vaga (estado de execução · Pipeline A+)

> Plano canônico: **`PLANEJAMENTO.md`**. Arquitetura: **`ARCHITECTURE.md`**.
> Este arquivo é o **estado de execução** para retomar com `/pipeline` exatamente onde paramos — à prova de sessão fechada.
> Última atualização: **2026-06-05**.

## Onde estamos AGORA

- **Branch:** `feat/mvp-foundation` (ainda sem remote/GitHub; criar repo na Onda 12).
- **HEAD:** Onda 3 (ingestão) **commitada e verificada ao vivo** (487 vagas reais no Neon).
- **Ponto de retomada:** **Onda 4 (Auth.js magic-link)** — trilha CRÍTICA (segurança). Chaves Resend/Gemini/Jooble ✅; JSearch (403, falta subscription) e Adzuna pendentes.
- **Suíte:** 137/137 verde · tsc/lint/build limpos.
- **Banco Neon:** provisionado via Vercel Marketplace (`neon-pink-notebook`), projeto `ylopes21s-projects/procura-vaga`. 7 tabelas aplicadas. Envs em `.env.local` (gitignored).

## Como a Pipeline A+ executa cada onda

Cada onda recebe **trilha proporcional ao risco** + roda partes independentes em **lanes paralelas** (juiz cego entre lanes) + passa pelo **gate** antes de **1 commit atômico**.

- **Trilha LITE:** só gate (`test`+`typecheck`+`lint`+`build`). Para peças sem lógica de risco.
- **Trilha PADRÃO:** TDD no núcleo + gate + verificação ao-vivo onde há superfície observável.
- **Trilha CRÍTICA:** TDD + pre-mortem + verificação ao-vivo + revisão 3x. Para auth, validação no clique, guardrail do CV, deploy.
- **Esteira:** nº de lanes paralelas quando o trabalho da onda é decomponível em partes independentes.

## Mapa de ondas

> Passadas: trilha/esteira **lidas do git + natureza da peça**. Futuras: trilha/esteira **propostas por criticidade** — a `/pipeline` recalibra na execução.

| Onda | Escopo | Trilha | Esteira | Commit | Estado |
|---|---|---|---|---|---|
| 0 | Cliente Drizzle lazy + env + docs base | PADRÃO | 1 | `0354b30` | ✅ |
| 0.5 | Hardening dos detectores (fail-closed real) | CRÍTICA | 1 | `096b49a` | ✅ |
| 1a | Contrato `RawJobFromATS` + connector Greenhouse | PADRÃO | 1 (fixa o contrato) | `d11e78a` | ✅ |
| 1b | Connectors Lever + Ashby + Workable | PADRÃO | **3 paralelas** | `05fef7a` | ✅ |
| 1c | Connector Gupy + hint de tipo | PADRÃO | 1 | `8de1d0c` | ✅ |
| 2a | `jobs/location` + `jobs/dedup` | PADRÃO (TDD) | 2 paralelas | `d80e1ae` | ✅ |
| 2b | `taxonomy/match` + `cv/semanticGuardrail` + `cv/pdfRoundtrip` | PADRÃO/CRÍTICA (guardrail) | 3 paralelas | `b20d8f0` | ✅ |
| 3 | `daily.ts` + `toNewJob` + `listingDiff` + watchlist (ingestão idempotente + circuit-breaker + guarda coleta-vazia) | PADRÃO | `toNewJob` ∥ `listingDiff` | ✅ | ✅ **ao vivo: 487 vagas reais** |
| 4 | Auth.js magic-link + `middleware` + allowlist 1 email | CRÍTICA | 1 | — | ☐ código key-indep; ao-vivo precisa `RESEND` |
| 5 | UI shell mobile-first: `page.tsx` (busca curso/área/local/tipo) + cards (badge tipo) + estados | PADRÃO + camada design + a11y | 1 | — | ☐ key-indep |
| 6 | `api/jobs/search` + `api/jobs/[id]/validate` (validação no clique) | CRÍTICA (`validate` = core "nunca vaga morta") | search ∥ validate | — | ☐ key-indep |
| 7 | `sources/{adzuna,jooble,jsearch}` (agregadores) | PADRÃO | **3 paralelas** | — | ☐ **KEY-DEP** |
| 8 | `cv/tailor` (adapter LLM gemini\|anthropic\|groq) + `api/cv/tailor` | CRÍTICA (anti-invenção) | 1 | — | ☐ **KEY-DEP** (`GEMINI`) |
| 9 | `notify/digest` + `.github/workflows/cron-diario.yml` | PADRÃO | 1 | — | ☐ **KEY-DEP** (`RESEND`) |
| 10 | `api/recruiter/draft` (link genérico + rascunho) | LITE | 1 | — | ☐ key-indep |
| 11 | PWA (`public/manifest.json` + service worker) | LITE-PADRÃO + a11y | 1 | — | ☐ key-indep |
| 12 | Repo GitHub + push + Actions secrets + deploy Vercel + env prod + verificação READY + GET | CRÍTICA (produção) | 1 | — | ☐ |

**Ordem de retomada:** fechar **3** → seguir key-independent **4 → 5 → 6** (já entregam app logável + busca + garantia no clique) → key-dependent **7 → 8 → 9** (após as chaves) → **10 → 11** → **12** (deploy).

## Onda 3 — fechar (retomada imediata)

1. `pnpm scrape` → coleta real (Greenhouse: `nubank`/`quintoandar`/`gympass` + 6 buscas Gupy) gravando no Neon; conferir contagem por fonte + nenhuma fonte abortando as demais.
2. `git add scripts/daily.ts src/lib/freshness/listingDiff.ts src/lib/freshness/listingDiff.test.ts src/lib/jobs/toNewJob.ts src/lib/jobs/toNewJob.test.ts data/companies-watchlist.json package.json .gitignore`
3. `git commit` → `feat(ingest): Onda 3 — coleta diária (toNewJob + listingDiff + daily, TDD)`.

## Commits feitos (branch `feat/mvp-foundation`)

| hash | descrição |
|------|-----------|
| `7c61598` | chore: inicializa projeto SALIM (base do repo) |
| `bbed524` | chore: scaffold Next.js 15 + Drizzle + Tailwind + env validado |
| `8f61a16` | feat(db): schema Drizzle (jobs/profile/seen_jobs + Auth.js) aplicado no Neon |
| `abe5219` | feat(core): detector de vaga fechada + classificação tipo/senioridade (TDD) |
| `d004948` | docs: salva plano (PLANEJAMENTO.md) + estado (PROGRESSO.md) |
| `0354b30` | feat(infra): Onda 0 — cliente Drizzle lazy, env e docs base |
| `096b49a` | fix(core): Onda 0.5 — hardening dos detectores (fail-closed real) |
| `d11e78a` | feat(sources): Onda 1a — contrato RawJobFromATS + connector Greenhouse (TDD) |
| `05fef7a` | feat(sources): Onda 1b — connectors Lever, Ashby e Workable (paralelo, TDD) |
| `8de1d0c` | feat(sources): Onda 1c — connector Gupy (portal de busca BR) + hint de tipo |
| `d80e1ae` | feat(jobs): Onda 2a — normalização de local e chave de dedup (TDD) |
| `b20d8f0` | feat(cv,taxonomy): Onda 2b — taxonomia, guardrail semântico e round-trip PDF |

## PENDENTE — chaves do Rodrigo (B) [bloqueia ao-vivo das ondas 7, 8, 9]

Preencher no `.env.local` (já tem Neon + AUTH_SECRET). Sem elas, o código existe mas não verifico ao vivo:

| chave | onde criar | var(s) | desbloqueia |
|-------|-----------|--------|-------------|
| Resend | resend.com → API Keys | `RESEND_API_KEY` | login (Onda 4) + digest (Onda 9) |
| JSearch / Google for Jobs | rapidapi.com → JSearch → Basic | `RAPIDAPI_KEY` | Onda 7 |
| Adzuna | developer.adzuna.com | `ADZUNA_APP_ID`, `ADZUNA_APP_KEY` | Onda 7 |
| Jooble | jooble.org/api/about | `JOOBLE_API_KEY` | Onda 7 |
| Gemini (grátis) | aistudio.google.com/app/apikey | `GEMINI_API_KEY` | Onda 8 |

> Já em `.env.local`: `DATABASE_URL` (Neon), `AUTH_SECRET`, `ALLOWED_EMAIL`, `EMAIL_FROM`, `LLM_PROVIDER=gemini`, `NEXT_PUBLIC_APP_URL`.

## Decisões travadas (log — não reabrir sem motivo)

- **Uso PESSOAL** (não comercial) → LGPD não se aplica (Art. 4º I); raspar no volume pessoal; SEM PJ, SEM páginas legais, SEM proteção de PII de terceiros.
- **Banco: Neon** (via Vercel Marketplace), não Supabase (os 2 free do Rodrigo estão ocupados). Vercel ele já paga.
- **Hospedado e sempre online** (PWA, abre no celular), **privado** (login único magic-link, allowlist do email do Rodrigo).
- **Cobertura alvo ~85-95%** via APIs grátis + scraping pessoal; "65% é pouco" foi rejeitado.
- **LLM do CV:** Gemini (grátis) por padrão; código agnóstico (anthropic|groq alternáveis).
- **CV do perfil:** salvo na conta privada (com botão apagar) — default aceito; efêmero disponível se pedir.
- **Garantia central:** nunca exibir vaga fechada → validação no clique (`classifyJobStatus`).

## Como retomar (comando)

Na raiz do projeto: **`/pipeline`** apontando para este `PROGRESSO.md`. Começa fechando a **Onda 3** (ao-vivo `pnpm scrape` + commit), depois segue **Onda 4 (Auth.js)** na ordem do mapa.
