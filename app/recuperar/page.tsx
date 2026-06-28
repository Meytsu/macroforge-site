"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function RecuperarPage() {
  const router = useRouter();
  const [etapa, setEtapa] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sucesso, setSucesso] = useState("");

  const senhaValida = {
    tamanho: novaSenha.length >= 8,
    maiuscula: /[A-Z]/.test(novaSenha),
    minuscula: /[a-z]/.test(novaSenha),
    especial: /[!@#$%&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(novaSenha),
    igual: novaSenha === confirmar && confirmar.length > 0,
  };
  const senhaOk = senhaValida.tamanho && senhaValida.maiuscula && senhaValida.minuscula && senhaValida.especial && senhaValida.igual;

  async function enviarCodigo() {
    if (!email.includes("@")) { setError("Digite um e-mail valido"); return; }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/recuperar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.ok) {
        setSucesso("Codigo enviado! Verifique seu e-mail.");
        setEtapa(2);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Erro de conexao");
    }
    setLoading(false);
  }

  async function verificarCodigo() {
    if (codigo.length !== 8) { setError("Digite o codigo de 8 caracteres"); return; }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/verificar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, codigo }),
      });
      const data = await res.json();
      if (data.ok) {
        setSucesso("");
        setEtapa(3);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Erro de conexao");
    }
    setLoading(false);
  }

  async function alterarSenha() {
    if (!senhaOk) { setError("Senha nao atende os requisitos"); return; }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/nova-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, codigo, novaSenha }),
      });
      const data = await res.json();
      if (data.ok) {
        setSucesso("Senha alterada! Redirecionando...");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Erro de conexao");
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#0D1117] text-white flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image src="/icon.png" alt="MacroForge" width={80} height={80} className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold">
            Macro<span className="text-amber-500">Forge</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">Recuperar senha</p>
        </div>

        {/* Indicador de etapas */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map(e => (
            <div key={e} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                etapa >= e ? "bg-amber-500 text-black" : "bg-gray-700 text-gray-400"
              }`}>
                {e}
              </div>
              {e < 3 && <div className={`w-8 h-0.5 ${etapa > e ? "bg-amber-500" : "bg-gray-700"}`}></div>}
            </div>
          ))}
        </div>

        <div className="bg-[#161B22] border border-gray-800 rounded-xl p-6 space-y-4">

          {/* ETAPA 1: Digitar e-mail */}
          {etapa === 1 && (
            <>
              <p className="text-gray-400 text-sm text-center">
                Digite o e-mail da sua conta pra receber o codigo de recuperacao.
              </p>
              <div>
                <label className="block text-sm text-gray-400 mb-1">E-mail</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && enviarCodigo()}
                  placeholder="seu@email.com"
                  className="w-full px-4 py-3 rounded-lg bg-[#0D1117] border border-gray-700 text-white text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>
              <button onClick={enviarCodigo} disabled={loading}
                className={`w-full py-3 rounded-xl font-bold transition-colors ${
                  loading ? "bg-gray-600" : "bg-amber-500 hover:bg-amber-600 text-black"
                }`}>
                {loading ? "Enviando..." : "Enviar codigo"}
              </button>
            </>
          )}

          {/* ETAPA 2: Digitar codigo */}
          {etapa === 2 && (
            <>
              <p className="text-gray-400 text-sm text-center">
                Enviamos um codigo de 8 caracteres para <span className="text-amber-500">{email}</span>
              </p>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Codigo</label>
                <input
                  type="text" value={codigo}
                  onChange={e => setCodigo(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))}
                  onKeyDown={e => e.key === "Enter" && verificarCodigo()}
                  placeholder="XXXXXXXX"
                  maxLength={8}
                  className="w-full px-4 py-3 rounded-lg bg-[#0D1117] border border-gray-700 text-white text-2xl text-center font-mono tracking-[0.5em] focus:border-amber-500 focus:outline-none"
                />
              </div>
              <button onClick={verificarCodigo} disabled={loading}
                className={`w-full py-3 rounded-xl font-bold transition-colors ${
                  loading ? "bg-gray-600" : "bg-amber-500 hover:bg-amber-600 text-black"
                }`}>
                {loading ? "Verificando..." : "Verificar codigo"}
              </button>
              <button onClick={() => { setEtapa(1); setError(""); setSucesso(""); }}
                className="w-full text-gray-500 text-sm hover:text-amber-500">
                Reenviar codigo
              </button>
            </>
          )}

          {/* ETAPA 3: Nova senha */}
          {etapa === 3 && (
            <>
              <p className="text-gray-400 text-sm text-center">Crie sua nova senha.</p>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nova senha</label>
                <div className="relative">
                  <input
                    type={showSenha ? "text" : "password"} value={novaSenha}
                    onChange={e => setNovaSenha(e.target.value)}
                    placeholder="Nova senha"
                    className="w-full px-4 py-3 pr-16 rounded-lg bg-[#0D1117] border border-gray-700 text-white text-sm focus:border-amber-500 focus:outline-none"
                  />
                  <button type="button" onClick={() => setShowSenha(!showSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs hover:text-amber-500">
                    {showSenha ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Confirmar nova senha</label>
                <input
                  type={showSenha ? "text" : "password"} value={confirmar}
                  onChange={e => setConfirmar(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && alterarSenha()}
                  placeholder="Repita a senha"
                  className="w-full px-4 py-3 rounded-lg bg-[#0D1117] border border-gray-700 text-white text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>
              {novaSenha.length > 0 && (
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <span className={senhaValida.tamanho ? "text-green-400" : "text-gray-500"}>{senhaValida.tamanho ? "\u2713" : "\u2717"} 8+ caracteres</span>
                  <span className={senhaValida.maiuscula ? "text-green-400" : "text-gray-500"}>{senhaValida.maiuscula ? "\u2713" : "\u2717"} Maiuscula</span>
                  <span className={senhaValida.minuscula ? "text-green-400" : "text-gray-500"}>{senhaValida.minuscula ? "\u2713" : "\u2717"} Minuscula</span>
                  <span className={senhaValida.especial ? "text-green-400" : "text-gray-500"}>{senhaValida.especial ? "\u2713" : "\u2717"} Especial</span>
                  <span className={senhaValida.igual ? "text-green-400" : "text-gray-500"}>{senhaValida.igual ? "\u2713" : "\u2717"} Senhas iguais</span>
                </div>
              )}
              <button onClick={alterarSenha} disabled={loading || !senhaOk}
                className={`w-full py-3 rounded-xl font-bold transition-colors ${
                  loading || !senhaOk ? "bg-gray-700 text-gray-500" : "bg-amber-500 hover:bg-amber-600 text-black"
                }`}>
                {loading ? "Alterando..." : "Alterar senha"}
              </button>
            </>
          )}

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          {sucesso && <p className="text-green-400 text-sm text-center">{sucesso}</p>}
        </div>

        <p className="text-center mt-6 text-gray-500 text-sm">
          Lembrou a senha? <a href="/login" className="text-amber-500 hover:underline">Voltar pro login</a>
        </p>
      </div>
    </main>
  );
}
