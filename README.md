# Movimento Volta Pra Você

Plataforma web mobile-first com diagnóstico gratuito, produtos progressivos, área individual da cliente, diário privado, SOS, jornada, comunidade e administração.

## O que está funcional

- Diagnóstico de 24 perguntas com cinco perfis, oito áreas e captura de origem.
- Resultado personalizado e plano inicial.
- Contas individuais protegidas por e-mail e senha criada pela própria cliente.
- Vinculação automática do diagnóstico à conta pelo e-mail informado.
- Permissões reais por produto, aplicadas na interface e no servidor.
- Plano de 7 dias ou Jornada de 30 dias conforme o produto adquirido.
- Missões adaptadas ao perfil, área desejada e tempo disponível.
- Diário privado, check-ins, Kit SOS, pontos, conquistas e comunidade.
- Catálogo, preços, links de pagamento, acessos e automações persistentes no painel.
- Webhooks assinados para aprovação, estorno, liberação e revogação de acesso.
- E-mail transacional automático após pagamento aprovado e página de confirmação.
- Funil real de quiz, resultado, checkout, compra e login no painel.
- Checklist de ativação comercial, sem números estimados ou configurações ocultas.
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
app/api/auth/               login, ativação e recuperação de senha
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
4. Configure `RESEND_API_KEY` e `AUTH_EMAIL_FROM` para enviar ativação e recuperação de senha.
5. Cadastre no painel os links de pagamento e o identificador externo de cada produto. No Mapa, informe também o checkout combinado com Kit SOS.
6. Configure o segredo do gateway escolhido e aponte o webhook para `/api/webhooks/<gateway>`.
7. Cadastre a página `/obrigada` como página de confirmação na Wiapy.
8. Preencha identificação do fornecedor e canais de atendimento antes de desativar o modo demonstração.

O modo de demonstração deve permanecer desativado em produção.

## Pagamentos

O checkout é externo e configurável por produto. Para a Wiapy, use `/api/webhooks/wiapy` e configure `WIAPY_WEBHOOK_TOKEN`. Depois de validar a chamada, o sistema registra a compra, libera o produto para uma conta existente, cria uma reivindicação por e-mail quando a cliente ainda não entrou e revoga o acesso em caso de estorno confirmado.

Na Wiapy, o token é recebido no cabeçalho `Authorization`. Nos demais conectores suportados, o normalizador aceita `x-volta-signature` com HMAC SHA-256 do corpo bruto.

## Contas individuais

A Wiapy confirma o pagamento pelo webhook e o sistema libera os produtos para o e-mail da compra. No primeiro acesso, a cliente recebe um link de ativação de uso único, válido por 24 horas, e cria a própria senha. Depois disso, entra em `/entrar` com e-mail e senha. A recuperação de senha utiliza um link de uso único válido por 30 minutos. A sessão fica protegida em cookie `HttpOnly` assinado. A área `/app`, o painel `/admin` e as operações privadas validam essa sessão no servidor, sem depender de uma conta da Wiapy ou de outra plataforma externa.

Em testes locais, mantenha `DEMO_MODE=true` somente no `.env.local`. A conta definida em `DEMO_EMAIL` e `DEMO_PASSWORD` abre a experiência completa da Maria. A conta separada definida em `DEMO_ADMIN_EMAIL` e `DEMO_ADMIN_PASSWORD` abre o painel administrativo sem dar permissões de gestão à Maria. Contas em `TESTER_EMAILS` recebem todos os produtos após a ativação. Nunca publique o `.env.local`.

## Privacidade e segurança

- Diário sempre isolado por cliente e ausente do painel administrativo.
- Permissões verificadas tanto na tela quanto na API.
- Exclusão e exportação de dados disponíveis.
- Entradas sanitizadas, limites de requisições e auditoria operacional.
- Webhooks assinados e idempotentes.
- Automação e marketing condicionados ao consentimento.
- Administradores definidos por lista segura de e-mails.

Antes da operação comercial, preencha os dados reais do administrador, domínio de envio de e-mail, gateway, checkout e canais de comunicação no ambiente protegido da hospedagem escolhida.
