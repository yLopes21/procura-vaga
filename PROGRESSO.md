# PROGRESSO — Procura-Vaga (estado de execução · Pipeline A+)

> Plano canônico: **`PLANEJAMENTO.md`**. Arquitetura: **`ARCHITECTURE.md`**.
> Este arquivo é o **estado de execução** para retomar com `/pipeline` exatamente onde paramos — à prova de sessão fechada.
> Última atualização: **2026-06-05**.

## Onde estamos AGORA

- **Branch:** `feat/mvp-foundation` (ainda sem remote/GitHub; criar repo na Onda 12).
- **HEAD:** Onda 6 (validação no clique) **commitada e verificada ao vivo** (vaga real → "open" via fetch + anti-SSRF). Engine A+ literal LIGADO (run `a220b9f5`).
- **Ponto de retomada:** **Onda 7 (scrapers BR seletivos)** — `scrape/{vagas,infojobs,catho}.ts`, key-independent (scraping não usa chave).
- **Suíte:** 161/161 verde · tsc/lint/build limpos.
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
| 7 | **Scrapers BR seletivos** `scrape/{vagas,infojobs,catho}.ts` (HTML público, kill-switch por fonte) | PADRÃO | 3 paralelas | — | ☐ **key-indep** (scraping não usa chave) |
| 8 | `sources/{adzuna,jooble,jsearch}` agregadores (Google for Jobs cobre LinkedIn/Indeed) | PADRÃO | 3 paralelas | — | ☐ KEY-DEP (Jooble ✅; JSearch 403/Adzuna pend.) |
| 9 | `cv/tailor` (adapter LLM gemini\|anthropic\|groq) + `api/cv/tailor` | CRÍTICA (anti-invenção) | 1 | — | ☐ KEY-DEP (`GEMINI` ✅; aguarda perfil do Rodrigo) |
| 10 | `notify/digest` + `.github/workflows/cron-diario.yml` | PADRÃO | 1 | — | ☐ KEY-DEP (`RESEND` ✅) |
| 11 | `api/recruiter/draft` (link genérico + rascunho) | LITE | 1 | — | ☐ key-indep |
| 12 | PWA (`public/manifest.json` + service worker) | LITE-PADRÃO + a11y | 1 | — | ☐ key-indep |
| 13 | Repo GitHub + push + Actions secrets + deploy Vercel + env prod + verificação READY + GET | CRÍTICA (produção, GATE humano) | 1 | — | ☐ |

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

## Onda 7 — PRONTA para executar (descoberta feita 2026-06-05)

Trilha PADRÃO · **key-independent** (scraping HTML, não usa chave). Viabilidade testada AO VIVO (curl com User-Agent de browser):
- **Vagas.com** → HTTP 200, ~158 KB, 542 menções de vaga, **sem Cloudflare/captcha → RASPÁVEL**. Busca: `https://www.vagas.com.br/vagas-de-<termo>` (ex.: `vagas-de-estagio+administracao`).
- **InfoJobs** → HTTP 200, ~240 KB, **sem bloqueio → RASPÁVEL**. Busca: `https://www.infojobs.com.br/empregos.aspx?palabra=<termo>`.
- **Catho** → `/vagas/estagio-administracao/` deu 404 (NÃO bloqueia); achar o padrão de busca correto e validar ao vivo antes de implementar — se difícil, vira TECH_DEBT (não bloqueia a onda).

Passos exatos:
1. `src/lib/scrape/vagas.ts` e `src/lib/scrape/infojobs.ts` — cada um implementa `JobSource` (`source`, `fetchJobs(query) → RawJobFromATS[]`) com parse via **cheerio** (já instalado): seletor do card → `title`/`company`/`applyUrl`/`locationRaw`; `employmentTypeHint` quando o site expõe. **TDD por fixture HTML** (salvar HTML real em `__fixtures__/`, testar o parser sem rede).
2. `data/companies-watchlist.json` — adicionar bloco de queries de scraping (termos por curso, ex.: "estagio administracao", "estagio marketing"…).
3. `scripts/daily.ts` `collectAll` — chamar os scrapers junto dos connectors; o **kill-switch por fonte** (try/catch existente) garante que uma fonte que bloqueie não derrube as outras.
4. Verificação ao-vivo: `pnpm scrape` → vagas reais de Vagas/InfoJobs no Neon; conferir contagem por fonte.
Regras: usar a taxonomia para os termos; nunca raspar logado; respeitar delays/jitter.

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

Estado: **HEAD `ec5d315` (Onda 6 ✅)**. Ondas 0–6 commitadas e verificadas ao vivo · suíte 161/161 · branch `feat/mvp-foundation` · working tree limpo. Próximo: **Onda 7** (seção acima). Engine A+ literal: rodar `pipe_emit.py` (helper em `C:\tmp` ou recriar) com CWD em `~/.claude/pipeline/engine`, `PIPELINE_PROJECT_PATH` = `<projeto>/.pipeline`, modo copilable.

**Mensagem exata para colar na nova sessão (no terminal do projeto):**

> /loop Continue o projeto Procura-Vaga com a Pipeline A+ no modo ENGINE A+ LITERAL (handoff + telemetria via ~/.claude/pipeline, como combinamos). SEMPRE comece lendo PROGRESSO.md e ~/.claude/memory/errors/ antes de tocar código; retome da próxima onda pendente (hoje a Onda 7) e execute na ordem do mapa até a Onda 13, SEM parar entre fases. Por onda: TDD (teste falhando antes), gate test+tsc+lint+build, code-review no diff antes do commit, verificação ao vivo onde há superfície, emitir handoff no engine a cada transição, commit atômico em PT-BR e ATUALIZAR o PROGRESSO.md ao fechar a onda. Pare SÓ nos 3 gates reais: (1) chaves JSearch (Subscribe) + Adzuna (cadastro) na Onda 8; (2) meu CV/perfil na Onda 9; (3) meu GO de deploy na Onda 13. Não peça aprovação entre ondas.
