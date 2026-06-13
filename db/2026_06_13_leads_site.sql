-- F&M — Tabela leads_site (solicitações vindas do site)
create table if not exists public.leads_site (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,
  nome text,
  cpf_cnpj text,
  whatsapp text,
  email text,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists leads_site_tipo_idx on public.leads_site (tipo);
create index if not exists leads_site_created_idx on public.leads_site (created_at desc);

grant select, insert on public.leads_site to anon, authenticated;
grant all on public.leads_site to service_role;

alter table public.leads_site enable row level security;

drop policy if exists "leads_site_insert_publico" on public.leads_site;
create policy "leads_site_insert_publico"
  on public.leads_site for insert
  to anon, authenticated
  with check (true);

drop policy if exists "leads_site_select_publico" on public.leads_site;
create policy "leads_site_select_publico"
  on public.leads_site for select
  to anon, authenticated
  using (true);
