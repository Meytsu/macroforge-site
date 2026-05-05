"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function CadastroPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [senhaValida, setSenhaValida] = useState({ maiuscula: false, minuscula: false, especial: false, tamanho: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "exists" | "available">("idle");

  function validarSenha(s: string) {
    setSenha(s);
    setSenhaValida({
      tamanho: s.length >= 8,
      maiuscula: /[A-Z]/.test(s),
      minuscula: /[a-z]/.test(s),
      especial: /[!@#$%&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(s),
    });
  }

  const senhaOk = senhaValida.tamanho && senhaValida.maiuscula && senhaValida.minuscula && senhaValida.especial;

  async function checkEmail(emailValue: string) {
    if (!emailValue || !emailValue.includes("@")) { setEmailStatus("idle"); return; }
    setEmailStatus("checking");
    try {
      const res = await fetch("/api/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue }),
      });
      const data = await res.json();
      setEmailStatus(data.exists && data.temSenha ? "exists" : "available");
    } catch { setEmailStatus("idle"); }
  }

  async function handleSubmit() {
    if (!nome.trim()) { setError("Digite seu nome"); return; }
    if (!email.includes("@")) { setError("Digite um e-mail valido"); return; }
    if (emailStatus === "exists") { setError("E-mail ja cadastrado. Faca login."); return; }
    if (!senhaOk) { setError("Senha nao atende os requisitos"); return; }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha }),
      });

      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }

      // Login automatico
      const loginRes = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      const loginData = await loginRes.json();
      if (loginData.cliente) {
        sessionStorage.setItem("macroforge_session", JSON.stringify(loginData));
      }

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
          <p className="text-gray-400 text-sm mt-2">Crie sua conta em segundos</p>
        </div>

        <div className="bg-[#161B22] border border-gray-800 rounded-xl p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nome</label>
            <input
              type="text" value={nome} onChange={e => setNome(e.target.value)}
              placeholder="Seu nome"
              className="w-full px-4 py-3 rounded-lg bg-[#0D1117] border border-gray-700 text-white text-sm focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">E-mail</label>
            <input
              type="email" value={email}
              onChange={e => { setEmail(e.target.value); setEmailStatus("idle"); }}
              onBlur={() => checkEmail(email)}
              placeholder="seu@email.com"
              className={`w-full px-4 py-3 rounded-lg bg-[#0D1117] border text-white text-sm focus:outline-none ${
                emailStatus === "exists" ? "border-red-500" :
                emailStatus === "available" ? "border-green-500" :
                "border-gray-700 focus:border-amber-500"
              }`}
            />
            {emailStatus === "exists" && (
              <p className="text-red-400 text-xs mt-1">
                E-mail ja cadastrado. <a href="/login" className="text-amber-500 hover:underline">Entrar</a>
              </p>
            )}
            {emailStatus === "available" && (
              <p className="text-green-400 text-xs mt-1">E-mail disponivel</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Senha</label>
            <div className="relative">
              <input
                type={showSenha ? "text" : "password"} value={senha}
                onChange={e => validarSenha(e.target.value)}
                placeholder="Crie sua senha"
                className="w-full px-4 py-3 pr-16 rounded-lg bg-[#0D1117] border border-gray-700 text-white text-sm focus:border-amber-500 focus:outline-none"
              />
              <button type="button" onClick={() => setShowSenha(!showSenha)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs hover:text-amber-500">
                {showSenha ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            {senha.length > 0 && (
              <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                <span className={senhaValida.tamanho ? "text-green-400" : "text-gray-500"}>
                  {senhaValida.tamanho ? "\u2713" : "\u2717"} 8+ caracteres
                </span>
                <span className={senhaValida.maiuscula ? "text-green-400" : "text-gray-500"}>
                  {senhaValida.maiuscula ? "\u2713" : "\u2717"} Maiuscula
                </span>
                <span className={senhaValida.minuscula ? "text-green-400" : "text-gray-500"}>
                  {senhaValida.minuscula ? "\u2713" : "\u2717"} Minuscula
                </span>
                <span className={senhaValida.especial ? "text-green-400" : "text-gray-500"}>
                  {senhaValida.especial ? "\u2713" : "\u2717"} Especial
                </span>
              </div>
            )}
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button onClick={handleSubmit} disabled={loading}
            className={`w-full py-3 rounded-xl font-bold text-lg transition-colors ${
              loading ? "bg-gray-600 cursor-not-allowed" : "bg-amber-500 hover:bg-amber-600 text-black"
            }`}>
            {loading ? "Criando conta..." : "Criar conta"}
          </button>
        </div>

        <p className="text-center mt-6 text-gray-500 text-sm">
          Ja tem uma conta? <a href="/login" className="text-amber-500 hover:underline">Entrar</a>
        </p>
      </div>
    </main>
  );
}
