-- Remove policy permissiva que permite qualquer pessoa ler TODAS as linhas
-- de public_links. A leitura pública passa a ser feita via admin client
-- no server component /s/[token]/page.tsx, que valida o token em código.
DROP POLICY IF EXISTS "Anyone can read by token" ON public.public_links;
