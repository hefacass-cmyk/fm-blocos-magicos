import { useState } from "react";
import { Star, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fmSupabase } from "@/lib/fm-supabase";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const BRAND_YELLOW = "#F4B941";

export function AvaliarParceiroModal({
  parceiroId,
  parceiroNome,
  onClose,
}: {
  parceiroId: string | number;
  parceiroNome: string;
  onClose: () => void;
}) {
  const [nome, setNome] = useState("");
  const [nota, setNota] = useState(0);
  const [hover, setHover] = useState(0);
  const [servico, setServico] = useState("");
  const [comentario, setComentario] = useState("");
  const [depoimento, setDepoimento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [cidade, setCidade] = useState("");
  const [saving, setSaving] = useState(false);

  const salvar = async () => {
    if (!nome.trim()) return toast.error("Informe seu nome");
    if (nota < 1 || nota > 5) return toast.error("Selecione uma nota de 1 a 5");
    if (depoimento.length > 300) return toast.error("Depoimento: máximo 300 caracteres");
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return toast.error("E-mail inválido");
    }
    setSaving(true);
    const { error } = await fmSupabase.from("avaliacoes").insert({
      parceiro_id: parceiroId,
      nome_avaliador: nome.trim(),
      nota,
      servico: servico.trim() || null,
      comentario: comentario.trim() || null,
      depoimento: depoimento.trim() || null,
      telefone_avaliador: telefone.trim() || null,
      email_avaliador: email.trim() || null,
      cidade_avaliador: cidade.trim() || null,
      aprovado: false,
    });
    setSaving(false);
    if (error) return toast.error("Erro: " + error.message);
    toast.success("Avaliação enviada! Será publicada após aprovação.");
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle>Avaliar {parceiroNome}</DialogTitle>
        <div className="space-y-3 pt-2">
          <div>
            <Label className="text-xs">Seu nome *</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={120} />
          </div>
          <div>
            <Label className="text-xs">Nota *</Label>
            <div className="mt-1 flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setNota(i)}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(0)}
                  className="p-1"
                  aria-label={`${i} estrelas`}
                >
                  <Star
                    className="h-7 w-7 transition"
                    style={{ color: BRAND_YELLOW, fill: i <= (hover || nota) ? BRAND_YELLOW : "transparent" }}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs">Serviço avaliado</Label>
            <Input value={servico} onChange={(e) => setServico(e.target.value)} placeholder="Ex: reforma de cozinha" maxLength={200} />
          </div>
          <div>
            <Label className="text-xs">Comentário</Label>
            <Textarea value={comentario} onChange={(e) => setComentario(e.target.value)} rows={3} maxLength={1000} />
          </div>
          <div>
            <Label className="text-xs">Depoimento (opcional, até 300 caracteres)</Label>
            <Textarea
              value={depoimento}
              onChange={(e) => setDepoimento(e.target.value.slice(0, 300))}
              rows={3}
              maxLength={300}
              placeholder="Conte como foi sua experiência com este parceiro..."
            />
            <p className="mt-1 text-[10px] text-slate-500 text-right">{depoimento.length}/300</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Telefone (opcional)</Label>
              <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} maxLength={20} placeholder="(71) 99999-9999" />
            </div>
            <div>
              <Label className="text-xs">Cidade (opcional)</Label>
              <Input value={cidade} onChange={(e) => setCidade(e.target.value)} maxLength={100} placeholder="Sua cidade" />
            </div>
          </div>
          <div>
            <Label className="text-xs">E-mail (opcional)</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} placeholder="voce@exemplo.com" />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-3">
          <Button variant="outline" onClick={onClose}><X className="h-4 w-4" /> Cancelar</Button>
          <Button onClick={salvar} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Enviar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}