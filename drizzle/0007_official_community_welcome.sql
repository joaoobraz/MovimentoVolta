INSERT OR IGNORE INTO `users` (`id`,`email`,`name`,`role`,`status`)
VALUES ('system','comunidade@movimentovolta.com.br','Movimento Volta Pra Você','admin','active');
--> statement-breakpoint
INSERT OR IGNORE INTO `community_posts` (`id`,`user_id`,`category`,`body`,`anonymous`,`pinned`)
VALUES ('post-welcome-official','system','Boas-vindas','Bem-vinda à comunidade da Jornada. Este é um espaço para registrar pequenas vitórias, recomeços e limites possíveis, sem comparação. Seu diário continua sempre privado. Antes de publicar, evite compartilhar telefone, endereço, documentos ou qualquer dado pessoal.',0,1);
