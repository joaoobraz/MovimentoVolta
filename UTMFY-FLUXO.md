# Fluxo UTMfy do Movimento Volta Pra Você

## Como a medição funciona

1. O anúncio da Meta leva a cliente para `movimentovolta.com.br` com parâmetros UTM.
2. O site preserva as UTMs, o `fbclid` e outros identificadores durante a landing page, o quiz e o resultado.
3. Ao abrir o checkout, esses parâmetros são enviados na URL da Wiapy.
4. A Wiapy confirma o pagamento e envia a venda para a UTMfy pela integração nativa.
5. A UTMfy relaciona a venda à campanha e à conta de anúncios da Meta.
6. O webhook separado do Movimento Volta recebe a mesma aprovação para liberar o produto e enviar o e-mail de acesso.

## Quais vendas chegam à UTMfy

Como a integração está vinculada aos checkouts da Wiapy, todas as vendas desses checkouts são enviadas, mesmo quando a cliente não veio de anúncio.

- Facebook ou Instagram com UTMs: campanha, conjunto e criativo podem ser identificados.
- Google Ads com UTMs e `gclid`: a campanha paga pode ser identificada.
- Pesquisa orgânica no Google: a venda chega, mas pode aparecer como orgânica ou sem atribuição se não houver parâmetros.
- Link compartilhado por uma amiga: a venda chega, mas normalmente aparece como direta ou referência, salvo se o link compartilhado tiver UTMs.
- Acesso digitando o domínio: a venda chega como direta ou sem atribuição.

A confirmação da venda não depende do Facebook. Os parâmetros servem para explicar de onde a cliente veio.

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
