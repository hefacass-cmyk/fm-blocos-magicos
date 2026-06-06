create or replace function public.get_contrato_publico(p_token text)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare r public.contratos;
begin
  select * into r from public.contratos where token_cliente::text = p_token;
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

grant execute on function public.get_contrato_publico(text) to anon, authenticated;

create or replace function public.assinar_contrato_publico(
  p_token text,
  p_dados jsonb,
  p_assinatura text
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare r public.contratos;
begin
  select * into r from public.contratos where token_cliente::text = p_token;
  if not found then raise exception 'contrato_nao_encontrado'; end if;
  if r.assinatura_cliente is not null then raise exception 'ja_assinado'; end if;
  if p_assinatura is null or length(p_assinatura) < 50 then raise exception 'assinatura_invalida'; end if;

  update public.contratos set
    cliente_nome = coalesce(p_dados->>'cliente_nome', cliente_nome),
    cliente_cpf_cnpj = coalesce(p_dados->>'cliente_cpf_cnpj', cliente_cpf_cnpj),
    cliente_rg = coalesce(p_dados->>'cliente_rg', cliente_rg),
    cliente_email = coalesce(p_dados->>'cliente_email', cliente_email),
    cliente_telefone = coalesce(p_dados->>'cliente_telefone', cliente_telefone),
    cliente_cep = coalesce(p_dados->>'cliente_cep', cliente_cep),
    cliente_rua = coalesce(p_dados->>'cliente_rua', cliente_rua),
    cliente_numero = coalesce(p_dados->>'cliente_numero', cliente_numero),
    cliente_bairro = coalesce(p_dados->>'cliente_bairro', cliente_bairro),
    cliente_cidade = coalesce(p_dados->>'cliente_cidade', cliente_cidade),
    cliente_estado = coalesce(p_dados->>'cliente_estado', cliente_estado),
    assinatura_cliente = p_assinatura,
    assinatura_cliente_data = now(),
    status = 'aguardando_fm',
    atualizado_em = now()
  where token_cliente::text = p_token;

  return jsonb_build_object('ok', true);
end $$;

grant execute on function public.assinar_contrato_publico(text, jsonb, text) to anon, authenticated;