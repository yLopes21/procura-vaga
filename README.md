# Workflow Antídoto — Guia de Uso

## O que é isso?

É um "kit de proteção" que você coloca em todo projeto para evitar os problemas do vibe coding. Ele funciona assim: quando o Claude Code abre seu projeto, ele lê automaticamente o arquivo `CLAUDE.md` no root. Esse arquivo contém TODAS as regras e aponta para 7 "especialistas" (skills) que o agente deve consultar em cada fase.

Pense assim: ao invés de você lembrar de tudo, o CLAUDE.md lembra pelo agente.

## Os 7 Especialistas (Skills)

| Skill | O que faz | Quando age |
|-------|-----------|------------|
| **architect** | Força o agente a PLANEJAR antes de codar | Antes de toda feature nova |
| **scope-lock** | Impede o agente de mexer no que não foi pedido | Antes de implementar |
| **code-quality** | Garante código limpo e organizado | Durante implementação |
| **db-guardian** | Protege o banco de dados | Qualquer mudança de dados |
| **test-shield** | Garante testes reais (não de mentira) | Após implementar |
| **security-sentinel** | Audita segurança | Antes de deploy |
| **deploy-guard** | Protege produção | No deploy |

## Como usar em PROJETO NOVO

### Passo 1: Copie os arquivos

Copie toda a pasta `workflow-antidoto/` para dentro do seu projeto novo:

```
seu-projeto/
├── CLAUDE.md              ← copie da raiz do workflow
├── ARCHITECTURE.md        ← copie de templates/
├── TECH_DEBT.md           ← copie de templates/
├── .env.example           ← copie de templates/
├── .gitignore             ← copie de templates/
├── skills/                ← copie a pasta inteira
│   ├── architect/
│   ├── db-guardian/
│   ├── security-sentinel/
│   ├── scope-lock/
│   ├── code-quality/
│   ├── test-shield/
│   └── deploy-guard/
└── src/                   ← seu código aqui
```

### Passo 2: Personalize o CLAUDE.md

Abra o `CLAUDE.md` e preencha o topo:

```markdown
## Identidade do Projeto
- **Nome:** Use Morena (exemplo)
- **Stack:** Next.js 14, Supabase, Tailwind, TypeScript
- **Tipo:** E-commerce
- **Ambiente atual:** dev
```

### Passo 3: Preencha o ARCHITECTURE.md

Descreva (por cima) o que o projeto faz, quais são as tabelas principais, e quais serviços externos usa. Não precisa ser perfeito — vai sendo atualizado conforme o projeto cresce.

### Passo 4: Use normalmente

A partir de agora, quando você abrir o Claude Code nesse projeto, ele já vai:
- Ler o CLAUDE.md automaticamente
- Seguir as regras antes de codar
- Consultar os especialistas em cada fase
- Pedir sua aprovação antes de expandir escopo
- Recusar fazer coisas proibidas (como hardcodar secrets)

## Como usar em PROJETO JÁ EXISTENTE

### Passo 1: Copie os mesmos arquivos

Mesma coisa do projeto novo. Copie CLAUDE.md, skills/, templates.

### Passo 2: Personalize o CLAUDE.md

Além de preencher o topo, adicione na seção "Estrutura de Pastas" a estrutura REAL do seu projeto (não a sugerida). Isso ensina ao agente como SEU projeto está organizado.

### Passo 3: Preencha o ARCHITECTURE.md com o estado atual

Descreva como o projeto está HOJE — não como deveria ser. Liste:
- Tabelas existentes
- Integrações
- Estrutura de pastas atual

### Passo 4: Faça uma auditoria inicial

Peça ao Claude Code:

> "Leia o CLAUDE.md e as skills. Depois, faça uma auditoria do projeto atual seguindo o checklist do security-sentinel e do db-guardian. Me diga o que está fora dos padrões."

Ele vai te dar uma lista de problemas. Registre no TECH_DEBT.md e vá resolvendo aos poucos.

### Passo 5: Não tente corrigir tudo de uma vez

Priorize:
1. 🔴 Segurança (secrets expostos, RLS ausente) — resolva AGORA
2. 🟠 Banco (constraints faltando, N+1) — resolva esta semana
3. 🟡 Código (nomenclatura, organização) — resolva aos poucos

## O dia-a-dia com o Workflow

### Quando for começar uma tarefa nova:

1. Diga ao Claude Code o que quer fazer
2. Ele vai **planejar** (architect) → te mostrar o plano → pedir aprovação
3. Ele vai **definir escopo** (scope-lock) → listar arquivos que vai tocar
4. Você aprova
5. Ele **implementa** seguindo os padrões (code-quality + db-guardian)
6. Ele **testa** (test-shield) → roda testes reais
7. Ele **audita segurança** (security-sentinel)
8. Você faz `git diff` para verificar → commita → deploy

### Se o agente fizer algo errado:

| Problema | Comando |
|----------|---------|
| Mexeu em arquivo errado | `git checkout -- caminho/do/arquivo` |
| Adicionou pacote sem pedir | `npm uninstall pacote` |
| Reescreveu meus testes | `git checkout -- tests/` |
| Fez muita bagunça | `git stash` (guarda tudo) ou `git reset --hard HEAD` (volta ao último commit) |
| Entrou em loop | Pare, commite o que funciona, quebre a tarefa em pedaços menores |

### Dica de ouro:

Antes de aceitar qualquer mudança do agente, SEMPRE rode:

```bash
git diff
```

Isso mostra EXATAMENTE o que mudou. Se tem algo que você não pediu, reverta.

## Resumo Visual do Workflow

```
VOCÊ TEM UMA IDEIA
        ↓
  1. PLANEJAR (architect)
     "O que vou construir? Quais arquivos? Que dados?"
        ↓
  2. TRAVAR ESCOPO (scope-lock)
     "Só posso mexer NESTES arquivos. Nada mais."
        ↓
  3. IMPLEMENTAR (code-quality + db-guardian)
     "Código limpo. Banco protegido. Padrões seguidos."
        ↓
  4. TESTAR (test-shield)
     "Testes reais. Happy path + erros + edge cases."
        ↓
  5. AUDITAR (security-sentinel)
     "Zero secrets expostos. RLS ativo. Inputs validados."
        ↓
  6. DEPLOY (deploy-guard)
     "Checklist completo. Staging primeiro. Prod por CI/CD."
        ↓
  ✅ PRONTO — Registre decisões no ARCHITECTURE.md
             Registre débitos no TECH_DEBT.md
```

## Perguntas Comuns

**"Isso não vai me deixar mais lento?"**
No começo, um pouco (5-10 min a mais por feature). Mas evita horas de debugging, retrabalho, e desastres. O estudo METR mostrou que devs que ACHAM que são mais rápidos com IA na verdade são 19% mais lentos — justamente porque não têm workflow.

**"Preciso seguir TODAS as fases sempre?"**
Para tarefas simples (mudar uma cor, um texto): não. Use bom senso.
Para qualquer coisa que toque em lógica, banco, auth, ou tenha mais de 2 arquivos: SIM.

**"E se eu quiser mudar as regras?"**
O CLAUDE.md é SEU. Adapte às suas necessidades. O importante é TER regras, não seguir estas específicas cegamente.

**"Funciona com Cursor, Windsurf e outros?"**
O CLAUDE.md é específico do Claude Code. Para outras ferramentas, os equivalentes são:
- Cursor: `.cursorrules`
- Windsurf: `.windsurfrules`
- Genérico: `.clinerules` ou `rules.md`
O conteúdo é o mesmo — só muda o nome do arquivo.
