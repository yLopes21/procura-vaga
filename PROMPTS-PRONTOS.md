# Prompts Prontos — Cole no Claude Code

Abaixo estão 2 prompts prontos. Escolha o que se aplica, copie, e cole no Claude Code junto com o arquivo workflow-antidoto.zip anexado.

---

## PROMPT 1: Projeto NOVO (ainda não tem código)

```
Estou anexando o arquivo workflow-antidoto.zip. Ele contém meu workflow de desenvolvimento com CLAUDE.md, 7 skills especializadas, e templates.

Faça o seguinte:

1. Descompacte o zip na raiz do projeto atual
2. Mova os arquivos de templates/ (.gitignore, .env.example, ARCHITECTURE.md, TECH_DEBT.md) para a raiz do projeto
3. Preencha o CLAUDE.md com estas informações:
   - Nome: [NOME DO PROJETO]
   - Stack: [SUA STACK - ex: Next.js 14, Supabase, Tailwind, TypeScript]
   - Tipo: [TIPO - ex: e-commerce, SaaS, chatbot]
   - Ambiente atual: dev
4. Inicialize o git se ainda não existir (git init + primeiro commit)
5. Confirme que tudo está no lugar e me mostre a estrutura final

A partir de agora, SEMPRE siga o CLAUDE.md e consulte as skills em cada fase antes de qualquer tarefa.
```

---

## PROMPT 2: Projeto QUE JÁ EXISTE (já tem código)

```
Estou anexando o arquivo workflow-antidoto.zip. Ele contém meu workflow de desenvolvimento com CLAUDE.md, 7 skills especializadas, e templates.

Faça o seguinte:

1. Descompacte o zip na raiz do projeto atual
2. Mova os templates que ainda não existem (.gitignore, .env.example, ARCHITECTURE.md, TECH_DEBT.md) para a raiz — NÃO sobrescreva arquivos que já existem
3. Analise o projeto atual (estrutura de pastas, package.json, banco) e preencha o CLAUDE.md com as informações reais do projeto
4. Preencha o ARCHITECTURE.md com a arquitetura real atual (tabelas, integrações, estrutura)
5. Rode uma auditoria rápida usando as skills security-sentinel e db-guardian
6. Liste tudo que encontrar fora dos padrões e registre no TECH_DEBT.md
7. Me mostre: estrutura final, resumo da auditoria, e os items de débito técnico priorizados

A partir de agora, SEMPRE siga o CLAUDE.md e consulte as skills em cada fase antes de qualquer tarefa.
```

---

## DICA

Substitua os trechos entre [COLCHETES] pelas informações do seu projeto antes de colar. No Prompt 2 (projeto existente) você não precisa preencher nada — o Claude Code analisa e preenche sozinho.
