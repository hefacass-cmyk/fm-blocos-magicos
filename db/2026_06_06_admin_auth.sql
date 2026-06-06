-- Admin Auth + RLS hardening dos contratos
-- Rodar no SQL Editor: https://supabase.com/dashboard/project/hdjlwidfnikbahfhrkil/sql/new
-- Idempotente.

-- ============================================================
-- 1) Roles
-- ============================================================
do $$ begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin');
  end if;
end $$;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  criado_em timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

drop policy if exists "user_roles self select" on public.user_roles;
create policy "user_roles self select"
  on public.user_roles for select to authenticated
  using (auth.uid() = user_id);

-- has_role: security definer evita recursão em policies
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.has_role(auth.uid(), 'admin'::public.app_role)
$$;

grant execute on function public.has_role(uuid, public.app_role) to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- ============================================================
-- 2) RLS dos contratos: apenas admin para tudo (anon bloqueado)
-- ============================================================
drop policy if exists "contratos all" on public.contratos;
drop policy if exists "contratos admin all" on public.contratos;
create policy "contratos admin all" on public.contratos
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "contratos_aditivos all" on public.contratos_aditivos;
drop policy if exists "contratos_aditivos admin all" on public.contratos_aditivos;
create policy "contratos_aditivos admin all" on public.contratos_aditivos
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "obra_financeiro all" on public.obra_financeiro;
drop policy if exists "obra_financeiro admin all" on public.obra_financeiro;
create policy "obra_financeiro admin all" on public.obra_financeiro
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- 3) RPCs públicas para o cliente via token
-- ============================================================
-- Retorna apenas campos não-sensíveis do contrato pelo token.
create or replace function public.get_contrato_publico(p_token uuid)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare r public.contratos;
begin
  select * into r from public.contratos where token_cliente = p_token;
  if not found then return null; end if;
  return jsonb_build_object(
    'id', r.id,
    'numero', r.numero,
    'status', r.status,
    'sistema_construtivo', r.sistema_construtivo,
    'tipo_servico', r.tipo_servico,
    'area_m2', r.area_m2,
    'valor_m2', r.valor_m2,
    'plano_camera', r.plano_camera,
    'valor_camera', r.valor_camera,
    'databook_eletronico', r.databook_eletronico,
    'data_inicio', r.data_inicio,
    'prazo_dias', r.prazo_dias,
    'data_previsao_fim', r.data_previsao_fim,
    'valor_servico', r.valor_servico,
    'valor_databook', r.valor_databook,
    'valor_total', r.valor_total,
    'valor_adiantamento', r.valor_adiantamento,
    'observacoes', r.observacoes,
    'gerente_nome', r.gerente_nome,
    'gerente_cargo', r.gerente_cargo,
    'gerente_whatsapp', r.gerente_whatsapp,
    'responsavel_tecnico', r.responsavel_tecnico,
    'crea', r.crea,
    'cliente_nome', r.cliente_nome,
    'cliente_cpf_cnpj', r.cliente_cpf_cnpj,
    'cliente_rg', r.cliente_rg,
    'cliente_email', r.cliente_email,
    'cliente_telefone', r.cliente_telefone,
    'cliente_cep', r.cliente_cep,
    'cliente_rua', r.cliente_rua,
    'cliente_numero', r.cliente_numero,
    'cliente_bairro', r.cliente_bairro,
    'cliente_cidade', r.cliente_cidade,
    'cliente_estado', r.cliente_estado,
    'assinatura_cliente', r.assinatura_cliente,
    'assinatura_cliente_data', r.assinatura_cliente_data,
    'assinatura_fm', r.assinatura_fm,
    'assinatura_fm_data', r.assinatura_fm_data
  );
end $$;

grant execute on function public.get_contrato_publico(uuid) to anon, authenticated;

-- Cliente assina: grava dados pessoais + assinatura. Bloqueia se já assinado.
create or replace function public.assinar_contrato_publico(
  p_token uuid,
  p_dados jsonb,
  p_assinatura text
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare r public.contratos;
begin
  select * into r from public.contratos where token_cliente = p_token;
  if not found then raise exception 'contrato_nao_encontrado'; end if;
  if r.assinatura_cliente is not null then raise exception 'ja_assinado'; end if;
  if p_assinatura is null or length(p_assinatura) < 50 then raise exception 'assinatura_invalida'; end if;

  update public.contratos set
    cliente_nome     = coalesce(p_dados->>'cliente_nome',     cliente_nome),
    cliente_cpf_cnpj = coalesce(p_dados->>'cliente_cpf_cnpj', cliente_cpf_cnpj),
    cliente_rg       = coalesce(p_dados->>'cliente_rg',       cliente_rg),
    cliente_email    = coalesce(p_dados->>'cliente_email',    cliente_email),
    cliente_telefone = coalesce(p_dados->>'cliente_telefone', cliente_telefone),
    cliente_cep      = coalesce(p_dados->>'cliente_cep',      cliente_cep),
    cliente_rua      = coalesce(p_dados->>'cliente_rua',      cliente_rua),
    cliente_numero   = coalesce(p_dados->>'cliente_numero',   cliente_numero),
    cliente_bairro   = coalesce(p_dados->>'cliente_bairro',   cliente_bairro),
    cliente_cidade   = coalesce(p_dados->>'cliente_cidade',   cliente_cidade),
    cliente_estado   = coalesce(p_dados->>'cliente_estado',   cliente_estado),
    assinatura_cliente = p_assinatura,
    assinatura_cliente_data = now(),
    status = 'aguardando_fm',
    atualizado_em = now()
  where token_cliente = p_token;

  return jsonb_build_object('ok', true);
end $$;

grant execute on function public.assinar_contrato_publico(uuid, jsonb, text) to anon, authenticated;