-- Migração: contratos, contratos_aditivos, obra_financeiro
-- Idempotente. Rodar no SQL Editor do Supabase.

-- ============================================================
-- 1) contratos
-- ============================================================
create table if not exists public.contratos (
  id uuid primary key default gen_random_uuid(),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.contratos
  add column if not exists cliente_id uuid references public.clientes(id) on delete cascade,
  add column if not exists numero text,
  add column if not exists token_cliente uuid default gen_random_uuid(),
  add column if not exists status text default 'rascunho',
  -- modalidade / tipo
  add column if not exists modalidade_empreitada_mista boolean default false,
  add column if not exists modalidade_empreitada_mo boolean default false,
  add column if not exists modalidade_gerenciamento boolean default false,
  add column if not exists modalidade_ambos boolean default false,
  add column if not exists tipo_construcao boolean default false,
  add column if not exists tipo_reforma boolean default false,
  add column if not exists tipo_ampliacao boolean default false,
  add column if not exists sistema_construtivo text,
  add column if not exists tipo_servico text,
  add column if not exists area_m2 numeric default 0,
  add column if not exists valor_m2 numeric default 0,
  add column if not exists plano_camera text default 'sem_camera',
  add column if not exists valor_camera numeric default 0,
  add column if not exists databook_eletronico boolean default false,
  add column if not exists data_inicio date,
  add column if not exists prazo_dias integer default 0,
  add column if not exists data_previsao_fim date,
  add column if not exists valor_servico numeric default 0,
  add column if not exists valor_databook numeric default 0,
  add column if not exists valor_total numeric default 0,
  add column if not exists valor_adiantamento numeric default 0,
  add column if not exists observacoes text,
  -- equipe F&M
  add column if not exists gerente_nome text default 'Hélder Souza',
  add column if not exists gerente_cargo text default 'Engenheiro responsável',
  add column if not exists gerente_whatsapp text default '71999454343',
  add column if not exists responsavel_tecnico text default 'Eng. Francisco A. P. Jr.',
  add column if not exists crea text default '38.135-D/BA',
  -- dados do cliente preenchidos no link
  add column if not exists cliente_nome text,
  add column if not exists cliente_cpf_cnpj text,
  add column if not exists cliente_rg text,
  add column if not exists cliente_email text,
  add column if not exists cliente_telefone text,
  add column if not exists cliente_cep text,
  add column if not exists cliente_rua text,
  add column if not exists cliente_numero text,
  add column if not exists cliente_bairro text,
  add column if not exists cliente_cidade text,
  add column if not exists cliente_estado text,
  -- assinaturas
  add column if not exists assinatura_cliente text,
  add column if not exists assinatura_cliente_data timestamptz,
  add column if not exists assinatura_fm text,
  add column if not exists assinatura_fm_data timestamptz;

create unique index if not exists contratos_numero_idx on public.contratos (numero);
create unique index if not exists contratos_token_idx on public.contratos (token_cliente);
create index if not exists contratos_cliente_idx on public.contratos (cliente_id);

grant select, insert, update, delete on public.contratos to anon, authenticated;
grant all on public.contratos to service_role;
alter table public.contratos enable row level security;
drop policy if exists "contratos all" on public.contratos;
create policy "contratos all" on public.contratos for all to anon, authenticated using (true) with check (true);

-- ============================================================
-- 2) contratos_aditivos
-- ============================================================
create table if not exists public.contratos_aditivos (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references public.contratos(id) on delete cascade,
  criado_em timestamptz not null default now()
);
alter table public.contratos_aditivos
  add column if not exists descricao text,
  add column if not exists area_m2 numeric default 0,
  add column if not exists valor_m2 numeric default 0,
  add column if not exists valor_total numeric default 0,
  add column if not exists prazo_adicional_dias integer default 0;

create index if not exists contratos_aditivos_contrato_idx on public.contratos_aditivos (contrato_id);
grant select, insert, update, delete on public.contratos_aditivos to anon, authenticated;
grant all on public.contratos_aditivos to service_role;
alter table public.contratos_aditivos enable row level security;
drop policy if exists "contratos_aditivos all" on public.contratos_aditivos;
create policy "contratos_aditivos all" on public.contratos_aditivos for all to anon, authenticated using (true) with check (true);

-- ============================================================
-- 3) obra_financeiro (medições)
-- ============================================================
create table if not exists public.obra_financeiro (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid references public.contratos(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete cascade,
  criado_em timestamptz not null default now()
);
alter table public.obra_financeiro
  add column if not exists semana_referencia date,
  add column if not exists descricao text,
  add column if not exists valor numeric default 0,
  add column if not exists data_vencimento date,
  add column if not exists data_pagamento date,
  add column if not exists status text default 'pendente',
  add column if not exists comprovante_url text;

create index if not exists obra_financeiro_contrato_idx on public.obra_financeiro (contrato_id);
create index if not exists obra_financeiro_cliente_idx on public.obra_financeiro (cliente_id);
grant select, insert, update, delete on public.obra_financeiro to anon, authenticated;
grant all on public.obra_financeiro to service_role;
alter table public.obra_financeiro enable row level security;
drop policy if exists "obra_financeiro all" on public.obra_financeiro;
create policy "obra_financeiro all" on public.obra_financeiro for all to anon, authenticated using (true) with check (true);