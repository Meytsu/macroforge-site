"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleLogin() {
    if (!email || !email.includes("@")) {
      setError("Digite um e-mail valido");
      return;
    }
    if (!senha) {
      setError("Digite sua senha");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      sessionStorage.setItem("macroforge_session", JSON.stringify(data));
      router.push("/painel");
    } catch {
      setError("Erro ao conectar. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0D1117] text-white flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image src="/icon.png" alt="MacroForge" width={80} height={80} className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold">
            Macro<span className="text-amber-500">Forge</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">Acesse sua conta</p>
        </div>

        <div className="bg-[#161B22] border border-gray-800 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full px-4 py-3 rounded-lg bg-[#0D1117] border border-gray-700 text-white text-sm focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Senha</label>
            <div className="relative">
              <input
                type={showSenha ? "text" : "password"}
                value={senha}
                onChange={e => setSenha(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                placeholder="Sua senha"
                className="w-full px-4 py-3 pr-16 rounded-lg bg-[#0D1117] border border-gray-700 text-white text-sm focus:border-amber-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowSenha(!showSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs hover:text-amber-500"
              >
                {showSenha ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>

          <div className="text-right">
            <a
              href="/recuperar"
              className="text-amber-500 text-xs hover:underline"
            >
              Esqueceu a senha?
            </a>
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            onClick={handleLogin}
            disabled={loading}
            className={`w-full py-3 rounded-xl font-bold text-lg transition-colors ${
              loading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-amber-500 hover:bg-amber-600 text-black"
            }`}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </div>

        <p className="text-center mt-6 text-gray-500 text-sm">
          Ainda nao tem uma conta?{" "}
          <a href="/cadastro?plano=mensal" className="text-amber-500 hover:underline">
            Criar conta
          </a>
        </p>
      </div>
    </main>
  );
}
