import { brl, fmtData, PLANOS_CAMERA, type PlanoCamera } from "@/lib/fm-contratos";

type Row = Record<string, unknown>;

export default function ContratoTexto({ c }: { c: Row }) {
  const get = (k: string) => (c[k] as string | number | boolean | null | undefined) ?? "";
  const modalidades = [
    c.modalidade_empreitada_mista && "Empreitada Mista",
    c.modalidade_empreitada_mo && "Empreitada MO",
    c.modalidade_gerenciamento && "Gerenciamento",
    c.modalidade_ambos && "Ambos",
  ].filter(Boolean).join(", ") || "—";
  const tipos = [
    c.tipo_construcao && "Construção",
    c.tipo_reforma && "Reforma",
    c.tipo_ampliacao && "Ampliação",
  ].filter(Boolean).join(", ") || "—";
  const camera = PLANOS_CAMERA[(c.plano_camera as PlanoCamera) || "sem_camera"];
  const essencial = c.tipo_servico === "F&M ESSENCIAL";
  const valorTotal = Number(c.valor_total || 0);
  const adiant = Number(c.valor_adiantamento || 0);
  const restante = valorTotal - adiant;

  return (
    <div className="prose prose-sm max-w-none text-slate-800">
      <h2 className="text-center">CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE CONSTRUÇÃO CIVIL</h2>
      <p className="text-center text-xs text-slate-500">Nº {String(get("numero") || "—")}</p>

      <p><strong>CONTRATANTE:</strong> {String(get("cliente_nome") || "—")}, portador(a) do CPF/CNPJ nº {String(get("cliente_cpf_cnpj") || "—")}, RG nº {String(get("cliente_rg") || "—")}, residente em {String(get("cliente_rua") || "—")}, {String(get("cliente_numero") || "—")}, bairro {String(get("cliente_bairro") || "—")}, {String(get("cliente_cidade") || "—")}/{String(get("cliente_estado") || "—")}, CEP {String(get("cliente_cep") || "—")}, e-mail {String(get("cliente_email") || "—")}, telefone {String(get("cliente_telefone") || "—")}.</p>

      <p><strong>CONTRATADA:</strong> F&M SMART BUILD, representada pelo Responsável Técnico {String(get("responsavel_tecnico"))}, CREA {String(get("crea"))}, e pelo Gerente de Obra {String(get("gerente_nome"))} ({String(get("gerente_cargo"))}), WhatsApp {String(get("gerente_whatsapp"))}.</p>

      <h3>CLÁUSULA 1ª – DO OBJETO</h3>
      <p>O presente contrato tem por objeto a prestação de serviços de construção civil na modalidade <strong>{modalidades}</strong>, do tipo <strong>{tipos}</strong>, utilizando o sistema construtivo <strong>{String(get("sistema_construtivo") || "—")}</strong>, na configuração de serviço <strong>{String(get("tipo_servico") || "—")}</strong>.</p>

      <h3>CLÁUSULA 2ª – DA ÁREA E DO PREÇO</h3>
      <p>A obra contempla área total de <strong>{Number(c.area_m2 || 0)} m²</strong> ao valor unitário de <strong>{brl(Number(c.valor_m2 || 0))}/m²</strong>, totalizando {brl(Number(c.valor_servico || 0))} de serviços.</p>

      <h3>CLÁUSULA 3ª – DO MONITORAMENTO POR CÂMERA</h3>
      <p>Plano contratado: <strong>{camera.label}</strong>{camera.valor > 0 ? `, no valor de ${brl(camera.valor)}/mês.` : "."}</p>

      <h3>CLÁUSULA 4ª – DO DATABOOK ELETRÔNICO</h3>
      <p>{c.databook_eletronico ? `Contratado, no valor de ${brl(Number(c.valor_databook || 0))} (3% do valor de serviço).` : "Não contratado."}</p>

      <h3>CLÁUSULA 5ª – DO VALOR TOTAL</h3>
      <p>O valor total do contrato é de <strong>{brl(valorTotal)}</strong>, sendo {brl(adiant)} (15%) a título de adiantamento e {brl(restante)} parcelados em medições semanais.</p>

      <h3>CLÁUSULA 6ª – DA FORMA DE PAGAMENTO</h3>
      <p>O pagamento será semanal, mediante medição dos serviços executados, com vencimento toda segunda-feira subsequente à semana de referência.</p>

      <h3>CLÁUSULA 7ª – DO PRAZO</h3>
      <p>Início em <strong>{fmtData(get("data_inicio") as string)}</strong>, com prazo de execução de <strong>{Number(c.prazo_dias || 0)} dias</strong>, prevendo término em <strong>{fmtData(get("data_previsao_fim") as string)}</strong>.</p>

      <h3>CLÁUSULA 8ª – DAS OBRIGAÇÕES DA CONTRATADA</h3>
      <p>Executar os serviços conforme normas técnicas (ABNT) e boas práticas, fornecer mão de obra qualificada e prestar contas semanalmente ao CONTRATANTE.</p>

      <h3>CLÁUSULA 9ª – DAS OBRIGAÇÕES DO CONTRATANTE</h3>
      <p>Efetuar os pagamentos nas datas acordadas, fornecer acesso à obra e às informações necessárias.</p>

      {essencial && (
        <>
          <h3>CLÁUSULA 9ª.1 – DO FORNECIMENTO DE MATERIAL (F&M ESSENCIAL)</h3>
          <p>O CONTRATANTE se compromete a fornecer os materiais nos prazos estabelecidos pela CONTRATADA, sob pena de multa diária de R$ 500,00 por dia de atraso na entrega de material que cause paralisação da obra.</p>
        </>
      )}

      <h3>CLÁUSULA 10ª – DOS ADITIVOS</h3>
      <p>Quaisquer acréscimos de área, escopo ou prazo serão formalizados por aditivo escrito, com os novos valores e prazos.</p>

      <h3>CLÁUSULA 11ª – DA RESCISÃO</h3>
      <p>O contrato poderá ser rescindido por inadimplemento de qualquer das partes, mediante notificação por escrito com 15 dias de antecedência.</p>

      <h3>CLÁUSULA 12ª – DA GARANTIA</h3>
      <p>A CONTRATADA garante os serviços executados pelo prazo legal, conforme art. 618 do Código Civil.</p>

      <h3>CLÁUSULA 13ª – DO FORO</h3>
      <p>Fica eleito o foro da Comarca de Salvador/BA para dirimir qualquer questão oriunda deste contrato.</p>

      <h3>CLÁUSULA 14ª – DAS DISPOSIÇÕES GERAIS</h3>
      <p>{String(c.observacoes || "Este contrato representa a totalidade do acordado entre as partes e somente poderá ser alterado por instrumento escrito.")}</p>
    </div>
  );
}