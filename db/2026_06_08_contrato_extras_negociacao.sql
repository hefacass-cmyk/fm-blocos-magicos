-- Campos para a etapa final da proposta F&M:
--   - forma de pagamento (texto livre, com default sugerido)
--   - itens extras incluídos na negociação (texto livre)
--   - serviços extras conhecidos (booleano + valor)
--   - extras "outros" como texto livre

alter table public.contratos
  add column if not exists forma_pagamento text,
  add column if not exists itens_negociacao text,
  add column if not exists extra_seguro_obra boolean default false,
  add column if not exists valor_seguro_obra numeric,
  add column if not exists extra_readequacao_ferragem boolean default false,
  add column if not exists valor_readequacao_ferragem numeric,
  add column if not exists extra_carta_tecnica boolean default false,
  add column if not exists valor_carta_tecnica numeric,
  add column if not exists extra_quantitativo_blocos boolean default false,
  add column if not exists valor_quantitativo_blocos numeric,
  add column if not exists extras_outros text;

grant select, insert, update, delete on public.contratos to anon, authenticated;
grant all on public.contratos to service_role;
