import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fmSupabase } from "@/lib/fm-supabase";
import { uploadParaBucket } from "@/lib/fm-admin";

type Props = {
  open: boolean;
  onClose: () => void;
  lancamentoId: string;
  contratoId: string;
  onSaved: (patch: Record<string, unknown>) => void;
};

export function MarcarPagoModal({ open, onClose, lancamentoId, contratoId, onSaved }: Props) {
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));
  const [observacao, setObservacao] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const salvar = async () => {
    setBusy(true);
    try {
      let comprovante_url: string | null = null;
      if (file) {
        const ext = (file.name.split(".").pop() || "pdf").toLowerCase();
        const path = `${contratoId}/${lancamentoId}.${ext}`;
        comprovante_url = await uploadParaBucket("comprovantes-pagamento", path, file);
      }
      const patch: Record<string, unknown> = {
        status: "pago",
        data_pagamento: data,
        observacao_pagamento: observacao || null,
      };
      if (comprovante_url) patch.comprovante_url = comprovante_url;
      const { error } = await fmSupabase.from("obra_financeiro").update(patch).eq("id", lancamentoId);
      if (error) throw error;
      onSaved(patch);
      toast.success("Pagamento registrado");
      onClose();
    } catch (e: any) {
      toast.error(e?.message || "Falha ao salvar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Marcar como Pago</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="dt">Data do pagamento</Label>
            <Input id="dt" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="cmp">Comprovante (PDF / imagem)</Label>
            <Input id="cmp" type="file" accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <div>
            <Label htmlFor="obs">Observação</Label>
            <Textarea id="obs" rows={3} value={observacao} onChange={(e) => setObservacao(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancelar</Button>
          <Button onClick={salvar} disabled={busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
