---
name: test-shield
description: >
  Guardião de testes que garante qualidade real de testing. Use SEMPRE que testes estiverem
  sendo criados, modificados, ou quando a cobertura de testes precisa ser verificada. Esta
  skill IMPEDE o anti-pattern mais perigoso da IA: reescrever testes para mascarar bugs.
  Use quando ouvir "teste", "test", "testing", "coverage", "cobertura", "jest", "vitest",
  "spec", "TDD", "unit test", "integration test", "e2e". Também use quando os testes
  estiverem falhando — esta skill garante que o CÓDIGO seja corrigido, não os testes.
  NUNCA permita que testes sejam reescritos para passar sem aprovação explícita.
---

# Test Shield — Guardião de Testes

## Propósito
A IA reescreve testes ao invés de corrigir código. Esta skill BLOQUEIA esse comportamento
e garante que os testes testem o que importa, não o que é fácil.

---

## REGRA ZERO (inviolável)

**Se um teste está falhando:**
1. O CÓDIGO está errado, não o teste
2. Corrija o CÓDIGO para o teste passar
3. NUNCA modifique um teste existente para que ele passe
4. A ÚNICA exceção: se o teste em si tem um bug ÓBVIO (typo, assertion errada)
   → Nesse caso, explique o bug do teste ANTES de corrigi-lo

---

## QUANDO CRIAR TESTES

### Obrigatório (sem negociação)
- Funções de cálculo (preço, frete, desconto, impostos)
- Fluxo de autenticação (login, registro, logout, refresh)
- Fluxo de pagamento (criar pedido, processar pagamento, webhook)
- Validação de dados (inputs do usuário, schemas)
- Lógica de negócio complexa (regras de desconto, estoque, etc.)

### Recomendado
- Componentes com lógica (forms, filtros, ordenação)
- Utilitários (formatação, parsing, transformação)
- API routes (request/response)

### Opcional
- Componentes puramente visuais (sem lógica)
- Páginas simples (lista estática)

---

## ESTRUTURA DE UM BOM TESTE

```typescript
describe('calculateShipping', () => {
  // 1. Happy path — o cenário normal
  it('deve calcular frete corretamente para SP', async () => {
    const result = await calculateShipping('01310-100', 500);
    expect(result).toHaveLength(3); // PAC, SEDEX, Mini
    expect(result[0].price).toBeGreaterThan(0);
    expect(result[0].deliveryDays).toBeGreaterThan(0);
  });

  // 2. Edge cases — limites e bordas
  it('deve retornar frete grátis para compras acima de R$ 299', async () => {
    const result = await calculateShipping('01310-100', 500, 300);
    expect(result[0].price).toBe(0);
  });

  it('deve funcionar com CEP sem hífen', async () => {
    const result = await calculateShipping('01310100', 500);
    expect(result).toHaveLength(3);
  });

  // 3. Casos de erro — o que pode dar errado
  it('deve lançar erro para CEP inválido', async () => {
    await expect(calculateShipping('00000-000', 500))
      .rejects.toThrow(InvalidZipCodeError);
  });

  it('deve lançar erro para peso zero ou negativo', async () => {
    await expect(calculateShipping('01310-100', 0))
      .rejects.toThrow('Peso deve ser positivo');
  });

  // 4. Segurança — tentativas de abuso
  it('deve rejeitar CEP com caracteres especiais', async () => {
    await expect(calculateShipping("'; DROP TABLE--", 500))
      .rejects.toThrow(InvalidZipCodeError);
  });
});
```

---

## CHECKLIST POR TESTE

- [ ] Testa o happy path? (cenário normal de sucesso)
- [ ] Testa pelo menos 2 edge cases? (limites, valores vazios, nulos)
- [ ] Testa pelo menos 2 cenários de erro? (input inválido, falha de rede)
- [ ] Testa cenário de segurança? (injection, valores maliciosos)
- [ ] O teste é INDEPENDENTE? (não depende da ordem de execução)
- [ ] O teste é DETERMINÍSTICO? (mesmo resultado toda vez)
- [ ] O mock é mínimo? (mocka só o necessário, não tudo)
- [ ] O teste verifica COMPORTAMENTO, não implementação?

---

## ANTI-PATTERNS DE TESTE (NUNCA faça)

### 1. Reescrever Teste para Passar
```typescript
// ❌ O teste original esperava 299. O código retorna 300.
// A IA MUDA O TESTE para expect(300):
it('frete grátis acima de R$ 299', () => {
  expect(calculateFreeShippingThreshold()).toBe(300); // ERA 299!
});
// → NUNCA faça isso. Corrija calculateFreeShippingThreshold().
```

### 2. Testar Implementação ao Invés de Comportamento
```typescript
// ❌ Teste acoplado à implementação (quebra se refatorar)
it('deve chamar supabase.from com "products"', () => {
  expect(supabase.from).toHaveBeenCalledWith('products');
});

// ✅ Teste de comportamento (sobrevive a refatoração)
it('deve retornar lista de produtos ativos', async () => {
  const products = await getActiveProducts();
  expect(products).toHaveLength(3);
  expect(products.every(p => p.isActive)).toBe(true);
});
```

### 3. Mockar Tudo
```typescript
// ❌ Tudo mockado — o teste não testa nada real
jest.mock('@/lib/supabase');
jest.mock('@/lib/auth');
jest.mock('@/lib/cache');
jest.mock('@/lib/logger');
// ... o teste só valida que mocks foram chamados

// ✅ Mock apenas dependências externas (APIs, banco)
// Mantenha a lógica de negócio testando com dados reais
```

### 4. Testes Sem Assertions
```typescript
// ❌ "Teste" que só verifica que não dá erro
it('deve criar pedido', async () => {
  await createOrder(mockCart, mockUser);
  // ... cadê o expect?
});

// ✅ Assertions concretas
it('deve criar pedido com valores corretos', async () => {
  const order = await createOrder(mockCart, mockUser);
  expect(order.id).toBeDefined();
  expect(order.total).toBe(299.90);
  expect(order.status).toBe('pending');
  expect(order.items).toHaveLength(3);
});
```

---

## TESTES DE INTEGRAÇÃO (para fluxos críticos)

```typescript
// Fluxo de checkout completo
describe('Checkout Flow', () => {
  it('deve completar checkout: carrinho → pedido → pagamento', async () => {
    // 1. Adicionar ao carrinho
    const cart = await addToCart(userId, productId, 2);
    expect(cart.items).toHaveLength(1);

    // 2. Calcular frete
    const shipping = await calculateShipping(cart, userAddress);
    expect(shipping.price).toBeGreaterThan(0);

    // 3. Criar pedido
    const order = await createOrder(cart, shipping, userId);
    expect(order.status).toBe('pending');
    expect(order.total).toBe(cart.subtotal + shipping.price);

    // 4. Processar pagamento
    const payment = await processPayment(order);
    expect(payment.status).toBe('approved');

    // 5. Verificar que estoque foi atualizado
    const product = await getProduct(productId);
    expect(product.stock).toBe(originalStock - 2);
  });
});
```

---

## QUANDO É OK MODIFICAR UM TESTE

1. O teste tem um BUG REAL (typo no valor esperado, assertion invertida)
   → Explique o bug ANTES de corrigir
2. A INTERFACE da função mudou (parâmetro novo, retorno diferente)
   → Atualize o teste para refletir a nova interface, mas mantenha a intenção
3. Requisito de negócio mudou (preço mínimo era 10, agora é 15)
   → Documente a mudança de requisito, depois atualize
4. O dev PEDIU EXPLICITAMENTE para mudar o teste
   → Confirme que entendeu o motivo antes de alterar
