"use client";

import { useState } from "react";

export default function CheckoutButton({
  plano,
  highlight,
}: {
  plano: string;
  highlight: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  async function handleCheckout() {
    if (!showEmail) {
      setShowEmail(true);
      return;
    }

    if (!email || !email.includes("@")) {
      setError("Digite um e-mail valido");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plano, email }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      // No modo teste, usa sandbox_url. Em produção, usa checkout_url
      const url = data.sandbox_url || data.checkout_url;
      window.location.href = url;
    } catch {
      setError("Erro ao conectar. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {showEmail && (
        <>
          <input
            type="email"
            placeholder="Seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[#0D1117] border border-gray-700 text-white text-sm focus:border-amber-500 focus:outline-none"
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
        </>
      )}
      <button
        onClick={handleCheckout}
        disabled={loading}
        className={`block w-full text-center py-3 rounded-lg font-bold transition-colors ${
          highlight
            ? "bg-amber-500 hover:bg-amber-600 text-black"
            : "border border-gray-600 hover:border-amber-500 text-gray-300"
        } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {loading ? "Redirecionando..." : showEmail ? "Pagar com Mercado Pago" : "Assinar"}
      </button>
    </div>
  );
}
