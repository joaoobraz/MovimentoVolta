# Configuração opcional com Supabase

Esta entrega usa Cloudflare D1 para funcionar no Sites. Se o projeto for hospedado na Vercel ou em outra infraestrutura Next.js, o mesmo domínio pode usar Supabase/PostgreSQL.

## Passos

1. Crie um projeto no Supabase e copie URL, chave pública e chave de serviço para o ambiente.
2. Converta os tipos SQLite de `db/schema.ts` para PostgreSQL (`uuid`, `timestamptz`, `jsonb`, `boolean`).
3. Execute as migrations no SQL Editor ou pela CLI do Supabase.
4. Ative e-mail/senha no Auth, confirmação de e-mail e URLs de redirecionamento.
5. Crie um trigger que replique `auth.users.id` em `public.users.id`.
6. Use a chave pública apenas no navegador. A chave de serviço fica somente no servidor.
7. Configure Storage para fotos opcionais de perfil e cartões exportados; diário continua no banco privado.

## RLS mínima

```sql
alter table journal_entries enable row level security;

create policy "owner reads journal"
on journal_entries for select
using (auth.uid() = user_id);

create policy "owner writes journal"
on journal_entries for insert
with check (auth.uid() = user_id);

create policy "owner updates journal"
on journal_entries for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "owner deletes journal"
on journal_entries for delete
using (auth.uid() = user_id);
```

Aplique políticas equivalentes em `daily_checkins`, `user_missions`, `user_access`, `points_history`, `user_achievements` e notificações. Em comunidade, permita leitura de posts publicados, mas limite edição/exclusão à autora ou moderadora. Não crie política administrativa que leia o diário por padrão.

## Auth

- Cadastro: `signUp` com e-mail e senha forte.
- Login: `signInWithPassword`.
- Recuperação: `resetPasswordForEmail` com URL de retorno segura.
- Confirmação: habilitada no painel Auth.
- Sessão: cookies HTTP-only por helpers server-side.
- Login social: adicionar provedores somente após configurar URLs e políticas.

## Deploy na Vercel

1. Importe o repositório.
2. Configure todas as variáveis de `.env.example`.
3. Troque a camada `db/runtime.ts` por um repositório Supabase server-side.
4. Execute migrations antes de liberar tráfego.
5. Desative `DEMO_MODE`.
6. Valide RLS com duas contas diferentes e com uma conta administrativa.
