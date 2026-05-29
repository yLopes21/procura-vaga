# CLAUDE.md — Workflow Antídoto v1.0

> Este arquivo é lido automaticamente pelo Claude Code. Ele define as regras do projeto.
> NUNCA modifique este arquivo sem aprovação explícita do desenvolvedor.

---

## Identidade do Projeto

- **Nome:** SALIM organização
- **Stack:** _A definir — será preenchida quando a skill `hm-init` for chamada pela primeira vez_
- **Tipo:** _A definir — será preenchido quando a skill `hm-init` for chamada pela primeira vez_
- **Ambiente atual:** dev

> Observação de layout: `ARCHITECTURE.md`, `TECH_DEBT.md`, `.env.example` e `.gitignore` ficam na **raiz** do projeto (não em `docs/`), conforme o setup inicial deste repositório.

---

## REGRAS GLOBAIS (NÃO-NEGOCIÁVEIS)

### 1. Antes de Qualquer Código → Planeje
- NÃO escreva código até que exista um plano aprovado em `ARCHITECTURE.md`
- Para cada tarefa: defina ESCOPO, ARQUIVOS PERMITIDOS e CRITÉRIO DE SUCESSO antes de começar
- Se não existe schema de banco documentado em `DATABASE.md`, crie ANTES de escrever queries

### 2. Escopo Trancado
- Modifique APENAS os arquivos listados na tarefa atual
- Se precisar tocar em um arquivo não listado: PARE e pergunte antes
- NUNCA refatore código que não foi pedido
- NUNCA adicione dependências sem aprovação explícita
- NUNCA mude nomes de variáveis/funções fora do escopo da tarefa

### 3. Segurança é Pré-Requisito
- ZERO secrets hardcoded — tudo via variáveis de ambiente (.env)
- ZERO uso de eval(), exec(), Function() ou equivalentes
- TODAS as queries SQL devem ser parametrizadas (NUNCA concatenar strings)
- TODA input do usuário deve ser validada e sanitizada no BACKEND
- Supabase: RLS OBRIGATÓRIO em toda tabela. NUNCA usar service_role key no frontend
- NUNCA logar PII, tokens, senhas ou dados sensíveis

### 4. Testes São Sagrados
- NUNCA reescreva um teste para ele passar — corrija o CÓDIGO
- Se os testes existentes falham, PARE e reporte antes de continuar
- Todo fluxo crítico (auth, pagamento, dados sensíveis) precisa de teste de integração

### 5. Git Discipline
- Trabalhe SEMPRE em branch dedicada (nunca direto na main)
- Commits atômicos: 1 commit = 1 mudança lógica
- Mensagem de commit em português, descritiva: "fix: corrige cálculo de frete no checkout"

### 6. Banco de Dados
- Schema definido em `DATABASE.md` ANTES de implementar
- Toda alteração de schema via migration (nunca direto no banco)
- Constraints (UNIQUE, FK, CHECK, NOT NULL) no banco, NÃO só na aplicação
- Índices para toda coluna usada em WHERE, JOIN ou ORDER BY frequente

### 7. Padrões de Código
- Naming: camelCase para variáveis/funções, PascalCase para componentes/classes
- Um estilo por projeto — NÃO misture patterns diferentes
- Funções com no máximo 50 linhas. Se maior, decomponha
- Imports organizados: libs externas → libs internas → componentes → utils → types
- TODA função pública precisa de JSDoc ou comentário explicando o PORQUÊ

### 8. Ambientes Separados
- O agente NUNCA deve ter acesso ao banco/API de produção
- Variáveis de ambiente distintas: .env.development, .env.production
- NUNCA faça deploy sem testes passando

---

## ESTRUTURA DE PASTAS PADRÃO

```
projeto/
├── CLAUDE.md              ← Este arquivo (regras do projeto)
├── README.md             ← Guia de uso do workflow
├── ARCHITECTURE.md       ← Decisões de arquitetura e componentes
├── DATABASE.md           ← Schema do banco, RLS policies, índices (criar ao iniciar o banco)
├── SCOPE.md              ← Escopo da tarefa atual (criar por tarefa)
├── TECH_DEBT.md          ← Registro de débitos técnicos conhecidos
├── skills/               ← 7 especialistas consultados pelo agente
├── src/                  ← Código fonte
├── tests/                ← Testes
├── .env.example          ← Template de variáveis (sem valores reais)
└── .gitignore            ← Inclui .env*, node_modules, etc.
```

---

## PIPELINE DE CADA TAREFA

Toda tarefa segue esta ordem. NÃO pule etapas:

```
1. ESCOPO    → Definir exatamente o que será feito e quais arquivos serão tocados
2. PLANO     → Desenhar a solução antes de codar (consultar ARCHITECTURE.md)
3. CÓDIGO    → Implementar seguindo os padrões acima
4. TESTE     → Verificar que testes existem e passam
5. SEGURANÇA → Revisar: secrets? inputs validados? RLS? auth?
6. REVIEW    → git diff — verificar que NÃO tocou em arquivos fora do escopo
7. COMMIT    → Commit atômico com mensagem descritiva
```

---

## STACK DO PROJETO

> A stack completa será definida quando a skill `hm-init` for chamada pela primeira vez. Atualizar os campos abaixo nesse momento.

- **Frontend:** _A definir (hm-init)_
- **Backend:** _A definir (hm-init)_
- **Banco:** _A definir (hm-init)_
- **Auth:** _A definir (hm-init)_
- **Deploy:** _A definir (hm-init)_
- **Pagamento:** _A definir (hm-init)_

---

## SKILLS DISPONÍVEIS

O Claude Code deve consultar estas skills especializadas quando necessário:

| Skill | Quando Consultar |
|-------|-----------------|
| `architect` | Antes de iniciar qualquer feature nova ou mudança arquitetural |
| `db-guardian` | Ao criar/alterar tabelas, queries, migrations, RLS |
| `security-sentinel` | Ao implementar auth, pagamentos, ou qualquer feature com dados sensíveis |
| `scope-lock` | SEMPRE — verificar escopo antes de qualquer mudança |
| `code-quality` | Ao escrever código novo ou refatorar |
| `test-shield` | Ao criar ou modificar testes |
| `deploy-guard` | Antes de qualquer deploy ou mudança de infraestrutura |
