import { fmSupabase } from "./fm-supabase";

export type EmpresaConfig = {
  razao_social: string;
  cnpj: string;
  endereco: string;
  representante_nome: string;
  representante_cpf: string;
  representante_rg: string;
  representante_estado_civil: string;
  representante_profissao: string;
  representante_nascimento: string | null;
  representante_endereco: string;
  responsavel_tecnico: string;
  crea: string;
  pix_chave: string;
  logo_url: string | null;
  assinatura_fm_default: string | null;
};

export const EMPRESA_DEFAULT: EmpresaConfig = {
  razao_social: "F&M Construções Inteligentes",
  cnpj: "21.560.948/0001-71",
  endereco: "Alameda Via Parque, S/N, Lote GS 09, Jauá, Camaçari/BA",
  representante_nome: "Hélder Fabrício Lima de Souza",
  representante_cpf: "790.955.695-00",
  representante_rg: "06458431-30",
  representante_estado_civil: "Casado",
  representante_profissao: "Empresário",
  representante_nascimento: "1979-11-03",
  representante_endereco: "Alameda Via Parque, S/N, Lote GS 09, Jauá, Camaçari/BA",
  responsavel_tecnico: "Eng. Francisco A. P. Jr.",
  crea: "38.135-D/BA",
  pix_chave: "21.560.948/0001-71",
  logo_url: null,
  assinatura_fm_default: null,
};

export async function carregarEmpresaConfig(): Promise<EmpresaConfig> {
  try {
    const { data } = await fmSupabase.from("empresa_config").select("*").limit(1).maybeSingle();
    if (!data) return EMPRESA_DEFAULT;
    return { ...EMPRESA_DEFAULT, ...(data as Partial<EmpresaConfig>) };
  } catch {
    return EMPRESA_DEFAULT;
  }
}