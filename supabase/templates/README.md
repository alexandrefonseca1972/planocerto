# Templates de email do Supabase

Este diretório concentra os templates versionados de autenticação do Supabase para o PlanoCerto.

## Templates já prontos

- `magic_link.html`: usado pelo fluxo de "reenviar acesso" do admin.
- `recovery.html`: usado pelo fluxo "esqueci minha senha".
- `confirmation.html`: pronto para futuras confirmações por email.
- `invite.html`: pronto para convites/onboarding.
- `email_change.html`: pronto para confirmação de troca de email.
- `reauthentication.html`: pronto para verificação extra em operações sensíveis.
- `password_changed_notification.html`: aviso de senha alterada.

## Como aplicar no projeto remoto

1. Configure o SMTP real no [supabase/config.toml](/Users/alexandrefonseca/projetos/planocerto/supabase/config.toml).
2. Revise `site_url` e `additional_redirect_urls`.
3. Execute `supabase config push`.

## Fluxo atual do app

- O projeto hoje envia email de recuperação por `resetPasswordForEmail`.
- O admin pode reenviar acesso por `generateLink({ type: "magiclink" })`.
- O auto-cadastro continua desabilitado em [src/app/actions/auth.ts](/Users/alexandrefonseca/projetos/planocerto/src/app/actions/auth.ts:63).
- A criação de usuário pelo admin ainda não dispara email automaticamente; ela cria o usuário e pode ser combinada com o reenvio de acesso.
