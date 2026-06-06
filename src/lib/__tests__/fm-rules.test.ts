import { describe, expect, it } from "vitest";
import {
  ADMIN_SESSION_KEY,
  avaliacaoSchema,
  buildRelatorioWhatsappLink,
  calcularMediaAvaliacoes,
  isAdminAuthenticated,
  onlyDigits,
  relatorioSemanalSchema,
  seoConfigSchema,
  sextaQuinta,
  statusBadge,
} from "@/lib/fm-rules";

function makeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    clear: () => data.clear(),
    key: () => null,
    length: 0,
  } satisfies Storage;
}

describe("permissões admin", () => {
  it("nega quando storage está vazio ou ausente", () => {
    expect(isAdminAuthenticated(null)).toBe(false);
    expect(isAdminAuthenticated(undefined)).toBe(false);
    expect(isAdminAuthenticated(makeStorage())).toBe(false);
  });

  it("permite somente quando a chave vale exatamente '1'", () => {
    expect(isAdminAuthenticated(makeStorage({ [ADMIN_SESSION_KEY]: "1" }))).toBe(true);
    expect(isAdminAuthenticated(makeStorage({ [ADMIN_SESSION_KEY]: "true" }))).toBe(false);
    expect(isAdminAuthenticated(makeStorage({ [ADMIN_SESSION_KEY]: "0" }))).toBe(false);
  });
});

describe("Relatórios Semanais — status e datas", () => {
  it("mapeia status para badge correto", () => {
    expect(statusBadge("enviado").label).toBe("Enviado");
    expect(statusBadge("visualizado").label).toBe("Visualizado");
    expect(statusBadge("rascunho").label).toBe("Rascunho");
    expect(statusBadge("qualquercoisa").label).toBe("Rascunho");
  });

  it("sextaQuinta retorna sexta→quinta (7 dias) e ini<=fim", () => {
    // Testa todos os dias da semana
    const base = new Date("2026-06-01T12:00:00Z"); // segunda
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setUTCDate(base.getUTCDate() + i);
      const { ini, fim } = sextaQuinta(d);
      expect(ini <= fim).toBe(true);
      const dIni = new Date(ini + "T00:00:00Z");
      const dFim = new Date(fim + "T00:00:00Z");
      // sexta = dia 5
      expect(dIni.getUTCDay()).toBe(5);
      // quinta = dia 4
      expect(dFim.getUTCDay()).toBe(4);
      // 6 dias de diferença
      expect((dFim.getTime() - dIni.getTime()) / 86400000).toBe(6);
    }
  });
});

describe("Relatórios Semanais — validação", () => {
  const valid = {
    cliente_id: "abc-123",
    semana_inicio: "2026-06-05",
    semana_fim: "2026-06-11",
    titulo: "Semana 03 — Paredes",
    resumo: "ok",
    progresso_semana: 10,
    progresso_total: 30,
    profissionais: 4,
    servicos_executados: ["pintura"],
    materiais_utilizados: ["tinta"],
    pendencias: [],
    proximos_passos: ["acabamento"],
    valor_medido: 1500.5,
  };

  it("aceita um payload válido", () => {
    expect(() => relatorioSemanalSchema.parse(valid)).not.toThrow();
  });

  it("rejeita título vazio", () => {
    expect(() => relatorioSemanalSchema.parse({ ...valid, titulo: "   " })).toThrow(/Título/);
  });

  it("rejeita progresso fora de 0..100", () => {
    expect(() => relatorioSemanalSchema.parse({ ...valid, progresso_total: 150 })).toThrow();
    expect(() => relatorioSemanalSchema.parse({ ...valid, progresso_semana: -1 })).toThrow();
  });

  it("rejeita data fim antes de data início", () => {
    expect(() =>
      relatorioSemanalSchema.parse({ ...valid, semana_inicio: "2026-06-11", semana_fim: "2026-06-05" }),
    ).toThrow(/semana_inicio/);
  });

  it("rejeita formato de data inválido", () => {
    expect(() => relatorioSemanalSchema.parse({ ...valid, semana_inicio: "05/06/2026" })).toThrow();
  });
});

describe("Relatórios Semanais — WhatsApp", () => {
  it("extrai apenas dígitos do telefone", () => {
    expect(onlyDigits("(31) 99876-5432")).toBe("31998765432");
  });

  it("retorna null se telefone vazio", () => {
    expect(buildRelatorioWhatsappLink({
      fone: "abc",
      nomeCliente: "X",
      titulo: "T",
      progressoTotal: 10,
      profissionais: 1,
      servicos: [],
    })).toBeNull();
  });

  it("monta link wa.me com 55 + dígitos e mensagem codificada", () => {
    const url = buildRelatorioWhatsappLink({
      fone: "(31) 99876-5432",
      nomeCliente: "Ana",
      titulo: "Semana 03",
      progressoTotal: 42,
      profissionais: 5,
      servicos: ["pintura", "elétrica"],
    })!;
    expect(url.startsWith("https://wa.me/5531998765432?text=")).toBe(true);
    const text = decodeURIComponent(url.split("text=")[1]);
    expect(text).toContain("Semana 03");
    expect(text).toContain("Ana");
    expect(text).toContain("42%");
    expect(text).toContain("pintura, elétrica");
    expect(text).toContain("https://www.fmsmartbuild.com.br/dashboard");
  });
});

describe("Avaliações — validação", () => {
  const valid = { parceiro_id: "p1", nome_avaliador: "João", nota: 5, aprovado: false };

  it("aceita payload válido", () => {
    expect(() => avaliacaoSchema.parse(valid)).not.toThrow();
  });

  it("rejeita nome vazio", () => {
    expect(() => avaliacaoSchema.parse({ ...valid, nome_avaliador: "  " })).toThrow(/nome/i);
  });

  it("rejeita nota fora de 1..5", () => {
    expect(() => avaliacaoSchema.parse({ ...valid, nota: 0 })).toThrow();
    expect(() => avaliacaoSchema.parse({ ...valid, nota: 6 })).toThrow();
    expect(() => avaliacaoSchema.parse({ ...valid, nota: 3.5 })).toThrow();
  });

  it("por padrão grava como NÃO aprovado", () => {
    const parsed = avaliacaoSchema.parse({ parceiro_id: "p1", nome_avaliador: "Ana", nota: 4 });
    expect(parsed.aprovado).toBe(false);
  });

  it("força limites de tamanho em serviço e comentário", () => {
    expect(() => avaliacaoSchema.parse({ ...valid, comentario: "x".repeat(1001) })).toThrow();
    expect(() => avaliacaoSchema.parse({ ...valid, servico: "x".repeat(201) })).toThrow();
  });
});

describe("Avaliações — agregação", () => {
  it("ignora não-aprovadas ao calcular média", () => {
    const r = calcularMediaAvaliacoes([
      { nota: 5, aprovado: true },
      { nota: 3, aprovado: true },
      { nota: 1, aprovado: false },
    ]);
    expect(r.total).toBe(2);
    expect(r.media).toBe(4);
  });

  it("retorna zero quando não há aprovadas", () => {
    expect(calcularMediaAvaliacoes([{ nota: 5, aprovado: false }])).toEqual({ media: 0, total: 0 });
    expect(calcularMediaAvaliacoes([])).toEqual({ media: 0, total: 0 });
  });

  it("arredonda para 1 casa decimal", () => {
    expect(calcularMediaAvaliacoes([
      { nota: 5, aprovado: true },
      { nota: 4, aprovado: true },
      { nota: 4, aprovado: true },
    ]).media).toBe(4.3);
  });
});

describe("SEO — validação", () => {
  const valid = {
    pagina: "/",
    titulo: "F&M Smart Build",
    descricao: "Construção e reforma com gestão inteligente",
  };

  it("aceita payload mínimo válido", () => {
    expect(() => seoConfigSchema.parse(valid)).not.toThrow();
  });

  it("rejeita título acima de 120 e descrição acima de 300", () => {
    expect(() => seoConfigSchema.parse({ ...valid, titulo: "x".repeat(121) })).toThrow();
    expect(() => seoConfigSchema.parse({ ...valid, descricao: "x".repeat(301) })).toThrow();
  });

  it("rejeita título/descrição vazios", () => {
    expect(() => seoConfigSchema.parse({ ...valid, titulo: "  " })).toThrow(/Título/);
    expect(() => seoConfigSchema.parse({ ...valid, descricao: "" })).toThrow();
  });

  it("rejeita og_image inválido mas aceita string vazia", () => {
    expect(() => seoConfigSchema.parse({ ...valid, og_image: "nao-eh-url" })).toThrow();
    expect(() => seoConfigSchema.parse({ ...valid, og_image: "" })).not.toThrow();
    expect(() => seoConfigSchema.parse({ ...valid, og_image: "https://x.com/a.png" })).not.toThrow();
  });
});