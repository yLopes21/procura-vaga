---
name: scope-lock
description: >
  Controlador de escopo que previne alterações indesejadas do agente de IA. Esta skill
  deve ser consultada ANTES de qualquer modificação de código. Ela define quais arquivos
  podem ser tocados e bloqueia qualquer mudança fora do escopo. Use SEMPRE — em toda
  tarefa, sem exceção. Use especialmente quando ouvir "corrija", "implemente", "adicione",
  "refatore", "mude", "atualize" ou qualquer verbo que implique modificação de código.
  Esta skill é o antídoto contra o scope creep do agente: refatorações não solicitadas,
  adição de dependências sem pedir, modificação de arquivos não relacionados, e a
  reescrita de testes para mascarar bugs. NUNCA modifique um arquivo sem que esta skill
  tenha autorizado.
---

# Scope Lock — Controle de Escopo

## Propósito
Agentes de IA são treinados para ser "úteis", mas no código, utilidade sem limites = caos.
Esta skill TRAVA o escopo de cada tarefa para evitar que o agente faça mudanças não pedidas.

---

## REGRA ZERO (inviolável)

**Antes de tocar em QUALQUER arquivo, responda:**
1. Este arquivo está listado no escopo da tarefa?
2. A modificação foi explicitamente pedida?
3. Se NÃO para qualquer uma → PARE e pergunte.

---

## PROCESSO DE CADA TAREFA

### Passo 1: Definir Escopo
Antes de codar, crie/atualize `docs/SCOPE.md`:

```markdown
# Escopo da Tarefa Atual

## Tarefa
[Descrição exata do que foi pedido]

## Arquivos PERMITIDOS para modificação
- src/components/ProductCard.tsx
- src/lib/calculateShipping.ts

## Arquivos PERMITIDOS para criação
- src/components/ShippingCalculator.tsx
- tests/shipping.test.ts

## Arquivos PROIBIDOS (NÃO TOCAR)
- Todos os outros
- Em especial: package.json, tsconfig, configs, outros componentes

## Dependências novas aprovadas
- Nenhuma (ou listar as aprovadas)

## O que NÃO fazer
- NÃO refatorar código existente fora do escopo
- NÃO renomear variáveis/funções em outros arquivos
- NÃO mudar estilos de código existente
- NÃO adicionar "melhorias" não solicitadas
```

### Passo 2: Durante a Implementação

A cada arquivo que for tocar, verificar:

```
CHECKLIST POR ARQUIVO:
□ Este arquivo está em "Arquivos PERMITIDOS"?
  → Se NÃO: PARE. Pergunte ao dev se pode tocar.
□ A mudança é necessária para a tarefa?
  → Se NÃO: NÃO faça. Documente como sugestão se relevante.
□ Estou mudando algo que NÃO foi pedido neste arquivo?
  → Se SIM: Reverta essa parte. Faça APENAS o pedido.
□ Estou adicionando uma dependência?
  → Se SIM: PARE. Justifique e peça aprovação.
□ Estou reescrevendo um teste existente?
  → Se SIM: PARE IMEDIATAMENTE. Corrija o CÓDIGO, não o teste.
```

### Passo 3: Revisão Pós-Implementação

Antes de apresentar o resultado:

```bash
# Verificar quais arquivos foram modificados
git diff --name-only

# Para cada arquivo na lista:
# - Está no escopo? Se NÃO → git checkout -- [arquivo]
# - As mudanças são todas necessárias? Se NÃO → reverter parcialmente
```

---

## AÇÕES PROIBIDAS (NÃO-NEGOCIÁVEIS)

### NUNCA faça sem pedir:
1. **Refatorar código existente** — Se o código funciona e não faz parte da tarefa, NÃO TOQUE
2. **Renomear variáveis/funções/arquivos** fora do escopo
3. **Mudar formatação/estilo** de código existente (espaços, aspas, etc.)
4. **Adicionar ou remover imports** em arquivos fora do escopo
5. **Adicionar dependências ao package.json** sem aprovação
6. **Modificar configs** (tsconfig, eslint, prettier, etc.) sem aprovação
7. **Reescrever testes** para que passem — corrija o código
8. **"Melhorar" código** que não foi pedido para ser melhorado
9. **Mover arquivos** de lugar sem pedido explícito
10. **Deletar código** que parece "não usado" — pode ser usado em outro lugar

### Se sentir necessidade de fazer algo fora do escopo:
1. NÃO faça
2. Documente como sugestão:
```markdown
## Sugestão (fora do escopo atual)
- Arquivo: src/lib/auth.ts
- Sugestão: Adicionar rate limiting no login
- Motivo: Prevenir brute force
- Prioridade: Alta
```
3. Deixe o dev decidir se e quando implementar

---

## SINAIS DE ALERTA (o agente está saindo do escopo quando...)

- Modifica mais de 5 arquivos em uma tarefa simples
- git diff mostra arquivos não listados no escopo
- Aparece "enquanto estou aqui, vou melhorar..." — PARE
- Adiciona imports de bibliotecas que não existiam no projeto
- Muda configurações de linter, formatter ou TypeScript
- Renomeia coisas "para ficar mais consistente"
- Refatora funções que "poderiam ser melhores" mas funcionam

---

## TEMPLATE DE RESPOSTA QUANDO ESCOPO É INSUFICIENTE

Quando o dev pede algo mas o escopo não está claro:

```
Antes de implementar, preciso confirmar o escopo:

**Entendi que você quer:** [descrição]

**Para isso, precisaria modificar:**
- [arquivo 1] — [o que mudaria]
- [arquivo 2] — [o que mudaria]

**Posso prosseguir com esse escopo?**

**Observação:** Vi que [arquivo X] também poderia ser melhorado,
mas isso está fora do escopo. Quer que eu adicione ao escopo?
```
