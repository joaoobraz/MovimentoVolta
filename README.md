# Movimento Volta Pra Você

Plataforma web mobile-first com diagnóstico gratuito, produtos progressivos, área individual da cliente, diário privado, SOS, jornada, comunidade e administração.

## O que está funcional

- Diagnóstico de 24 perguntas com cinco perfis, oito áreas e captura de origem.
- Resultado personalizado e plano inicial.
- Contas individuais protegidas por Sign in with ChatGPT.
- Vinculação automática do diagnóstico à conta pelo e-mail informado.
- Permissões reais por produto, aplicadas na interface e no servidor.
- Plano de 7 dias ou Jornada de 30 dias conforme o produto adquirido.
- Missões adaptadas ao perfil, área desejada e tempo disponível.
- Diário privado, check-ins, Kit SOS, pontos, conquistas e comunidade.
- Catálogo, preços, links de pagamento, acessos e automações persistentes no painel.
- Webhooks assinados para aprovação, estorno, liberação e revogação de acesso.
- Fila de comunicações que respeita consentimento.

## Ordem dos produtos

1. Diagnóstico gratuito.
2. Mapa da Volta — produto de entrada.
3. Kit SOS Para Dias Difíceis — adicional.
4. Desafio 7 Dias Sem Me Abandonar.
5. Jornada VOLTA — 30 Dias.

Todos os produtos funcionam dentro do mesmo aplicativo. Cada cliente vê somente os acessos adquiridos e mantém progresso, preferências e registros separados.

## Estrutura

```text
app/                        páginas públicas, área protegida e administração
app/api/data/               dados, permissões e configurações
app/api/webhooks/[gateway]/ eventos de pagamento assinados
components/                 experiências públicas, da cliente e administrativas
db/schema.ts                modelo relacional
db/runtime.ts               inicialização D1 e catálogo padrão
drizzle/                    migrations
lib/content.ts              diagnóstico, perfis, missões e SOS
```

## Configuração

1. Copie `.env.example` para o arquivo de ambiente local.
2. Informe `ADMIN_EMAILS` com os e-mails autorizados a administrar.
3. Cadastre no painel os links de pagamento de cada produto.
4. Configure o segredo do gateway escolhido.
5. Aponte o webhook para `/api/webhooks/<gateway>`.
6. Configure as credenciais do provedor de e-mail ou WhatsApp quando essas mensagens forem ativadas.

O modo de demonstração deve permanecer desativado em produção.

## Pagamentos

O checkout é externo e configurável por produto. Depois de validar a assinatura do webhook, o sistema registra a compra, libera o produto para uma conta existente, cria uma reivindicação por e-mail quando a cliente ainda não entrou e revoga o acesso em caso de estorno confirmado.

O cabeçalho esperado pelo normalizador de webhooks é `x-volta-signature`, contendo o HMAC SHA-256 do corpo bruto com o segredo do gateway.

## Contas individuais

Na hospedagem Sites, a autenticação é iniciada em `/signin-with-chatgpt`. A área `/app`, o painel `/admin` e as operações privadas validam a identidade no servidor. Não há formulário de senha próprio nem credenciais públicas de demonstração.

## Privacidade e segurança

- Diário sempre isolado por cliente e ausente do painel administrativo.
- Permissões verificadas tanto na tela quanto na API.
- Exclusão e exportação de dados disponíveis.
- Entradas sanitizadas, limites de requisições e auditoria operacional.
- Webhooks assinados e idempotentes.
- Automação e marketing condicionados ao consentimento.
- Administradores definidos por lista segura de e-mails.

Antes da operação comercial, preencha os dados reais do administrador, gateway, checkout e canais de comunicação no ambiente protegido do Sites.
