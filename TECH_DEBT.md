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

## Items Resolvidos

| # | Resolvido em | Descrição |
|---|-------------|-----------|
