# Arquitetura funcional

## Superfícies

1. **Pública:** landing, políticas, quiz, captura, resultado e ofertas.
2. **Participante:** Hoje, Jornada, SOS, Diário, Comunidade e Perfil.
3. **Administração:** métricas, leads, conteúdo, moderação, acessos e automações.
4. **Serviços:** cálculo do diagnóstico, permissões, pontos, persistência e webhooks.

## Fluxo principal

```text
Landing → Quiz (24 etapas) → Lead + UTMs → Resultado por perfil
        → Mapa R$17 + SOS R$27 → Compra simulada → Upsell R$47
        → Conta → Mini app → Missão → Check-in → Vitória → Jornada R$147
```

O quiz usa 20 questões de frequência e quatro de segmentação. Respostas positivas são invertidas quando necessário. Cada pergunta alimenta um perfil e uma das oito áreas. O perfil é a dimensão de maior severidade; resultados de baixa severidade passam para **Mulher em Retomada**. A pontuação geral é normalizada de 0 a 100.

## Permissões por produto

| Nível | Capacidades |
| --- | --- |
| Gratuito | Quiz, resultado resumido e conteúdo público |
| Mapa | Diagnóstico completo, plano de 7 dias, diário básico, relatório |
| SOS | Biblioteca SOS completa |
| Desafio | 7 dias, check-in, cartões e gamificação |
| Jornada | 30 dias, relatórios, comunidade, diário e gamificação completos |
| Clube | Círculos, novos desafios e comunidade premium (fase futura) |

`user_access` é a fonte de verdade. Compras aprovadas concedem acesso; reembolso ou cancelamento deve revogar o registro. A experiência local também mantém uma escolha de demonstração no dispositivo, identificada visualmente como teste.

## Banco de dados

O schema completo está em `db/schema.ts` e contém:

- identidade: `users`, `profiles`;
- diagnóstico: `quiz_questions`, `quiz_options`, `quiz_attempts`, `quiz_answers`, `leads`, `utm_tracking`;
- comércio: `products`, `purchases`, `user_access`, `webhook_events`;
- jornada: `journeys`, `journey_phases`, `missions`, `user_missions`;
- prática privada: `daily_checkins`, `journal_entries`, `user_sos_actions`;
- gamificação: `achievements`, `user_achievements`, `points_history`;
- comunidade: `community_posts`, `community_comments`, `community_likes`, `community_reports`;
- fase 2: `circles`, `circle_members`;
- operação: `notifications`, `system_settings`, `automation_settings`, `audit_logs`.

Índices cobrem as consultas reais: proprietário/data no diário, jornada/dia nas missões, status/data na comunidade, usuário/status em acesso e perfil nas tentativas.

## Regras de privacidade

- Toda leitura ou escrita de diário exige o mesmo `user_id` da sessão.
- Consultas administrativas não selecionam `journal_entries.body`.
- Comunidade e diário usam tabelas e rotas separadas.
- Exclusão de conta marca dados pessoais e registros privados para remoção controlada.
- Consentimento de marketing é separado do aceite obrigatório de privacidade.

## Pontos e conquistas

- Missão: 10 pontos, uma vez por referência.
- Check-in: 3 pontos; vitória registrada adiciona 3.
- SOS concluído: 3 pontos.
- Marcos de 3, 7, 15 e 30 dias são exibidos na jornada.

O histórico impede pontuação duplicada para a mesma ação/referência. Não existe ranking por aparência, peso ou desempenho.

## Liberação de missões

O dia atual é a quantidade de dias concluídos + 1. Missões anteriores continuam acessíveis e podem ser refeitas; `first_completed_at` é preservado, `last_completed_at` e `completion_count` são atualizados. O schema suporta liberação `daily` ou `free` por jornada.

## Webhooks

`/api/webhooks/[gateway]` valida gateway, assinatura e identificador externo. O par gateway/evento é único. O modo `simulado` aceita eventos sem segredo somente no ambiente de demonstração. A integração final deve mapear status e conceder/revogar acesso em transação.
