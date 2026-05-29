---
name: db-guardian
description: >
  Especialista em banco de dados. Use SEMPRE que qualquer operação envolver banco de dados:
  criar tabelas, alterar schema, escrever queries, criar migrations, configurar RLS no
  Supabase, definir índices, ou qualquer coisa que toque em dados persistidos. Também use
  quando o projeto estiver sendo iniciado e o schema precisa ser planejado. Use quando ouvir
  "tabela", "coluna", "query", "migration", "RLS", "Supabase", "banco", "database", "schema",
  "índice", "index", "foreign key", "constraint", "N+1", "performance de query". Esta skill
  IMPEDE os erros mais comuns de banco: falta de normalização, N+1, ausência de índices,
  RLS desativado, tipos errados. NUNCA toque no banco sem consultar esta skill.
---

# DB Guardian — Protetor do Banco de Dados

## Propósito
Evitar os problemas de banco mais comuns do vibe coding: schema sem planejamento,
queries N+1, ausência de RLS, falta de índices, tipos errados, e migrations inexistentes.

---

## FASE 1 — Antes de Qualquer Operação no Banco

### 1.1 Existe docs/DATABASE.md?
- Se NÃO → Crie usando o template abaixo ANTES de continuar
- Se SIM → Leia e garanta que a operação atual é compatível

### 1.2 Checklist Pré-Operação
- [ ] A tabela que vou criar/alterar está documentada?
- [ ] Os tipos de dados estão corretos? (ver seção Tipos)
- [ ] Constraints estão definidas? (UNIQUE, FK, CHECK, NOT NULL)
- [ ] Índices estão planejados para os padrões de acesso?
- [ ] RLS policies estão definidas? (Supabase)
- [ ] A migration existe ou será criada?

---

## FASE 2 — Regras de Schema

### 2.1 Tipos de Dados (NUNCA erre isso)
| Dado | Tipo CORRETO | Tipo ERRADO | Por quê |
|------|-------------|-------------|---------|
| ID | uuid / bigint | varchar | Performance e unicidade |
| Email | varchar(255) | text | Limite razoável + validação |
| Preço/dinheiro | numeric(10,2) ou integer (centavos) | float/real | Float tem erros de arredondamento |
| Data/hora | timestamptz | varchar/text | Timezone + queries temporais |
| Booleano | boolean | varchar/integer | Semântica correta |
| Status/enum | tipo ENUM ou check constraint | varchar livre | Previne dados inválidos |
| CEP | varchar(9) | integer | CEPs com zero à esquerda |
| Telefone | varchar(20) | integer | Formatação e código de país |
| JSON estruturado | jsonb | json/text | Indexável e mais rápido |

### 2.2 Constraints OBRIGATÓRIAS
```sql
-- TODA tabela deve ter:
id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
created_at timestamptz DEFAULT now() NOT NULL,
updated_at timestamptz DEFAULT now() NOT NULL

-- TODA referência deve ter FK:
user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL

-- TODA coluna que deve ser única:
email varchar(255) UNIQUE NOT NULL

-- TODA coluna com valores limitados:
status varchar(20) CHECK (status IN ('pending', 'active', 'cancelled')) NOT NULL DEFAULT 'pending'
```

### 2.3 Índices
```sql
-- Crie índices para TODA coluna usada em:
-- WHERE frequente:
CREATE INDEX idx_orders_user_id ON orders(user_id);
-- ORDER BY frequente:
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
-- Combinações frequentes (índice composto):
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
-- Busca em texto (se necessário):
CREATE INDEX idx_products_name_trgm ON products USING gin(name gin_trgm_ops);
```

---

## FASE 3 — RLS no Supabase (CRÍTICO)

### 3.1 Regra de Ouro
**TODA tabela no Supabase deve ter RLS habilitado. SEM EXCEÇÃO.**

```sql
-- 1. Habilitar RLS
ALTER TABLE nome_tabela ENABLE ROW LEVEL SECURITY;

-- 2. Policy padrão: usuário só vê seus dados
CREATE POLICY "Users can view own data"
  ON nome_tabela FOR SELECT
  USING (auth.uid() = user_id);

-- 3. Policy de insert: usuário só insere seus dados
CREATE POLICY "Users can insert own data"
  ON nome_tabela FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. Policy de update: usuário só edita seus dados
CREATE POLICY "Users can update own data"
  ON nome_tabela FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Policy de delete: usuário só deleta seus dados
CREATE POLICY "Users can delete own data"
  ON nome_tabela FOR DELETE
  USING (auth.uid() = user_id);
```

### 3.2 NUNCA faça isso
- NUNCA use `service_role` key no frontend/client
- NUNCA desabilite RLS "temporariamente" — esquecem de reabilitar
- NUNCA crie policy `USING (true)` em tabelas com dados sensíveis
- NUNCA exponha a `anon` key com permissões amplas

---

## FASE 4 — Anti-Patterns de Query

### 4.1 Problema N+1 (MAIS COMUM)
```javascript
// ❌ ERRADO — N+1: uma query por pedido
const orders = await supabase.from('orders').select('*');
for (const order of orders.data) {
  const items = await supabase.from('order_items').select('*').eq('order_id', order.id);
}

// ✅ CORRETO — Uma única query com join
const orders = await supabase
  .from('orders')
  .select('*, order_items(*)');
```

### 4.2 Select * (EVITAR)
```javascript
// ❌ ERRADO — traz todas as colunas
const { data } = await supabase.from('products').select('*');

// ✅ CORRETO — só o que precisa
const { data } = await supabase.from('products').select('id, name, price, image_url');
```

### 4.3 Paginação (OBRIGATÓRIA para listas)
```javascript
// ✅ Sempre paginar
const { data } = await supabase
  .from('products')
  .select('id, name, price', { count: 'exact' })
  .range(0, 19) // primeiros 20 items
  .order('created_at', { ascending: false });
```

---

## FASE 5 — Migrations

### 5.1 Regra: TODA mudança via migration
```sql
-- Arquivo: migrations/001_create_products.sql
CREATE TABLE products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name varchar(200) NOT NULL,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_products_created_at ON products(created_at DESC);
```

### 5.2 NUNCA faça direto no banco
- Sempre crie um arquivo de migration
- Migrations devem ser idempotentes quando possível (IF NOT EXISTS)
- Toda migration destrutiva precisa de confirmação explícita

---

## FASE 6 — Template do DATABASE.md

```markdown
# Database Schema — [Nome do Projeto]

## Diagrama de Relacionamentos
[Descrição textual ou link para diagrama ER]

## Tabelas

### users (gerenciada pelo Supabase Auth)
| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| id | uuid | PK | ID do usuário |

### products
| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| id | uuid | PK, default gen_random_uuid() | |
| name | varchar(200) | NOT NULL | Nome do produto |
| price | numeric(10,2) | NOT NULL, CHECK >= 0 | Preço em reais |

## RLS Policies
| Tabela | Operação | Policy | Regra |
|--------|----------|--------|-------|
| products | SELECT | Public read | USING (true) |
| products | INSERT | Admin only | WITH CHECK (is_admin()) |

## Índices
| Tabela | Colunas | Tipo | Motivo |
|--------|---------|------|--------|
| products | created_at | btree DESC | Ordenação padrão |

## Migrations
| # | Arquivo | Descrição | Data |
|---|---------|-----------|------|
| 1 | 001_create_products.sql | Tabela de produtos | [data] |
```
