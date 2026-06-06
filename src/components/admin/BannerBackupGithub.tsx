import { useEffect, useState } from "react";
import { Github, X } from "lucide-react";

const KEY = "fm_admin_dismiss_github_banner";

export function BannerBackupGithub() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setShow(localStorage.getItem(KEY) !== "1");
  }, []);

  if (!show) return null;

  return (
    <div className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <div className="flex items-start gap-3">
        <Github className="mt-0.5 h-5 w-5 shrink-0" />
        <p>
          <strong>⚠️ Lembre-se de exportar o projeto para o GitHub regularmente</strong>
          <br />
          Em Lovable → Settings → GitHub para evitar perda de código.
        </p>
      </div>
      <button
        onClick={() => { localStorage.setItem(KEY, "1"); setShow(false); }}
        className="rounded-md p-1 hover:bg-amber-100"
        aria-label="Fechar"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}