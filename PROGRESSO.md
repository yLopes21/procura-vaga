# PROGRESSO — Procura-Vaga (estado de execução do /execute1)

> Plano completo e canônico: **`PLANEJAMENTO.md`** (na raiz). Este arquivo é o estado de execução para retomar exatamente onde paramos.
> Última atualização: 2026-05-30.

## Onde estamos

- **Branch:** `feat/mvp-foundation` (ainda sem remote/GitHub; criar repo depois).
- **Trilha /execute1:** COMPLETA. **Wave 1 concluída e verificada ao vivo.**
- **Banco Neon:** provisionado via Vercel Marketplace (`neon-pink-notebook`), conectado ao projeto `ylopes21s-projects/procura-vaga`. Envs em `.env.local` (gitignored).

## Commits feitos (branch feat/mvp-foundation)

| hash | descrição |
|------|-----------|
| `7c61598` | chore: inicializa projeto SALIM (base do repo) |
| `bbed524` | chore: scaffold Next.js 15 + Drizzle + Tailwind + env validado |
| `8f61a16` | feat(db): schema Drizzle (jobs/profile/seen_jobs + Auth.js) aplicado no Neon |
| `abe5219` | feat(core): detector de vaga fechada + classificação tipo/senioridade (TDD) |

## Feito + VERIFICADO ao vivo [CHECKED]

- Scaffold Next.js 15 + React 19 + Drizzle + Tailwind + next-auth v5 + Resend + cheerio + pdf-lib + Gemini SDK. `next build` ✅ (compila 3.3s).
- `src/lib/env.ts` — validação zod das envs com `requireEnv()` no ponto de uso.
- **Neon** provisionado + conectado + **7 tabelas aplicadas e confirmadas por query ao vivo**: `account, jobs, profile, seen_jobs, session, user, verification_token`. (`node scripts/check-db.mjs` lista as tabelas.)
- `src/lib/db/schema.ts` + `src/lib/db/index.ts` — catálogo `jobs` (sem PII de recrutador), `profile`, `seen_jobs` + tabelas Auth.js. Unique index (source, source_job_id); índices em location/type/area/status.
- `src/lib/freshness/closeSignals.ts` — `classifyJobStatus` (404/410, redirect-para-landing, marcadores PT-EN → closed; rede/5xx → unknown, fail-closed). **TDD 13/13.**
- `src/lib/taxonomy/classify.ts` — `classifyEmploymentType` (estagio|trainee|efetivo|unknown) + `classifySeniority` (junior|pleno|senior|unknown), fail-safe `unknown`, sem falso-positivo "internacional". **TDD 20/20.**
- **Suíte total: 33/33 verdes** (`pnpm test`).

## PENDENTE — chaves do Rodrigo (B) [bloqueia verificação dessas integrações]

Preencher no `.env.local` (já tem Neon + AUTH_SECRET). Sem elas, o código existe mas não verifico ao vivo:

| chave | onde criar | var(s) |
|-------|-----------|--------|
| Resend (email login + digest) | resend.com → API Keys | `RESEND_API_KEY` |
| JSearch / Google for Jobs | rapidapi.com → JSearch → Subscribe Basic | `RAPIDAPI_KEY` |
| Adzuna | developer.adzuna.com → Register | `ADZUNA_APP_ID`, `ADZUNA_APP_KEY` |
| Jooble | jooble.org/api/about | `JOOBLE_API_KEY` |
| Gemini (IA do CV; grátis) | aistudio.google.com/app/apikey | `GEMINI_API_KEY` (LLM_PROVIDER=gemini) |

> Já em `.env.local`: `DATABASE_URL` (Neon), `AUTH_SECRET`, `ALLOWED_EMAIL=r.lopes.marques01@gmail.com`, `EMAIL_FROM`, `LLM_PROVIDER=gemini`, `NEXT_PUBLIC_APP_URL`.

## PRÓXIMOS PASSOS (ordem) — Wave 2+

**Key-independent (dá pra construir E verificar ao vivo agora):**
1. `src/lib/sources/{greenhouse,lever,ashby,workable}.ts` — connectors de ATS público (SEM chave). Interface comum `fetchJobs(company) → NewJob[]`. Verificar puxando vaga real de uma empresa BR conhecida.
2. `src/lib/jobs/location.ts` — normaliza local → UF/cidade/`remote_flag`; ambíguo → `unknown`. **TDD.**
3. `src/lib/jobs/dedup.ts` — chave de cluster (empresa+título_norm+UF); duplicata só marca. **TDD.**
4. `src/lib/cv/semanticGuardrail.ts` — diff campo-a-campo, entidades idênticas in/out, verbo só sinônimo de mesma intensidade. **TDD.**
5. `src/lib/cv/pdfRoundtrip.ts` — gera PDF (pdf-lib) + re-extrai texto (pdf.js) e valida espaços/ordem. **TDD.**
6. `data/taxonomy-top20.json` + `src/lib/taxonomy/match.ts` — curso→área→keywords→CBO; matching curso+local+tipo. **TDD.**
7. Auth.js (`src/auth.ts` + `src/app/(auth)/login` + middleware) — magic-link Resend, allowlist 1 email. (código agora; verificação real precisa do RESEND_API_KEY)
8. UI shell mobile-first: `src/app/page.tsx` (busca curso/sub-área/local/tipo) + cards com badge de tipo + estados.

**Key-dependent (verifica após as 5 chaves):**
9. `src/lib/sources/{adzuna,jooble,jsearch}.ts` — agregadores (precisam das chaves).
10. `src/app/api/jobs/search/route.ts` + `src/app/api/jobs/[id]/validate/route.ts` (validação no clique usando `classifyJobStatus`).
11. `src/lib/cv/tailor.ts` (adapter LLM: gemini|anthropic|groq) + `src/app/api/cv/tailor/route.ts`.
12. `src/lib/notify/digest.ts` + `.github/workflows/cron-diario.yml` (scrape + refresh + email).
13. `src/app/api/recruiter/draft/route.ts` (link genérico + rascunho).
14. PWA (`public/manifest.json` + service worker).
15. Criar repo GitHub (`gh repo create`) + push + secrets do Actions; deploy Vercel + env de produção + verificação READY + GET.

## Decisões travadas (log — não reabrir sem motivo)

- **Uso PESSOAL** (não comercial) → LGPD não se aplica (Art. 4º I); pode raspar no volume pessoal; SEM PJ, SEM páginas legais, SEM proteção de PII de terceiros.
- **Banco: Neon** (via Vercel Marketplace), não Supabase (os 2 free do Rodrigo estão ocupados). Vercel ele já paga.
- **Hospedado e sempre online** (PWA, abre no celular), **privado** (login único magic-link, allowlist do email do Rodrigo).
- **Cobertura alvo ~85-95%** via APIs grátis + scraping pessoal; "65% é pouco" foi rejeitado — uso pessoal destrava cobertura alta barata.
- **LLM do CV:** Gemini (grátis) por padrão; código agnóstico (anthropic|groq alternáveis).
- **CV do perfil:** salvo na conta privada do Rodrigo (com botão apagar) — default aceito; alternativa efêmera disponível se ele pedir.
- **Garantia central:** nunca exibir vaga fechada → validação no clique (`classifyJobStatus`).

## Como retomar (comando)

Na raiz do projeto, rodar `/execute1` apontando para este estado. Mensagem de retomada está logo abaixo, fornecida ao Rodrigo.
