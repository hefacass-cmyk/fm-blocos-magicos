## Plano: Fluxo de contrato F&M em 5 etapas

Vou redesenhar todo o ciclo de vida do contrato, criando 3 páginas públicas novas, refatorando o admin e adicionando os novos status no banco.

---

### 1. Banco de dados — `db/2026_06_08_contrato_fluxo_5_etapas.sql`

- Adicionar novos valores ao enum/check de `contratos.status`:
  - `dados_cliente_enviados`, `aguardando_revisao`, `em_revisao`, `assinado_cliente`
  - (mantém `rascunho`, `aguardando_cliente`, `aguardando_fm`, `assinado`, `cancelado` para compat)
- Adicionar coluna `observacoes_cliente text` em `contratos` (idempotente)
- RPC `salvar_dados_cliente_publico(p_token, p_payload jsonb)` — preenche todos os `prospect_*` e seta status para `dados_cliente_enviados`
- RPC `solicitar_alteracao_contrato(p_token, p_observacao)` — grava `observacoes_cliente` e seta status `em_revisao`
- RPC `assinar_contrato_cliente(p_token, p_assinatura)` — grava assinatura cliente + status `assinado_cliente`
- RPC `assinar_fm_automatico(p_contrato_id)` — busca `empresa_config.assinatura_fm_default`, grava em `assinatura_fm`, status `assinado`
- GRANTs apropriados (anon para RPCs públicas via token; service_role para tudo)

### 2. Rotas públicas novas (todas sem login)

**a) `src/routes/contrato.dados.$token.tsx`** — Etapa 1
- Formulário completo (PF/PJ, dados pessoais, cônjuge condicional, endereço com ViaCEP, dados da obra)
- Reaproveita máscaras de `src/lib/fm-clientes.ts`
- Submit chama RPC `salvar_dados_cliente_publico`
- Após sucesso: tela "✅ Dados enviados! A F&M vai elaborar sua proposta."
- Notificação WhatsApp à F&M via link `wa.me/5571999454343` (abre nova aba) ou função server-side se já houver integração

**b) `src/routes/contrato.revisar.$token.tsx`** — Etapa 3
- Carrega contrato + `empresa_config`
- Renderiza `<ContratoTexto />` completo com as 14 cláusulas já preenchidas
- 2 botões: "✅ Concordo — Assinar" (→ navega para `/contrato/assinar/$token`) e "✏️ Solicitar alteração" (abre textarea modal → RPC `solicitar_alteracao_contrato`)

**c) `src/routes/contrato.assinar.$token.tsx`** — Etapa 4
- Resumo enxuto do contrato
- `<SignaturePad />` largura total altura 200px
- Botão Limpar + checkbox "Li e concordo com todos os termos"
- Submit: RPC `assinar_contrato_cliente` → em seguida chama RPC `assinar_fm_automatico` (Etapa 5)
- Após sucesso: tela final com link para `/dashboard` e código do cliente

A rota antiga `src/routes/contrato.$token.tsx` permanece como fallback (redireciona para a etapa apropriada conforme `status`).

### 3. Admin — `src/routes/admin.contratos.$id.tsx` (Etapa 2)

- Cards de leitura (azul claro) com os dados recebidos do cliente
- Seção "Proposta F&M" editável:
  sistema, serviço, modalidades, valor total (livre), adiantamento (auto 15% editável), data início, prazo, data fim (auto), plano câmera, databook, observações
- Botão "GERAR CONTRATO PARA REVISÃO DO CLIENTE":
  - Salva, status → `aguardando_revisao`
  - Copia link `https://www.fmsmartbuild.com.br/contrato/revisar/[token]` para clipboard
  - Toast confirmando
- Mostrar `observacoes_cliente` em destaque (amarelo) quando status = `em_revisao`

Também atualizar `src/routes/admin.contratos.tsx` (lista) com novos labels/cores de status.

### 4. Admin — `src/routes/admin.configuracoes.tsx`

Já existe a seção "Assinatura padrão da F&M" com SignaturePad. Verificar e ajustar se necessário (parece já implementado conforme contexto).

### 5. Geração do link inicial (Etapa 1)

No admin existe `/admin/contratos` (lista). Adicionar botão "Novo contrato" que:
- Cria um registro mínimo em `contratos` (apenas token gerado, status `rascunho`)
- Copia link `https://www.fmsmartbuild.com.br/contrato/dados/[token]` para clipboard
- F&M envia manualmente ao cliente via WhatsApp

### 6. Helpers atualizados em `src/lib/fm-contratos.ts`

- Adicionar novos status nos `STATUS_LABELS` e `STATUS_COLORS`
- Helper `linkPublicoEtapa(status, token)` que retorna a URL correta da etapa atual

---

### Arquivos a criar
- `db/2026_06_08_contrato_fluxo_5_etapas.sql`
- `src/routes/contrato.dados.$token.tsx`
- `src/routes/contrato.revisar.$token.tsx`
- `src/routes/contrato.assinar.$token.tsx`

### Arquivos a editar
- `src/lib/fm-contratos.ts` (novos status + helper de link)
- `src/routes/admin.contratos.$id.tsx` (botão "Gerar para revisão", exibir observações)
- `src/routes/admin.contratos.tsx` (labels novos status)
- `src/routes/contrato.$token.tsx` (redirect para etapa correta conforme status)

### PDF e WhatsApp automático

O envio automático via WhatsApp (etapa 5 final) exige integração com API (uazapi/outro). Hoje o projeto não tem essa integração configurada — vou deixar o fluxo gerando o link, mas o **envio automático ao WhatsApp** vai exigir confirmação adicional do provedor (uazapi token? outra API?). Por ora, mostro botão "Abrir WhatsApp" que o admin clica para enviar manualmente. Da mesma forma, a notificação automática à F&M em cada etapa será um botão `wa.me` que abre o WhatsApp do Hélder — confirmar se prefere assim ou integrar API externa.

A geração do PDF reaproveita o fluxo `html2canvas` já existente em `admin.contratos.$id.tsx`. O link do PDF gerado pelo cliente fica disponível no dashboard dele.

---

### Pontos a confirmar antes de implementar

1. **Notificação WhatsApp automática**: usar API externa (qual? uazapi com token?) ou apenas botões `wa.me` que abrem o app manualmente?
2. **PDF final**: gerado on-demand quando cliente acessa o dashboard, ou salvo em storage (Supabase Storage) no momento da assinatura?
3. **Confirmar que a tabela `contratos` já tem o campo `token_cliente`** (parece sim pelo contexto) e que ele é gerado quando o contrato é criado.
4. **Status legado**: posso deprecar `aguardando_cliente` / `aguardando_fm` (substituídos por `dados_cliente_enviados` / `aguardando_revisao`) ou preciso manter ambos por compat com contratos antigos?
