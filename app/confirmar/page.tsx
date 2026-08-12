"use client";

// Página onde o link do e-mail cai: /confirmar?c=XXXXXXXX
//
// O link e o código são o MESMO segredo — esta página só preenche o campo sozinha e envia.
// Um caminho de validação, não dois que possam divergir.
//
// Precisa funcionar SOZINHA, sem a aba do cadastro: a pessoa pode abrir o e-mail no celular
// horas depois, com o computador desligado. Por isso ela tem o campo manual também, e não
// depende de nenhum estado guardado no navegador.
import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

type Estado = "verificando" | "ok" | "erro" | "pedindo";

function ConfirmarConteudo() {
  const params = useSearchParams();
  const codigoDaUrl = (params.get("c") || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();

  const [estado, setEstado] = useState<Estado>(codigoDaUrl ? "verificando" : "pedindo");
  const [codigo, setCodigo] = useState(codigoDaUrl);
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Reenvio a partir DAQUI. Sem isto, quem chega com código expirado fica num beco sem
  // saída: o passo 2 do cadastro só aparece logo depois de criar a conta, e cadastrar de
  // novo é recusado por e-mail duplicado. A tela dizia "peça um novo na tela de cadastro"
  // — uma instrução que não levava a lugar nenhum.
  const [emailReenvio, setEmailReenvio] = useState("");
  const [reenviando, setReenviando] = useState(false);
  const [avisoReenvio, setAvisoReenvio] = useState("");

  async function reenviar() {
    if (!emailReenvio.includes("@")) { setAvisoReenvio("Digite seu e-mail."); return; }
    setReenviando(true);
    setAvisoReenvio("");
    try {
      const res = await fetch("/api/reenviar-confirmacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailReenvio }),
      });
      const data = await res.json();
      // Resposta deliberadamente vaga: o endpoint responde igual pra "não existe" e pra
      // "já confirmado", pra não virar detector de contas. A tela mantém esse contrato.
      setAvisoReenvio(data.error || "Se houver uma conta pendente com esse e-mail, o codigo foi reenviado.");
    } catch {
      setAvisoReenvio("Erro ao conectar.");
    }
    setReenviando(false);
  }

  const confirmar = useCallback(async (valor: string) => {
    const limpo = valor.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    if (limpo.length !== 8) {
      setEstado("erro");
      setMensagem("O codigo tem 8 caracteres.");
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch("/api/confirmar-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: limpo }),
      });
      const data = await res.json();

      if (data.ok) {
        setEstado("ok");
        // `jaConfirmado` também cai aqui de propósito: quem clicou no link e DEPOIS digitou
        // o código (ou clicou duas vezes) fez tudo certo. Mostrar erro seria mentir sobre
        // uma operação que deu certo.
        setMensagem(data.jaConfirmado ? "Sua conta ja estava confirmada." : "");
      } else {
        setEstado("erro");
        setMensagem(data.error || "Codigo invalido.");
      }
    } catch {
      setEstado("erro");
      setMensagem("Erro ao conectar. Tente novamente.");
    }
    setEnviando(false);
  }, []);

  // Veio com código na URL: confirma sozinho, sem pedir clique. É o que faz o link do
  // e-mail parecer instantâneo.
  useEffect(() => {
    if (codigoDaUrl) confirmar(codigoDaUrl);
  }, [codigoDaUrl, confirmar]);

  return (
    <main className="min-h-screen bg-[#0D1117] text-white flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image src="/icon.png" alt="MacroForge" width={80} height={80} className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold">
            Macro<span className="text-amber-500">Forge</span>
          </h1>
        </div>

        <div className="bg-[#161B22] border border-gray-800 rounded-xl p-6 space-y-4 text-center">
          {estado === "verificando" && (
            <p className="text-gray-400 py-6">Confirmando seu e-mail...</p>
          )}

          {estado === "ok" && (
            <div className="py-4">
              <p className="text-green-400 text-lg font-bold mb-1">E-mail confirmado!</p>
              {mensagem && <p className="text-gray-400 text-sm mb-3">{mensagem}</p>}
              <p className="text-gray-400 text-sm mb-4">
                Sua conta esta liberada. Se voce deixou a outra aba aberta, ela ja seguiu sozinha.
              </p>
              <a href="/painel"
                className="inline-block w-full py-3 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-black transition-colors">
                Ir para o painel
              </a>
            </div>
          )}

          {(estado === "pedindo" || estado === "erro") && (
            <>
              <p className="text-gray-400 text-sm">
                {estado === "erro" ? mensagem : "Digite o codigo que enviamos por e-mail."}
              </p>

              <input
                type="text" value={codigo} inputMode="text" autoCapitalize="characters"
                onChange={e => setCodigo(e.target.value.toUpperCase())}
                onKeyDown={e => { if (e.key === "Enter") confirmar(codigo); }}
                placeholder="XXXXXXXX" maxLength={12}
                className="w-full px-4 py-3 rounded-lg bg-[#0D1117] border border-gray-700 text-white text-center font-mono text-xl tracking-[0.3em] focus:border-amber-500 focus:outline-none"
              />

              <button onClick={() => confirmar(codigo)} disabled={enviando}
                className={`w-full py-3 rounded-xl font-bold text-lg transition-colors ${
                  enviando ? "bg-gray-600 cursor-not-allowed" : "bg-amber-500 hover:bg-amber-600 text-black"
                }`}>
                {enviando ? "Confirmando..." : "Confirmar"}
              </button>

              <div className="border-t border-gray-800 pt-4 mt-2 space-y-2">
                <p className="text-gray-500 text-xs">Codigo expirado ou perdido? Reenviamos:</p>
                <input
                  type="email" value={emailReenvio}
                  onChange={e => setEmailReenvio(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") reenviar(); }}
                  placeholder="seu@email.com"
                  className="w-full px-4 py-2 rounded-lg bg-[#0D1117] border border-gray-700 text-white text-sm focus:border-amber-500 focus:outline-none"
                />
                <button onClick={reenviar} disabled={reenviando}
                  className="text-amber-500 text-sm hover:underline disabled:text-gray-600">
                  {reenviando ? "Reenviando..." : "Reenviar codigo"}
                </button>
                {avisoReenvio && <p className="text-gray-400 text-xs">{avisoReenvio}</p>}
              </div>
            </>
          )}
        </div>

        <p className="text-center mt-6 text-gray-500 text-sm">
          <a href="/login" className="text-amber-500 hover:underline">Entrar</a>
        </p>
      </div>
    </main>
  );
}

// useSearchParams exige uma fronteira de Suspense no App Router — sem ela o build falha
// ao tentar pré-renderizar a página.
export default function ConfirmarPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#0D1117] text-white flex items-center justify-center">
        <p className="text-gray-400">Carregando...</p>
      </main>
    }>
      <ConfirmarConteudo />
    </Suspense>
  );
}
