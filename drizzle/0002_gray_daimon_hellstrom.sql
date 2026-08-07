ALTER TABLE `products` ADD `external_product_id` text;
--> statement-breakpoint
UPDATE `products` SET `name` = 'Mapa da Volta', `description` = 'Diagnóstico completo, plano personalizado de 7 dias, diário básico e relatório' WHERE `id` = 'mapa';
--> statement-breakpoint
UPDATE `products` SET `name` = 'Kit SOS Para Dias Difíceis', `description` = 'Biblioteca SOS completa para momentos de sobrecarga' WHERE `id` = 'sos';
--> statement-breakpoint
UPDATE `products` SET `name` = 'Desafio 7 Dias Sem Me Abandonar', `description` = 'Missões, check-ins e conquistas durante sete dias' WHERE `id` = 'desafio';
--> statement-breakpoint
UPDATE `products` SET `name` = 'Jornada VOLTA — 30 Dias', `description` = 'Jornada completa, relatórios, comunidade e diário' WHERE `id` = 'jornada';
