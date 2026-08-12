# Checklist de lançamento do Movimento Volta Pra Você

Atualizado em 12 de agosto de 2026.

## Domínio e atendimento

- [x] Domínio `movimentovolta.com.br` ativo na Cloudflare
- [x] Site e aplicativo publicados no domínio principal
- [x] Encaminhamento de `suporte@movimentovolta.com.br` para o Gmail da operação
- [x] SPF e registros MX da Cloudflare ativos
- [x] Confirmar o código enviado pela Wiapy ao e-mail de suporte
- [x] Escolher o plano de envio transacional e validar o remetente do domínio

## Produtos e preços

- [x] Mapa da Volta por R$ 17,00
- [x] Kit SOS Para Dias Difíceis por R$ 27,00
- [x] Desafio 7 Dias Sem Me Abandonar por R$ 47,00
- [x] Jornada VOLTA 30 Dias por R$ 147,00
- [x] Plano VOLTA Completo por R$ 47,00 recadastrado para nova análise
- [x] Condição de saída do Plano VOLTA Completo por R$ 17,00

## Esteira comercial

- [x] Quiz e resultado personalizado
- [x] Comparação entre Mapa por R$ 17,00 e Plano Completo por R$ 47,00
- [x] Order bump do Kit SOS no checkout do Mapa
- [x] Upsell do Desafio de 7 Dias
- [x] Cross-sell da Jornada de 30 Dias
- [x] Oferta de saída por R$ 17,00 exibida uma vez por sessão
- [x] Produtos já adquiridos não são oferecidos novamente na área da cliente

## Pagamento e acesso

- [x] Checkouts com Pix e cartão
- [x] Webhook da Wiapy protegido por token
- [x] Pagamento aprovado libera o produto correto
- [x] Plano Completo libera Mapa, Kit SOS e Desafio
- [x] Compras posteriores entram na mesma conta pelo mesmo e-mail
- [x] Reembolso ou chargeback revoga o acesso relacionado
- [x] Primeiro acesso usa link único para criação de senha
- [x] Login posterior usa e-mail e senha
- [x] Validar o remetente de saída e configurar a chave do provedor de e-mail
- [x] Vincular o webhook a todos os checkouts antigos e atuais da Wiapy
- [ ] Executar uma compra real de R$ 1,00 ou cupom de teste autorizado pela Wiapy
- [ ] Confirmar recebimento do e-mail, criação de senha, login e liberação do produto
- [ ] Confirmar revogação com um reembolso de teste

## Revisão final

- [x] Confirmar que o novo Plano VOLTA Completo não apresenta recusa na Wiapy
- [x] Confirmar que todos os checkouts saíram de “Aguardando código”
- [ ] Testar a jornada completa em celular Android e iPhone
- [x] Testar carregamento das páginas inicial, quiz, login, obrigada e catálogo público
- [x] Confirmar que o quiz avança entre as perguntas
- [x] Confirmar que o login usa e-mail e senha e não depende do ChatGPT
- [x] Confirmar que o webhook rejeita requisições sem o token correto
- [ ] Testar resultado, checkout, ativação e aplicativo com uma compra real de baixo valor
- [ ] Conferir dados legais do fornecedor antes de iniciar anúncios

# E-mail operacional

- [x] `suporte@movimentovolta.com.br` recebe mensagens pela Cloudflare Email Routing.
- [x] Encaminhamento ativo para `lg09030220@gmail.com` e `joaobraz.ofc@gmail.com` pelo Worker `movimento-volta-email-router`.
- [x] Todos os checkouts da Wiapy tiveram o e-mail de suporte validado e estão ativos.
- [x] Resend configurado no plano gratuito para criação e recuperação de senha.
- [x] Domínio `movimentovolta.com.br` autenticado por DKIM, SPF e DMARC.
- [x] Chave de produção com permissão somente de envio armazenada como segredo do Worker.
