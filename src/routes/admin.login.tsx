import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock } from "lucide-react";
import { signInAdmin } from "@/lib/fm-admin-auth";

const BRAND_BLUE = "#1A4D7A";
const BRAND_YELLOW = "#F4B941";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "Admin F&M" }] }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    const r = await signInAdmin(email.trim(), pwd);
    setLoading(false);
    if (!r.ok) { setErr(r.error || "Acesso negado."); return; }
    navigate({ to: "/admin/dashboard" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 flex items-center justify-center">
          <div className="grid h-14 w-14 place-items-center rounded-full" style={{ backgroundColor: BRAND_YELLOW }}>
            <Lock className="h-6 w-6" style={{ color: BRAND_BLUE }} />
          </div>
        </div>
        <h1 className="text-center text-xl font-extrabold" style={{ color: BRAND_BLUE }}>
          Chave Mestra · Admin F&M
        </h1>
        <p className="mt-1 text-center text-xs text-slate-500">Acesso restrito</p>
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setErr(""); }}
          placeholder="E-mail"
          className="mt-6 w-full rounded-md border border-slate-300 px-3 py-3 text-sm focus:border-[#1A4D7A] focus:outline-none"
          autoFocus
          required
        />
        <input
          type="password"
          value={pwd}
          onChange={(e) => { setPwd(e.target.value); setErr(""); }}
          placeholder="Senha"
          className="mt-3 w-full rounded-md border border-slate-300 px-3 py-3 text-sm focus:border-[#1A4D7A] focus:outline-none"
          required
        />
        {err && <p className="mt-2 text-xs text-red-600">{err}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded-lg py-3 text-sm font-extrabold"
          style={{ backgroundColor: BRAND_BLUE, color: "#fff" }}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}