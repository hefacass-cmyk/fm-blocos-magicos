-- ============================================================
-- F&M — Página pública /iniciar-contrato
-- Adiciona campos prospect_* em contratos + RPC pública criar_contrato_publico
-- Idempotente. Rodar no SQL Editor do Supabase.
-- ============================================================

-- 1) Campos prospect_* (dados do solicitante antes do contrato F&M)
alter table public.contratos
  add column if not exists parceiro_indicador_id text,
  add column if not exists prospect_tipo_pessoa text,
  add column if not exists prospect_nome text,
  add column if not exists prospect_cpf_cnpj text,
  add column if not exists prospect_rg text,
  add column if not exists prospect_nacionalidade text,
  add column if not exists prospect_estado_civil text,
  add column if not exists prospect_profissao text,
  add column if not exists prospect_email text,
  add column if not exists prospect_telefone text,
  add column if not exists prospect_cep text,
  add column if not exists prospect_rua text,
  add column if not exists prospect_numero text,
  add column if not exists prospect_bairro text,
  add column if not exists prospect_cidade text,
  add column if not exists prospect_estado text,
  add column if not exists prospect_conjuge_nome text,
  add column if not exists prospect_conjuge_cpf text,
  add column if not exists prospect_conjuge_rg text,
  add column if not exists prospect_conjuge_email text,
  add column if not exists prospect_conjuge_telefone text,
  add column if not exists prospect_conjuge_profissao text,
  add column if not exists prospect_conjuge_nacionalidade text,
  add column if not exists prospect_obra_cep text,
  add column if not exists prospect_obra_rua text,
  add column if not exists prospect_obra_numero text,
  add column if not exists prospect_obra_bairro text,
  add column if not exists prospect_obra_cidade text,
  add column if not exists prospect_obra_estado text,
  add column if not exists prospect_tamanho_terreno numeric,
  add column if not exists prospect_tipo_terreno text,
  add column if not exists prospect_area_construir numeric,
  add column if not exists prospect_tipo_obra_construcao boolean default false,
  add column if not exists prospect_tipo_obra_reforma boolean default false,
  add column if not exists prospect_tipo_obra_ampliacao boolean default false,
  add column if not exists prospect_sistema text,
  add column if not exists prospect_servico text,
  add column if not exists prospect_plano_camera text,
  add column if not exists prospect_prazo_desejado text,
  add column if not exists prospect_observacoes text;

-- 2) RPC pública: cria contrato em rascunho a partir do formulário público
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
begin
  -- gera próximo número FM-XXX-YYYY
  select coalesce(max((regexp_match(numero, 'FM-(\d+)-'))[1]::int), 0) + 1
    into v_next
  from public.contratos
  where numero ilike 'FM-%-' || v_ano::text;
  v_numero := 'FM-' || lpad(v_next::text, 3, '0') || '-' || v_ano::text;

  -- resolve parceiro pelo slug (best-effort; ignora se tabela/coluna não existir)
  if p_parceiro_slug is not null and length(p_parceiro_slug) > 0 then
    begin
      execute 'select id::text from public.parceiros where slug = $1 limit 1'
        into v_parceiro_id using p_parceiro_slug;
    exception when others then v_parceiro_id := null;
    end;
  end if;

  insert into public.contratos (
    numero, status, token_cliente, parceiro_indicador_id,
    prospect_tipo_pessoa, prospect_nome, prospect_cpf_cnpj, prospect_rg,
    prospect_nacionalidade, prospect_estado_civil, prospect_profissao,
    prospect_email, prospect_telefone,
    prospect_cep, prospect_rua, prospect_numero, prospect_bairro, prospect_cidade, prospect_estado,
    prospect_conjuge_nome, prospect_conjuge_cpf, prospect_conjuge_rg,
    prospect_conjuge_email, prospect_conjuge_telefone,
    prospect_conjuge_profissao, prospect_conjuge_nacionalidade,
    prospect_obra_cep, prospect_obra_rua, prospect_obra_numero,
    prospect_obra_bairro, prospect_obra_cidade, prospect_obra_estado,
    prospect_tamanho_terreno, prospect_tipo_terreno, prospect_area_construir,
    prospect_tipo_obra_construcao, prospect_tipo_obra_reforma, prospect_tipo_obra_ampliacao,
    prospect_sistema, prospect_servico, prospect_plano_camera,
    prospect_prazo_desejado, prospect_observacoes,
    cliente_nome, cliente_cpf_cnpj, cliente_rg, cliente_email, cliente_telefone,
    cliente_cep, cliente_rua, cliente_numero, cliente_bairro, cliente_cidade, cliente_estado
  ) values (
    v_numero, 'rascunho', gen_random_uuid(), v_parceiro_id,
    p_dados->>'tipo_pessoa', p_dados->>'nome', p_dados->>'cpf_cnpj', p_dados->>'rg',
    p_dados->>'nacionalidade', p_dados->>'estado_civil', p_dados->>'profissao',
    p_dados->>'email', p_dados->>'telefone',
    p_dados->>'cep', p_dados->>'rua', p_dados->>'numero', p_dados->>'bairro', p_dados->>'cidade', p_dados->>'estado',
    p_dados->>'conjuge_nome', p_dados->>'conjuge_cpf', p_dados->>'conjuge_rg',
    p_dados->>'conjuge_email', p_dados->>'conjuge_telefone',
    p_dados->>'conjuge_profissao', p_dados->>'conjuge_nacionalidade',
    p_dados->>'obra_cep', p_dados->>'obra_rua', p_dados->>'obra_numero',
    p_dados->>'obra_bairro', p_dados->>'obra_cidade', p_dados->>'obra_estado',
    nullif(p_dados->>'tamanho_terreno','')::numeric,
    p_dados->>'tipo_terreno',
    nullif(p_dados->>'area_construir','')::numeric,
    coalesce((p_dados->>'tipo_obra_construcao')::boolean,false),
    coalesce((p_dados->>'tipo_obra_reforma')::boolean,false),
    coalesce((p_dados->>'tipo_obra_ampliacao')::boolean,false),
    p_dados->>'sistema', p_dados->>'servico', p_dados->>'plano_camera',
    p_dados->>'prazo_desejado', p_dados->>'observacoes',
    -- pré-popula cliente_* para o link de assinatura aproveitar
    p_dados->>'nome', p_dados->>'cpf_cnpj', p_dados->>'rg',
    p_dados->>'email', p_dados->>'telefone',
    p_dados->>'cep', p_dados->>'rua', p_dados->>'numero',
    p_dados->>'bairro', p_dados->>'cidade', p_dados->>'estado'
  )
  returning id, numero, token_cliente into v_id, v_numero, v_token;

  -- cria lead de indicação (best-effort)
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