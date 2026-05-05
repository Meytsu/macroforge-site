"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const PLANOS = [
  { id: "mensal", nome: "Mensal", preco: "R$ 14,90", periodo: "/mes", destaque: false },
  { id: "trimestral", nome: "Trimestral", preco: "R$ 34,90", periodo: "/3 meses", destaque: true, economia: "22%" },
  { id: "semestral", nome: "Semestral", preco: "R$ 59,90", periodo: "/6 meses", destaque: false, economia: "33%" },
];

export default function PlanosPage() {
  const router = useRouter();
  const [planoId, setPlanoId] = useState("mensal");
  const [email, setEmail] = useState("");
  const [emailConfirmado, setEmailConfirmado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [logado, setLogado] = useState(false);

  useEffect(() => {
    const session = sessionStorage.getItem("macroforge_session");
    if (session) {
      try {
        const data = JSON.parse(session);
        if (data.cliente?.email) {
          setEmail(data.cliente.email);
          setEmailConfirmado(true);
          setLogado(true);
        }
      } catch { /* ignora */ }
    }
  }, []);

  async function handleComprar() {
    if (!email || !email.includes("@")) {
      setError("Digite um e-mail valido");
      return;
    }

    if (!logado) {
      // Se nao esta logado, redireciona pro login primeiro
      router.push("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plano: planoId, email }),
      });

      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      window.location.href = data.checkout_url;
    } catch {
      setError("Erro ao conectar. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0D1117] text-white pt-20 px-4 pb-12">
      <div className="max-w-2xl mx-auto">

        <div className="text-center mb-8">
          <Image src="/icon.png" alt="MacroForge" width={60} height={60} className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Escolha seu plano</h1>
          <p className="text-gray-400 text-sm">Cancele quando quiser. Sem fidelidade.</p>
        </div>

        {/* Planos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {PLANOS.map(p => (
            <button
              key={p.id}
              onClick={() => setPlanoId(p.id)}
              className={`relative rounded-xl p-5 border text-left transition-all ${
                planoId === p.id
                  ? "border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30"
                  : "border-gray-700 bg-[#161B22] hover:border-gray-500"
              }`}
            >
              {p.destaque && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Popular
                </div>
              )}
              <p className="font-bold">{p.nome}</p>
              <p className="text-amber-500 font-bold text-2xl mt-1">{p.preco}</p>
              <p className="text-gray-500 text-xs">{p.periodo}</p>
              {p.economia && (
                <p className="text-green-400 text-xs mt-1">Economia de {p.economia}</p>
              )}
            </button>
          ))}
        </div>

        {/* Email com LED verde */}
        <div className="bg-[#161B22] border border-gray-800 rounded-xl p-6 mb-6">
          <label className="block text-sm text-gray-400 mb-2">E-mail da conta</label>
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setEmailConfirmado(false); }}
              disabled={logado}
              className={`w-full px-4 py-3 rounded-lg bg-[#0D1117] text-white text-sm focus:outline-none ${
                emailConfirmado
                  ? "border-2 border-green-500 shadow-[0_0_10px_rgba(74,222,128,0.3)]"
                  : "border border-gray-700 focus:border-amber-500"
              } ${logado ? "opacity-80" : ""}`}
            />
            {emailConfirmado && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-green-400 text-xs font-medium">Confirmado</span>
              </div>
            )}
          </div>
          {emailConfirmado && (
            <p className="text-green-400 text-xs mt-2">
              A licenca sera vinculada a este e-mail. Correto?
            </p>
          )}
          {!logado && (
            <p className="text-yellow-400 text-xs mt-2">
              Voce precisa fazer <a href="/login" className="text-amber-500 hover:underline">login</a> ou <a href="/cadastro" className="text-amber-500 hover:underline">criar uma conta</a> primeiro.
            </p>
          )}

          {error && <p className="text-red-400 text-sm mt-3 text-center">{error}</p>}

          <button
            onClick={handleComprar}
            disabled={loading || !logado}
            className={`w-full mt-4 py-4 rounded-xl font-bold text-lg transition-colors ${
              loading || !logado
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-amber-500 hover:bg-amber-600 text-black"
            }`}
          >
            {loading ? "Redirecionando..." : !logado ? "Faca login para continuar" : "Pagar com Mercado Pago"}
          </button>

          <p className="text-gray-500 text-xs text-center mt-3">
            Pagamento seguro via Mercado Pago. Aceitamos PIX, cartao e boleto.
          </p>
        </div>
      </div>
    </main>
  );
}
