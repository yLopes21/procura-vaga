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
| 5 | 2026-06-05 | Onda 4 (verif. visual): `/login` gera 5 console 404 (`manifest.json` + `favicon.ico`). Assets ausentes, não-funcionais. Resolver na Onda 12 (PWA cria o manifest) + adicionar `app/icon`. | 🟢 | ~20min | Pendente |
| 6 | 2026-06-05 | Onda 5 (P2 review): busca sem índice composto `(status, employment_type)`; `ilike` sem `pg_trgm` GIN. OK p/ catálogo pequeno; revisar se passar de ~50k linhas. | 🟢 | ~1h | Pendente |
| 7 | 2026-06-05 | Onda 5: só `administracao` tem `subareas` no `taxonomy-top20.json`. Popular subáreas dos outros 11 cursos (área dependente fica vazia neles hoje). | 🟡 | ~2h | Pendente |
| 8 | 2026-06-05 | Onda 6: `/api/jobs/[id]/validate` sem sessão retorna 307 (redirect do middleware), não 401. Inócuo (1 usuário, card é fail-open); ideal seria o middleware responder 401 para rotas `/api`. | 🟢 | ~30min | Pendente |
| 9 | 2026-06-05 | Dados (Onda 2a `location`): algumas cidades caem na UF errada (ex.: "Patos"/"João Pessoa" → BA em vez de PB). Revisar dicionário cidade→UF. | 🟡 | ~2h | Pendente |
| 10 | 2026-06-06 | Onda 7: scraper do **Catho** não implementado — `/vagas/estagio-administracao/` e variações dão 404 (sem Cloudflare); o padrão de busca real precisa ser descoberto (provável SPA/API interna). Vagas.com + InfoJobs já cobrem o BR; Catho é incremento. | 🟢 | ~3h | Pendente |
| 11 | 2026-06-06 | Onda 7: `fetchHtmlWithRetry` (retry+backoff p/ `UND_ERR_CONNECT_TIMEOUT` transitório) só está nos scrapers (vagas/infojobs). Os connectors ATS (greenhouse/lever/ashby/workable/gupy) ainda fazem fetch sem retry — `greenhouse:nubank` falhou 1× por isso. Migrar os ATS para o helper compartilhado. | 🟡 | ~1h | Pendente |

## Items Resolvidos

| # | Resolvido em | Descrição |
|---|-------------|-----------|
