---
name: architect
description: >
  Skill de arquitetura de software. OBRIGATÓRIA antes de iniciar qualquer feature nova,
  módulo, página, API, ou mudança estrutural. Use SEMPRE que o usuário pedir para
  "criar", "construir", "adicionar feature", "fazer um módulo", "implementar", ou qualquer
  tarefa que envolva código novo. Também use quando o projeto estiver sendo iniciado do zero.
  Esta skill IMPEDE que código seja escrito sem planejamento. Se não existe um
  docs/ARCHITECTURE.md, esta skill cria um. Se já existe, ela garante que a nova feature
  se encaixa na arquitetura existente. NUNCA comece a codar sem passar por esta skill.
---

# Architect — Planeje Antes de Codar

## Propósito
Evitar o problema #1 do vibe coding: código sem estrutura que vira spaghetti.
Todo código nasce de um plano. Sem plano = sem código.

---

## FASE 1 — Diagnóstico (obrigatório)

Antes de qualquer implementação, responda internamente:

### 1.1 Contexto do Projeto
- O projeto já tem `docs/ARCHITECTURE.md`? Se NÃO → crie antes de continuar
- Qual a stack? (ler seção STACK do CLAUDE.md)
- Quantos módulos/páginas existem hoje?
- Existe schema de banco documentado em `docs/DATABASE.md`?

### 1.2 Contexto da Tarefa
- O que exatamente foi pedido?
- Quais componentes existentes serão afetados?
- Quais arquivos serão criados ou modificados? (LISTAR TODOS)
- Existe código reutilizável no projeto ou preciso criar do zero?
- Há dependências externas necessárias? (listar e justificar cada uma)

---

## FASE 2 — Plano de Implementação

Crie um plano ANTES de escrever código. O plano deve conter:

### 2.1 Escopo Fechado
```markdown
## Tarefa: [nome da tarefa]

### Arquivos que serão CRIADOS:
- src/components/NomeComponente.tsx — [propósito]
- src/lib/nomeUtil.ts — [propósito]

### Arquivos que serão MODIFICADOS:
- src/pages/index.tsx — [o que muda e por quê]

### Arquivos que NÃO serão tocados:
- Todos os outros (se precisar tocar em algo não listado, PARE e pergunte)

### Dependências novas:
- Nenhuma (ou listar com justificativa)

### Critério de sucesso:
- [O que precisa funcionar para a tarefa estar completa]
```

### 2.2 Decisões de Design (ADR Simplificado)
Para cada decisão não-trivial, documente:
- **Decisão:** O que foi decidido
- **Motivo:** Por que essa abordagem e não outra
- **Trade-off:** O que estamos abrindo mão

### 2.3 Impacto no Banco de Dados
- A tarefa precisa de novas tabelas ou colunas? → Consultar skill `db-guardian`
- Precisa de novas queries? → Documentar padrão de acesso esperado
- Impacta RLS policies? → Documentar

---

## FASE 3 — Validação do Plano

Antes de implementar, faça o checklist:

- [ ] O plano foi apresentado ao desenvolvedor?
- [ ] Os arquivos permitidos estão listados?
- [ ] Não estou adicionando dependências sem aprovação?
- [ ] A solução se encaixa na arquitetura existente (docs/ARCHITECTURE.md)?
- [ ] Se precisa de banco: o schema está documentado?
- [ ] A estimativa de arquivos tocados é ≤ 5? (se não, decomponha a tarefa)

---

## FASE 4 — Template do ARCHITECTURE.md

Se o projeto não tem `docs/ARCHITECTURE.md`, crie com esta estrutura:

```markdown
# Arquitetura do Projeto — [Nome]

## Visão Geral
[Descrição em 2-3 frases do que o projeto faz]

## Stack
- Frontend: [framework]
- Backend: [framework]
- Banco: [DB]
- Auth: [provider]
- Deploy: [plataforma]

## Estrutura de Pastas
[Árvore de pastas com explicação de cada diretório]

## Componentes Principais
[Lista dos módulos/componentes principais e suas responsabilidades]

## Fluxos Críticos
[Diagrama ou descrição dos fluxos principais: auth, pagamento, etc.]

## Decisões de Design (ADRs)
| # | Decisão | Motivo | Data |
|---|---------|--------|------|
| 1 | [exemplo] | [motivo] | [data] |

## Integrações Externas
[APIs, webhooks, serviços terceiros]
```

---

## REGRAS RÍGIDAS

1. **NUNCA comece a codar sem plano aprovado** — Se o dev pede "faz X", primeiro apresente o plano
2. **Decomponha tarefas grandes** — Se > 5 arquivos, quebre em sub-tarefas
3. **Reutilize antes de criar** — Sempre verifique se já existe algo similar no projeto
4. **Documente decisões** — Toda decisão não-óbvia vai no ADR
5. **Pense em escala** — A solução funciona para 10.000 usuários ou só para 10?
