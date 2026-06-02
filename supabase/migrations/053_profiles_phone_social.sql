-- Reconciliação: o código (e o database.types.ts mantido à mão) usa
-- profiles.phone e profiles.social_media, mas nenhuma migration as criava —
-- o banco antigo as ganhou fora de migration. Adiciona aqui para que um banco
-- novo, construído só pelas migrations, reproduza o schema que a aplicação espera.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone        text  NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS social_media jsonb NOT NULL DEFAULT '{}'::jsonb;
