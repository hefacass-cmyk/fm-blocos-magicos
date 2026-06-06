-- ============================================================
-- F&M — Extensão da tabela leads_indicacao para o formulário
-- /vamos-construir
-- Execute manualmente no SQL Editor do Supabase
-- ============================================================

-- 1) Permitir origem = 'site' (além de parceiro/fornecedor)
alter table public.leads_indicacao
  drop constraint if exists leads_indicacao_origem_check;
alter table public.leads_indicacao
  add constraint leads_indicacao_origem_check
  check (origem in ('parceiro','fornecedor','site'));

-- 2) Novas colunas usadas pelo formulário "Vamos Construir"
alter table public.leads_indicacao
  add column if not exists nome text,
  add column if not exists email text,
  add column if not exists telefone text,
  add column if not exists whatsapp text,
  add column if not exists cidade text,
  add column if not exists estado text,
  add column if not exists rua text,
  add column if not exists tipo_imovel text,
  add column if not exists area_m2 numeric,
  add column if not exists tipo_obra text[],
  add column if not exists projeto_arquitetonico boolean default false,
  add column if not exists sistema_interesse text,
  add column if not exists observacoes text,
  add column if not exists convertido boolean default false;