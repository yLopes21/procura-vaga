---
name: code-quality
description: >
  Especialista em qualidade e organização de código. Use SEMPRE que código novo estiver
  sendo escrito ou código existente estiver sendo modificado. Garante consistência de
  naming, estrutura, imports, decomposição de funções, e previne spaghetti code. Use
  quando ouvir "escrever código", "implementar", "criar componente", "criar função",
  "refatorar", "organizar", "limpar código", "code review", "padrão", "naming",
  "estrutura". Esta skill é o antídoto contra código duplicado, nomenclatura
  inconsistente, funções gigantes, e a colcha de retalhos que o vibe coding cria.
---

# Code Quality — Anti-Spaghetti Code

## Propósito
Código gerado por IA tende a funcionar mas ser desorganizado. Cada prompt gera um estilo
diferente. Esta skill impõe consistência e qualidade em todo código do projeto.

---

## REGRAS DE NAMING (escolha UMA e siga em TODO o projeto)

### JavaScript/TypeScript — Padrão Obrigatório
```
Variáveis e funções:    camelCase      → getUserById, isActive, totalPrice
Componentes React:      PascalCase     → ProductCard, ShippingCalculator
Constantes globais:     UPPER_SNAKE    → MAX_RETRY_COUNT, API_BASE_URL
Tipos/Interfaces:       PascalCase     → UserProfile, OrderStatus
Enums:                  PascalCase     → PaymentMethod.CreditCard
Arquivos de componente: PascalCase     → ProductCard.tsx
Arquivos de util:       camelCase      → formatCurrency.ts
Diretórios:             kebab-case     → order-management/
Variáveis booleanas:    prefixo is/has → isLoading, hasPermission, canEdit
Handlers de evento:     prefixo handle → handleSubmit, handleClick
```

### Nomes Devem Ser Descritivos
```typescript
// ❌ Nomes vagos
const d = new Date();
const arr = users.filter(u => u.a);
function proc(x) { ... }

// ✅ Nomes descritivos
const orderCreatedAt = new Date();
const activeUsers = users.filter(user => user.isActive);
function processPayment(order) { ... }
```

---

## ESTRUTURA DE ARQUIVOS

### Organização de Imports (nesta ordem)
```typescript
// 1. Libs externas
import { useState, useEffect } from 'react';
import { z } from 'zod';

// 2. Libs internas / configuração
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/formatCurrency';

// 3. Componentes
import { ProductCard } from '@/components/ProductCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';

// 4. Types
import type { Product, CartItem } from '@/types';
```

### Estrutura de Componente React
```typescript
// 1. Imports (na ordem acima)
// 2. Types/Interfaces do componente
// 3. Constantes do componente
// 4. Componente
// 5. Sub-componentes privados (se pequenos)
// 6. Hooks customizados (se específicos deste componente)

interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: string) => void;
}

/** Card de produto para listagem no catálogo */
export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  // hooks primeiro
  const [isLoading, setIsLoading] = useState(false);

  // handlers
  const handleAddToCart = async () => {
    setIsLoading(true);
    await onAddToCart(product.id);
    setIsLoading(false);
  };

  // render
  return ( ... );
}
```

---

## REGRAS DE DECOMPOSIÇÃO

### Tamanho Máximo
- **Função:** máximo 50 linhas. Se maior → decomponha
- **Componente React:** máximo 150 linhas. Se maior → extraia sub-componentes
- **Arquivo:** máximo 300 linhas. Se maior → divida em módulos

### Quando Extrair uma Função
```typescript
// ❌ Função que faz muitas coisas
async function createOrder(cart, user, coupon) {
  // valida estoque (20 linhas)
  // calcula desconto (15 linhas)
  // calcula frete (15 linhas)
  // cria pedido no banco (10 linhas)
  // envia email (10 linhas)
  // atualiza estoque (10 linhas)
}

// ✅ Funções focadas
async function createOrder(cart, user, coupon) {
  await validateStock(cart);
  const discount = calculateDiscount(cart, coupon);
  const shipping = await calculateShipping(cart, user.address);
  const order = await saveOrder({ cart, user, discount, shipping });
  await sendOrderConfirmation(order);
  await updateStock(cart);
  return order;
}
```

### Quando Extrair um Componente
- Bloco de JSX se repete → componente
- Bloco tem sua própria lógica (state, effects) → componente
- Bloco pode ser testado independentemente → componente
- O arquivo está ficando > 150 linhas → extraia

---

## ANTI-PATTERNS (NUNCA faça)

### 1. Código Duplicado
```typescript
// ❌ Mesma lógica em 3 lugares diferentes
// page1.tsx: const price = product.price * (1 - discount / 100);
// page2.tsx: const finalPrice = item.price * (1 - item.discount / 100);
// page3.tsx: const total = p.price * (1 - d / 100);

// ✅ Uma função, reusada
// lib/pricing.ts
export function applyDiscount(price: number, discountPercent: number): number {
  return price * (1 - discountPercent / 100);
}
```

### 2. Lógica no JSX
```typescript
// ❌ Lógica complexa dentro do render
return (
  <div>
    {items.filter(i => i.status === 'active' && i.price > 0).map(i => (
      <span>{i.price > 100 ? `R$ ${(i.price * 0.9).toFixed(2)}` : `R$ ${i.price.toFixed(2)}`}</span>
    ))}
  </div>
);

// ✅ Lógica separada, render limpo
const activeItems = items.filter(item => item.status === 'active' && item.price > 0);

return (
  <div>
    {activeItems.map(item => (
      <ProductPrice key={item.id} product={item} />
    ))}
  </div>
);
```

### 3. Hardcoded Values
```typescript
// ❌ Números mágicos
if (cart.total > 299) { shipping = 0; }
if (retryCount > 3) { throw new Error(); }

// ✅ Constantes nomeadas
const FREE_SHIPPING_THRESHOLD = 299;
const MAX_RETRY_ATTEMPTS = 3;

if (cart.total > FREE_SHIPPING_THRESHOLD) { shipping = 0; }
if (retryCount > MAX_RETRY_ATTEMPTS) { throw new MaxRetriesError(); }
```

---

## COMENTÁRIOS

### Quando Comentar
- **SEMPRE:** O porquê de decisões não-óbvias
- **SEMPRE:** JSDoc em funções públicas/exportadas
- **NUNCA:** O que o código faz (o código deve ser legível o suficiente)

```typescript
// ❌ Comentário inútil
// Incrementa o contador
counter++;

// ✅ Comentário útil — explica o PORQUÊ
// Supabase retorna null para arrays vazios ao invés de [].
// Normalizamos aqui para evitar erros de .map() downstream.
const items = data.items ?? [];
```

### JSDoc para Funções Públicas
```typescript
/**
 * Calcula o frete baseado no CEP e peso total do carrinho.
 * Usa a API do Melhor Envio para cotação real.
 *
 * @param zipCode - CEP do destino (formato: "12345-678" ou "12345678")
 * @param weightGrams - Peso total em gramas
 * @returns Opções de frete ordenadas por preço
 * @throws {InvalidZipCodeError} Se o CEP for inválido
 */
export async function calculateShipping(
  zipCode: string,
  weightGrams: number
): Promise<ShippingOption[]> { ... }
```

---

## ERROR HANDLING

```typescript
// ❌ Engolir erros
try { await save(); } catch (e) { }

// ❌ Erro genérico sem contexto
try { await save(); } catch (e) { throw new Error('Erro'); }

// ✅ Erro com contexto, log útil, mensagem amigável
try {
  await saveOrder(order);
} catch (error) {
  console.error('Falha ao salvar pedido:', {
    orderId: order.id,
    error: error instanceof Error ? error.message : 'Erro desconhecido',
  });
  throw new OrderSaveError(`Não foi possível salvar o pedido ${order.id}`, { cause: error });
}
```
