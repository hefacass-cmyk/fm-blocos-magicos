## Premissas

- Views `dashboard_admin`, `leads_por_parceiro`, `contratos_pendentes`, `financeiro_resumo` e tabelas `notificacoes_log`, `referral_leads`, `obra_financeiro`, `parceiros`, `fornecedores`, `tabela_precos` já existem no Supabase. Antes de cada query confirmo as colunas reais; se faltar algo crio migration em `db/2026_06_06_admin_final.sql` (idempotente, para você rodar no SQL Editor).
- Buckets `comprovantes-pagamento` e `perfil-parceiros` precisam existir. Se não existirem, eu crio via tool de storage (privado para comprovantes, público para fotos de perfil) e escrevo as policies de RLS em `storage.objects`.
- Toda escrita do parceiro/admin usa client browser autenticado (RLS já existente). Toasts via `sonner`.

## 1. Dashboard admin (`/admin/dashboard`)

- Componente `DashboardResumo` no topo da página, 3 linhas × 4 cards.
- Hook `useQuery(['dashboard_admin'], …, { refetchInterval: 60_000 })` lendo a view `dashboard_admin`.
- Cores via tokens (`bg-primary/10`, `text-emerald-600`, `text-amber-600`, `text-destructive`). Cards pulsantes usam `animate-pulse` quando contagem > 0.
- Cada card é um `<Link>` para a rota correspondente (`/admin/contratos?tab=pendentes`, `/admin/clientes`, `/admin/leads`, `/admin/financeiro`).
- Banners de alerta acima dos cards (item 6): aguardando_fm (azul pulsante), atrasados (vermelho com R$ total), leads >7d (âmbar). Calculo via mesma view + uma chamada extra à `referral_leads`.

## 2. Leads de parceiros (`/admin/leads`)

- Nova rota `src/routes/admin.leads.tsx` + link na navbar admin existente.
- Tabela principal lendo `leads_por_parceiro` (Nome, Cidade/UF, Total, Convertidos, Pendentes, Último Lead). Linha clicável expande (Accordion) com SELECT em `referral_leads` filtrado por parceiro.
- Cada lead pendente tem botão "Converter em Contrato" → `navigate({to:'/iniciar-contrato', search:{lead: lead.id}})`. A página `/iniciar-contrato` passa a aceitar `?lead=…` e pré-preenche nome/telefone/email lendo `referral_leads`.

## 3. Comprovantes de pagamento

- Em `admin.contratos.$id.tsx` (aba Financeiro) e onde existir a listagem de `obra_financeiro`:
  - Botão "Marcar como Pago" abre `<Dialog>` com Datepicker (shadcn), input file e textarea.
  - Upload em `comprovantes-pagamento/<contrato_id>/<lancamento_id>.<ext>`. Salvo o path; gero URL via `createSignedUrl` no botão 👁️.
  - Update em `obra_financeiro`: status='pago', `data_pagamento`, `comprovante_url`, `observacao_pagamento`.
- Helper `statusEfetivo(l)` que vira `'atrasado'` quando `status='pendente' && data_vencimento < hoje`; aplico cor vermelha e badge.

## 4. Fotos de perfil — parceiros e fornecedores

- Componente reutilizável `<FotoPerfilUpload bucket="perfil-parceiros" path={`parceiros/${id}.jpg`} value={url} onChange={…}/>` (preview circular + botão alterar).
- `parceiro.dashboard.tsx`: seção "Minha Foto de Perfil" usando o componente; persiste em `parceiros.foto_perfil`.
- Detalhe admin do parceiro: mesma componente + permissão admin.
- Mesmo componente em fornecedores (bucket idem, coluna `fornecedores.foto_url`).
- Se as colunas `foto_perfil`/`foto_url` não existirem, adiciono na migration.

## 5. "Meus Leads" no dashboard do parceiro

- Nova aba `Tabs` em `parceiro.dashboard.tsx`.
- Lê `leads_por_parceiro` filtrando por `parceiro_id = session.parceiro.id` + lista detalhada em `referral_leads`.
- Card de destaque com `Você já indicou {convertidos} clientes para a F&M! 🎉`.

## 6. Alertas (já cobertos no item 1)

Banners no topo do `admin.dashboard.tsx`. Cada banner é um `Link` para a aba relacionada e some quando a contagem for zero.

## 7. Página pública `/precos`

- Nova rota `src/routes/precos.tsx` com `head()` próprio (title/desc/og).
- Hero F&M (cores `#1A4D7A` / `#F4B941`).
- Carrega `tabela_precos where ativo=true` uma vez (`useQuery`). Monta a matriz 4 planos × 3 sistemas usando os campos existentes (`sistema`, `tipo_servico`, `preco_m2`).
- Seções extras por `categoria`: Câmeras, Serviços Técnicos, Inclusos (badge verde), Consultar (botão WhatsApp `https://wa.me/5571999454343`).
- CTAs finais: amarelo → `/iniciar-contrato`, azul → WhatsApp.
- Link "Preços" no header do `FMSite.tsx`.

## 8. Notificações WhatsApp (`/admin/notificacoes`)

- Nova rota lendo `notificacoes_log` com filtros (`Select` tipo + status) e paginação simples (50/página).
- Badges: enviado (verde), pendente (âmbar), erro (vermelho).
- Botão "Reenviar" em itens com erro: chama RPC `reenviar_notificacao(id)` se existir; senão faz `update notificacoes_log set status='pendente', tentativas=tentativas+1` e mostra toast informando que o worker irá reprocessar. Confirmo qual mecanismo existe antes de implementar; documento na migration se for preciso criar a RPC.

## Detalhes técnicos

- Refetch global de 60s nos dashboards via `refetchInterval`.
- Navegação admin: amplio a barra de tabs existente em `admin.dashboard.tsx` para incluir Leads e Notificações.
- Helpers compartilhados em `src/lib/fm-admin.ts` (formatadores BRL, statusEfetivo).
- Storage: arquivo `db/2026_06_06_admin_final.sql` com policies de `storage.objects` para `comprovantes-pagamento` (admin read/write; parceiro/cliente sem acesso) e `perfil-parceiros` (público read; parceiro escreve só seu próprio path; admin tudo) — só se essas policies ainda não existirem.
- Não toco em fluxo de contratos já estável; apenas leio dados e adiciono UI.

## Entregáveis

1. `db/2026_06_06_admin_final.sql` (eventual, idempotente)
2. Buckets criados via tool
3. Novas rotas: `admin.leads.tsx`, `admin.notificacoes.tsx`, `precos.tsx`
4. Edições: `admin.dashboard.tsx`, `admin.contratos.$id.tsx`, `parceiro.dashboard.tsx`, `iniciar-contrato.tsx`, `FMSite.tsx`
5. Componentes novos: `DashboardResumo`, `AlertasAdmin`, `FotoPerfilUpload`, `MarcarPagoModal`
6. Helper: `src/lib/fm-admin.ts`

Confirma essa abordagem (entrego tudo de uma vez na próxima resposta)?
