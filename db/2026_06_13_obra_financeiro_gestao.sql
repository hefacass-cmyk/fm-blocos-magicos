-- Migração: ajustes para a página /admin/obras/[clienteId] (Gestão da Obra)
-- Idempotente.
-- Rodar em: https://supabase.com/dashboard/project/hdjlwidfnikbahfhrkil/sql/new

-- ============================================================
-- 1) Campos de orçamento na tabela clientes
-- ============================================================
alter table public.clientes
  add column if not exists orcado_mo numeric default 0,
  add column if not exists orcado_material numeric default 0,
  add column if not exists orcado_extras numeric default 0;

-- ============================================================
-- 2) Campos novos em obra_financeiro
--    tipo: 'mo' | 'material' | 'extra'
--    loja: nome do fornecedor / loja (somente material)
-- ============================================================
alter table public.obra_financeiro
  add column if not exists tipo text,
  add column if not exists loja text,
  add column if not exists data date;

create index if not exists obra_financeiro_cliente_tipo_idx
  on public.obra_financeiro (cliente_id, tipo, data desc);

-- ============================================================
-- 3) Garantir tabela obra_fotos (já existe). Coluna descricao p/ relatórios semanais
-- ============================================================
alter table public.obra_fotos
  add column if not exists data date,
  add column if not exists descricao text;

-- ============================================================
-- 4) Empresa_config — colunas usadas pelo gerente da obra
-- ============================================================
alter table public.empresa_config
  add column if not exists gerente_nome text,
  add column if not exists gerente_whatsapp text,
  add column if not exists gerente_telefone text;