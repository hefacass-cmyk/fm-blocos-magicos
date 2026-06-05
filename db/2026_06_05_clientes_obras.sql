-- Migração para a seção de Clientes / Obras do painel admin.
-- Idempotente: pode ser rodada várias vezes sem erro.
-- Rodar no SQL Editor:
-- https://supabase.com/dashboard/project/hdjlwidfnikbahfhrkil/sql/new

-- ============================================================
-- 1) Tabela clientes
-- ============================================================
create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.clientes
  add column if not exists codigo_cliente text,
  add column if not exists tipo_pessoa text,
  add column if not exists cpf_cnpj text,
  add column if not exists nome text,
  add column if not exists telefone text,
  add column if not exists whatsapp text,
  add column if not exists email text,
  add column if not exists cep text,
  add column if not exists rua text,
  add column if not exists numero text,
  add column if not exists bairro text,
  add column if not exists cidade text,
  add column if not exists estado text,
  add column if not exists obra_nome text,
  add column if not exists obra_tipo text,
  add column if not exists area_m2 numeric,
  add column if not exists data_inicio date,
  add column if not exists data_termino date,
  add column if not exists obra_status text,
  add column if not exists progresso int default 0,
  add column if not exists profissionais_canteiro int default 0,
  add column if not exists parceiro_id uuid,
  add column if not exists camera_url text,
  add column if not exists observacoes text,
  add column if not exists gerente_nome text default 'Hélder Souza',
  add column if not exists gerente_cargo text default 'Engenheiro responsável',
  add column if not exists gerente_whatsapp text default '71999454343';

create unique index if not exists clientes_codigo_cliente_idx
  on public.clientes (codigo_cliente);

grant select, insert, update, delete on public.clientes to anon, authenticated;
grant all on public.clientes to service_role;

alter table public.clientes enable row level security;
drop policy if exists "clientes select" on public.clientes;
create policy "clientes select" on public.clientes for select to anon, authenticated using (true);
drop policy if exists "clientes insert" on public.clientes;
create policy "clientes insert" on public.clientes for insert to anon, authenticated with check (true);
drop policy if exists "clientes update" on public.clientes;
create policy "clientes update" on public.clientes for update to anon, authenticated using (true) with check (true);
drop policy if exists "clientes delete" on public.clientes;
create policy "clientes delete" on public.clientes for delete to anon, authenticated using (true);

-- ============================================================
-- 2) obra_atualizacoes
-- ============================================================
create table if not exists public.obra_atualizacoes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  titulo text,
  descricao text,
  profissionais_canteiro int default 0,
  data date default current_date,
  criado_em timestamptz not null default now()
);
create index if not exists obra_atualizacoes_cliente_idx on public.obra_atualizacoes (cliente_id, data desc);
grant select, insert, update, delete on public.obra_atualizacoes to anon, authenticated;
grant all on public.obra_atualizacoes to service_role;
alter table public.obra_atualizacoes enable row level security;
drop policy if exists "obra_atu all" on public.obra_atualizacoes;
create policy "obra_atu all" on public.obra_atualizacoes for all to anon, authenticated using (true) with check (true);

-- ============================================================
-- 3) obra_etapas
-- ============================================================
create table if not exists public.obra_etapas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  nome text,
  data_inicio date,
  data_fim date,
  status text default 'pendente',
  ordem int default 0,
  criado_em timestamptz not null default now()
);
create index if not exists obra_etapas_cliente_idx on public.obra_etapas (cliente_id, ordem);
grant select, insert, update, delete on public.obra_etapas to anon, authenticated;
grant all on public.obra_etapas to service_role;
alter table public.obra_etapas enable row level security;
drop policy if exists "obra_etapas all" on public.obra_etapas;
create policy "obra_etapas all" on public.obra_etapas for all to anon, authenticated using (true) with check (true);

-- ============================================================
-- 4) obra_fotos
-- ============================================================
create table if not exists public.obra_fotos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  foto_url text not null,
  legenda text,
  semana int,
  criado_em timestamptz not null default now()
);
create index if not exists obra_fotos_cliente_idx on public.obra_fotos (cliente_id, criado_em desc);
grant select, insert, update, delete on public.obra_fotos to anon, authenticated;
grant all on public.obra_fotos to service_role;
alter table public.obra_fotos enable row level security;
drop policy if exists "obra_fotos all" on public.obra_fotos;
create policy "obra_fotos all" on public.obra_fotos for all to anon, authenticated using (true) with check (true);

-- ============================================================
-- 5) obra_documentos
-- ============================================================
create table if not exists public.obra_documentos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  doc_url text not null,
  nome text,
  tipo text default 'outro',
  criado_em timestamptz not null default now()
);
create index if not exists obra_documentos_cliente_idx on public.obra_documentos (cliente_id, criado_em desc);
grant select, insert, update, delete on public.obra_documentos to anon, authenticated;
grant all on public.obra_documentos to service_role;
alter table public.obra_documentos enable row level security;
drop policy if exists "obra_docs all" on public.obra_documentos;
create policy "obra_docs all" on public.obra_documentos for all to anon, authenticated using (true) with check (true);

-- ============================================================
-- 6) Storage bucket público para fotos e documentos
-- ============================================================
insert into storage.buckets (id, name, public)
values ('obra-arquivos', 'obra-arquivos', true)
on conflict (id) do update set public = true;

drop policy if exists "obra-arquivos read" on storage.objects;
create policy "obra-arquivos read" on storage.objects for select to anon, authenticated
  using (bucket_id = 'obra-arquivos');
drop policy if exists "obra-arquivos write" on storage.objects;
create policy "obra-arquivos write" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'obra-arquivos');
drop policy if exists "obra-arquivos update" on storage.objects;
create policy "obra-arquivos update" on storage.objects for update to anon, authenticated
  using (bucket_id = 'obra-arquivos') with check (bucket_id = 'obra-arquivos');
drop policy if exists "obra-arquivos delete" on storage.objects;
create policy "obra-arquivos delete" on storage.objects for delete to anon, authenticated
  using (bucket_id = 'obra-arquivos');