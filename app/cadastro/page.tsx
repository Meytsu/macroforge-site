"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Suspense } from "react";
import { PhoneCodeSelect, CountrySelect, PAISES } from "../components/CountrySelect";

const ESTADOS_BR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
];

const PLANOS = [
  { id: "mensal", nome: "Mensal", preco: "R$ 14,90", periodo: "/mes", valor: 14.9 },
  { id: "trimestral", nome: "Trimestral", preco: "R$ 34,90", periodo: "/3 meses", valor: 34.9, destaque: true, economia: "22%" },
  { id: "semestral", nome: "Semestral", preco: "R$ 59,90", periodo: "/6 meses", valor: 59.9, economia: "33%" },
];

function CadastroForm() {
  const searchParams = useSearchParams();
  const planoInicial = searchParams.get("plano") || "mensal";

  const [planoId, setPlanoId] = useState(planoInicial);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [codigoPais, setCodigoPais] = useState("+55");
  const [telefone, setTelefone] = useState("");
  const [pais, setPais] = useState("Brasil");
  const [estado, setEstado] = useState("");
  const [cidade, setCidade] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [senhaValida, setSenhaValida] = useState({ maiuscula: false, minuscula: false, especial: false, tamanho: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "exists" | "exists_no_pass" | "available">("idle");

  const isBrasil = pais === "Brasil";

  async function checkEmail(emailValue: string) {
    if (!emailValue || !emailValue.includes("@")) {
      setEmailStatus("idle");
      return;
    }
    setEmailStatus("checking");
    try {
      const res = await fetch("/api/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue }),
      });
      const data = await res.json();
      if (data.exists && data.temSenha) {
        setEmailStatus("exists");
      } else if (data.exists && !data.temSenha) {
        setEmailStatus("exists_no_pass");
      } else {
        setEmailStatus("available");
      }
    } catch {
      setEmailStatus("idle");
    }
  }

  function handlePaisChange(novoPais: string) {
    setPais(novoPais);
    setEstado("");
    const p = PAISES.find(x => x.pais === novoPais);
    if (p) setCodigoPais(p.codigo);
  }

  function handleCodigoChange(novoCodigo: string) {
    setCodigoPais(novoCodigo);
    const p = PAISES.find(x => x.codigo === novoCodigo);
    if (p) setPais(p.pais);
  }

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

  async function handleSubmit() {
    if (!nome.trim()) { setError("Digite seu nome completo"); return; }
    if (!email.includes("@")) { setError("Digite um e-mail valido"); return; }
    if (emailStatus === "exists") { setError("E-mail ja cadastrado. Faca login."); return; }
    if (!senhaOk) { setError("Senha nao atende os requisitos"); return; }
    if (!telefone.trim()) { setError("Digite seu numero de contato"); return; }
    if (!pais.trim()) { setError("Selecione seu pais"); return; }

    setLoading(true);
    setError("");

    try {
      // 1. Registra o cliente com senha
      const regRes = await fetch("/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          email,
          senha,
          whatsapp: `${codigoPais} ${telefone}`,
          pais,
          estado,
          cidade,
          codigo_pais: codigoPais,
        }),
      });

      const regData = await regRes.json();
      if (regData.error) {
        setError(regData.error);
        setLoading(false);
        return;
      }

      // 2. Gera o checkout do Mercado Pago
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plano: planoId,
          email,
          nome,
          whatsapp: `${codigoPais} ${telefone}`,
          pais,
          estado,
          cidade,
          codigo_pais: codigoPais,
        }),
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
    <main className="min-h-screen bg-[#0D1117] text-white flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <Image src="/icon.png" alt="MacroForge" width={80} height={80} className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold">
            Macro<span className="text-amber-500">Forge</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2">Preencha seus dados para continuar</p>
        </div>

        {/* Seletor de plano */}
        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">Escolha seu plano</label>
          <div className="grid grid-cols-3 gap-2">
            {PLANOS.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlanoId(p.id)}
                className={`relative rounded-xl p-3 border text-center transition-all ${
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
                <p className="font-bold text-sm">{p.nome}</p>
                <p className="text-amber-500 font-bold text-lg">{p.preco}</p>
                <p className="text-gray-500 text-xs">{p.periodo}</p>
                {p.economia && (
                  <p className="text-green-400 text-xs mt-1">-{p.economia}</p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Formulário */}
        <div className="bg-[#161B22] border border-gray-800 rounded-xl p-6 space-y-4">

          {/* Nome */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nome completo</label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Ex: Henrique Alves de Oliveira"
              className="w-full px-4 py-3 rounded-lg bg-[#0D1117] border border-gray-700 text-white text-sm focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* E-mail */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setEmailStatus("idle"); }}
              onBlur={() => checkEmail(email)}
              placeholder="seu@email.com"
              className={`w-full px-4 py-3 rounded-lg bg-[#0D1117] border text-white text-sm focus:outline-none ${
                emailStatus === "exists" ? "border-red-500" :
                emailStatus === "available" ? "border-green-500" :
                "border-gray-700 focus:border-amber-500"
              }`}
            />
            {emailStatus === "checking" && (
              <p className="text-gray-500 text-xs mt-1">Verificando...</p>
            )}
            {emailStatus === "exists" && (
              <p className="text-red-400 text-xs mt-1">
                E-mail ja cadastrado. <a href="/login" className="text-amber-500 hover:underline">Faca login aqui</a>
              </p>
            )}
            {emailStatus === "exists_no_pass" && (
              <p className="text-yellow-400 text-xs mt-1">
                E-mail encontrado (sem senha). Preencha os dados para completar seu cadastro.
              </p>
            )}
            {emailStatus === "available" && (
              <p className="text-green-400 text-xs mt-1">E-mail disponivel</p>
            )}
          </div>

          {/* Senha */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Senha</label>
            <div className="relative">
              <input
                type={showSenha ? "text" : "password"}
                value={senha}
                onChange={e => validarSenha(e.target.value)}
                placeholder="Crie sua senha"
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
            {senha.length > 0 && (
              <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                <span className={senhaValida.tamanho ? "text-green-400" : "text-gray-500"}>
                  {senhaValida.tamanho ? "\u2713" : "\u2717"} 8+ caracteres
                </span>
                <span className={senhaValida.maiuscula ? "text-green-400" : "text-gray-500"}>
                  {senhaValida.maiuscula ? "\u2713" : "\u2717"} Letra maiuscula
                </span>
                <span className={senhaValida.minuscula ? "text-green-400" : "text-gray-500"}>
                  {senhaValida.minuscula ? "\u2713" : "\u2717"} Letra minuscula
                </span>
                <span className={senhaValida.especial ? "text-green-400" : "text-gray-500"}>
                  {senhaValida.especial ? "\u2713" : "\u2717"} Caractere especial
                </span>
              </div>
            )}
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">WhatsApp</label>
            <div className="flex gap-2">
              <PhoneCodeSelect value={codigoPais} onChange={handleCodigoChange} />
              <input
                type="tel"
                value={telefone}
                onChange={e => setTelefone(e.target.value)}
                placeholder="81 973197753"
                className="flex-1 px-4 py-3 rounded-lg bg-[#0D1117] border border-gray-700 text-white text-sm focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* País */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Pais</label>
            <CountrySelect value={pais} onChange={handlePaisChange} />
          </div>

          {/* Estado */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Estado</label>
            {isBrasil ? (
              <select
                value={estado}
                onChange={e => setEstado(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[#0D1117] border border-gray-700 text-white text-sm focus:border-amber-500 focus:outline-none"
              >
                <option value="">Selecione</option>
                {ESTADOS_BR.map(uf => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={estado}
                onChange={e => setEstado(e.target.value)}
                placeholder="Ex: Lisboa"
                className="w-full px-4 py-3 rounded-lg bg-[#0D1117] border border-gray-700 text-white text-sm focus:border-amber-500 focus:outline-none"
              />
            )}
          </div>

          {/* Cidade */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Cidade</label>
            <input
              type="text"
              value={cidade}
              onChange={e => setCidade(e.target.value)}
              placeholder="Ex: Recife"
              className="w-full px-4 py-3 rounded-lg bg-[#0D1117] border border-gray-700 text-white text-sm focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Erro */}
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          {/* Botão */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-colors ${
              loading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-amber-500 hover:bg-amber-600 text-black"
            }`}
          >
            {loading ? "Redirecionando..." : "Pagar com Mercado Pago"}
          </button>

          <p className="text-gray-500 text-xs text-center">
            Pagamento seguro via Mercado Pago. Aceitamos PIX, cartao e boleto.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function CadastroPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#0D1117] text-white flex items-center justify-center">
        <p className="text-gray-400">Carregando...</p>
      </main>
    }>
      <CadastroForm />
    </Suspense>
  );
}
