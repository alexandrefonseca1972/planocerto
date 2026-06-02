-- Remove a integração com Google Calendar (sync de prazos).
-- Era código morto: src/lib/calendar/google.ts não tinha importadores e as
-- tabelas abaixo não eram consumidas por nenhum código. A agenda nativa
-- (/calendario) não depende disto. Reverte 013_calendar_sync e 014_calendar_tokens.

DROP TABLE IF EXISTS public.calendar_sync CASCADE;
DROP TABLE IF EXISTS public.calendar_tokens CASCADE;
