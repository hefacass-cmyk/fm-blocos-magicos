import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Users, Building2, CheckCircle2, DollarSign, FileText, Clock,
  PenSquare, ThumbsUp, TrendingUp, AlertTriangle, Handshake, UserPlus,
} from "lucide-react";
import { fmSupabase } from "@/lib/fm-supabase";
import { BRL } from "@/lib/fm-admin";

type Stats = {
  total_clientes: number;
  obras_andamento: number;
  obras_finalizando: number;
  volume_total_obras: number;
  contratos_pendentes: number;
  aguardando_cliente: number;
  aguardando_fm: number;
  contratos_assinados: number;
  total_recebido: number;
  total_atrasado: number;
  parceiros_ativos: number;
  leads_pendentes: number;
};

const ZERO: Stats = {
  total_clientes: 0, obras_andamento: 0, obras_finalizando: 0, volume_total_obras: 0,
  contratos_pendentes: 0, aguardando_cliente: 0, aguardando_fm: 0, contratos_assinados: 0,
  total_recebido: 0, total_atrasado: 0, parceiros_ativos: 0, leads_pendentes: 0,
};

function num(v: unknown): number { return Number(v ?? 0) || 0; }

async function fetchStats(): Promise<Stats> {
  // 1) tenta a view dashboard_admin
  try {
    const { data, error } = await fmSupabase.from("dashboard_admin").select("*").limit(1).maybeSingle();
    if (!error && data) {
      const r = data as Record<string, unknown>;
      return {
        total_clientes: num(r.total_clientes),
        obras_andamento: num(r.obras_andamento),
        obras_finalizando: num(r.obras_finalizando),
        volume_total_obras: num(r.volume_total_obras),
        contratos_pendentes: num(r.contratos_pendentes),
        aguardando_cliente: num(r.aguardando_cliente),
        aguardando_fm: num(r.aguardando_fm),
        contratos_assinados: num(r.contratos_assinados),
        total_recebido: num(r.total_recebido),
        total_atrasado: num(r.total_atrasado),
        parceiros_ativos: num(r.parceiros_ativos),
        leads_pendentes: num(r.leads_pendentes),
      };
    }
  } catch { /* fallback abaixo */ }

  // 2) fallback: agrega via tabelas individuais (best-effort)
  const out: Stats = { ...ZERO };
  const safeCount = async (table: string, filter?: (q: any) => any) => {
    try {
      let q = fmSupabase.from(table).select("*", { count: "exact", head: true });
      if (filter) q = filter(q);
      const { count } = await q;
      return count || 0;
    } catch { return 0; }
  };
  out.total_clientes = await safeCount("clientes");
  out.parceiros_ativos = await safeCount("parceiros", (q) => q.eq("status", "ativo"));
  out.contratos_pendentes = await safeCount("contratos", (q) => q.eq("status", "rascunho"));
  out.aguardando_cliente = await safeCount("contratos", (q) => q.eq("status", "aguardando_cliente"));
  out.aguardando_fm = await safeCount("contratos", (q) => q.eq("status", "aguardando_fm"));
  out.contratos_assinados = await safeCount("contratos", (q) => q.eq("status", "assinado"));
  out.leads_pendentes = await safeCount("referral_leads", (q) => q.eq("status", "pendente"));
  try {
    const { data: fin } = await fmSupabase.from("obra_financeiro").select("status, valor, data_vencimento");
    const hoje = new Date().toISOString().slice(0, 10);
    (fin || []).forEach((r: any) => {
      const v = Number(r.valor || 0);
      if (r.status === "pago") out.total_recebido += v;
      else if (r.data_vencimento && r.data_vencimento < hoje) out.total_atrasado += v;
    });
  } catch { /* ignore */ }
  try {
    const { data: obras } = await fmSupabase.from("contratos").select("status, valor_total");
    (obras || []).forEach((o: any) => {
      if (o.status === "em_andamento" || o.status === "assinado") out.obras_andamento++;
      if (o.status === "finalizando") out.obras_finalizando++;
      out.volume_total_obras += Number(o.valor_total || 0);
    });
  } catch { /* ignore */ }
  return out;
}

function Card({
  to, icon, label, value, color, pulse,
}: { to: string; icon: React.ReactNode; label: string; value: React.ReactNode; color: string; pulse?: boolean }) {
  return (
    <Link
      to={to}
      className={`group flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${pulse ? "animate-pulse" : ""}`}
    >
      <div className="rounded-lg p-2.5 text-white" style={{ backgroundColor: color }}>{icon}</div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase font-semibold text-slate-500 truncate">{label}</div>
        <div className="text-xl font-extrabold text-slate-900 truncate">{value}</div>
      </div>
    </Link>
  );
}

export function DashboardResumo() {
  const [s, setS] = useState<Stats>(ZERO);

  useEffect(() => {
    let active = true;
    const load = async () => { const r = await fetchStats(); if (active) setS(r); };
    load();
    const id = setInterval(load, 60_000);
    return () => { active = false; clearInterval(id); };
  }, []);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card to="/admin/dashboard" icon={<Users className="h-4 w-4" />} label="Total Clientes" value={s.total_clientes} color="#1A4D7A" />
        <Card to="/admin/dashboard" icon={<Building2 className="h-4 w-4" />} label="Em Andamento" value={s.obras_andamento} color="#1A4D7A" />
        <Card to="/admin/dashboard" icon={<CheckCircle2 className="h-4 w-4" />} label="Finalizando" value={s.obras_finalizando} color="#06A77D" />
        <Card to="/admin/dashboard" icon={<DollarSign className="h-4 w-4" />} label="Volume Total" value={BRL(s.volume_total_obras)} color="#0F766E" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card to="/admin/contratos" icon={<FileText className="h-4 w-4" />} label="Pendentes análise" value={s.contratos_pendentes} color="#F4B941" pulse={s.contratos_pendentes > 0} />
        <Card to="/admin/contratos" icon={<Clock className="h-4 w-4" />} label="Aguardando Cliente" value={s.aguardando_cliente} color="#F59E0B" />
        <Card to="/admin/contratos" icon={<PenSquare className="h-4 w-4" />} label="Aguardando F&M assinar" value={s.aguardando_fm} color="#1A4D7A" pulse={s.aguardando_fm > 0} />
        <Card to="/admin/contratos" icon={<ThumbsUp className="h-4 w-4" />} label="Assinados" value={s.contratos_assinados} color="#06A77D" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card to="/admin/contratos" icon={<TrendingUp className="h-4 w-4" />} label="Total Recebido" value={BRL(s.total_recebido)} color="#06A77D" />
        <Card to="/admin/contratos" icon={<AlertTriangle className="h-4 w-4" />} label="Total Atrasado" value={BRL(s.total_atrasado)} color="#DC2626" pulse={s.total_atrasado > 0} />
        <Card to="/admin/dashboard" icon={<Handshake className="h-4 w-4" />} label="Parceiros Ativos" value={s.parceiros_ativos} color="#1A4D7A" />
        <Card to="/admin/leads" icon={<UserPlus className="h-4 w-4" />} label="Leads Pendentes" value={s.leads_pendentes} color="#F4B941" pulse={s.leads_pendentes > 0} />
      </div>
    </div>
  );
}

export function AlertasAdmin() {
  const [s, setS] = useState<Stats>(ZERO);
  const [leadsAntigos, setLeadsAntigos] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const r = await fetchStats();
      if (active) setS(r);
      try {
        const dt = new Date(); dt.setDate(dt.getDate() - 7);
        const { count } = await fmSupabase
          .from("referral_leads")
          .select("*", { count: "exact", head: true })
          .eq("status", "pendente")
          .lt("created_at", dt.toISOString());
        if (active) setLeadsAntigos(count || 0);
      } catch { /* ignore */ }
    };
    load();
    const id = setInterval(load, 60_000);
    return () => { active = false; clearInterval(id); };
  }, []);

  const items: React.ReactNode[] = [];
  if (s.aguardando_fm > 0) {
    items.push(
      <Link key="fm" to="/admin/contratos" className="flex items-center justify-between gap-3 rounded-lg border border-blue-300 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900 animate-pulse hover:bg-blue-100">
        <span className="flex items-center gap-2"><PenSquare className="h-4 w-4" /> Você tem {s.aguardando_fm} contrato(s) aguardando sua assinatura</span>
        <span className="text-xs underline">Ver</span>
      </Link>
    );
  }
  if (s.total_atrasado > 0) {
    items.push(
      <Link key="atr" to="/admin/contratos" className="flex items-center justify-between gap-3 rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-900 hover:bg-rose-100">
        <span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Pagamentos atrasados: {BRL(s.total_atrasado)}</span>
        <span className="text-xs underline">Ver</span>
      </Link>
    );
  }
  if (leadsAntigos > 0) {
    items.push(
      <Link key="lead" to="/admin/leads" className="flex items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 hover:bg-amber-100">
        <span className="flex items-center gap-2"><Clock className="h-4 w-4" /> {leadsAntigos} lead(s) sem retorno há mais de 7 dias</span>
        <span className="text-xs underline">Ver</span>
      </Link>
    );
  }
  if (items.length === 0) return null;
  return <div className="space-y-2">{items}</div>;
}
