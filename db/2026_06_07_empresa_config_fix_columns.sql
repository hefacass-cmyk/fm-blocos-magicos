-- Garante todas as colunas de empresa_config (idempotente)
alter table public.empresa_config
  add column if not exists razao_social text,
  add column if not exists cnpj text,
  add column if not exists endereco text,
  add column if not exists representante_nome text,
  add column if not exists representante_cpf text,
  add column if not exists representante_rg text,
  add column if not exists representante_estado_civil text,
  add column if not exists representante_profissao text,
  add column if not exists representante_nascimento date,
  add column if not exists representante_endereco text,
  add column if not exists responsavel_tecnico text,
  add column if not exists crea text,
  add column if not exists pix_chave text,
  add column if not exists logo_url text,
  add column if not exists assinatura_fm_default text,
  add column if not exists atualizado_em timestamptz not null default now();

notify pgrst, 'reload schema';