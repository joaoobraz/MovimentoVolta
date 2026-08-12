ALTER TABLE `products` ADD `downsell_checkout_url` text;--> statement-breakpoint
INSERT OR IGNORE INTO `products` (`id`,`slug`,`name`,`price_cents`,`description`,`status`,`position`) VALUES ('completo','plano-volta-completo','Plano VOLTA Completo',4700,'Mapa da Volta, Kit SOS e Desafio de 7 Dias em uma única experiência','active',5);
