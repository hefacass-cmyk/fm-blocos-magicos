-- Tabela usada por fm-password.ts, fm-tracking.ts, admin.dashboard.tsx
-- e admin.auditoria-emails.tsx para registrar eventos administrativos
-- (incluindo as tentativas do fluxo "Esqueci a senha").
--
-- Rodar no SQL Editor do Supabase: https://supabase.com/dashboard/project/hdjlwidfnikbahfhrkil/sql/new

create table if not exists public.logs_admin (
  id          uuid primary key default gen_random_uuid(),
  tipo        text not null,
  descricao   text not null,
  origem      text,
  criado_em   timestamptz not null default now()
);

create index if not exists logs_admin_criado_em_idx
  on public.logs_admin (criado_em desc);

create index if not exists logs_admin_origem_idx
  on public.logs_admin (origem);

-- GRANTs (PostgREST exige explicitamente)
grant select, insert on public.logs_admin to anon, authenticated;
grant all          on public.logs_admin to service_role;

-- RLS
alter table public.logs_admin enable row level security;

-- Insert público: o fluxo "Esqueci a senha" precisa registrar tentativas
-- antes do usuário estar autenticado. Sem PII sensível na descrição
-- (apenas email e ids já tratados pelo app).
drop policy if exists "logs_admin insert publico" on public.logs_admin;
create policy "logs_admin insert publico"
  on public.logs_admin
  for insert
  to anon, authenticated
  with check (true);

-- Select público: a tela /admin/auditoria-emails é protegida por
-- "Chave Mestra" no front (admin.login). A leitura via fmSupabase
-- precisa funcionar com a publishable key.
-- Se preferir restringir, troque por uma policy que valide um claim
-- ou mova a leitura para um serverFn com service_role.
drop policy if exists "logs_admin select publico" on public.logs_admin;
create policy "logs_admin select publico"
  on public.logs_admin
  for select
  to anon, authenticated
  using (true);