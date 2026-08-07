-- Dados editoriais de demonstração para uso após a migration completa.
INSERT OR IGNORE INTO profiles (id,slug,name,message) VALUES
('profile-auto','automatico','Mulher no Piloto Automático','Você não parou de viver. Mas começou a viver quase sempre no modo automático.'),
('profile-over','sobrecarregada','Mulher Sobrecarregada','Você não precisa aprender a fazer mais. Precisa descobrir o que não deveria continuar carregando sozinha.'),
('profile-delay','adiada','Mulher Adiada','Seus planos não desapareceram. Eles apenas estão esperando espaço na sua vida.'),
('profile-invisible','invisivel','Mulher Invisível','Você se tornou importante para muitas pessoas, mas começou a ficar invisível dentro da própria vida.'),
('profile-return','retomada','Mulher em Retomada','Você já começou a voltar para si. Agora precisa transformar intenção em continuidade.');

INSERT OR IGNORE INTO products (id,slug,name,price_cents,description) VALUES
('mapa','mapa','Mapa da Volta',1700,'Diagnóstico completo e plano de sete dias.'),
('sos','sos','Kit SOS Para Dias Difíceis',2700,'Biblioteca de ações práticas para dias difíceis.'),
('desafio','desafio','Desafio 7 Dias Sem Me Abandonar',4700,'Sete dias de pequenas ações, check-ins e cartões.'),
('jornada','jornada','Jornada VOLTA — 30 Dias',14700,'Jornada completa do Método VOLTA.');

INSERT OR IGNORE INTO achievements (id,slug,name,threshold) VALUES
('ach-1','primeiro-passo','Primeiro passo',1),
('ach-3','tres-dias','Três dias me escolhendo',3),
('ach-7','sete-dias','Sete dias sem me abandonar',7),
('ach-15','quinze-dias','Quinze dias em movimento',15),
('ach-30','jornada','Jornada concluída',30);

INSERT OR IGNORE INTO automation_settings (id,kind,enabled,requires_consent) VALUES
('auto-welcome','welcome',0,1),('auto-quiz','quiz_completed',0,1),('auto-mission','mission_reminder',0,1),('auto-weekly','weekly_report',0,1);
