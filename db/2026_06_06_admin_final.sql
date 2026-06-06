-- ============================================================
-- F&M — Ajustes finais admin (storage, colunas, RPC opcional)
-- Idempotente. Rodar no SQL Editor do Supabase.
-- ============================================================

-- 1) Colunas usadas pelo painel
alter table public.parceiros     add column if not exists foto_perfil text;
alter table public.fornecedores  add column if not exists foto_url    text;
alter table public.obra_financeiro add column if not exists comprovante_url text;
alter table public.obra_financeiro add column if not exists observacao_pagamento text;

-- 2) Buckets
insert into storage.buckets (id, name, public)
  values ('comprovantes-pagamento', 'comprovantes-pagamento', false)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('perfil-parceiros', 'perfil-parceiros', true)
  on conflict (id) do update set public = true;

-- 3) Policies de storage.objects (idempotentes)
do $$
begin
  -- perfil-parceiros: leitura pública
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='perfil_parceiros_public_read') then
    create policy perfil_parceiros_public_read on storage.objects
      for select to anon, authenticated
      using (bucket_id = 'perfil-parceiros');
  end if;

  -- perfil-parceiros: gravação autenticada (parceiro/admin)
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='perfil_parceiros_auth_write') then
    create policy perfil_parceiros_auth_write on storage.objects
      for insert to authenticated
      with check (bucket_id = 'perfil-parceiros');
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='perfil_parceiros_auth_update') then
    create policy perfil_parceiros_auth_update on storage.objects
      for update to authenticated
      using (bucket_id = 'perfil-parceiros');
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='perfil_parceiros_anon_write') then
    -- parceiro/cliente sem login Supabase também precisa subir foto via fluxo público
    create policy perfil_parceiros_anon_write on storage.objects
      for insert to anon
      with check (bucket_id = 'perfil-parceiros');
  end if;

  -- comprovantes-pagamento: somente authenticated lê/escreve (admin opera autenticado)
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='comprovantes_auth_read') then
    create policy comprovantes_auth_read on storage.objects
      for select to authenticated
      using (bucket_id = 'comprovantes-pagamento');
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='comprovantes_auth_write') then
    create policy comprovantes_auth_write on storage.objects
      for insert to authenticated
      with check (bucket_id = 'comprovantes-pagamento');
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='comprovantes_auth_update') then
    create policy comprovantes_auth_update on storage.objects
      for update to authenticated
      using (bucket_id = 'comprovantes-pagamento');
  end if;
  -- O painel admin F&M usa client anon + sessionStorage, então também liberamos anon para o bucket.
  -- Se preferir mais segurança, remova as duas policies abaixo e mude o admin para logar com Supabase Auth.
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='comprovantes_anon_read') then
    create policy comprovantes_anon_read on storage.objects
      for select to anon
      using (bucket_id = 'comprovantes-pagamento');
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='comprovantes_anon_write') then
    create policy comprovantes_anon_write on storage.objects
      for insert to anon
      with check (bucket_id = 'comprovantes-pagamento');
  end if;
end$$;

-- 4) RPC opcional para reenfileirar notificação (mantém compat com botão "Reenviar")
create or replace function public.reenviar_notificacao(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.notificacoes_log
     set status = 'pendente', erro = null, tentativas = coalesce(tentativas, 0) + 1
   where id = p_id;
$$;
grant execute on function public.reenviar_notificacao(uuid) to anon, authenticated;
