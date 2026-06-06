## Escopo

Boa parte do fluxo já existe: `/contrato/$token` (assinatura), `/admin/contratos` (listagem) e `/admin/contratos/$id` (form F&M + financeiro + aditivos + assinatura F&M + PDF). Faltam três peças:

### 1. Página pública `/iniciar-contrato` (NOVA)

Stepper 3 etapas com cores F&M (#1A4D7A, #F4B941):

- **Etapa 1 — Dados Pessoais**: tipo (PF/PJ), nome, CPF/CNPJ, RG, nacionalidade, estado civil, profissão, email, telefone, endereço com ViaCEP. Bloco de cônjuge aparece se estado civil = Casado/União Estável (nome, CPF, RG, email, telefone, profissão, nacionalidade).
- **Etapa 2 — Dados da Obra**: endereço (com checkbox "mesmo endereço"), tamanho terreno, tipo terreno, área a construir, tipo obra (checkboxes), sistema construtivo (IBPP / Alvenaria / ICF / Não sei), tipo serviço (TOTAL / GESTÃO / ESSENCIAL / Só Gestão) com preços da `tabela_precos`, plano câmera, prazo desejado, observações.
- **Etapa 3 — Confirmação**: resumo em cards + checkbox de veracidade + botão "ENVIAR SOLICITAÇÃO".

Captura `?ref=SLUG` para `parceiro_indicador_id`. Ao enviar:
- INSERT em `contratos` com `status='rascunho'`, campos `prospect_*`, `token_cliente` (auto), `numero` gerado (protocolo `FM-XXX-2026`).
- INSERT em `referral_leads` se veio de parceiro.
- Tela de sucesso com nº de protocolo.

### 2. Menu "Quero Construir"

Botão amarelo `#F4B941` no header de `FMSite.tsx` (desktop + mobile) linkando para `/iniciar-contrato`.

### 3. Admin `/admin/contratos` — 3 abas

Reorganizar listagem em Tabs: **Pendentes** (rascunho, badge amarelo com contagem), **Em Andamento** (aguardando_cliente | aguardando_fm), **Assinados** (assinado). Adicionar coluna Protocolo (numero) e Obra. Badges com `STATUS_COLORS`/`STATUS_LABELS` já existentes.

### 4. Ajustes de detalhe (`admin.contratos.$id`)

- Ao abrir um contrato rascunho (vindo do prospect), exibir bloco de "Dados do Prospect" em leitura (fundo azul claro) com todos os campos `prospect_*`.
- O F&M usa o form já existente para confirmar sistema/serviço/valores; auto-preenche `valor_m2` da `tabela_precos` (já existe via `precoM2`).
- Botão "GERAR CONTRATO E ENVIAR" reaproveita `enviarParaCliente()` (já implementado).

### 5. Cláusula extra F&M ESSENCIAL

Adicionar em `ContratoTexto.tsx` parágrafo automático quando `tipo_servico = 'F&M ESSENCIAL'` (multa diária R$500 por atraso de material).

## Notas técnicas

- Toda escrita pública via RPC `criar_contrato_publico` (nova, SECURITY DEFINER, GRANT a anon) para evitar abrir INSERT em `contratos` para anon.
- Migration nova: função `criar_contrato_publico(p_dados jsonb, p_parceiro_slug text)` que insere o rascunho, gera `numero` e `token_cliente`, e cria `referral_leads`.
- ViaCEP, máscaras CPF/CNPJ/CEP/telefone já existem em `@/lib/fm-clientes`.
- `gerarNumeroContrato`, `precoM2`, `PLANOS_CAMERA` já em `@/lib/fm-contratos`.

Confirma que sigo com essa abordagem? (Tudo na mesma entrega, em uma migration + as páginas novas.)