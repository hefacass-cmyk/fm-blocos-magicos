import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { fmSupabase } from "@/lib/fm-supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const ADMIN_KEY = "fm_admin_auth";
const BRAND_BLUE = "#1A4D7A";

export const Route = createFileRoute("/admin/seo")({
  head: () => ({ meta: [{ title: "SEO · Admin F&M" }] }),
  component: AdminSeoPage,
});

type Row = Record<string, unknown>;

function AdminSeoPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Row | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(ADMIN_KEY) !== "1") {
      navigate({ to: "/admin/login" });
      return;
    }
    fmSupabase
      .from("seo_config")
      .select("*")
      .order("pagina", { ascending: true })
      .then(({ data, error }) => {
        if (error) toast.error("Erro: " + error.message);
        setRows((data as Row[]) ?? []);
        setLoading(false);
      });
  }, [navigate]);

  const onSaved = (r: Row) => {
    setRows((arr) => arr.map((x) => (String(x.id) === String(r.id) ? r : x)));
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: BRAND_BLUE }}>
            <ArrowLeft className="h-4 w-4" /> Painel
          </Link>
          <h1 className="text-base font-extrabold" style={{ color: BRAND_BLUE }}>SEO — Páginas</h1>
          <span />
        </div>
      </header>
      <main className="container mx-auto max-w-5xl px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma configuração de SEO cadastrada.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={String(r.id)} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white p-4 shadow-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs text-slate-500">{String(r.pagina ?? "—")}</p>
                  <p className="truncate font-semibold" style={{ color: BRAND_BLUE }}>{String(r.titulo ?? "—")}</p>
                  <p className="line-clamp-1 text-xs text-slate-500">{String(r.descricao ?? "")}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditing(r)}>Editar</Button>
              </li>
            ))}
          </ul>
        )}
      </main>
      {editing && (
        <EditSeoModal
          row={editing}
          onClose={() => setEditing(null)}
          onSaved={(r) => { onSaved(r); setEditing(null); }}
        />
      )}
    </div>
  );
}

function EditSeoModal({ row, onClose, onSaved }: { row: Row; onClose: () => void; onSaved: (r: Row) => void }) {
  const [titulo, setTitulo] = useState(String(row.titulo ?? ""));
  const [descricao, setDescricao] = useState(String(row.descricao ?? ""));
  const [keywords, setKeywords] = useState(String(row.keywords ?? ""));
  const [ogTitle, setOgTitle] = useState(String(row.og_title ?? ""));
  const [ogDesc, setOgDesc] = useState(String(row.og_description ?? ""));
  const [ogImage, setOgImage] = useState(String(row.og_image ?? ""));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { data, error } = await fmSupabase
      .from("seo_config")
      .update({
        titulo,
        descricao,
        keywords,
        og_title: ogTitle || null,
        og_description: ogDesc || null,
        og_image: ogImage || null,
      })
      .eq("id", row.id)
      .select()
      .maybeSingle();
    setSaving(false);
    if (error) return toast.error("Erro: " + error.message);
    toast.success("SEO salvo");
    onSaved(data as Row);
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogTitle>Editar SEO — {String(row.pagina ?? "")}</DialogTitle>
        <div className="space-y-3 pt-2">
          <div><Label className="text-xs">Título</Label><Input value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={120} /></div>
          <div><Label className="text-xs">Descrição</Label><Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={300} rows={3} /></div>
          <div><Label className="text-xs">Keywords (separadas por vírgula)</Label><Input value={keywords} onChange={(e) => setKeywords(e.target.value)} /></div>
          <div><Label className="text-xs">OG Title</Label><Input value={ogTitle} onChange={(e) => setOgTitle(e.target.value)} maxLength={120} /></div>
          <div><Label className="text-xs">OG Description</Label><Textarea value={ogDesc} onChange={(e) => setOgDesc(e.target.value)} maxLength={300} rows={2} /></div>
          <div><Label className="text-xs">OG Image (URL)</Label><Input value={ogImage} onChange={(e) => setOgImage(e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-2 pt-3">
          <Button variant="outline" onClick={onClose}><X className="h-4 w-4" /> Cancelar</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}