## Visão geral

Reformatar todo o fluxo de contratos em 5 frentes:

1. Formulário público `/iniciar-contrato` sem qualquer preço/cálculo
2. Schema do banco: novas colunas `prospect_*` e tabela `empresa_config`
3. Painel admin `/admin/contratos/[id]` — cards de leitura do prospect + seção "Proposta F&M" + botão "Gerar contrato e enviar"
4. Página `/contrato/[token]` — contrato formatado com **14 cláusulas completas**, dados da F&M (de `empresa_config`), cônjuge como interveniente, assinaturas
5. Geração de PDF formatado com cabeçalho, cláusulas, assinaturas e rodapé

---

## 1. Schema do banco (nova migration)

**Arquivo:** `db/2026_06_07_contratos_v2.sql`

**Tabela `empresa_config`** (singleton, 1 linha):
```
razao_social, cnpj, endereco, representante_nome,
representante_cpf, representante_rg, representante_estado_civil,
representante_profissao, representante_nascimento,
representante_endereco, responsavel_tecnico, crea, pix_chave,
logo_url, assinatura_fm_default (base64)
```
Seed com os dados fornecidos (Hélder, CNPJ 21.560.948/0001-71, etc).

**Novas colunas em `contratos`** (idempotente, `add column if not exists`):
- `prospect_whatsapp` text
- `prospect_tipo_obra` text[]  (array de checkboxes)
- `prospect_sistema_preferido`, `prospect_servico_preferido`, `prospect_camera_preferida` text  (apelidos novos; manter antigos para compat)
- `prospect_conjuge_assinatura` text + `prospect_conjuge_assinatura_data` timestamptz

**Atualizar RPC `criar_contrato_publico`** para gravar nas novas colunas (incluindo `prospect_tipo_obra` como array em vez dos 3 booleans antigos).

GRANT/RLS conforme padrão do projeto.

---

## 2. Formulário público `/iniciar-contrato` (src/routes/iniciar-contrato.tsx)

**Remover:**
- `precoPreview` (linhas 346-349) e badge de `R$/m²` no Etapa 2
- Qualquer exibição de preço no Etapa 3 (resumo) — substituir por resumo textual
- Import de `precoM2`, `brl`, `PLANOS_CAMERA`

**Estrutura nova:**
- **Etapa 1** (Dados Pessoais): adicionar **WhatsApp** separado de Telefone. Mantém cônjuge condicional (já existe).
- **Etapa 2** (Dados da Obra): substituir os 3 booleans `tipo_obra_*` por **array de checkboxes** `tipo_obra[]`. Sistema/Serviço/Câmera continuam como Radio mas **sem preço** ao lado.
- **Etapa 3** (Confirmação): apenas listar campos preenchidos (sem qualquer valor financeiro), checkbox de confirmação, botão ENVIAR.

Payload enviado à RPC inclui as novas chaves (`whatsapp`, `tipo_obra` array, `sistema_preferido`, etc).

---

## 3. Admin — `/admin/contratos/$id` (src/routes/admin.contratos.$id.tsx)

**Já existe** o card azul "Dados recebidos do solicitante". Expandir com:
- WhatsApp, tipo_obra (array), cônjuge completo
- Bloco "Endereço da obra" formatado

**Seção "Proposta F&M"** (editável, novo agrupamento dos campos já existentes):
- Sistema construtivo, Tipo de serviço (selects)
- Valor m² (input livre — manter `precoM2()` como sugestão mas não impor)
- Área m² (pré-carregada de `prospect_area_construir`, editável)
- Valor serviço, plano câmera, databook, valor total, adiantamento 15%
- Data início, prazo dias, data fim automática
- Modalidades (checkboxes)
- Observações

**Botão "GERAR CONTRATO E ENVIAR PARA ASSINATURA"** (substitui "Enviar para Cliente"):
- Valida campos mínimos da proposta
- Salva com `status='aguardando_cliente'`
- Copia link `https://www.fmsmartbuild.com.br/contrato/[token]` para clipboard
- Toast: "Contrato gerado! Envie o link ao cliente pelo WhatsApp."
- Não abre wa.me automaticamente (admin envia manual)

**Assinar como F&M** (aba já existente): pré-carregar `empresa_config.assinatura_fm_default` se existir.

---

## 4. `/contrato/[token]` — Contrato com 14 cláusulas

**Reescrever `src/components/admin/ContratoTexto.tsx`** (usado em ambos preview admin e página pública):
- Buscar `empresa_config` (passado por prop ou hook)
- Renderizar **as 14 cláusulas exatamente como especificado** no pedido:
  1. Qualificação das Partes (com cônjuge interveniente se aplicável)
  2. Objeto (com modalidade, tipo obra, endereço, áreas, sistema, serviço)
  3. Prazo de Execução (com condições de prorrogação)
  4. Serviços Adicionais e Aditivos (15% adiantamento)
  5. Valor e Forma de Pagamento (com valor por extenso; PIX CNPJ; câmera/databook condicionais)
  6. Obrigações da Contratada
  7. Obrigações do Contratante (extra item se F&M ESSENCIAL)
  8. Responsabilidade Técnica (CREA, ART)
  9. Especificações Técnicas IBPP (somente se sistema=IBPP)
  10. Rescisão Contratual
  11. Penalidades ao Contratante (com cláusula extra F&M ESSENCIAL)
  12. Garantia Legal (Art. 618 CC, 5 anos)
  13. Alterações Contratuais
  14. Disposições Gerais (Foro Camaçari/BA)
- Local e data: "Camaçari/BA, [DIA] de [MÊS] de [ANO]"
- Bloco de assinaturas: CONTRATADA (imagem + nome + CPF + data) + CONTRATANTE + CÔNJUGE (se houver) + 2 linhas em branco para testemunhas

**Helper `valor por extenso`** em `src/lib/fm-extenso.ts` (escrever do zero — função pura, converte número → "vinte mil reais").

**Página `/contrato/$token`:**
- Carregar `empresa_config` junto com o contrato
- Se prospect tem cônjuge, exibir campo extra de assinatura do cônjuge
- Ao assinar: salva `assinatura_cliente` + `assinatura_cliente_data`, status `aguardando_fm`, toast "✅ Assinatura registrada!"

---

## 5. PDF (já existe `baixarPDF` mas precisa melhorar)

**Em `src/routes/admin.contratos.$id.tsx`:**
- Renderizar o `ContratoTexto` em um container fora-da-tela com largura A4 (210mm = ~794px @ 96dpi)
- Cabeçalho: logo F&M + dados empresa
- Rodapé fixo: "F&M Construções Inteligentes | CNPJ: 21.560.948/0001-71"
- Nome do arquivo: `Contrato_FM_${numero}_${nome_cliente_slug}.pdf`
- Paginação correta via html2canvas (já tem rudimentar, melhorar com slicing por altura útil)

---

## Arquivos a criar
- `db/2026_06_07_contratos_v2.sql`
- `src/lib/fm-extenso.ts`
- `src/lib/fm-empresa.ts` (loader de empresa_config + tipos)

## Arquivos a editar
- `src/routes/iniciar-contrato.tsx` — remover preços, adicionar WhatsApp, tipo_obra array
- `src/routes/admin.contratos.$id.tsx` — botão "Gerar e enviar", PDF melhorado
- `src/routes/contrato.$token.tsx` — carregar empresa_config, assinatura cônjuge
- `src/components/admin/ContratoTexto.tsx` — reescrever com 14 cláusulas

## Pontos a confirmar antes de implementar

1. **Logo da F&M**: tem URL/asset já no projeto ou devo deixar placeholder no cabeçalho do PDF?
2. **Assinatura padrão do Hélder**: você quer carregar uma imagem pré-cadastrada de `empresa_config.assinatura_fm_default` (admin só clica "confirmar"), ou continua desenhando manualmente toda vez?
3. **Campos do prospect já gravados**: o banco hoje tem `prospect_tipo_obra_construcao/reforma/ampliacao` (3 booleans) — devo migrar para o array `prospect_tipo_obra[]` e dropar os booleans, ou manter ambos por compat?
4. **Telefone vs WhatsApp**: você quer **dois campos separados** no formulário, ou um único campo "Telefone/WhatsApp" (como hoje)?
