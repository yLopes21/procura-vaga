# Arquitetura do Projeto — [Nome]

## Visão Geral
[Descrição em 2-3 frases do que o projeto faz]

## Stack
- **Frontend:** [Next.js / React / etc.]
- **Backend:** [Node.js / API Routes / etc.]
- **Banco:** [Supabase / PostgreSQL / etc.]
- **Auth:** [Supabase Auth / NextAuth / etc.]
- **Deploy:** [Vercel / etc.]
- **Pagamento:** [Asaas / Stripe / etc.]

## Estrutura de Pastas
```
src/
├── app/           ← Páginas e rotas (Next.js App Router)
├── components/    ← Componentes React reutilizáveis
├── lib/           ← Utilitários, configurações, clients
├── hooks/         ← Hooks customizados
├── types/         ← TypeScript types e interfaces
└── styles/        ← Estilos globais
```

## Componentes Principais
| Componente | Responsabilidade |
|-----------|-----------------|
| [exemplo] | [o que faz] |

## Fluxos Críticos
### Autenticação
[Descrever: como login/registro/logout funcionam]

### Checkout / Pagamento
[Descrever: carrinho → pedido → pagamento → confirmação]

## Decisões de Design (ADRs)
| # | Decisão | Motivo | Data |
|---|---------|--------|------|
| 1 | [exemplo: Usar Supabase ao invés de Firebase] | [motivo] | [data] |

## Integrações Externas
| Serviço | Propósito | Documentação |
|---------|-----------|-------------|
| [exemplo: Melhor Envio] | Cálculo de frete | [link] |
