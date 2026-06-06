# TECH_DEBT.md — Registro de Débito Técnico

> Quando encontrar algo que precisa ser melhorado mas não é urgente, registre aqui.
> Revise este arquivo semanalmente e priorize os itens mais impactantes.

## Como usar

Adicione items com: data, descrição, severidade, e esforço estimado.

| Severidade | Significado |
|-----------|------------|
| 🔴 Alta | Impacta performance ou segurança. Resolver este mês. |
| 🟡 Média | Dificulta manutenção. Resolver em 1-2 meses. |
| 🟢 Baixa | Melhoria desejável. Resolver quando houver tempo. |

## Items Pendentes

| # | Data | Descrição | Severidade | Esforço | Status |
|---|------|-----------|-----------|---------|--------|
| 1 | 2026-06-05 | Onda 3 (P2 review): `upsertJobs` retorna `newJobs.length` (tentativas), não rows realmente afetadas. Log já diz "tentativas"; para count real, capturar `rowCount` do batch. | 🟢 | ~1h | Pendente |
| 2 | 2026-06-05 | Onda 3 (P3 review): `_comment` em `companies-watchlist.json` é convenção frágil; migrar para `"__meta"` fora do namespace de fontes se o JSON crescer. | 🟢 | ~15min | Pendente |
| 3 | 2026-06-05 | Onda 4 (review): `sendMagicLink` (server action de login) sem teste automatizado. Cobrir os 3 caminhos (sucesso, AuthError, erro inesperado). | 🟡 | ~1h | Pendente |
| 4 | 2026-06-05 | Onda 4 (review): endpoint direto `/api/auth/signin/resend` revela `AccessDenied` para email fora da allowlist (a UI/server action já não enumera). Inócuo p/ app de 1 usuário; endurecer só se virar multiusuário. | 🟢 | ~30min | Pendente |
| 5 | 2026-06-05 | Onda 4 (verif. visual): `/login` gera 5 console 404 (`manifest.json` + `favicon.ico`). Assets ausentes, não-funcionais. Resolver na Onda 12 (PWA cria o manifest) + adicionar `app/icon`. | 🟢 | ~20min | ✅ Resolvido Onda 12 (`e6f5278`): manifest + ícones + fix matcher; console limpo ao vivo |
| 6 | 2026-06-05 | Onda 5 (P2 review): busca sem índice composto `(status, employment_type)`; `ilike` sem `pg_trgm` GIN. OK p/ catálogo pequeno; revisar se passar de ~50k linhas. | 🟢 | ~1h | Pendente |
| 7 | 2026-06-05 | Onda 5: só `administracao` tem `subareas` no `taxonomy-top20.json`. Popular subáreas dos outros 11 cursos (área dependente fica vazia neles hoje). | 🟡 | ~2h | Pendente |
| 8 | 2026-06-05 | Onda 6: `/api/jobs/[id]/validate` sem sessão retorna 307 (redirect do middleware), não 401. Inócuo (1 usuário, card é fail-open); ideal seria o middleware responder 401 para rotas `/api`. | 🟢 | ~30min | Pendente |
| 9 | 2026-06-05 | Dados (Onda 2a `location`): algumas cidades caem na UF errada (ex.: "Patos"/"João Pessoa" → BA em vez de PB). Revisar dicionário cidade→UF. | 🟡 | ~2h | Pendente |
| 10 | 2026-06-06 | Onda 7: scraper do **Catho** não implementado — `/vagas/estagio-administracao/` e variações dão 404 (sem Cloudflare); o padrão de busca real precisa ser descoberto (provável SPA/API interna). Vagas.com + InfoJobs já cobrem o BR; Catho é incremento. | 🟢 | ~3h | Pendente |
| 11 | 2026-06-06 | Onda 7: `fetchHtmlWithRetry` (retry+backoff p/ `UND_ERR_CONNECT_TIMEOUT` transitório) só está nos scrapers (vagas/infojobs). Os connectors ATS (greenhouse/lever/ashby/workable/gupy) ainda fazem fetch sem retry — `greenhouse:nubank` falhou 1× por isso. Migrar os ATS para `fetchJsonWithRetry` (helper já existe). | 🟡 | ~1h | Pendente |
| 12 | 2026-06-06 | Onda 8: cobertura BR do **Jooble** é fraca p/ "estágio" (`location:""` traz vagas globais; `location:"Brazil"` → 0). 149 vagas ao vivo, mas com ruído geográfico. Afinar `location`/filtro BR no `fetchJoobleJobs` ou aceitar como fonte secundária. | 🟢 | ~1h | Pendente |
| 13 | 2026-06-06 | Onda 8: Adzuna expõe `contract_time` (part_time/full_time) — hoje ignorado (`employmentTypeHint: null`), pois não mapeia o vínculo BR (estagio/trainee/efetivo). Pode virar metadado de regime futuramente. | 🟢 | ~30min | Pendente |
| 14 | 2026-06-06 | Onda 8: `jsearch.ts` e `adzuna.ts` foram escritos com fixture da DOC (sem validação ao vivo: JSearch 403 sem subscribe, Adzuna sem chave). Validar shape real assim que as chaves chegarem (gate #1) e ajustar o schema se divergir. | 🟡 | ~1h | Pendente |
| 15 | 2026-06-06 | Onda 10: `sendDigest.ts` (selectNewJobs + runDigest) sem teste unitário (entrypoint I/O, como `daily.ts`; verificado ao vivo em console). Cobrir com mock de banco: 0 vagas→não envia; console→não marca seen; resend→marca; idempotência. | 🟡 | ~1.5h | Pendente |
| 16 | 2026-06-06 | Onda 10: workflow `cron-diario.yml` não alerta se `scrape:ci` coletar 0 vagas (exit 0 com todas as fontes falhando → run "verde"). Adicionar step de sanidade (count(jobs active) > 0) antes do digest. | 🟢 | ~30min | Pendente |
| 17 | 2026-06-06 | Onda 13 (cron review P2-4): `CRON_SECRET` é `optional()` em todo ambiente; `AUTH_SECRET` é obrigatório em prod. Tornar `CRON_SECRET` obrigatório em produção (descoberta cedo) — mas antes garantir a env em TODOS os ambientes Vercel (Preview inclusive), senão quebra o build de preview. | 🟢 | ~20min | Pendente |
| 18 | 2026-06-06 | Onda 13: cron Vercel roda coleta+digest no Neon compartilhado dev↔prod. NÃO rodar `pnpm scrape`/`digest` local apontando p/ o mesmo banco (marca seen / fecha vagas de prod). Separar banco dev quando deixar de ser projeto de 1 usuário. | 🟢 | — | Pendente |
| 19 | 2026-06-06 | Login senha: `rateLimit.ts` é in-memory (Map) — best-effort; em serverless não compartilha entre instâncias nem sobrevive a cold start, e o Map não tem eviction (cresce em processo longo). Gate real = senha + sem-signup + anti-enumeração. Migrar p/ store compartilhado (ex.: Upstash) se virar multiusuário. | 🟢 | ~1h | Pendente |
| 20 | 2026-06-06 | Login senha: `authorize` (auth.ts) e `signInWithPassword` (action) sem teste unitário (I/O: banco + signN; verificados AO VIVO — login certo entra, errado nega, e-mail entra). Cobrir com mock de banco/signIn se a lógica crescer. | 🟡 | ~1.5h | Pendente |
| 21 | 2026-06-06 | Login senha: senha do `procuravaga` (`achavaga0123`) é FRACA (a pedido). Trocar por forte com `pnpm seed:user` (SEED_PASSWORD via env). | 🟡 | ~10min | Pendente |

## Items Resolvidos

| # | Resolvido em | Descrição |
|---|-------------|-----------|
