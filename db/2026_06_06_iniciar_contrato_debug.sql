-- ============================================================
-- F&M — criar_contrato_publico com logs de diagnóstico
-- Idempotente. Rodar no SQL Editor do Supabase.
-- ============================================================

-- 1) Tabela de logs (acesso só via service_role / SQL Editor)
create table if not exists public.criar_contrato_publico_logs (
  id           bigserial primary key,
  criado_em    timestamptz not null default now(),
  etapa        text not null,
  ok           boolean not null default true,
  mensagem     text,
  sqlstate     text,
  parceiro_slug text,
  parceiro_id  text,
  numero       text,
  contrato_id  uuid,
  payload      jsonb
);

alter table public.criar_contrato_publico_logs enable row level security;
-- sem policies => somente service_role enxerga (use SQL Editor para consultar)

-- 2) RPC com logging detalhado em cada etapa
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
  v_sqlstate text;
  v_msg text;
begin
  insert into public.criar_contrato_publico_logs(etapa, parceiro_slug, payload)
    values ('inicio', p_parceiro_slug, p_dados);

  -- ---------- gerar número ----------
  begin
    select coalesce(max((regexp_match(numero, 'FM-(\d+)-'))[1]::int), 0) + 1
      into v_next
    from public.contratos
    where numero ilike 'FM-%-' || v_ano::text;
    v_numero := 'FM-' || lpad(v_next::text, 3, '0') || '-' || v_ano::text;

    insert into public.criar_contrato_publico_logs(etapa, numero)
      values ('numero_gerado', v_numero);
  exception when others then
    get stacked diagnostics v_sqlstate = returned_sqlstate, v_msg = message_text;
    insert into public.criar_contrato_publico_logs(etapa, ok, sqlstate, mensagem)
      values ('numero_erro', false, v_sqlstate, v_msg);
    raise;
  end;

  -- ---------- resolver parceiro ----------
  if p_parceiro_slug is not null and length(p_parceiro_slug) > 0 then
    begin
      execute 'select id::text from public.parceiros where slug = $1 limit 1'
        into v_parceiro_id using p_parceiro_slug;
      insert into public.criar_contrato_publico_logs(etapa, parceiro_slug, parceiro_id)
        values ('parceiro_resolvido', p_parceiro_slug, v_parceiro_id);
    exception when others then
      get stacked diagnostics v_sqlstate = returned_sqlstate, v_msg = message_text;
      v_parceiro_id := null;
      insert into public.criar_contrato_publico_logs(etapa, ok, sqlstate, mensagem, parceiro_slug)
        values ('parceiro_erro_ignorado', false, v_sqlstate, v_msg, p_parceiro_slug);
    end;
  end if;

  -- ---------- insert contrato ----------
  begin
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
      p_dados->>'nome', p_dados->>'cpf_cnpj', p_dados->>'rg',
      p_dados->>'email', p_dados->>'telefone',
      p_dados->>'cep', p_dados->>'rua', p_dados->>'numero',
      p_dados->>'bairro', p_dados->>'cidade', p_dados->>'estado'
    )
    returning id, numero, token_cliente into v_id, v_numero, v_token;

    insert into public.criar_contrato_publico_logs(etapa, numero, contrato_id)
      values ('contrato_inserido', v_numero, v_id);
  exception when others then
    get stacked diagnostics v_sqlstate = returned_sqlstate, v_msg = message_text;
    insert into public.criar_contrato_publico_logs(etapa, ok, sqlstate, mensagem, numero, payload)
      values ('contrato_insert_erro', false, v_sqlstate, v_msg, v_numero, p_dados);
    raise exception 'criar_contrato_publico/insert: % (%)', v_msg, v_sqlstate;
  end;

  -- ---------- lead de indicação ----------
  if v_parceiro_id is not null then
    begin
      insert into public.leads_indicacao (origem, parceiro_id, nome_cliente, email_cliente, telefone_cliente, mensagem)
      values ('parceiro', v_parceiro_id, p_dados->>'nome', p_dados->>'email', p_dados->>'telefone',
              'Solicitação de contrato — protocolo ' || v_numero);
      insert into public.criar_contrato_publico_logs(etapa, numero, parceiro_id)
        values ('lead_criado', v_numero, v_parceiro_id);
    exception when others then
      get stacked diagnostics v_sqlstate = returned_sqlstate, v_msg = message_text;
      insert into public.criar_contrato_publico_logs(etapa, ok, sqlstate, mensagem, numero, parceiro_id)
        values ('lead_erro_ignorado', false, v_sqlstate, v_msg, v_numero, v_parceiro_id);
    end;
  end if;

  insert into public.criar_contrato_publico_logs(etapa, numero, contrato_id)
    values ('fim_ok', v_numero, v_id);

  return jsonb_build_object('id', v_id, 'numero', v_numero, 'token', v_token);
end;
$$;

grant execute on function public.criar_contrato_publico(jsonb, text) to anon, authenticated;

-- ============================================================
-- Consultas úteis para diagnóstico (rodar separadamente):
--   select * from public.criar_contrato_publico_logs order by id desc limit 30;
--   select etapa, ok, sqlstate, mensagem, criado_em
--     from public.criar_contrato_publico_logs
--     where ok = false order by id desc;
-- ============================================================
