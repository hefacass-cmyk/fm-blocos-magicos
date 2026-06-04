-- ============================================================
-- F&M — Sistema de indicação (slug + leads)
-- Execute manualmente no SQL Editor do Supabase
-- ============================================================

-- 1) Coluna slug em parceiros (se ainda não existir)
alter table public.parceiros
  add column if not exists slug text;
create unique index if not exists parceiros_slug_unique
  on public.parceiros (slug) where slug is not null;

-- 2) Coluna slug em Fornecedores
alter table public."Fornecedores"
  add column if not exists slug text;
create unique index if not exists fornecedores_slug_unique
  on public."Fornecedores" (slug) where slug is not null;

-- 3) Tabela de leads de indicação
create table if not exists public.leads_indicacao (
  id uuid primary key default gen_random_uuid(),
  origem text not null check (origem in ('parceiro','fornecedor')),
  parceiro_id text,
  fornecedor_id text,
  nome_cliente text not null,
  email_cliente text,
  telefone_cliente text,
  mensagem text,
  created_at timestamptz not null default now()
);

create index if not exists leads_indicacao_parceiro_idx
  on public.leads_indicacao (parceiro_id);
create index if not exists leads_indicacao_fornecedor_idx
  on public.leads_indicacao (fornecedor_id);

-- 4) RLS — permite INSERT público (qualquer visitante envia lead)
--    e SELECT pelo dono via filtro no app (anon).
alter table public.leads_indicacao enable row level security;

grant select, insert on public.leads_indicacao to anon, authenticated;
grant all on public.leads_indicacao to service_role;

drop policy if exists "leads_insert_publico" on public.leads_indicacao;
create policy "leads_insert_publico"
  on public.leads_indicacao for insert
  to anon, authenticated
  with check (true);

drop policy if exists "leads_select_publico" on public.leads_indicacao;
create policy "leads_select_publico"
  on public.leads_indicacao for select
  to anon, authenticated
  using (true);