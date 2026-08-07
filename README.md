# Movimento Volta Pra Você

Plataforma web mobile-first com diagnóstico gratuito, produtos progressivos, área individual da cliente, diário privado, SOS, jornada, comunidade e administração.

## O que está funcional

- Diagnóstico de 24 perguntas com cinco perfis, oito áreas e captura de origem.
- Resultado personalizado e plano inicial.
- Contas individuais protegidas por link mágico enviado ao e-mail da compra.
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
app/api/auth/               solicitação e validação do link mágico
app/api/webhooks/[gateway]/ eventos de pagamento assinados
components/                 experiências públicas, da cliente e administrativas
db/schema.ts                modelo relacional
db/runtime.ts               inicialização D1 e catálogo padrão
drizzle/                    migrations
lib/content.ts              diagnóstico, perfis, missões e SOS
```

## Configuração

1. Copie `.env.example` para o arquivo de ambiente local.
2. Gere `AUTH_SESSION_SECRET` com no mínimo 32 caracteres aleatórios.
3. Informe `ADMIN_EMAILS` com os e-mails autorizados a administrar e `TESTER_EMAILS` com as contas que devem enxergar todos os produtos.
4. Configure `RESEND_API_KEY` e `AUTH_EMAIL_FROM` para enviar os links de acesso.
5. Cadastre no painel os links de pagamento e o identificador externo de cada produto.
6. Configure o segredo do gateway escolhido e aponte o webhook para `/api/webhooks/<gateway>`.

O modo de demonstração deve permanecer desativado em produção.

## Pagamentos

O checkout é externo e configurável por produto. Para a Wiapy, use `/api/webhooks/wiapy` e configure `WIAPY_WEBHOOK_TOKEN`. Depois de validar a chamada, o sistema registra a compra, libera o produto para uma conta existente, cria uma reivindicação por e-mail quando a cliente ainda não entrou e revoga o acesso em caso de estorno confirmado.

O cabeçalho esperado pelo normalizador de webhooks é `x-volta-signature`, contendo o HMAC SHA-256 do corpo bruto com o segredo do gateway.

## Contas individuais

A cliente abre `/entrar`, informa o mesmo e-mail usado na compra e recebe um link pessoal de uso único, válido por 15 minutos. A sessão fica protegida em cookie `HttpOnly` assinado. A área `/app`, o painel `/admin` e as operações privadas validam essa sessão no servidor. Não existe senha própria nem dependência de uma conta externa.

Em testes locais, mantenha `DEMO_MODE=true` somente no `.env.local`. O e-mail de `DEMO_EMAIL` abre a conta de teste e recebe todos os produtos através de `TESTER_EMAILS`. Nunca publique o `.env.local`.

## Privacidade e segurança

- Diário sempre isolado por cliente e ausente do painel administrativo.
- Permissões verificadas tanto na tela quanto na API.
- Exclusão e exportação de dados disponíveis.
- Entradas sanitizadas, limites de requisições e auditoria operacional.
- Webhooks assinados e idempotentes.
- Automação e marketing condicionados ao consentimento.
- Administradores definidos por lista segura de e-mails.

Antes da operação comercial, preencha os dados reais do administrador, domínio de envio de e-mail, gateway, checkout e canais de comunicação no ambiente protegido da hospedagem escolhida.
