-- ============================================================
-- Fluxo de Contrato em 5 etapas — adiciona coluna observacoes_cliente
-- Status é text livre, então novos valores funcionam sem migração de enum.
-- Novos valores em uso:
--   dados_cliente_enviados | aguardando_revisao | em_revisao | assinado_cliente
-- ============================================================

alter table public.contratos
  add column if not exists observacoes_cliente text;

-- (Re)garantir grants/RLS já permissivos
grant select, insert, update, delete on public.contratos to anon, authenticated;
grant all on public.contratos to service_role;