# PROGRESSO — Procura-Vaga (estado de execução · Pipeline A+)

> Plano canônico: **`PLANEJAMENTO.md`**. Arquitetura: **`ARCHITECTURE.md`**.
> Este arquivo é o **estado de execução** para retomar com `/pipeline` exatamente onde paramos — à prova de sessão fechada.
> Última atualização: **2026-06-06**.

## Onde estamos AGORA

- **Branch:** `feat/mvp-foundation` (ainda sem remote/GitHub; criar repo na Onda 13).
- **HEAD:** **ONDA 13 COMPLETA — no ar + cron automático** 🚀 **https://procura-vaga.vercel.app** (repo público `github.com/yLopes21/procura-vaga`, main). **Vercel Cron** (`vercel.json` → `/api/cron/daily`, 09:00 UTC) verificado ao vivo: coleta+digest em **41s**, 893 vagas, **digest enviado (50 vagas, Resend em prod)**, endpoint 401 sem Bearer. GitHub Actions desativado (billing). Feitas **7–13**. Engine run `a220b9f5`.
- **⚠️ EXECUÇÃO:** Pipeline A+ SEMPRE via **tool Workflow** (esteira), nunca manual. Ver `errors/pipeline-a+-exige-workflow-esteira-nunca-execucao-manual.md`.
- **Gates abertos (INCREMENTOS, não bloqueiam o produto):** **#1** chaves JSearch (Subscribe rapidapi) + Adzuna (cadastro) = mais fontes · **#2** perfil/CV → Onda 9 (feature de currículo adaptado). Smoke-test do login = você acessa `/login` e pede o link.
- **Suíte:** 246/246 · tsc/lint/build limpos · Neon 893 vagas · cron diário ativo (41s, cabe em qualquer plano Vercel).
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
| 4 | Auth.js magic-link + middleware + allowlist (dupla, fail-closed) | CRÍTICA | 1 | ✅ | ✅ **login ao vivo: permitido entra, intruso negado (AccessDenied)** |
| 5 | UI busca: **Curso (select taxonomia) → Área (chips dependentes)** + Estado + Tipo + cards/badge/estados | PADRÃO + design + a11y | 1 | ✅ | ✅ **ao vivo: curso→área dinâmico + filtro real** |
| 6 | `api/jobs/[id]/validate` (validação no clique: anti-SSRF redirect-manual + `classifyJobStatus` + persist) — busca ficou server-side na Onda 5 | CRÍTICA | 1 | ✅ | ✅ **ao vivo: vaga real → "open"; rota protegida** |
| 7 | **Scrapers BR seletivos** `sources/{vagas,infojobs}.ts` + `http.ts` (HTML público, retry, kill-switch) | PADRÃO | 2 (Catho→débito) | `9ac0c81` | ✅ **ao vivo: Vagas 164 + InfoJobs 120** |
| 8 | `sources/{jooble,jsearch,adzuna}` + `fetchJsonWithRetry` (Google for Jobs cobre LinkedIn/Indeed) | PADRÃO | 3 | `5f8f773` | 🟡 **código ✅; Jooble 149 ao vivo; JSearch/Adzuna = GATE #1** |
| 9 | `cv/tailor` (adapter LLM gemini\|anthropic\|groq) + `api/cv/tailor` | CRÍTICA (anti-invenção) | 1 | — | ☐ KEY-DEP (`GEMINI` ✅; aguarda perfil do Rodrigo) |
| 10 | `notify/digest` + `.github/workflows/cron-diario.yml` | PADRÃO | 1 | `ca663b5` | ✅ **ao vivo (console): 50 vagas → e-mail 21KB** |
| 11 | `api/recruiter/draft` (link recrutadores + rascunho) | LITE | 1 | `f25dd0a` | ✅ |
| 12 | PWA (`app/manifest.ts` + ícones + service worker) + fix matcher | LITE-PADRÃO + a11y | 1 | `e6f5278` | ✅ **ao vivo: manifest+ícones 200, console limpo** |
| 13 | Repo GitHub + deploy Vercel + **Vercel Cron** (`/api/cron/daily`) + verificação | CRÍTICA | 1 | `9122958` | ✅ **no ar + cron ao vivo (41s, digest enviado)** |

**Ordem de retomada:** **4 (auth)** → **5 (UI)** → **6 (busca + validação no clique)** → **7 (scrapers BR, key-indep)** → **8 (agregadores)** → **9 (CV)** → **10 (digest)** → **11 (recruiter)** → **12 (PWA)** → **13 (deploy — GATE humano)**.

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
| `b316437` | feat(ingest): Onda 3 — coleta diária (toNewJob + listingDiff + daily, TDD) |
| `e05a12a` | feat(auth): Onda 4 — login magic-link + allowlist fail-closed (Auth.js v5, TDD) |
| `b1b2873` | feat(busca): Onda 5 — UI busca Curso→Área (taxonomia) + cards (TDD) |
| `ec5d315` | feat(freshness): Onda 6 — validação no clique (anti-SSRF + persist, TDD) |
| `9ac0c81` | feat(scrape): Onda 7 — scrapers BR Vagas.com + InfoJobs (cheerio + retry, TDD) |
| `5f8f773` | feat(sources): Onda 8 — agregadores Jooble + JSearch + Adzuna (TDD) |
| `ca663b5` | feat(notify): Onda 10 — digest diário por e-mail + workflow cron (TDD) |
| `f25dd0a` | feat(recruiter): Onda 11 — rascunho de abordagem + link de recrutadores (TDD) |
| `e6f5278` | feat(pwa): Onda 12 — PWA instalável (manifest/ícones/SW) + fix matcher (TDD) |
| `a821833` | refactor(sources): aplica auditoria da esteira A+ (collect testado + timeout API) |
| `465739d` | chore(deploy): pre-mortem da esteira — fix pnpm no cron + engines node 22 |
| `721632e` | chore(deploy): ignora .vercel · Onda 13 deploy Vercel (procura-vaga.vercel.app) |
| `9122958` | feat(cron): Vercel Cron p/ coleta+digest diária (substitui GitHub Actions, TDD) |

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

## Onda 7 — FECHADA (2026-06-06 · commit `9ac0c81`)

`src/lib/sources/{vagas,infojobs,http}.ts` + testes + fixtures. Parser puro (cheerio) testado por fixture HTML real reduzida; `fetchHtmlWithRetry` (retry+backoff) no `http.ts`; integrados no `daily.ts` com kill-switch por fonte + delay com jitter. **Ao vivo: Vagas 164 + InfoJobs 120 vagas reais no Neon.**
- Seletores: Vagas `li.vaga` (título no attr `title`, id `data-id-vaga`, empresa `.emprVaga`, nível `.nivelVaga`; local NÃO exposto no card → null). InfoJobs `div.js_rowCard[data-href]` (título `.js_vacancyTitle`, empresa `a[href*="/empresa-"]`, local pelo padrão "Cidade - UF", data `.js_date[data-value]`).
- **Descoberta:** InfoJobs "fetch failed" era `UND_ERR_CONNECT_TIMEOUT` transitório do undici (não bloqueio) → retry resolveu (0→120). Aprendizado em `errors/fetch-failed-undici-connect-timeout-nao-e-bloqueio.md`.
- **Catho:** TECH_DEBT #10 (404 nos padrões de busca; provável SPA/API). Retry nos ATS: TECH_DEBT #11.

## Onda 8 — código FECHADO (2026-06-06 · commit `5f8f773`) · GATE HUMANO #1

`sources/{jooble,jsearch,adzuna}.ts` (parser por fixture + fetch com retry) + `fetchJsonWithRetry` no `http.ts`, ligados no `daily.ts` (`collectQuerySource` unificado, kill-switch que distingue fonte inacessível de falha pontual). Schema de entrada tolerante + `rawJobSchema.safeParse` na saída (resiliência de item).
- **Jooble:** ✅ 149 vagas ao vivo. `sourceJobId` vem do link (id numérico trunca por MAX_SAFE_INTEGER). Cobertura BR fraca → TECH_DEBT #12.
- **JSearch/Adzuna:** código pronto e testado por fixture da doc; **verificação ao vivo bloqueada** (gate). Validar shape real quando a chave chegar → TECH_DEBT #14.

### O que o Rodrigo precisa fazer (GATE #1)
1. **JSearch:** rapidapi.com → API "JSearch" (jsearch.p.rapidapi.com) → **Subscribe** no plano Basic (grátis). `RAPIDAPI_KEY` já está no `.env.local`; falta só assinar a API (hoje retorna 403 "not subscribed").
2. **Adzuna:** cadastro grátis em developer.adzuna.com → criar app → adicionar `ADZUNA_APP_ID` e `ADZUNA_APP_KEY` no `.env.local`.
Feito isso, `pnpm scrape` coleta JSearch + Adzuna ao vivo (ajusto o schema se a resposta real divergir da fixture da doc).

## Onda 9 — plano (CV · CRÍTICA anti-invenção · GATE HUMANO #2)

`cv/tailor` (adapta o CV base do Rodrigo a uma vaga, com guardrail anti-invenção) + `api/cv/tailor`. `GEMINI_API_KEY` já existe; código agnóstico (anthropic|groq). **Gate #2:** o CV/perfil-base do Rodrigo (texto do currículo) para o tailoring adaptar e o guardrail semântico (`cv/semanticGuardrail`, já existe da Onda 2b) ser testado com dados reais.

## Decisões travadas (log — não reabrir sem motivo)

- **Uso PESSOAL** (não comercial) → LGPD não se aplica (Art. 4º I); raspar no volume pessoal; SEM PJ, SEM páginas legais, SEM proteção de PII de terceiros.
- **Banco: Neon** (via Vercel Marketplace), não Supabase (os 2 free do Rodrigo estão ocupados). Vercel ele já paga.
- **Hospedado e sempre online** (PWA, abre no celular), **privado** (login único magic-link, allowlist do email do Rodrigo).
- **Cobertura alvo ~85-95%** via APIs grátis + scraping pessoal; "65% é pouco" foi rejeitado.
- **LLM do CV:** Gemini (grátis) por padrão; código agnóstico (anthropic|groq alternáveis).
- **CV do perfil:** salvo na conta privada (com botão apagar) — default aceito; efêmero disponível se pedir.
- **Garantia central:** nunca exibir vaga fechada → validação no clique (`classifyJobStatus`).
- **Sourcing HÍBRIDO** (2026-06-05): base = Gupy (direto ✅) + Google for Jobs/JSearch + Adzuna + Jooble + ATS; **scrapers BR seletivos** (Vagas.com, InfoJobs, Catho) na Onda 7; **LinkedIn/Indeed via Google for Jobs**, NÃO scraping direto (anti-bot pesado em 2026). Corrige o drift que cortou os scrapers do `PLANEJAMENTO.md` sem registro.
- **Busca por Curso→Área** (2026-06-05): a busca NÃO é texto livre. **Curso** = select dos 12 cursos da taxonomia (`taxonomy-top20.json`); **Área** = chips múltiplos **dependentes do curso** (ex.: Administração → Financeiro/Marketing/RH/Comercial/Operações). Filtro via `keywordsForAreas(curso, áreas)` no `title_norm`. Áreas pré-definidas por curso; ampliar `subareas` dos demais cursos é dívida (hoje só Administração tem subáreas).

## Como retomar (comando)

Estado: **HEAD `9122958` — DEPLOY + CRON NO AR** 🚀 https://procura-vaga.vercel.app · repo público `github.com/yLopes21/procura-vaga` (main) · suíte 246/246 · Neon 893 vagas · **Vercel Cron diário ativo** (41s ao vivo, digest enviado). Feitas **7–13**. **Pendentes = só incrementos:** gate #1 chaves JSearch (Subscribe)/Adzuna (cadastro) p/ mais fontes · gate #2 perfil/CV → Onda 9 (currículo adaptado). **Pipeline A+ SEMPRE via tool Workflow** (ver errors/pipeline-a+...). Engine run `a220b9f5`; `pipe_emit.py` (C:\tmp) com python `~/.claude/pipeline/.venv/Scripts/python.exe`.

**Mensagem exata para colar na nova sessão (no terminal do projeto):**

> /loop Continue o projeto Procura-Vaga com a Pipeline A+ no modo ENGINE A+ LITERAL (handoff + telemetria via ~/.claude/pipeline, como combinamos). SEMPRE comece lendo PROGRESSO.md e ~/.claude/memory/errors/ antes de tocar código; retome da próxima onda pendente (hoje a Onda 8) e execute na ordem do mapa até a Onda 13, SEM parar entre fases. Por onda: TDD (teste falhando antes), gate test+tsc+lint+build, code-review no diff antes do commit, verificação ao vivo onde há superfície, emitir handoff no engine a cada transição, commit atômico em PT-BR e ATUALIZAR o PROGRESSO.md ao fechar a onda. Pare SÓ nos 3 gates reais: (1) chaves JSearch (Subscribe) + Adzuna (cadastro) na Onda 8; (2) meu CV/perfil na Onda 9; (3) meu GO de deploy na Onda 13. Não peça aprovação entre ondas.
