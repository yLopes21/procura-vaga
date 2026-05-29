---
name: security-sentinel
description: >
  Auditor de segurança para todo código gerado. Use SEMPRE que o código envolver:
  autenticação, autorização, pagamentos, dados pessoais, API keys, tokens, senhas,
  inputs do usuário, uploads de arquivo, webhooks, ou qualquer operação sensível.
  Também use para revisar código existente em busca de vulnerabilidades. Trigger em:
  "auth", "login", "senha", "password", "token", "API key", "secret", "pagamento",
  "payment", "checkout", "webhook", "upload", "input", "form", "validação",
  "sanitização", "OWASP", "segurança", "security", "vulnerabilidade", "XSS",
  "injection", "RLS". Esta skill detecta e bloqueia as vulnerabilidades que a IA
  introduz sem perceber. NUNCA faça deploy sem passar por esta skill.
---

# Security Sentinel — Auditor de Segurança

## Propósito
A IA gera código com 2.74x mais vulnerabilidades que humanos. Esta skill é o antídoto.
Ela verifica CADA linha de código sensível contra as vulnerabilidades mais comuns.

---

## CHECKLIST DE SEGURANÇA (executar em toda revisão)

### 1. Secrets e Credenciais
- [ ] ZERO secrets/keys/tokens hardcoded no código?
- [ ] Tudo está em .env e o .env está no .gitignore?
- [ ] O .env.example existe (sem valores reais, só nomes das variáveis)?
- [ ] As variáveis sensíveis são acessadas via process.env no backend?
- [ ] NENHUMA variável sensível é exposta ao frontend? (exceto NEXT_PUBLIC_* não-sensíveis)

### 2. Autenticação e Autorização
- [ ] Login usa bcrypt/argon2 para hash de senhas? (NUNCA plain text, NUNCA MD5/SHA sem salt)
- [ ] Tokens JWT têm expiração razoável? (access: 15min-1h, refresh: 7-30 dias)
- [ ] Toda rota protegida verifica auth no BACKEND? (NUNCA só no frontend)
- [ ] Existe verificação de autorização (não só autenticação)?
  - Autenticação = "quem é você?"
  - Autorização = "você pode fazer ISSO?"
- [ ] Rate limiting está ativo em rotas de login/registro?

### 3. Validação de Input (CRÍTICO)
- [ ] TODA input do usuário é validada no BACKEND? (frontend é bônus, não substituto)
- [ ] Usando Zod, Joi, ou similar para validação tipada?
- [ ] Inputs HTML são sanitizados contra XSS? (DOMPurify ou similar)
- [ ] Queries SQL são SEMPRE parametrizadas?
```javascript
// ❌ NUNCA — SQL Injection
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ SEMPRE — Query parametrizada
const { data } = await supabase.from('users').select('*').eq('email', email);
// ou com SQL raw:
const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
```
- [ ] File uploads validam: tipo MIME, extensão, tamanho máximo, conteúdo?
- [ ] Nenhum uso de eval(), exec(), Function(), innerHTML com dados do usuário?

### 4. Supabase Específico
- [ ] RLS habilitado em TODAS as tabelas?
- [ ] service_role key está APENAS no backend?
- [ ] anon key não tem permissões excessivas?
- [ ] Edge Functions validam inputs?
- [ ] Webhooks verificam assinatura de origem?

### 5. Headers e CORS
- [ ] CORS configurado para domínios específicos (não `*` em produção)?
- [ ] Headers de segurança ativos?
  - Content-Security-Policy
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY (ou SAMEORIGIN)
  - Strict-Transport-Security (HSTS)

### 6. Dados Sensíveis
- [ ] PII (nome, email, telefone, CPF) não aparece em logs?
- [ ] Dados de pagamento seguem PCI-DSS? (NUNCA armazene número de cartão)
- [ ] Dados sensíveis são criptografados em repouso quando necessário?
- [ ] Backups do banco estão criptografados?

### 7. Dependências
- [ ] Nenhuma dependência com CVEs conhecidas? (npm audit / yarn audit)
- [ ] Dependências são de fontes confiáveis?
- [ ] Lock file (package-lock.json / yarn.lock) está no git?

---

## PADRÕES DE CÓDIGO SEGURO

### API Route Segura (Next.js + Supabase)
```typescript
// ✅ Padrão correto para API route
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';

// 1. Schema de validação
const inputSchema = z.object({
  name: z.string().min(1).max(200),
  price: z.number().positive().multipleOf(0.01),
});

export async function POST(request: Request) {
  // 2. Autenticação
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return Response.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // 3. Validação de input
  const body = await request.json();
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: 'Dados inválidos', details: parsed.error.issues }, { status: 400 });
  }

  // 4. Operação com dados validados (RLS protege automaticamente)
  const { data, error } = await supabase
    .from('products')
    .insert({ ...parsed.data, user_id: session.user.id })
    .select()
    .single();

  if (error) {
    // 5. NUNCA exponha erro interno ao usuário
    console.error('DB error:', error.message); // log sem PII
    return Response.json({ error: 'Erro ao salvar' }, { status: 500 });
  }

  return Response.json({ data });
}
```

---

## VULNERABILIDADES QUE A IA INTRODUZ SEM PERCEBER

| Vulnerabilidade | Como Detectar | Como Corrigir |
|----------------|---------------|---------------|
| Secret no código | grep -r "sk_" "pk_" "key=" "password=" | Mover para .env |
| Lógica auth no frontend | Verificar se auth check existe no backend | Duplicar validação no backend |
| eval() com input do user | grep -r "eval(" "Function(" | Remover e usar alternativa segura |
| SQL concatenado | grep -r "SELECT.*\${" "INSERT.*\${" | Usar query parametrizada |
| CORS wildcard | Verificar Access-Control-Allow-Origin | Especificar domínios |
| Console.log com dados | grep -r "console.log" em produção | Remover ou sanitizar |
| Service key no client | grep -r "service_role" no frontend | Mover para backend |

---

## PROCESSO DE REVISÃO EM 2 ESTÁGIOS

Para toda feature sensível, use este processo:

### Estágio 1: Implementação
- Implemente a feature normalmente seguindo os padrões acima

### Estágio 2: Revisão de Segurança
- Releia TODO o código gerado como se fosse um atacante
- Pergunte: "Se eu fosse malicioso, como exploraria isso?"
- Execute o checklist acima item por item
- Documente qualquer risco aceito em docs/TECH_DEBT.md
