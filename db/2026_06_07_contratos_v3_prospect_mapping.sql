-- ============================================================
-- F&M Contratos v3 — Mapeamento canônico de colunas prospect_*
-- Garante que TODAS as colunas usadas pelo formulário /iniciar-contrato existam
-- e reescreve criar_contrato_publico para inserir SOMENTE estas colunas.
-- Idempotente. Rodar no SQL Editor do Supabase.
-- ============================================================

alter table public.contratos
  add column if not exists prospect_tipo_obra_casa boolean default false,
  add column if not exists prospect_tipo_obra_galpao boolean default false,
  add column if not exists prospect_tipo_obra_predio boolean default false,
  add column if not exists prospect_tipo_obra_village boolean default false,
  add column if not exists prospect_tipo_obra_outro boolean default false,
  add column if not exists prospect_ja_possui_projeto boolean default false,
  add column if not exists prospect_quer_projeto boolean default false;

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
  v_token := gen_random_uuid();

  if p_parceiro_slug is not null and length(p_parceiro_slug) > 0 then
    begin
      execute 'select id::text from public.parceiros where slug = $1 limit 1'
        into v_parceiro_id using p_parceiro_slug;
    exception when others then v_parceiro_id := null;
    end;
  end if;

  begin
    v_tipos := array(select jsonb_array_elements_text(p_dados->'prospect_tipo_obra'));
  exception when others then v_tipos := array[]::text[];
  end;

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
    prospect_tipo_obra_casa, prospect_tipo_obra_galpao, prospect_tipo_obra_predio,
    prospect_tipo_obra_village, prospect_tipo_obra_outro,
    prospect_sistema_preferido, prospect_servico_preferido, prospect_camera_preferida,
    prospect_prazo_desejado, prospect_observacoes,
    prospect_ja_possui_projeto, prospect_quer_projeto
  ) values (
    v_numero, 'rascunho', v_token, v_parceiro_id,
    p_dados->>'prospect_tipo_pessoa', p_dados->>'prospect_nome', p_dados->>'prospect_cpf_cnpj', p_dados->>'prospect_rg',
    p_dados->>'prospect_nacionalidade', p_dados->>'prospect_estado_civil', p_dados->>'prospect_profissao',
    p_dados->>'prospect_email', p_dados->>'prospect_telefone', p_dados->>'prospect_whatsapp',
    p_dados->>'prospect_cep', p_dados->>'prospect_rua', p_dados->>'prospect_numero',
    p_dados->>'prospect_bairro', p_dados->>'prospect_cidade', p_dados->>'prospect_estado',
    p_dados->>'prospect_conjuge_nome', p_dados->>'prospect_conjuge_cpf', p_dados->>'prospect_conjuge_rg',
    p_dados->>'prospect_conjuge_email', p_dados->>'prospect_conjuge_telefone',
    p_dados->>'prospect_conjuge_profissao', p_dados->>'prospect_conjuge_nacionalidade',
    p_dados->>'prospect_obra_cep', p_dados->>'prospect_obra_rua', p_dados->>'prospect_obra_numero',
    p_dados->>'prospect_obra_bairro', p_dados->>'prospect_obra_cidade', p_dados->>'prospect_obra_estado',
    nullif(p_dados->>'prospect_tamanho_terreno','')::numeric,
    p_dados->>'prospect_tipo_terreno',
    nullif(p_dados->>'prospect_area_construir','')::numeric,
    v_tipos,
    'Construção' = any(v_tipos),
    'Reforma'    = any(v_tipos),
    'Ampliação'  = any(v_tipos),
    'Casa'       = any(v_tipos),
    'Galpão'     = any(v_tipos),
    'Prédio'     = any(v_tipos),
    'Village'    = any(v_tipos) or 'Vilage' = any(v_tipos),
    'Outro'      = any(v_tipos),
    p_dados->>'prospect_sistema_preferido',
    p_dados->>'prospect_servico_preferido',
    p_dados->>'prospect_camera_preferida',
    p_dados->>'prospect_prazo_desejado',
    p_dados->>'prospect_observacoes',
    coalesce((p_dados->>'prospect_ja_possui_projeto')::boolean, false),
    coalesce((p_dados->>'prospect_quer_projeto')::boolean, false)
  )
  returning id, numero, token_cliente into v_id, v_numero, v_token;

  if v_parceiro_id is not null then
    begin
      insert into public.leads_indicacao (origem, parceiro_id, nome_cliente, email_cliente, telefone_cliente, mensagem)
      values ('parceiro', v_parceiro_id,
              p_dados->>'prospect_nome',
              p_dados->>'prospect_email',
              p_dados->>'prospect_telefone',
              'Solicitação de contrato — protocolo ' || v_numero);
    exception when others then null;
    end;
  end if;

  return jsonb_build_object('id', v_id, 'numero', v_numero, 'token', v_token);
end;
$$;

grant execute on function public.criar_contrato_publico(jsonb, text) to anon, authenticated;