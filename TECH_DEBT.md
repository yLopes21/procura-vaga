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

## Items Resolvidos

| # | Resolvido em | Descrição |
|---|-------------|-----------|
