## Plano: Seção Clientes no Painel Admin

Vou construir a seção completa em etapas. Antes de codar, preciso confirmar pontos críticos para não retrabalhar.

### Etapas previstas

1. **Verificar/criar schema no banco** (Lovable Cloud)
   - Confirmar colunas existentes em `clientes`, `obra_atualizacoes`, `obra_etapas`, `obra_fotos`, `obra_documentos`
   - Criar migration adicionando colunas faltantes (endereço, área, datas, status, progresso, parceiro_id, camera_url, gerente_*, etc.)
   - Criar bucket `obra-arquivos` no Storage (fotos + documentos) com RLS
   - Garantir GRANTs e RLS apropriadas (apenas admin escreve; cliente lê só sua obra)

2. **Listagem `/admin/dashboard` → aba Clientes**
   - Nova aba/tab no dashboard existente
   - Tabela com busca, badge de status, ações editar/excluir
   - Modal de confirmação de exclusão (padrão já usado)

3. **Modal Novo/Editar Cliente**
   - Form único reaproveitando seções (Dados pessoais, Endereço, Obra, Gerente, Código)
   - PF/PJ com máscara CPF/CNPJ (reusar utils existentes)
   - Busca ViaCEP via fetch
   - Geração automática `FM-{PRIMEIRONOME}-{DDMMYYYY}` editável
   - Após salvar: card destacado com código + botão copiar + botão WhatsApp

4. **Página detalhe `/admin/clientes/$id`**
   - 4 abas: Atualizações, Etapas, Fotos, Documentos
   - CRUD em cada aba com toasts
   - Upload no Storage para fotos/documentos

5. **Validação**
   - Smoke test: criar cliente → editar → adicionar atualização/etapa/foto/documento → excluir

### Detalhes técnicos

- Frontend puro com `fmSupabase` (mesmo padrão do projeto)
- Upload via `fmSupabase.storage.from('obra-arquivos').upload(...)`
- Drag-and-drop de etapas: usar ordenação numérica simples (campo `ordem`) com botões ↑↓ para evitar dependência nova
- Status como **radio** (única seleção) — o pedido diz "checkboxes" mas semanticamente é exclusivo; vou perguntar

### Perguntas antes de começar

1. **Schema atual**: as 5 tabelas (`clientes`, `obra_atualizacoes`, `obra_etapas`, `obra_fotos`, `obra_documentos`) já existem com todas as colunas necessárias, ou preciso criar/alterar via migration? Se já existem, posso inspecionar o schema para confirmar.

2. **Status da obra**: o briefing diz "checkboxes" mas as 4 opções (Orçamento / Iniciando / Andamento / Finalizando) são fases sequenciais. Confirma que é **seleção única (radio)** ou realmente múltipla?

3. **Storage**: posso criar bucket `obra-arquivos` (privado, só admin escreve, cliente lê via signed URL) para fotos+documentos, ou prefere buckets separados (`obra-fotos`, `obra-documentos`)?

4. **Drag-and-drop nas etapas**: posso usar botões de reordenar (↑↓) para evitar adicionar lib nova (`dnd-kit`), ou prefere drag real?

Responda essas 4 e eu sigo direto na implementação.
