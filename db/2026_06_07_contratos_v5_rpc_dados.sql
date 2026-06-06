create or replace function public.criar_contrato_publico(
  dados jsonb,
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
  v_uuid_in text;
begin
  select coalesce(max((regexp_match(numero, 'FM-(\d+)-'))[1]::int), 0) + 1
    into v_next
  from public.contratos
  where numero ilike 'FM-%-' || v_ano::text;

  v_numero := 'FM-' || lpad(v_next::text, 3, '0') || '-' || v_ano::text;
  v_token := gen_random_uuid();

  v_uuid_in := nullif(dados->>'parceiro_indicador_id', '');
  if v_uuid_in is not null then
    begin
      v_parceiro_id := v_uuid_in::uuid::text;
    exception when others then
      v_parceiro_id := null;
    end;
  end if;

  if v_parceiro_id is null and p_parceiro_slug is not null and length(p_parceiro_slug) > 0 then
    begin
      execute 'select id::text from public.parceiros where slug = $1 limit 1'
        into v_parceiro_id using p_parceiro_slug;
    exception when others then
      v_parceiro_id := null;
    end;
  end if;

  begin
    v_tipos := array(select jsonb_array_elements_text(dados->'prospect_tipo_obra'));
  exception when others then
    v_tipos := array[]::text[];
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
    dados->>'prospect_tipo_pessoa', dados->>'prospect_nome', dados->>'prospect_cpf_cnpj', dados->>'prospect_rg',
    dados->>'prospect_nacionalidade', dados->>'prospect_estado_civil', dados->>'prospect_profissao',
    dados->>'prospect_email', dados->>'prospect_telefone', dados->>'prospect_whatsapp',
    dados->>'prospect_cep', dados->>'prospect_rua', dados->>'prospect_numero',
    dados->>'prospect_bairro', dados->>'prospect_cidade', dados->>'prospect_estado',
    dados->>'prospect_conjuge_nome', dados->>'prospect_conjuge_cpf', dados->>'prospect_conjuge_rg',
    dados->>'prospect_conjuge_email', dados->>'prospect_conjuge_telefone',
    dados->>'prospect_conjuge_profissao', dados->>'prospect_conjuge_nacionalidade',
    dados->>'prospect_obra_cep', dados->>'prospect_obra_rua', dados->>'prospect_obra_numero',
    dados->>'prospect_obra_bairro', dados->>'prospect_obra_cidade', dados->>'prospect_obra_estado',
    nullif(dados->>'prospect_tamanho_terreno','')::numeric,
    dados->>'prospect_tipo_terreno',
    nullif(dados->>'prospect_area_construir','')::numeric,
    v_tipos,
    'Construção' = any(v_tipos),
    'Reforma' = any(v_tipos),
    'Ampliação' = any(v_tipos),
    'Casa' = any(v_tipos),
    'Galpão' = any(v_tipos),
    'Prédio' = any(v_tipos),
    'Village' = any(v_tipos) or 'Vilage' = any(v_tipos),
    'Outro' = any(v_tipos),
    dados->>'prospect_sistema_preferido',
    dados->>'prospect_servico_preferido',
    dados->>'prospect_camera_preferida',
    dados->>'prospect_prazo_desejado',
    dados->>'prospect_observacoes',
    coalesce((dados->>'prospect_ja_possui_projeto')::boolean, false),
    coalesce((dados->>'prospect_quer_projeto')::boolean, false)
  )
  returning id, numero, token_cliente into v_id, v_numero, v_token;

  if v_parceiro_id is not null then
    begin
      insert into public.leads_indicacao (origem, parceiro_id, nome_cliente, email_cliente, telefone_cliente, mensagem)
      values (
        'parceiro',
        v_parceiro_id,
        dados->>'prospect_nome',
        dados->>'prospect_email',
        dados->>'prospect_telefone',
        'Solicitação de contrato — protocolo ' || v_numero
      );
    exception when others then
      null;
    end;
  end if;

  return jsonb_build_object('id', v_id, 'numero', v_numero, 'token', v_token);
end;
$$;

grant execute on function public.criar_contrato_publico(jsonb, text) to anon, authenticated;