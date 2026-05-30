# Plano — Procura-Vaga (ferramenta pessoal hospedada)

## Context

Ferramenta **pessoal** do Rodrigo — **não é produto comercial, não vende, uso próprio**. É um **web app hospedado e sempre online** (URL que ele abre no celular na rua), **privado** (atrás de login só dele). Acha vagas **abertas** no Brasil por *(curso + sub-área + local + tipo)*, gera currículo adaptado e *ATS-safe*, ajuda a abordar o time de contratação, e manda **alerta diário** das vagas novas que casam com o perfil.

**Reframe que define tudo:** por ser uso pessoal e não-econômico, a **LGPD não se aplica** (Art. 4º, I) e raspar fontes no volume pessoal é a **menor zona de risco** jurídico. Isso derruba todo o andaime de produto público (PJ, fontes licenciadas caras, teto de ~80%, proteção de PII de terceiros, infra de fila/cobertura-invariante, frota de canários) e libera **cobertura alta (~85-95%) a custo ~R$0**.

Resultado pretendido: cobertura alta + grátis + sempre acessível do celular, **sem nunca mostrar vaga já encerrada**.

---

## Princípios (ajustados ao uso pessoal)

- **Privado:** login único (só o Rodrigo). Mantém "uso pessoal", protege cotas grátis de API, impede terceiros de usar. **Sem** isso, vira "serviço a terceiros" e o reframe legal se enfraquece.
- **Grátis:** Vercel (já paga) + Neon free + GitHub Actions + Resend em free tier + Claude do Rodrigo. ~R$0/mês adicional.
- **Cobertura alta:** APIs grátis **+** scraping das fontes BR (LinkedIn/Gupy/Catho/Vagas/InfoJobs/Indeed) no volume pessoal.
- **Nunca vaga fechada:** revalidação no clique permanece o coração — é o que torna a garantia real.
- **Engenharia certa ao escopo:** ferramenta pessoal (dias a ~2 semanas), não produto (4-6 semanas). Sem over-engineering.

---

## Arquitetura

- **App (hospedado):** Next.js 15 na **Vercel (já paga)**, **mobile-first / PWA** (instala no celular, abre na rua, pode mandar push). URL `procura-vaga.vercel.app` (ou domínio `.com.br` ~R$40/ano, opcional).
- **Auth:** **Auth.js (NextAuth)** com **magic-link via Resend**, allowlist de 1 email (só o Rodrigo) — simples e seguro.
- **Banco:** **Neon Postgres (free) via Vercel Marketplace** — não consome os 2 projetos free do Supabase; integração nativa (env vars automáticas), scale-to-zero. Query via **Drizzle ORM** + driver serverless do Neon. Guarda catálogo de vagas + perfil/CV (privado, atrás do login).
- **Sourcing (alta cobertura, grátis):**
  - **Via API grátis:** Google for Jobs (JSearch free tier) + Adzuna + Jooble + ATS oficiais (Greenhouse/Lever/Ashby/Workable...).
  - **Via scraping (no cron, volume pessoal):** LinkedIn (guest), Gupy, Catho, Vagas.com, InfoJobs, Indeed.
- **Cron diário (GitHub Actions, grátis):** raspa + atualiza o catálogo (marca `closed` o que sumiu) + monta o **digest das vagas novas** que casam com o perfil → **email (Resend free)** / push PWA.
- **Busca on-demand:** o app consulta o catálogo + APIs grátis ao vivo; filtros **curso + sub-área + local (UF/cidade+remoto) + tipo (Estágio·Trainee·Efetivo)**.
- **Validação no clique:** ao abrir uma vaga, 1 fetch da `apply_url` real → se fechada (404/redirect-pra-home/marcador PT-EN), **marca e esconde**. É a garantia "nunca vaga morta".
- **CV:** Claude (chave no env do servidor, nunca no cliente) gera o currículo adaptado — **guardrail semântico** (bloqueia `auxiliei→liderei`, nunca inventa empresa/cargo/número) + **round-trip do PDF** (re-extrai o texto pra provar que o ATS lê). Perfil salvo no banco privado (digita uma vez, reusa) — **com botão de apagar**.
- **Recrutador:** link de busca genérico do LinkedIn + rascunho de mensagem; o Rodrigo revisa e envia da conta dele.

---

## Cobertura & frescor

- **~85-95%** combinando APIs grátis + scraping das fontes BR. Fora ficam só vagas informais (WhatsApp) / PME sem presença online — irrelevantes pro uso.
- **Frescor:** scraping diário (catálogo) **+ validação no clique** (garantia real) → nunca exibe vaga fechada.

---

## Modelo de dados (Neon Postgres)

- **`jobs`**: `id, source, source_job_id, apply_url, company, title_norm, location_uf, location_city, remote_flag, employment_type(estagio|trainee|efetivo|unknown), seniority, snippet, cine_area, cbo_codes[], status(active|closed|unknown), last_seen_at, last_validated_at, dedup_cluster_id, collected_at` — índices em `location_uf`, `employment_type`, `cine_area`, `status`.
- **`profile`**: dados do CV do Rodrigo (privado, atrás do login; apagável).
- **`seen_jobs`** / digest: controla o que já foi alertado, pra o email diário só trazer **novidades**.
- Fechar vaga = `status=closed` (nunca `DELETE`); dedup por (empresa+título_norm+UF) — duplicata só **marca**, nunca esconde réplica aberta.

---

## Filtros local & tipo (mantidos)

- **Local:** UF (+cidade) + toggle "incluir remotas"; estrito por padrão (só RJ não traz SP). Local ambíguo → `unknown` (nunca atribui UF errada).
- **Tipo:** Estágio · Trainee · Efetivo, classificado por título/metadados; ambíguo → `unknown` em grupo próprio (**nunca** rotula estágio como efetivo). Badge de tipo em cada card.

---

## Erros graves → mitigação (enxuto pra uso pessoal)

| Erro | Mitigação | 
|---|---|
| Vaga fechada exibida | validação no clique (1 fetch da `apply_url` real) — o core | 
| Bloqueio de IP do cron | delays/jitter, scraping **guest** (sem login), kill-switch por fonte; no volume pessoal é raro e inofensivo; se travar, as outras fontes seguem | 
| Conta LinkedIn pessoal afetada | cron raspa só endpoints **guest/sem login**; nunca usa a conta do Rodrigo | 
| Estágio mostrado como efetivo / cidade errada | classificação com fail-safe `unknown` (nunca rótulo errado) | 
| CV super-adaptado / word-salad no ATS | guardrail semântico + round-trip do PDF | 

---

## Estrutura a criar (greenfield)

```
ARCHITECTURE.md, DATABASE.md           ← preencher (Fase 0)
data/taxonomy-top20.json               ← curso → área CINE → keywords → CBO
drizzle/migrations/*.sql               ← jobs, profile, seen_jobs (schema Drizzle p/ Neon)
src/app/(auth)/login                   ← Auth.js magic-link via Resend (allowlist 1 email)
src/lib/db.ts                          ← cliente Drizzle + driver serverless Neon
src/app/page.tsx                       ← busca: Curso+sub-área + Local + Tipo (mobile-first/PWA)
src/app/api/jobs/search/route.ts
src/app/api/jobs/[id]/validate/route.ts   ← validação no clique
src/app/api/cv/tailor/route.ts            ← Claude + guardrail semântico
src/app/api/recruiter/draft/route.ts
.github/workflows/cron-diario.yml      ← scrape + refresh catálogo + email digest (grátis)
src/lib/scrape/{linkedin,gupy,catho,vagas,infojobs,indeed}.ts  ← scrapers (guest/público)
src/lib/sources/{greenhouse,lever,ashby,workable,adzuna,jooble,jsearch}.ts  ← APIs grátis
src/lib/freshness/{listingDiff,validate}.ts
src/lib/taxonomy/{cine,cbo,match}.ts
src/lib/cv/{extractKeywords,tailor,semanticGuardrail,pdfRoundtrip}.ts
src/lib/notify/digest.ts               ← email diário (Resend)
public/manifest.json + service worker  ← PWA (instalar no celular)
tests/  ← validação no clique, guardrail semântico, round-trip PDF, classificação tipo/local
```

Padrão: TDD nos núcleos (validação no clique, guardrail do CV, classificação), funções ≤50 linhas, queries parametrizadas, segredos em env.

---

## Stack

Next.js 15 (App Router) + Tailwind/shadcn na **Vercel (já paga)** · **Neon Postgres (free, via Vercel Marketplace)** + **Drizzle ORM** · **Auth.js (NextAuth)** magic-link · **GitHub Actions** (cron diário grátis) · **Resend** (magic-link + email do digest, free) · **Claude Haiku** (CV; chave no env do servidor) · **PWA** (instalável no celular). `pdf-lib` + `pdf.js` (round-trip ATS) no cliente.

## Custo

**~R$0/mês adicional** (Vercel você já paga). Neon free + GitHub Actions + Resend free tier + Claude do Rodrigo (centavos por CV). Domínio `.com.br` opcional ~R$40/ano. VPS (~R$20/mês) **só** se o scraping precisar de IP dedicado — opcional, provavelmente desnecessário no volume pessoal.

## Roadmap

- **Fase 0:** scaffold Next.js + Neon (via Vercel Marketplace) + Drizzle + Auth.js magic-link (só Rodrigo); taxonomia CINE→CBO Top 20; contas free JSearch/Adzuna/Jooble.
- **Fase 1 (núcleo):** sourcing (APIs grátis + scrapers) + cron diário + catálogo + busca com filtros (curso/área/local/tipo) + validação no clique. **Já entrega o essencial: achar vaga aberta certa.**
- **Fase 2:** CV ATS via Claude (guardrail + round-trip) + alerta diário por email/push + PWA instalável.
- **Fase 3:** helper de recrutador (link + rascunho).

## Trade-offs honestos

- **Scraping quebra o ToS dos sites tecnicamente.** No uso pessoal e baixo volume, o pior realista é um **bloqueio temporário de IP** (inofensivo) — não há exposição LGPD (isenção pessoal) nem cenário de cease-and-desist plausível contra um indivíduo buscando emprego. Regra: nunca raspar logado na conta principal.
- **IP do GitHub Actions** pode tomar bloqueio em alguns sites; mitigado por delays + baixa frequência + apoiar-se no Google for Jobs (JSearch) para o que bloquear. Fallback: VPS barato.
- **Free tiers têm limite** (ex.: JSearch ~200 req/mês): ajustar a frequência do cron e o nº de combinações curso×local pra caber. No uso pessoal, sobra.
- **Cobertura não é 100%** (vaga informal sem presença online fica fora) — ~90% atende de sobra.

## Verificação (end-to-end)

- `npm run dev` local → depois **deploy Vercel** → abrir a URL **no celular** e logar.
- Disparar o **cron manualmente** (GitHub Actions) → ver o catálogo popular no Neon + **email do digest chegar**.
- Clicar numa vaga → ver a **validação no clique** (vaga fechada some da lista).
- Gerar **1 currículo** → jogar o PDF no **Jobscan** e conferir que os campos são lidos.
- Buscar "só Rio de Janeiro" → confirmar que não vem vaga de outra UF; conferir badges Estágio/Efetivo.

---

### Em linguagem simples

A virada desta rodada foi entender que isto é **uma ferramenta sua, pra você usar**, não um produto pra vender. Isso muda tudo: a lei de proteção de dados (LGPD) **não se aplica** a uso pessoal, então some toda a parte cara e burocrática (abrir empresa, fontes pagas, teto de 80%), e você pode buscar nas fontes que quiser (LinkedIn, Gupy, Catho, Indeed) **de graça**, chegando a ~90% das vagas. Vai ser um site de verdade, **sempre no ar e protegido por um login só seu**, que você abre no celular na rua — e que toda manhã te manda por email as **vagas novas** que combinam com o que você procura. O cuidado central continua: antes de te mandar pra uma vaga, o sistema **reconfere na hora do clique** se ela ainda está aberta, pra você nunca perder tempo com vaga morta. Custo: praticamente **zero**. Um ponto pra você confirmar: seu currículo ficaria **salvo na sua conta privada** (pra não redigitar) com botão de apagar — se preferir que nada fique salvo, eu deixo só na sessão; é só dizer.
