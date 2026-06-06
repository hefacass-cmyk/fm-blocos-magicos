create or replace function public.get_contrato_publico(p_token text)
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare r public.contratos;
begin
  select * into r
  from public.contratos
  where token_cliente::text = p_token
     or id::text = p_token;
  if not found then return null; end if;
  return to_jsonb(r) - 'token_cliente' - 'cliente_id' - 'parceiro_indicador_id';
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
  select * into r
  from public.contratos
  where token_cliente::text = p_token
     or id::text = p_token;
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
  where token_cliente::text = p_token
     or id::text = p_token;

  return jsonb_build_object('ok', true);
end $$;

grant execute on function public.assinar_contrato_publico(text, jsonb, text) to anon, authenticated;