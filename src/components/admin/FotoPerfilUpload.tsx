import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { uploadParaBucket } from "@/lib/fm-admin";

type Props = {
  bucket: string;
  path: string;
  value?: string | null;
  onChange: (url: string) => Promise<void> | void;
  nome?: string | null;
  size?: number;
};

function iniciais(n?: string | null) {
  if (!n) return "?";
  return n.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() || "").join("") || "?";
}

export function FotoPerfilUpload({ bucket, path, value, onChange, nome, size = 96 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = () => inputRef.current?.click();

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    if (f.size > 4 * 1024 * 1024) { toast.error("Imagem muito grande (máx 4MB)."); return; }
    setBusy(true);
    try {
      const ext = (f.name.split(".").pop() || "jpg").toLowerCase();
      const finalPath = path.includes(".") ? path : `${path}.${ext}`;
      const url = await uploadParaBucket(bucket, finalPath, f);
      const cacheBust = `${url}?t=${Date.now()}`;
      await onChange(cacheBust);
      toast.success("Foto atualizada");
    } catch (e: any) {
      toast.error(e?.message || "Falha no upload");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div
        className="relative overflow-hidden rounded-full border-2 border-white shadow ring-2 ring-slate-200 bg-slate-100 flex items-center justify-center text-slate-500 font-bold"
        style={{ width: size, height: size, fontSize: size / 3 }}
      >
        {value ? (
          <img src={value} alt={nome || "Foto"} className="h-full w-full object-cover" />
        ) : (
          <span>{iniciais(nome)}</span>
        )}
      </div>
      <div>
        <button
          type="button"
          onClick={pick}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
          {busy ? "Enviando…" : "Alterar Foto"}
        </button>
        <p className="mt-1 text-[11px] text-slate-500">JPG ou PNG, até 4MB.</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}
