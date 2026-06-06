-- ============================================================
-- F&M Contratos v2: empresa_config + novas colunas prospect
-- Idempotente. Rodar no SQL Editor do Supabase.
-- ============================================================

-- 1) empresa_config (singleton — 1 linha)
create table if not exists public.empresa_config (
  id uuid primary key default gen_random_uuid(),
  razao_social text,
  cnpj text,
  endereco text,
  representante_nome text,
  representante_cpf text,
  representante_rg text,
  representante_estado_civil text,
  representante_profissao text,
  representante_nascimento date,
  representante_endereco text,
  responsavel_tecnico text,
  crea text,
  pix_chave text,
  logo_url text,
  assinatura_fm_default text,
  atualizado_em timestamptz not null default now()
);

grant select on public.empresa_config to anon, authenticated;
grant all on public.empresa_config to service_role;
grant update, insert on public.empresa_config to authenticated;
alter table public.empresa_config enable row level security;
drop policy if exists "empresa_config read" on public.empresa_config;
create policy "empresa_config read" on public.empresa_config for select to anon, authenticated using (true);
drop policy if exists "empresa_config write" on public.empresa_config;
create policy "empresa_config write" on public.empresa_config for all to authenticated using (true) with check (true);

-- seed (apenas se vazio)
insert into public.empresa_config (
  razao_social, cnpj, endereco,
  representante_nome, representante_cpf, representante_rg,
  representante_estado_civil, representante_profissao, representante_nascimento,
  representante_endereco, responsavel_tecnico, crea, pix_chave
)
select
  'F&M Construções Inteligentes',
  '21.560.948/0001-71',
  'Alameda Via Parque, S/N, Lote GS 09, Jauá, Camaçari/BA',
  'Hélder Fabrício Lima de Souza',
  '790.955.695-00',
  '06458431-30',
  'Casado',
  'Empresário',
  '1979-11-03'::date,
  'Alameda Via Parque, S/N, Lote GS 09, Jauá, Camaçari/BA',
  'Eng. Francisco A. P. Jr.',
  '38.135-D/BA',
  '21.560.948/0001-71'
where not exists (select 1 from public.empresa_config);

-- 2) Novas colunas em contratos
alter table public.contratos
  add column if not exists prospect_whatsapp text,
  add column if not exists prospect_tipo_obra text[],
  add column if not exists prospect_sistema_preferido text,
  add column if not exists prospect_servico_preferido text,
  add column if not exists prospect_camera_preferida text,
  add column if not exists prospect_conjuge_assinatura text,
  add column if not exists prospect_conjuge_assinatura_data timestamptz;

-- 3) Atualiza RPC criar_contrato_publico para preencher os novos campos
create or replace function public.criar_contrato_publico(
  p_dados jsonb,
  p_parceiro_slug text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_numero text;
  v_token uuid;
  v_ano int := extract(year from now())::int;
  v_next int;
  v_parceiro_id text;
  v_tipos text[];
begin
  select coalesce(max((regexp_match(numero, 'FM-(\d+)-'))[1]::int), 0) + 1
    into v_next
  from public.contratos
  where numero ilike 'FM-%-' || v_ano::text;
  v_numero := 'FM-' || lpad(v_next::text, 3, '0') || '-' || v_ano::text;

  if p_parceiro_slug is not null and length(p_parceiro_slug) > 0 then
    begin
      execute 'select id::text from public.parceiros where slug = $1 limit 1'
        into v_parceiro_id using p_parceiro_slug;
    exception when others then v_parceiro_id := null;
    end;
  end if;

  -- tipo_obra: aceita array (novo) ou booleans (compat)
  begin
    v_tipos := array(select jsonb_array_elements_text(p_dados->'tipo_obra'));
  exception when others then v_tipos := array[]::text[];
  end;
  if coalesce(array_length(v_tipos,1),0) = 0 then
    v_tipos := array_remove(array[
      case when (p_dados->>'tipo_obra_construcao')::boolean then 'Construção' end,
      case when (p_dados->>'tipo_obra_reforma')::boolean    then 'Reforma' end,
      case when (p_dados->>'tipo_obra_ampliacao')::boolean  then 'Ampliação' end
    ], null);
  end if;

  insert into public.contratos (
    numero, status, token_cliente, parceiro_indicador_id,
    prospect_tipo_pessoa, prospect_nome, prospect_cpf_cnpj, prospect_rg,
    prospect_nacionalidade, prospect_estado_civil, prospect_profissao,
    prospect_email, prospect_telefone, prospect_whatsapp,
    prospect_cep, prospect_rua, prospect_numero, prospect_bairro, prospect_cidade, prospect_estado,
    prospect_conjuge_nome, prospect_conjuge_cpf, prospect_conjuge_rg,
    prospect_conjuge_email, prospect_conjuge_telefone,
    prospect_conjuge_profissao, prospect_conjuge_nacionalidade,
    prospect_obra_cep, prospect_obra_rua, prospect_obra_numero,
    prospect_obra_bairro, prospect_obra_cidade, prospect_obra_estado,
    prospect_tamanho_terreno, prospect_tipo_terreno, prospect_area_construir,
    prospect_tipo_obra,
    prospect_tipo_obra_construcao, prospect_tipo_obra_reforma, prospect_tipo_obra_ampliacao,
    prospect_sistema, prospect_servico, prospect_plano_camera,
    prospect_sistema_preferido, prospect_servico_preferido, prospect_camera_preferida,
    prospect_prazo_desejado, prospect_observacoes,
    cliente_nome, cliente_cpf_cnpj, cliente_rg, cliente_email, cliente_telefone,
    cliente_cep, cliente_rua, cliente_numero, cliente_bairro, cliente_cidade, cliente_estado
  ) values (
    v_numero, 'rascunho', gen_random_uuid(), v_parceiro_id,
    p_dados->>'tipo_pessoa', p_dados->>'nome', p_dados->>'cpf_cnpj', p_dados->>'rg',
    p_dados->>'nacionalidade', p_dados->>'estado_civil', p_dados->>'profissao',
    p_dados->>'email', p_dados->>'telefone', coalesce(p_dados->>'whatsapp', p_dados->>'telefone'),
    p_dados->>'cep', p_dados->>'rua', p_dados->>'numero', p_dados->>'bairro', p_dados->>'cidade', p_dados->>'estado',
    p_dados->>'conjuge_nome', p_dados->>'conjuge_cpf', p_dados->>'conjuge_rg',
    p_dados->>'conjuge_email', p_dados->>'conjuge_telefone',
    p_dados->>'conjuge_profissao', p_dados->>'conjuge_nacionalidade',
    p_dados->>'obra_cep', p_dados->>'obra_rua', p_dados->>'obra_numero',
    p_dados->>'obra_bairro', p_dados->>'obra_cidade', p_dados->>'obra_estado',
    nullif(p_dados->>'tamanho_terreno','')::numeric,
    p_dados->>'tipo_terreno',
    nullif(p_dados->>'area_construir','')::numeric,
    v_tipos,
    'Construção' = any(v_tipos),
    'Reforma' = any(v_tipos),
    'Ampliação' = any(v_tipos),
    p_dados->>'sistema', p_dados->>'servico', p_dados->>'plano_camera',
    coalesce(p_dados->>'sistema_preferido', p_dados->>'sistema'),
    coalesce(p_dados->>'servico_preferido', p_dados->>'servico'),
    coalesce(p_dados->>'camera_preferida', p_dados->>'plano_camera'),
    p_dados->>'prazo_desejado', p_dados->>'observacoes',
    p_dados->>'nome', p_dados->>'cpf_cnpj', p_dados->>'rg',
    p_dados->>'email', p_dados->>'telefone',
    p_dados->>'cep', p_dados->>'rua', p_dados->>'numero',
    p_dados->>'bairro', p_dados->>'cidade', p_dados->>'estado'
  )
  returning id, numero, token_cliente into v_id, v_numero, v_token;

  if v_parceiro_id is not null then
    begin
      insert into public.leads_indicacao (origem, parceiro_id, nome_cliente, email_cliente, telefone_cliente, mensagem)
      values ('parceiro', v_parceiro_id, p_dados->>'nome', p_dados->>'email', p_dados->>'telefone',
              'Solicitação de contrato — protocolo ' || v_numero);
    exception when others then null;
    end;
  end if;

  return jsonb_build_object('id', v_id, 'numero', v_numero, 'token', v_token);
end;
$$;

grant execute on function public.criar_contrato_publico(jsonb, text) to anon, authenticated;