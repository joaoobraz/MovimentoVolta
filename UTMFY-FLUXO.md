# Fluxo UTMfy do Movimento Volta Pra Você

## Como a medição funciona

1. O anúncio da Meta leva a cliente para `movimentovolta.com.br` com parâmetros UTM.
2. O site preserva as UTMs, o `fbclid` e outros identificadores durante a landing page, o quiz e o resultado.
3. Ao abrir o checkout, esses parâmetros são enviados na URL da Wiapy.
4. A Wiapy confirma o pagamento e envia a venda para a UTMfy pela integração nativa.
5. A UTMfy relaciona a venda à campanha e à conta de anúncios da Meta.
6. O webhook separado do Movimento Volta recebe a mesma aprovação para liberar o produto e enviar o e-mail de acesso.

## Configuração na Wiapy

- Integrações > UTMfy
- Selecionar todos os checkouts ativos
- Colar o API Token obtido na conta UTMfy
- Ativar pagamento pendente, aprovado, estornado, chargeback, cartão recusado e carrinho abandonado
- Salvar

## Configuração na UTMfy

- Conectar a conta de anúncios da Meta
- Criar ou copiar o token de integração da Wiapy
- Confirmar domínio, pixel de otimização e parâmetros UTM conforme o padrão das campanhas

## Padrão recomendado para anúncios

`utm_source=facebook&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}`

O webhook do Movimento Volta e a integração UTMfy têm funções diferentes. O primeiro entrega o produto. A segunda mede a origem da venda e ajuda a otimizar anúncios.
