import { brl, fmtData, PLANOS_CAMERA, type PlanoCamera } from "@/lib/fm-contratos";
import { EMPRESA_DEFAULT, type EmpresaConfig } from "@/lib/fm-empresa";
import { valorPorExtenso } from "@/lib/fm-extenso";

type Row = Record<string, unknown>;

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

function dataExtenso(d?: string | null): string {
  const dt = d ? new Date(d.includes("T") ? d : d + "T00:00:00") : new Date();
  return `${dt.getDate()} de ${MESES[dt.getMonth()]} de ${dt.getFullYear()}`;
}

export default function ContratoTexto({ c, empresa }: { c: Row; empresa?: EmpresaConfig }) {
  const e = empresa || EMPRESA_DEFAULT;
  const s = (k: string) => String(c[k] ?? "");
  const lc = (v: unknown) => String(v ?? "").toLowerCase();

  // tipo_obra: prefere array novo, fallback aos booleans antigos
  const tipoObraArr = Array.isArray(c.prospect_tipo_obra) ? (c.prospect_tipo_obra as string[]) : [];
  const tiposFromBool = [
    c.tipo_construcao && "Construção",
    c.tipo_reforma && "Reforma",
    c.tipo_ampliacao && "Ampliação",
  ].filter(Boolean) as string[];
  const tipos = (tipoObraArr.length ? tipoObraArr : tiposFromBool).join(", ") || "—";

  const modalidades = [
    c.modalidade_empreitada_mista && "Empreitada Mista",
    c.modalidade_empreitada_mo && "Empreitada MO",
    c.modalidade_gerenciamento && "Gerenciamento",
    c.modalidade_ambos && "Ambos",
  ].filter(Boolean).join(", ") || s("tipo_servico") || "—";

  const camera = PLANOS_CAMERA[(c.plano_camera as PlanoCamera) || "sem_camera"];
  const essencial = c.tipo_servico === "F&M ESSENCIAL";
  const sistemaIBPP = (c.sistema_construtivo || c.prospect_sistema) === "IBPP";

  const area = Number(c.area_m2 || c.prospect_area_construir || 0);
  const terreno = Number(c.prospect_tamanho_terreno || 0);
  const valorTotal = Number(c.valor_total || 0);
  const adiant = Number(c.valor_adiantamento || valorTotal * 0.15);

  const enderecoObra = `${s("prospect_obra_rua")}, ${s("prospect_obra_numero")} — ${s("prospect_obra_bairro")}, ${s("prospect_obra_cidade")}/${s("prospect_obra_estado")} (CEP ${s("prospect_obra_cep")})`;
  const enderecoContratante = `${s("cliente_rua") || s("prospect_rua")}, ${s("cliente_numero") || s("prospect_numero")} — ${s("cliente_bairro") || s("prospect_bairro")}, ${s("cliente_cidade") || s("prospect_cidade")}/${s("cliente_estado") || s("prospect_estado")}, CEP ${s("cliente_cep") || s("prospect_cep")}`;

  const temConjuge = Boolean(c.prospect_conjuge_nome);

  return (
    <div className="prose prose-sm max-w-none text-slate-800">
      <h2 className="text-center">CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE CONSTRUÇÃO CIVIL</h2>
      <p className="text-center text-xs text-slate-500">Nº {s("numero") || "—"}</p>

      <h3>CLÁUSULA 1ª — QUALIFICAÇÃO DAS PARTES</h3>
      <p>
        <strong>CONTRATADA:</strong> {e.razao_social}, inscrita no CNPJ sob nº {e.cnpj},
        com sede em {e.endereco}, neste ato representada por <strong>{e.representante_nome}</strong>,
        {lc(e.representante_estado_civil)}, {lc(e.representante_profissao)},
        nascido em {fmtData(e.representante_nascimento)}, portador do RG nº {e.representante_rg}
        {" e do CPF nº "}{e.representante_cpf}, residente em {e.representante_endereco}.
      </p>
      <p>
        <strong>CONTRATANTE:</strong> {s("cliente_nome") || s("prospect_nome") || "—"},
        {" "}{lc(s("prospect_nacionalidade") || "brasileiro(a)")},
        {" "}{lc(s("prospect_estado_civil") || "—")},
        {" "}{lc(s("prospect_profissao") || "—")},
        portador(a) do RG nº {s("cliente_rg") || s("prospect_rg") || "—"} e CPF/CNPJ nº {s("cliente_cpf_cnpj") || s("prospect_cpf_cnpj") || "—"},
        e-mail {s("cliente_email") || s("prospect_email") || "—"}, telefone {s("cliente_telefone") || s("prospect_telefone") || "—"},
        residente em {enderecoContratante}.
      </p>
      {temConjuge && (
        <p>
          <strong>INTERVENIENTE ANUENTE (cônjuge/companheiro(a)):</strong> {s("prospect_conjuge_nome")},
          {" "}{lc(s("prospect_conjuge_nacionalidade") || "brasileiro(a)")},
          {" "}{lc(s("prospect_conjuge_profissao") || "—")},
          portador(a) do RG nº {s("prospect_conjuge_rg") || "—"} e CPF nº {s("prospect_conjuge_cpf") || "—"},
          e-mail {s("prospect_conjuge_email") || "—"}, telefone {s("prospect_conjuge_telefone") || "—"}.
        </p>
      )}

      <h3>CLÁUSULA 2ª — OBJETO DO CONTRATO</h3>
      <p>
        O presente contrato tem por objeto a prestação de serviços de <strong>{modalidades}</strong> para
        <strong> {lc(tipos)}</strong> do imóvel localizado em {enderecoObra},
        com área de <strong>{area} m²</strong> sobre terreno de {terreno} m² ({s("prospect_tipo_terreno") || "—"}),
        pelo sistema construtivo <strong>{s("sistema_construtivo") || s("prospect_sistema") || "—"}</strong>,
        na modalidade <strong>{s("tipo_servico") || s("prospect_servico") || "—"}</strong>.
      </p>

      <h3>CLÁUSULA 3ª — PRAZO DE EXECUÇÃO</h3>
      <p>
        O prazo de execução será de <strong>{Number(c.prazo_dias || 0)} dias corridos</strong>,
        com início previsto para <strong>{fmtData(s("data_inicio"))}</strong> e conclusão prevista para
        <strong> {fmtData(s("data_previsao_fim"))}</strong>. O prazo poderá ser prorrogado em caso de:
        chuvas que impeçam o trabalho por mais de 3 dias consecutivos; atraso na entrega de materiais
        pelo CONTRATANTE; inadimplência financeira; força maior ou caso fortuito.
      </p>

      <h3>CLÁUSULA 4ª — SERVIÇOS ADICIONAIS E ADITIVOS</h3>
      <p>
        Qualquer serviço não previsto no objeto deste contrato deverá ser objeto de Termo Aditivo,
        aprovado por ambas as partes em até 5 dias úteis, com adiantamento de 15% do valor do aditivo.
      </p>

      <h3>CLÁUSULA 5ª — VALOR E FORMA DE PAGAMENTO</h3>
      <p>
        O valor total dos serviços é de <strong>{brl(valorTotal)}</strong> ({valorPorExtenso(valorTotal)}), sendo:
      </p>
      {c.forma_pagamento ? (
        <p className="whitespace-pre-wrap">{String(c.forma_pagamento)}</p>
      ) : (
        <ul>
          <li>Adiantamento de 15%: <strong>{brl(adiant)}</strong> na assinatura;</li>
          <li>Medições toda sexta-feira;</li>
          <li>Pagamentos toda segunda-feira via PIX CNPJ {e.pix_chave};</li>
          <li>Reajuste anual pelo INCC/IPCA.</li>
        </ul>
      )}
      {camera.valor > 0 && (
        <p>Adicional <strong>F&M Live</strong>: {brl(camera.valor)}/mês ({camera.label}).</p>
      )}
      {c.databook_eletronico ? (
        <p>Adicional <strong>Databook Eletrônico</strong>: {brl(Number(c.valor_databook || 0))} (3% do contrato).</p>
      ) : null}
      {(c.extra_seguro_obra || c.extra_readequacao_ferragem || c.extra_carta_tecnica || c.extra_quantitativo_blocos || c.extras_outros) ? (
        <>
          <p><strong>Serviços extras inclusos nesta proposta:</strong></p>
          <ul>
            {c.extra_seguro_obra ? <li>Seguro de Obra — {brl(Number(c.valor_seguro_obra || 0))}</li> : null}
            {c.extra_readequacao_ferragem ? <li>Readequação de Ferragem — {brl(Number(c.valor_readequacao_ferragem || 0))}</li> : null}
            {c.extra_carta_tecnica ? <li>Carta Técnica do Engenheiro — {brl(Number(c.valor_carta_tecnica || 0))}</li> : null}
            {c.extra_quantitativo_blocos ? <li>Quantitativo de Blocos — {brl(Number(c.valor_quantitativo_blocos || 0))}</li> : null}
            {c.extras_outros ? <li className="whitespace-pre-wrap">{String(c.extras_outros)}</li> : null}
          </ul>
        </>
      ) : null}
      {c.itens_negociacao ? (
        <>
          <p><strong>Itens incluídos na negociação:</strong></p>
          <p className="whitespace-pre-wrap">{String(c.itens_negociacao)}</p>
        </>
      ) : null}

      <h3>CLÁUSULA 6ª — OBRIGAÇÕES DA CONTRATADA</h3>
      <ul>
        <li>Executar os serviços com técnica e qualidade;</li>
        <li>Manter registro fotográfico semanal;</li>
        <li>Disponibilizar acesso ao dashboard do cliente;</li>
        <li>Cumprir as normas ABNT aplicáveis ao sistema construtivo contratado;</li>
        <li>Comunicar imprevistos em até 48 horas.</li>
      </ul>

      <h3>CLÁUSULA 7ª — OBRIGAÇÕES DO CONTRATANTE</h3>
      <ul>
        <li>Efetuar pagamentos nos prazos acordados;</li>
        <li>Fornecer acesso ao imóvel;</li>
        <li>Não interferir na execução técnica;</li>
        <li>Comunicar alterações com antecedência mínima de 5 dias úteis;</li>
        {essencial && <li>Fornecer os materiais nos prazos estabelecidos pela CONTRATADA (F&M ESSENCIAL).</li>}
      </ul>

      {sistemaIBPP && (
        <>
          <h3>CLÁUSULA 8ª — ESPECIFICAÇÕES TÉCNICAS IBPP</h3>
          <p>
            O sistema Inova Blocos Paredes Prontas® (IBPP), patente INPI BR 20 2024 012110 0,
            utiliza painéis pré-moldados com núcleo EPS T1AF antichamas e duas faces de
            microconceto de 15mm, eliminando etapas de chapisco e reboco. Espessura total
            da parede: 13cm (fora a fora).
          </p>
        </>
      )}

      <h3>CLÁUSULA {sistemaIBPP ? "9ª" : "8ª"} — RESCISÃO CONTRATUAL</h3>
      <p>
        O contrato poderá ser rescindido por qualquer das partes, mediante notificação por escrito
        com 15 (quinze) dias de antecedência, em caso de inadimplemento, descumprimento de cláusula
        contratual ou inviabilidade técnica/financeira de continuação da obra. Em caso de rescisão
        unilateral injustificada, a parte que der causa pagará multa equivalente a 10% do saldo
        remanescente do contrato.
      </p>

      <h3>CLÁUSULA {sistemaIBPP ? "10ª" : "9ª"} — PENALIDADES AO CONTRATANTE</h3>
      <p>
        O atraso no pagamento de qualquer parcela acarretará multa de 2% sobre o valor em atraso,
        acrescida de juros de 1% ao mês.
      </p>
      {essencial && (
        <p>
          Na modalidade F&M ESSENCIAL, o atraso na entrega de materiais que cause paralisação
          da obra acarretará multa diária de R$ 500,00 por dia de paralisação.
        </p>
      )}

      <h3>CLÁUSULA {sistemaIBPP ? "11ª" : "10ª"} — GARANTIA LEGAL</h3>
      <p>
        Nos termos do Art. 618 do Código Civil Brasileiro, a CONTRATADA garante a solidez e
        segurança da obra pelo prazo de 5 (cinco) anos após a conclusão dos serviços executados
        diretamente pela F&M Construções Inteligentes.
      </p>
      <p>
        A garantia não se aplica a serviços, materiais ou instalações executados por terceiros
        contratados diretamente pelo CONTRATANTE, incluindo mas não se limitando a: instalações
        elétricas, hidráulicas, esquadrias, revestimentos, pinturas e demais acabamentos quando
        fornecidos ou executados por empresas ou profissionais indicados ou contratados pelo
        próprio CONTRATANTE.
      </p>

      <h3>CLÁUSULA {sistemaIBPP ? "12ª" : "11ª"} — ALTERAÇÕES CONTRATUAIS</h3>
      <p>
        Qualquer alteração deste contrato somente terá validade se efetuada por escrito e
        assinada por ambas as partes.
      </p>

      <h3>CLÁUSULA {sistemaIBPP ? "13ª" : "12ª"} — DISPOSIÇÕES GERAIS</h3>
      <p>
        Fica eleito o foro da Comarca de Camaçari/BA para dirimir quaisquer dúvidas oriundas
        deste contrato, com renúncia a qualquer outro, por mais privilegiado que seja.
        {c.observacoes ? ` Observações: ${String(c.observacoes)}.` : ""}
      </p>

      <p className="mt-6">Camaçari/BA, {dataExtenso(s("data_inicio") || null)}.</p>

      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          <div className="border-b border-slate-400 pb-2 h-20 flex items-end justify-center">
            {c.assinatura_fm ? <img src={c.assinatura_fm as string} alt="" className="h-16" /> : <span className="text-slate-300">—</span>}
          </div>
          <p className="mt-1 text-center text-xs">
            <strong>CONTRATADA</strong><br />
            {e.razao_social}<br />
            {e.representante_nome} — CPF: {e.representante_cpf}<br />
            {c.assinatura_fm_data ? `Assinado em ${fmtData(s("assinatura_fm_data"))}` : ""}
          </p>
        </div>
        <div>
          <div className="border-b border-slate-400 pb-2 h-20 flex items-end justify-center">
            {c.assinatura_cliente ? <img src={c.assinatura_cliente as string} alt="" className="h-16" /> : <span className="text-slate-300">—</span>}
          </div>
          <p className="mt-1 text-center text-xs">
            <strong>CONTRATANTE</strong><br />
            {s("cliente_nome") || s("prospect_nome") || "—"}<br />
            CPF/CNPJ: {s("cliente_cpf_cnpj") || s("prospect_cpf_cnpj") || "—"}<br />
            {c.assinatura_cliente_data ? `Assinado em ${fmtData(s("assinatura_cliente_data"))}` : ""}
          </p>
        </div>
        {temConjuge && (
          <div>
            <div className="border-b border-slate-400 pb-2 h-20 flex items-end justify-center">
              {c.prospect_conjuge_assinatura ? <img src={c.prospect_conjuge_assinatura as string} alt="" className="h-16" /> : <span className="text-slate-300">—</span>}
            </div>
            <p className="mt-1 text-center text-xs">
              <strong>INTERVENIENTE ANUENTE</strong><br />
              {s("prospect_conjuge_nome")}<br />
              CPF: {s("prospect_conjuge_cpf") || "—"}
            </p>
          </div>
        )}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-8">
        <div>
          <div className="border-b border-slate-400 h-12" />
          <p className="mt-1 text-center text-xs">TESTEMUNHA 1 (Nome / CPF)</p>
        </div>
        <div>
          <div className="border-b border-slate-400 h-12" />
          <p className="mt-1 text-center text-xs">TESTEMUNHA 2 (Nome / CPF)</p>
        </div>
      </div>
    </div>
  );
}