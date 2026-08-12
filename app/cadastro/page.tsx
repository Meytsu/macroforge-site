"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Cadastro em 2 etapas (ISSUE-MF-133).
//
// Etapa 1  formulário de sempre.
// Etapa 2  confirmação do e-mail. A pessoa pode DIGITAR o código ou CLICAR no link do
//          e-mail — inclusive em outro aparelho. Por isso a etapa 2 fica perguntando ao
//          servidor "já confirmou?": se ele clicar no link no celular, esta tela no
//          computador percebe e segue sozinha. (Padrão do Steam/Epic, pedido dele.)
//
// Não existe "pular". Conta não confirmada é apagada em 5 dias, então um botão de pular
// seria um convite pra perder a conta — pior do que o atrito que ele evitaria.

/** De quanto em quanto tempo a etapa 2 pergunta se já confirmou. */
const INTERVALO_MS = 5000;
/** Depois disso, para de perguntar. Aba esquecida aberta não fica batendo no servidor pra sempre. */
const LIMITE_ESPERA_MS = 10 * 60 * 1000;

export default function CadastroPage() {
  const router = useRouter();
  const [etapa, setEtapa] = useState<1 | 2>(1);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [senhaValida, setSenhaValida] = useState({ maiuscula: false, minuscula: false, especial: false, tamanho: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "exists" | "available">("idle");

  // --- etapa 2 ---
  const [pendencia, setPendencia] = useState("");
  const [emailEnviado, setEmailEnviado] = useState(true);
  const [codigo, setCodigo] = useState("");
  const [confirmando, setConfirmando] = useState(false);
  const [erroCodigo, setErroCodigo] = useState("");
  const [confirmado, setConfirmado] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [avisoReenvio, setAvisoReenvio] = useState("");
  const inicioEspera = useRef<number>(0);

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

      // Login automático continua acontecendo: a conta EXISTE e funciona. O que a
      // confirmação trava é só o trial (/api/ativar-trial), não o acesso.
      const loginRes = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      const loginData = await loginRes.json();
      if (loginData.cliente) {
        sessionStorage.setItem("macroforge_session", JSON.stringify(loginData));
      }

      // Sem pendência = não há o que confirmar (conta que já veio de um pagamento, por
      // exemplo). Segue direto, como era antes.
      if (!data.pendencia) {
        router.push("/painel");
        return;
      }

      setPendencia(data.pendencia);
      setEmailEnviado(data.emailEnviado !== false);
      inicioEspera.current = Date.now();
      setEtapa(2);
      setLoading(false);
    } catch {
      setError("Erro ao conectar. Tente novamente.");
      setLoading(false);
    }
  }

  // Pergunta ao servidor se já confirmou. É o que faz a etapa 2 fechar sozinha quando o
  // link é aberto em OUTRO aparelho — esta aba não tem como saber por conta própria.
  useEffect(() => {
    if (etapa !== 2 || !pendencia || confirmado) return;

    const t = setInterval(async () => {
      if (Date.now() - inicioEspera.current > LIMITE_ESPERA_MS) {
        clearInterval(t);
        return;
      }
      try {
        const res = await fetch(`/api/confirmar-email?pendencia=${encodeURIComponent(pendencia)}`);
        const data = await res.json();
        if (data.confirmado) {
          setConfirmado(true);
          clearInterval(t);
          setTimeout(() => router.push("/painel"), 1200);
        }
      } catch { /* rede oscilou; a próxima rodada tenta de novo */ }
    }, INTERVALO_MS);

    return () => clearInterval(t);
  }, [etapa, pendencia, confirmado, router]);

  async function handleConfirmar() {
    const limpo = codigo.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    if (limpo.length !== 8) { setErroCodigo("O codigo tem 8 caracteres"); return; }

    setConfirmando(true);
    setErroCodigo("");
    try {
      const res = await fetch("/api/confirmar-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: limpo }),
      });
      const data = await res.json();
      if (data.ok) {
        setConfirmado(true);
        setTimeout(() => router.push("/painel"), 1200);
        return;
      }
      setErroCodigo(data.error || "Codigo invalido");
    } catch {
      setErroCodigo("Erro ao conectar. Tente novamente.");
    }
    setConfirmando(false);
  }

  async function handleReenviar() {
    setReenviando(true);
    setAvisoReenvio("");
    try {
      const res = await fetch("/api/reenviar-confirmacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.pendencia) setPendencia(data.pendencia);
      setAvisoReenvio(
        data.error ? data.error :
        data.emailEnviado === false ? "Nao conseguimos enviar agora. Tente de novo em instantes." :
        "E-mail reenviado."
      );
      if (!data.error) { setEmailEnviado(true); inicioEspera.current = Date.now(); }
    } catch {
      setAvisoReenvio("Erro ao conectar.");
    }
    setReenviando(false);
  }

  // ==========================================================================
  // ETAPA 2 — confirmação
  // ==========================================================================
  if (etapa === 2) {
    return (
      <main className="min-h-screen bg-[#0D1117] text-white flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <Image src="/icon.png" alt="MacroForge" width={80} height={80} className="mx-auto mb-4" />
            <h1 className="text-2xl font-bold">
              Macro<span className="text-amber-500">Forge</span>
            </h1>
            <p className="text-gray-400 text-sm mt-2">Passo 2 de 2 — confirme seu e-mail</p>
          </div>

          <div className="bg-[#161B22] border border-gray-800 rounded-xl p-6 space-y-4">
            {confirmado ? (
              <div className="text-center py-6">
                <p className="text-green-400 text-lg font-bold mb-1">E-mail confirmado!</p>
                <p className="text-gray-400 text-sm">Levando voce para o painel...</p>
              </div>
            ) : (
              <>
                <p className="text-gray-400 text-sm text-center">
                  Enviamos um e-mail para <span className="text-white">{email}</span>.
                  Clique no botao da mensagem ou digite o codigo abaixo.
                </p>

                {!emailEnviado && (
                  <p className="text-amber-400 text-xs text-center bg-amber-500/10 border border-amber-500/30 rounded-lg p-2">
                    Nao conseguimos enviar o e-mail agora. Use o botao de reenviar.
                  </p>
                )}

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Codigo de 8 caracteres</label>
                  <input
                    type="text" value={codigo} inputMode="text" autoCapitalize="characters"
                    onChange={e => { setCodigo(e.target.value.toUpperCase()); setErroCodigo(""); }}
                    onKeyDown={e => { if (e.key === "Enter") handleConfirmar(); }}
                    placeholder="XXXXXXXX" maxLength={12}
                    className="w-full px-4 py-3 rounded-lg bg-[#0D1117] border border-gray-700 text-white text-center font-mono text-xl tracking-[0.3em] focus:border-amber-500 focus:outline-none"
                  />
                </div>

                {erroCodigo && <p className="text-red-400 text-sm text-center">{erroCodigo}</p>}

                <button onClick={handleConfirmar} disabled={confirmando}
                  className={`w-full py-3 rounded-xl font-bold text-lg transition-colors ${
                    confirmando ? "bg-gray-600 cursor-not-allowed" : "bg-amber-500 hover:bg-amber-600 text-black"
                  }`}>
                  {confirmando ? "Confirmando..." : "Confirmar"}
                </button>

                <div className="text-center">
                  <button onClick={handleReenviar} disabled={reenviando}
                    className="text-amber-500 text-sm hover:underline disabled:text-gray-600">
                    {reenviando ? "Reenviando..." : "Nao recebi o e-mail — reenviar"}
                  </button>
                  {avisoReenvio && <p className="text-gray-400 text-xs mt-2">{avisoReenvio}</p>}
                </div>

                {/* Aviso honesto, e não ameaça: sem ele, quem fechar a aba não faz ideia
                    de que a conta tem prazo. Ver mf_faxina_nao_confirmados (240 h). */}
                <p className="text-gray-500 text-xs text-center border-t border-gray-800 pt-3">
                  Contas nao confirmadas em 10 dias sao removidas.
                  O trial de teste so libera depois da confirmacao.
                </p>
              </>
            )}
          </div>
        </div>
      </main>
    );
  }

  // ==========================================================================
  // ETAPA 1 — cadastro
  // ==========================================================================
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
