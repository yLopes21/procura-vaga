# DATABASE.md — Procura-Vaga (Neon Postgres)

> Schema canônico em `src/lib/db/schema.ts` (Drizzle). 7 tabelas aplicadas e confirmadas no Neon (`node scripts/check-db.mjs`). Toda alteração via migration Drizzle (`pnpm db:generate` → `pnpm db:migrate`), nunca direto no banco. Strings PT-BR sempre UTF-8.

## Modelo do domínio

### `jobs` — catálogo de vagas (sem PII de recrutador)
| Coluna | Tipo | Nota |
|---|---|---|
| `id` | uuid PK | `defaultRandom()` |
| `source` | text NOT NULL | greenhouse\|lever\|ashby\|workable\|gupy\|jsearch\|adzuna\|jooble\|… |
| `source_job_id` | text NOT NULL | id da vaga na fonte |
| `apply_url` | text NOT NULL | URL real de candidatura (validada no clique) |
| `company`, `title` | text NOT NULL | exibição (com acento) |
| `title_norm` | text NOT NULL | normalizado p/ dedup/busca (sem acento só na chave) |
| `location_uf`, `location_city` | text | UF / "remoto" / null=unknown |
| `remote_flag` | bool NOT NULL | default false |
| `employment_type` | text NOT NULL | estagio\|trainee\|efetivo\|**unknown** (default unknown) |
| `seniority` | text NOT NULL | junior\|pleno\|senior\|unknown (default unknown) |
| `snippet` | text | ≤100 palavras + link-out (nunca descrição integral) |
| `cine_area` | text | área CINE p/ match curso |
| `status` | text NOT NULL | **active\|closed\|unknown** (default active) |
| `last_seen_at` | timestamptz NOT NULL | última coleta que viu a vaga → base do fechamento |
| `last_validated_at` | timestamptz | última validação no clique |
| `closed_at` | timestamptz | setado na transição p/ closed (limpo ao reabrir) |
| `dedup_cluster_id` | text | cluster empresa+título_norm+UF |
| `confidence` | text NOT NULL | high\|low (default low) — confiança da classificação |
| `collected_at` | timestamptz NOT NULL | 1ª coleta (preservado em re-upsert) |

**Índices:** `jobs_source_unique` UNIQUE (`source`,`source_job_id`) · `jobs_location_idx` · `jobs_type_idx` · `jobs_area_idx` · `jobs_status_idx`.

### `profile` — CV do dono (privado, apagável)
`user_id` PK→user · `data` jsonb (CV estruturado) · `updated_at`.

### `seen_jobs` — controle do digest (evita re-alertar)
PK (`user_id`,`job_id`) · `notified_at`. O digest só alerta vaga **não** presente aqui.

### Auth.js (`user`, `account`, `session`, `verification_token`)
Schema padrão do `@auth/drizzle-adapter`.

## Regras de estado (garantia "nunca exibir vaga fechada")
- **Fechar = `status='closed'` + `closed_at=now()`**, nunca `DELETE`.
- Fechamento por **`last_seen_at` defasado (> N dias)**, não por diff de coleta única → resiliente a coleta parcial.
- **Circuit-breaker:** rodada que fecharia > X% de uma fonte é abortada (provável falha de coleta).
- **Upsert idempotente:** `ON CONFLICT (source, source_job_id)` atualiza `last_seen_at`; **não sobrescreve** `status='closed'`/`last_validated_at` (decisão do clique) nem `collected_at`.
- Busca **esconde `closed`**; `unknown` vai a grupo próprio (nunca rotula errado).

## Vocabulário (detector ↔ banco)
`classifyJobStatus` retorna `open|closed|unknown`; a coluna `status` usa `active|closed|unknown`. Mapeamento: **`open` → `active`** na escrita.

## Segurança / acesso
App single-user atrás de login (allowlist 1 email). **RLS não se aplica** (sem multi-tenant; acesso mediado 100% pela aplicação autenticada). Conexão por `DATABASE_URL` (server-only); cliente Drizzle lazy (`getDb()`). Queries sempre parametrizadas (Drizzle).
