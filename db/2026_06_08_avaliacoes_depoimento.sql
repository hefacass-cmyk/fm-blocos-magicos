-- Add optional testimonial + contact fields to avaliacoes
ALTER TABLE public.avaliacoes
  ADD COLUMN IF NOT EXISTS depoimento text,
  ADD COLUMN IF NOT EXISTS telefone_avaliador text,
  ADD COLUMN IF NOT EXISTS email_avaliador text,
  ADD COLUMN IF NOT EXISTS cidade_avaliador text;