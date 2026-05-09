-- Adiciona coluna `tipo` em conta_attachments para classificar o documento.
-- Valores: nf | recibo | contrato | boleto | comprovante | outro.
-- Default 'outro' preserva anexos antigos.

ALTER TABLE public.conta_attachments
  ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'outro'
    CHECK (tipo IN ('nf','recibo','contrato','boleto','comprovante','outro'));

CREATE INDEX IF NOT EXISTS idx_conta_attachments_tipo
  ON public.conta_attachments(tipo);
