import { z } from "zod";

// ---------- Permissões ----------
export const ADMIN_SESSION_KEY = "fm_admin_auth";

export function isAdminAuthenticated(storage: Pick<Storage, "getItem"> | null | undefined): boolean {
  if (!storage) return false;
  return storage.getItem(ADMIN_SESSION_KEY) === "1";
}

// ---------- Relatórios Semanais ----------
export function statusBadge(status: string): { label: string; color: string } {
  if (status === "enviado") return { label: "Enviado", color: "#1A4D7A" };
  if (status === "visualizado") return { label: "Visualizado", color: "#06A77D" };
  return { label: "Rascunho", color: "#94a3b8" };
}

/** Semana corrente: sexta (início) → quinta (fim), ambos em YYYY-MM-DD UTC. */
export function sextaQuinta(today: Date = new Date()): { ini: string; fim: string } {
  const day = today.getDay();
  const diff = (day - 5 + 7) % 7;
  const sexta = new Date(today);
  sexta.setDate(today.getDate() - diff);
  const quinta = new Date(sexta);
  quinta.setDate(sexta.getDate() + 6);
  return { ini: sexta.toISOString().slice(0, 10), fim: quinta.toISOString().slice(0, 10) };
}

export const relatorioSemanalSchema = z.object({
  cliente_id: z.string().uuid().or(z.string().min(1)),
  semana_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  semana_fim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  titulo: z.string().trim().min(1, "Título obrigatório").max(120),
  resumo: z.string().max(2000).optional().default(""),
  progresso_semana: z.number().min(0).max(100),
  progresso_total: z.number().min(0).max(100),
  profissionais: z.number().int().min(0).max(999),
  servicos_executados: z.array(z.string().min(1).max(120)).max(50),
  materiais_utilizados: z.array(z.string().min(1).max(120)).max(50),
  pendencias: z.array(z.string().min(1).max(200)).max(50),
  proximos_passos: z.array(z.string().min(1).max(200)).max(50),
  valor_medido: z.number().min(0),
}).refine((v) => v.semana_inicio <= v.semana_fim, {
  message: "semana_inicio deve ser anterior ou igual a semana_fim",
  path: ["semana_fim"],
});

export function onlyDigits(s: string): string {
  return s.replace(/\D/g, "");
}

export function buildRelatorioWhatsappLink(input: {
  fone: string;
  nomeCliente: string;
  titulo: string;
  progressoTotal: number | string;
  profissionais: number | string;
  servicos: string[] | string;
}): string | null {
  const fone = onlyDigits(input.fone);
  if (!fone) return null;
  const servicos = Array.isArray(input.servicos) ? input.servicos.join(", ") : input.servicos;
  const msg =
    `📊 *Relatório Semanal F&M — ${input.titulo}*\n\n` +
    `Olá ${input.nomeCliente}! Seu relatório semanal está disponível.\n\n` +
    `📈 Progresso total: ${input.progressoTotal}%\n` +
    `👷 Profissionais: ${input.profissionais}\n` +
    `✅ Executado: ${servicos}\n\n` +
    `Acesse sua área para ver detalhes e fotos:\n` +
    `https://www.fmsmartbuild.com.br/dashboard`;
  return `https://wa.me/55${fone}?text=${encodeURIComponent(msg)}`;
}

// ---------- Avaliações ----------
export const avaliacaoSchema = z.object({
  parceiro_id: z.union([z.string().min(1), z.number()]),
  nome_avaliador: z.string().trim().min(1, "Informe seu nome").max(120),
  nota: z.number().int().min(1, "Nota mínima 1").max(5, "Nota máxima 5"),
  servico: z.string().trim().max(200).optional().nullable(),
  comentario: z.string().trim().max(1000).optional().nullable(),
  aprovado: z.boolean().default(false),
});

export type Avaliacao = z.infer<typeof avaliacaoSchema>;

/** Média (1 casa decimal) e total a partir de avaliações aprovadas. */
export function calcularMediaAvaliacoes(avaliacoes: Array<{ nota: number; aprovado?: boolean }>): {
  media: number;
  total: number;
} {
  const aprovadas = avaliacoes.filter((a) => a.aprovado !== false);
  if (aprovadas.length === 0) return { media: 0, total: 0 };
  const soma = aprovadas.reduce((acc, a) => acc + a.nota, 0);
  return { media: Math.round((soma / aprovadas.length) * 10) / 10, total: aprovadas.length };
}

// ---------- SEO ----------
export const seoConfigSchema = z.object({
  pagina: z.string().trim().min(1).max(120),
  titulo: z.string().trim().min(1, "Título obrigatório").max(120, "Máx. 120 caracteres"),
  descricao: z.string().trim().min(1, "Descrição obrigatória").max(300, "Máx. 300 caracteres"),
  keywords: z.string().max(500).optional().default(""),
  og_title: z.string().max(120).optional().nullable(),
  og_description: z.string().max(300).optional().nullable(),
  og_image: z.string().url("URL inválida").optional().nullable().or(z.literal("")),
});