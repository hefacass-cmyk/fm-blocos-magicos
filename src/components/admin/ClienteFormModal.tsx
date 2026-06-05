import { useEffect, useState } from "react";
import { Copy, MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  fmSupabase,
  gerarCodigoCliente,
  maskCep,
  maskCpfCnpj,
  maskPhone,
  onlyDigits,
  STATUS_LABELS,
  viaCep,
  type ObraStatus,
  type TipoPessoa,
} from "@/lib/fm-clientes";

type Row = Record<string, unknown>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente?: Row | null;
  parceiros: { id: string; nome: string }[];
  onSaved: (row: Row) => void;
}

const STATUSES: ObraStatus[] = ["orcamento", "iniciando", "andamento", "finalizando"];
const TIPOS_OBRA = ["Residencial", "Comercial", "Industrial"];

const empty = {
  tipo_pessoa: "PF" as TipoPessoa,
  cpf_cnpj: "",
  nome: "",
  telefone: "",
  whatsapp: "",
  email: "",
  cep: "",
  rua: "",
  numero: "",
  bairro: "",
  cidade: "",
  estado: "",
  obra_nome: "",
  obra_tipo: "Residencial",
  area_m2: "",
  data_inicio: "",
  data_termino: "",
  obra_status: "orcamento" as ObraStatus,
  progresso: 0,
  profissionais_canteiro: 0,
  parceiro_id: "",
  camera_url: "",
  observacoes: "",
  gerente_nome: "Hélder Souza",
  gerente_cargo: "Engenheiro responsável",
  gerente_whatsapp: "71999454343",
  codigo_cliente: "",
};

export default function ClienteFormModal({ open, onOpenChange, cliente, parceiros, onSaved }: Props) {
  const editing = !!cliente?.id;
  const [form, setForm] = useState<typeof empty>(empty);
  const [saving, setSaving] = useState(false);
  const [codigoFinal, setCodigoFinal] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCodigoFinal(null);
    if (cliente) {
      setForm({
        ...empty,
        ...Object.fromEntries(
          Object.entries(cliente).map(([k, v]) => [k, v ?? (empty as Row)[k] ?? ""]),
        ),
        cpf_cnpj: maskCpfCnpj(String(cliente.cpf_cnpj ?? ""), (cliente.tipo_pessoa as TipoPessoa) ?? "PF"),
      } as typeof empty);
    } else {
      setForm(empty);
    }
  }, [open, cliente]);

  const set = <K extends keyof typeof empty>(k: K, v: (typeof empty)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleCep = async (v: string) => {
    const masked = maskCep(v);
    set("cep", masked);
    if (onlyDigits(masked).length === 8) {
      const r = await viaCep(masked);
      if (r) {
        setForm((f) => ({ ...f, ...r }));
      }
    }
  };

  const gerar = () => set("codigo_cliente", gerarCodigoCliente(form.nome));

  useEffect(() => {
    if (!editing && form.nome && !form.codigo_cliente) {
      set("codigo_cliente", gerarCodigoCliente(form.nome));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.nome]);

  const salvar = async () => {
    if (!form.nome.trim()) return toast.error("Nome é obrigatório");
    const cpfDigits = onlyDigits(form.cpf_cnpj);
    const expected = form.tipo_pessoa === "PF" ? 11 : 14;
    if (cpfDigits.length !== expected) {
      return toast.error(form.tipo_pessoa === "PF" ? "CPF inválido" : "CNPJ inválido");
    }
    const codigo = (form.codigo_cliente || gerarCodigoCliente(form.nome)).trim();

    const payload: Row = {
      codigo_cliente: codigo,
      tipo_pessoa: form.tipo_pessoa,
      cpf_cnpj: cpfDigits,
      nome: form.nome.trim(),
      telefone: onlyDigits(form.telefone) || null,
      whatsapp: onlyDigits(form.whatsapp) || null,
      email: form.email.trim() || null,
      cep: onlyDigits(form.cep) || null,
      rua: form.rua || null,
      numero: form.numero || null,
      bairro: form.bairro || null,
      cidade: form.cidade || null,
      estado: form.estado || null,
      obra_nome: form.obra_nome || null,
      obra_tipo: form.obra_tipo,
      area_m2: form.area_m2 ? Number(form.area_m2) : null,
      data_inicio: form.data_inicio || null,
      data_termino: form.data_termino || null,
      obra_status: form.obra_status,
      progresso: Number(form.progresso) || 0,
      profissionais_canteiro: Number(form.profissionais_canteiro) || 0,
      parceiro_id: form.parceiro_id || null,
      camera_url: form.camera_url || null,
      observacoes: form.observacoes || null,
      gerente_nome: form.gerente_nome || null,
      gerente_cargo: form.gerente_cargo || null,
      gerente_whatsapp: onlyDigits(form.gerente_whatsapp) || null,
      atualizado_em: new Date().toISOString(),
    };

    setSaving(true);
    try {
      if (editing && cliente?.id) {
        const { data, error } = await fmSupabase
          .from("clientes")
          .update(payload)
          .eq("id", cliente.id)
          .select()
          .maybeSingle();
        if (error) throw error;
        toast.success("Cliente atualizado");
        onSaved((data as Row) ?? { ...cliente, ...payload });
        onOpenChange(false);
      } else {
        const { data, error } = await fmSupabase
          .from("clientes")
          .insert(payload)
          .select()
          .maybeSingle();
        if (error) throw error;
        toast.success("Cliente cadastrado");
        onSaved((data as Row) ?? payload);
        setCodigoFinal(codigo);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error("Erro ao salvar: " + msg);
    } finally {
      setSaving(false);
    }
  };

  const copyCodigo = async () => {
    if (!codigoFinal) return;
    await navigator.clipboard.writeText(codigoFinal);
    toast.success("Código copiado");
  };

  const enviarWhats = () => {
    if (!codigoFinal) return;
    const phone = onlyDigits(form.whatsapp || form.telefone);
    if (!phone) return toast.error("Cliente sem WhatsApp");
    const msg = `Olá ${form.nome}, seu código de acesso F&M é: ${codigoFinal}. Acesse sua obra em: https://www.fmsmartbuild.com.br/dashboard usando seu CPF/CNPJ + código.`;
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          <DialogDescription>Preencha os dados do cliente e da obra.</DialogDescription>
        </DialogHeader>

        {codigoFinal ? (
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-green-500 bg-green-50 p-4 text-center">
              <p className="text-sm text-slate-600">Código de acesso gerado:</p>
              <p className="my-2 font-mono text-2xl font-bold text-green-700">{codigoFinal}</p>
              <div className="flex justify-center gap-2">
                <Button variant="outline" size="sm" onClick={copyCodigo}>
                  <Copy className="h-4 w-4" /> Copiar
                </Button>
                <Button size="sm" onClick={enviarWhats} className="bg-green-600 hover:bg-green-700">
                  <MessageCircle className="h-4 w-4" /> Enviar por WhatsApp
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Fechar</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Dados Pessoais */}
            <Section title="Dados Pessoais">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" checked={form.tipo_pessoa === "PF"} onChange={() => set("tipo_pessoa", "PF")} />
                  Pessoa Física
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" checked={form.tipo_pessoa === "PJ"} onChange={() => set("tipo_pessoa", "PJ")} />
                  Pessoa Jurídica
                </label>
              </div>
              <Grid>
                <Field label={form.tipo_pessoa === "PF" ? "CPF *" : "CNPJ *"}>
                  <Input
                    value={form.cpf_cnpj}
                    onChange={(e) => set("cpf_cnpj", maskCpfCnpj(e.target.value, form.tipo_pessoa))}
                    placeholder={form.tipo_pessoa === "PF" ? "000.000.000-00" : "00.000.000/0000-00"}
                  />
                </Field>
                <Field label="Nome completo *">
                  <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} />
                </Field>
                <Field label="Telefone">
                  <Input value={form.telefone} onChange={(e) => set("telefone", maskPhone(e.target.value))} />
                </Field>
                <Field label="WhatsApp">
                  <Input value={form.whatsapp} onChange={(e) => set("whatsapp", maskPhone(e.target.value))} />
                </Field>
                <Field label="Email">
                  <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
                </Field>
              </Grid>
            </Section>

            {/* Endereço */}
            <Section title="Endereço da Obra">
              <Grid>
                <Field label="CEP">
                  <Input value={form.cep} onChange={(e) => handleCep(e.target.value)} placeholder="00000-000" />
                </Field>
                <Field label="Rua">
                  <Input value={form.rua} onChange={(e) => set("rua", e.target.value)} />
                </Field>
                <Field label="Número">
                  <Input value={form.numero} onChange={(e) => set("numero", e.target.value)} />
                </Field>
                <Field label="Bairro">
                  <Input value={form.bairro} onChange={(e) => set("bairro", e.target.value)} />
                </Field>
                <Field label="Cidade">
                  <Input value={form.cidade} onChange={(e) => set("cidade", e.target.value)} />
                </Field>
                <Field label="Estado">
                  <Input value={form.estado} onChange={(e) => set("estado", e.target.value.toUpperCase().slice(0, 2))} />
                </Field>
              </Grid>
            </Section>

            {/* Dados Obra */}
            <Section title="Dados da Obra">
              <Grid>
                <Field label="Nome da obra">
                  <Input value={form.obra_nome} onChange={(e) => set("obra_nome", e.target.value)} placeholder="Ex: Casa Teste 150m²" />
                </Field>
                <Field label="Tipo de obra">
                  <div className="flex gap-3 pt-2">
                    {TIPOS_OBRA.map((t) => (
                      <label key={t} className="flex items-center gap-1 text-sm">
                        <input type="radio" checked={form.obra_tipo === t} onChange={() => set("obra_tipo", t)} />
                        {t}
                      </label>
                    ))}
                  </div>
                </Field>
                <Field label="Área (m²)">
                  <Input type="number" value={form.area_m2} onChange={(e) => set("area_m2", e.target.value)} />
                </Field>
                <Field label="Profissionais no canteiro">
                  <Input type="number" value={form.profissionais_canteiro} onChange={(e) => set("profissionais_canteiro", Number(e.target.value))} />
                </Field>
                <Field label="Data início">
                  <Input type="date" value={form.data_inicio} onChange={(e) => set("data_inicio", e.target.value)} />
                </Field>
                <Field label="Previsão término">
                  <Input type="date" value={form.data_termino} onChange={(e) => set("data_termino", e.target.value)} />
                </Field>
                <Field label="Parceiro responsável">
                  <select
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                    value={form.parceiro_id}
                    onChange={(e) => set("parceiro_id", e.target.value)}
                  >
                    <option value="">—</option>
                    {parceiros.map((p) => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </Field>
                <Field label="URL câmera ao vivo">
                  <Input value={form.camera_url} onChange={(e) => set("camera_url", e.target.value)} placeholder="https://..." />
                </Field>
              </Grid>
              <Field label="Status da obra">
                <div className="flex flex-wrap gap-3 pt-1">
                  {STATUSES.map((s) => (
                    <label key={s} className="flex items-center gap-1 text-sm">
                      <input type="radio" checked={form.obra_status === s} onChange={() => set("obra_status", s)} />
                      {STATUS_LABELS[s]}
                    </label>
                  ))}
                </div>
              </Field>
              <Field label={`Progresso: ${form.progresso}%`}>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={form.progresso}
                  onChange={(e) => set("progresso", Number(e.target.value))}
                  className="w-full"
                />
              </Field>
              <Field label="Observações">
                <Textarea value={form.observacoes} onChange={(e) => set("observacoes", e.target.value)} />
              </Field>
            </Section>

            {/* Gerente */}
            <Section title="Gerente da Obra">
              <Grid>
                <Field label="Nome">
                  <Input value={form.gerente_nome} onChange={(e) => set("gerente_nome", e.target.value)} />
                </Field>
                <Field label="Cargo">
                  <Input value={form.gerente_cargo} onChange={(e) => set("gerente_cargo", e.target.value)} />
                </Field>
                <Field label="WhatsApp">
                  <Input value={form.gerente_whatsapp} onChange={(e) => set("gerente_whatsapp", e.target.value)} />
                </Field>
              </Grid>
            </Section>

            {/* Código */}
            <Section title="Código de Acesso">
              <div className="flex gap-2">
                <Input
                  value={form.codigo_cliente}
                  onChange={(e) => set("codigo_cliente", e.target.value)}
                  placeholder="FM-NOME-DDMMAAAA"
                  className="font-mono"
                />
                <Button type="button" variant="outline" onClick={gerar}>Gerar</Button>
              </div>
              <p className="text-xs text-slate-500">Editável antes de salvar. Após salvar, código e botão de envio aparecem destacados.</p>
            </Section>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
              <Button onClick={salvar} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Salvar alterações" : "Cadastrar cliente"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-lg border bg-slate-50 p-4">
      <h3 className="text-sm font-bold text-slate-700">{title}</h3>
      {children}
    </div>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}