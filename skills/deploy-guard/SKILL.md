---
name: deploy-guard
description: >
  Guardião de deploy e infraestrutura. Use SEMPRE antes de qualquer deploy, mudança de
  infraestrutura, configuração de CI/CD, ou migração de ambiente. Também use quando
  o projeto estiver sendo configurado pela primeira vez. Use quando ouvir "deploy",
  "produção", "production", "staging", "CI/CD", "pipeline", "Vercel", "ambiente",
  "environment", "variáveis de ambiente", "monitoring", "health check", "logs",
  "observabilidade". Esta skill é o último checkpoint antes do código ir para
  produção. Ela verifica ambientes, variáveis, segurança, testes e monitoring.
---

# Deploy Guard — Último Checkpoint

## Propósito
Nenhum código vai para produção sem passar por este checklist.
A IA gera código que funciona em dev mas quebra em prod. Esta skill previne isso.

---

## CHECKLIST PRÉ-DEPLOY (todo item deve estar ✅)

### 1. Ambientes Separados
- [ ] Existe .env.development E .env.production com valores DIFERENTES?
- [ ] O banco de dev é DIFERENTE do banco de prod?
- [ ] As API keys de dev são DIFERENTES das de prod?
- [ ] O agente de IA NÃO tem acesso às credenciais de produção?
- [ ] Existe .env.example no repositório (sem valores reais)?

### 2. Variáveis de Ambiente
- [ ] TODAS as variáveis necessárias estão configuradas no ambiente de deploy?
- [ ] NENHUMA variável sensível está hardcoded no código?
- [ ] Variáveis do Supabase:
  - [ ] NEXT_PUBLIC_SUPABASE_URL — OK para ser pública
  - [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY — OK para ser pública
  - [ ] SUPABASE_SERVICE_ROLE_KEY — APENAS no backend, NUNCA no frontend
- [ ] Variáveis de pagamento (Asaas/Stripe) — APENAS no backend

### 3. Testes
- [ ] Todos os testes passam? (`npm test` / `npm run test`)
- [ ] Testes de integração para fluxos críticos passam?
- [ ] Não há testes sendo ignorados (`.skip`) sem justificativa?

### 4. Segurança (consultar security-sentinel)
- [ ] `npm audit` não mostra vulnerabilidades críticas?
- [ ] RLS está habilitado em TODAS as tabelas do Supabase?
- [ ] Nenhum console.log com dados sensíveis?
- [ ] CORS está configurado para o domínio correto (não `*`)?
- [ ] Headers de segurança estão configurados?

### 5. Performance
- [ ] Imagens estão otimizadas? (WebP, lazy loading)
- [ ] Bundle size está aceitável? (`npm run build` mostra warnings?)
- [ ] Queries de banco estão otimizadas? (sem N+1, com paginação)
- [ ] Caching está configurado onde faz sentido?

### 6. Banco de Dados
- [ ] Migrations estão sincronizadas com produção?
- [ ] Índices necessários existem?
- [ ] Backup automático está ativo?
- [ ] Nenhuma migration destrutiva sem reversão possível?

### 7. Monitoring e Observabilidade
- [ ] Health check endpoint existe? (`/api/health`)
- [ ] Logs estão configurados (sem PII)?
- [ ] Alertas de erro estão configurados?
- [ ] Plataforma de monitoramento está configurada? (Vercel Analytics, Sentry, etc.)

---

## HEALTH CHECK PADRÃO

```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {} as Record<string, string>,
  };

  // Verificar banco
  try {
    const { error } = await supabase.from('_health').select('count').limit(1);
    checks.services.database = error ? 'error' : 'ok';
  } catch {
    checks.services.database = 'unreachable';
  }

  // Status geral
  const allOk = Object.values(checks.services).every(s => s === 'ok');
  checks.status = allOk ? 'ok' : 'degraded';

  return Response.json(checks, { status: allOk ? 200 : 503 });
}
```

---

## CONFIGURAÇÃO DE DEPLOY (Vercel + Next.js)

### vercel.json mínimo
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

### .gitignore obrigatório
```
node_modules/
.env
.env.local
.env.development
.env.production
.next/
out/
dist/
*.log
```

---

## PROCESSO DE DEPLOY

### Para Projeto Novo
1. Configurar repositório no GitHub
2. Conectar ao Vercel (ou plataforma de deploy)
3. Configurar TODAS as variáveis de ambiente na plataforma
4. Fazer primeiro deploy em preview/staging
5. Testar manualmente os fluxos críticos no preview
6. Se tudo OK → promover para produção
7. Verificar health check em produção
8. Monitorar logs nas primeiras 24h

### Para Atualização
1. Garantir que estou em branch dedicada (não main)
2. Executar TODOS os testes localmente
3. Executar checklist pré-deploy acima
4. Criar PR para main
5. Review do PR (git diff completo)
6. Merge → deploy automático para preview
7. Testar no preview
8. Promover para produção
9. Monitorar

---

## ROLLBACK

Se algo der errado em produção:
1. Reverter o deploy na plataforma (Vercel: redeploy do commit anterior)
2. NÃO tente "corrigir rapidamente" direto na main
3. Investigue o problema em branch separada
4. Corrija, teste, e faça o deploy normalmente
