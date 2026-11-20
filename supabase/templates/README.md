# Templates de email do Auth

Este diretório concentra os templates versionados do serviço de autenticação self-hosted do PlanoCerto.

## Templates já prontos

- `magic_link.html`: usado pelo fluxo de "reenviar acesso" do admin.
- `recovery.html`: usado pelo fluxo "esqueci minha senha".
- `confirmation.html`: pronto para futuras confirmações por email.
- `invite.html`: pronto para convites/onboarding.
- `email_change.html`: pronto para confirmação de troca de email.
- `reauthentication.html`: pronto para verificação extra em operações sensíveis.
- `password_changed_notification.html`: aviso de senha alterada.

## Como aplicar na VPS

1. Configure o envio de email conforme `/opt/planocerto/OPERACAO.md`.
2. Revise `site_url` e as URLs de redirecionamento do Auth.
3. Atualize os templates e reinicie `planocerto-auth`.

## Fluxo atual do app

- O projeto hoje envia email de recuperação por `resetPasswordForEmail`.
- O admin pode reenviar acesso por `generateLink({ type: "magiclink" })`.
- O auto-cadastro continua desabilitado em [src/app/actions/auth.ts](/Users/alexandrefonseca/projetos/planocerto/src/app/actions/auth.ts:63).
- A criação de usuário pelo admin ainda não dispara email automaticamente; ela cria o usuário e pode ser combinada com o reenvio de acesso.
