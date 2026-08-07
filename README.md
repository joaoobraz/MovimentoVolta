# Movimento Volta Pra Você

Plataforma web mobile-first de transformação pessoal diária, construída em português do Brasil. A experiência combina landing page, diagnóstico gratuito, resultado personalizado, funil de produtos, mini app, gamificação, diário privado, SOS, comunidade e administração.

> “Eu não me abandono mais.”

## O que está funcional

- Landing page completa com acessibilidade, FAQ, consentimento de cookies e aviso de cuidado.
- Quiz progressivo de 24 perguntas, rascunho temporário, pontuação determinística, cinco perfis e captura de UTMs.
- Captura de lead e respostas em banco; resultado personalizado com gráfico de oito áreas.
- Compra simulada do Mapa da Volta, order bump SOS e upsell do Desafio de 7 Dias.
- Entrada/cadastro de demonstração e autenticação segura do ambiente preparada via Sign in with ChatGPT.
- Mini app responsivo com Hoje, 30 missões, check-in, diário privado, SOS, pontos, conquistas, comunidade, relatório e perfil.
- Cartão compartilhável baixado como imagem, com nome oculto por padrão.
- Painel administrativo com métricas, leads, CSV, produtos, moderação, acessos e automações.
- D1/SQLite relacional com migration Drizzle, índices, auditoria, eventos idempotentes e separação por usuária.
- Endpoint de webhook preparado para Hotmart, Kiwify, Stripe, Mercado Pago e modo simulado.

## Arquitetura

O projeto usa Next.js App Router compatível com Vinext, TypeScript, React, Tailwind CSS e Cloudflare D1. O deploy é preparado para Cloudflare Workers por meio de Sites.

```text
app/
  page.tsx                    landing pública
  quiz/                       diagnóstico
  resultado/                  perfil e oferta
  upsell/                     desafio de 7 dias
  entrar/                     acesso e conta demo
  app/                        mini app da participante
  admin/                      painel protegido de demonstração
  api/data/                   operações persistentes
  api/webhooks/[gateway]/     eventos de pagamento
components/                   experiências React
db/schema.ts                  modelo relacional completo
db/runtime.ts                 acesso D1, proteção de dados e seed mínimo
drizzle/                      migrations geradas
lib/content.ts                conteúdo editorial e regras do quiz
docs/                         arquitetura e integração Supabase
```

Leia [docs/ARQUITETURA.md](docs/ARQUITETURA.md) para fluxos, permissões e banco.

## Instalação local

Requisitos: Node.js 22.13 ou superior e npm.

1. Duplique `.env.example` como `.env.local`.
2. Mantenha `DEMO_MODE=true` para explorar sem gateways reais.
3. Instale as dependências com `npm install`.
4. Gere migrations, se alterar o schema, com `npm run db:generate`.
5. Inicie com `npm run dev` e abra `http://localhost:3000`.

O banco local do ambiente é inicializado de forma idempotente na primeira operação. Em hospedagem, a migration em `drizzle/` é aplicada ao D1 lógico `DB`.

## Acessos de demonstração

Participante:

- E-mail: `maria@demo.volta`
- Senha de demonstração: `VoltaDemo#2026`

Administradora:

- E-mail: `admin@demo.volta`
- Senha de demonstração: `AdminVolta#2026`

Essas credenciais existem somente para explorar o produto; não são um mecanismo de autenticação de produção.

## Variáveis de ambiente

Consulte `.env.example`. Não grave segredos no repositório.

- `DEMO_MODE`: habilita fluxos simulados.
- `ADMIN_EMAILS`: lista de administradores autorizados.
- `NEXT_PUBLIC_SITE_URL`: URL pública do projeto.
- `PAYMENT_WEBHOOK_SECRET`: assinatura comum de webhook.
- Segredos específicos dos gateways: preparados para integração futura.
- Variáveis Supabase: opcionais para uma instalação externa à hospedagem Sites.

## Autenticação

Na hospedagem Sites, a identidade segura é fornecida pelo fluxo Sign in with ChatGPT e validada no servidor. A tela de e-mail/senha é demonstrável para avaliação da experiência, não armazena senhas e deve ser substituída por Supabase Auth quando o projeto for hospedado fora de Sites. Confirmação de e-mail, recuperação e alteração de senha ficam sob responsabilidade do provedor de identidade.

## Pagamentos

Nenhuma cobrança real é feita. O modo simulado registra compra, cria acesso e audit log. Para produção:

1. Configure o segredo do gateway no ambiente.
2. Aponte o webhook para `/api/webhooks/<gateway>`.
3. Adapte o mapeamento do evento para os estados `approved`, `pending`, `refunded` e `cancelled`.
4. Preserve o identificador externo: ele garante idempotência.
5. Libere ou revogue `user_access` somente depois de validar a assinatura.

## Trocar textos, preços e cores

- Conteúdo, produtos, missões, SOS e cálculo do quiz: `lib/content.ts`.
- Preços: catálogo `products` no mesmo arquivo e painel administrativo.
- Cores e tipografia: variáveis no topo de `app/globals.css`.
- Textos da landing: `components/LandingPage.tsx`.
- Políticas: `app/legal/page.tsx`.

## Supabase e deploy alternativo

O projeto atual usa D1 para ser publicado no Sites. Para Supabase/PostgreSQL, siga [docs/SUPABASE.md](docs/SUPABASE.md), que inclui Auth, RLS, diário privado e Storage.

## Privacidade e segurança

- Diário sempre filtrado por `user_id`; exclusão lógica e exportação disponíveis.
- Administradores não recebem conteúdo do diário nas consultas administrativas.
- Entradas textuais são limitadas e sanitizadas no servidor.
- Operações possuem rate limiting simples e logs de auditoria.
- Webhooks exigem assinatura fora do modo simulado e registram eventos idempotentes.
- Marketing e automações dependem de consentimento explícito.
- Para produção comercial, complemente com rate limiting distribuído, política de retenção, revisão jurídica LGPD e provedor de autenticação escolhido.

## Integrações preparadas, não ativadas

- Hotmart, Kiwify, Stripe e Mercado Pago por webhook.
- Supabase Auth, PostgreSQL, RLS e Storage.
- E-mail transacional e WhatsApp com consentimento.
- Checkout externo configurável.
- Círculos, Clube Volta, relatórios PDF e login social.
- Analytics de origem e automações de funil.

Não há especialista fictícia, depoimentos inventados, conteúdo médico, vídeos obrigatórios ou áudios gravados.
