"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  NIVEIS, NOME_NIVEL, APARELHOS_DO_NIVEL, precoNivel, formatarPreco,
  VENDA_PELO_SITE_ATIVA, URL_PLAY_STORE, type NivelId,
} from "@/app/lib/precos";

// SEM PREÇO AQUI. Todo valor vem de app/lib/precos.ts — a MESMA função que o /api/checkout cobra e o /api/webhook
// confere. ADR-MF-XCROSS-022 (2026-11-22): só mensal, tudo incluído; o plano só muda a quantidade de aparelhos.

const DESTAQUE: NivelId = "mega";

// Sessão do login (sessionStorage), lida como no /painel: useSyncExternalStore em vez de setState dentro do
// useEffect (regra react-hooks/set-state-in-effect). No servidor não existe sessionStorage → null.
const semAssinatura = () => () => {};
const lerSessao = () => sessionStorage.getItem("macroforge_session");

function tokenDaSessao(guardada: string | null): string | null {
  if (!guardada) return null;
  try {
    const t = JSON.parse(guardada)?.token;
    return typeof t === "string" && t ? t : null;
  } catch {
    return null;
  }
}

function CardPlano({ nivel, children }: { nivel: NivelId; children?: React.ReactNode }) {
  const destaque = nivel === DESTAQUE;
  return (
    <div
      className={`relative rounded-xl p-5 border text-left ${
        destaque ? "border-amber-500 bg-[#161B22] ring-2 ring-amber-500/30" : "border-gray-700 bg-[#161B22]"
      }`}
    >
      {destaque && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
          Mais popular
        </div>
      )}
      <p className="font-bold text-lg">{NOME_NIVEL[nivel]}</p>
      <div className="flex items-baseline gap-1 mt-1">
        <span className="text-sm text-amber-400">R$</span>
        <span className="text-3xl font-bold text-amber-500">{formatarPreco(precoNivel(nivel))}</span>
        <span className="text-gray-400 text-sm">/mes</span>
      </div>
      <ul className="space-y-1.5 mt-4 text-sm text-gray-300">
        <li><span className="text-amber-500">&#10003;</span> {APARELHOS_DO_NIVEL[nivel]} aparelhos ao mesmo tempo</li>
        <li><span className="text-amber-500">&#10003;</span> 1 computador (MacroForge PC)</li>
        <li><span className="text-amber-500">&#10003;</span> Tudo incluido</li>
      </ul>
      {children}
    </div>
  );
}

const TUDO_INCLUIDO =
  "Todo plano inclui tudo: todas as DGs e a TG, no app e no PC; Colecao e Loja de DP no PC (no app, em breve). O plano so muda quantos aparelhos usam ao mesmo tempo.";

export default function PlanosPage() {
  const router = useRouter();
  const guardada = useSyncExternalStore(semAssinatura, lerSessao, () => null);
  const token = tokenDaSessao(guardada);
  // /planos?teste mostra os botões de compra com a venda desligada (teste controlado do Mercado Pago — o /api/checkout
  // só aceita os e-mails da lista de teste do servidor; para os outros a compra é recusada do mesmo jeito)
  const modoTeste = useSyncExternalStore(semAssinatura, () => new URLSearchParams(window.location.search).has("teste"),
    () => false);
  const [comprando, setComprando] = useState<NivelId | null>(null);
  const [error, setError] = useState("");

  async function comprar(nivel: NivelId) {
    if (!token) {
      router.push("/login");
      return;
    }
    setComprando(nivel);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nivel }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.precisaLogin) {
        router.push("/login");
        return;
      }
      if (data.precisaCadastro) {
        router.push("/cadastro");
        return;
      }
      if (!res.ok || !data.checkout_url) {
        setError(data.error || "Nao foi possivel iniciar o pagamento. Tente novamente.");
        setComprando(null);
        return;
      }
      window.location.assign(data.checkout_url);
    } catch {
      setError("Erro ao conectar. Tente novamente.");
      setComprando(null);
    }
  }

  // VENDA PELO SITE DESLIGADA: a tela não sai do ar — mostra os planos e manda assinar pelo app.
  // A recusa de verdade está no /api/checkout: esta tela é conveniência, não trava.
  if (!VENDA_PELO_SITE_ATIVA && !modoTeste) {
    return (
      <main className="min-h-screen bg-[#0D1117] text-white pt-20 px-4 pb-12">
        <div className="max-w-3xl mx-auto text-center">
          <Image src="/icon.png" alt="MacroForge" width={64} height={64} className="mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-3">Assine pelo aplicativo</h1>
          <p className="text-gray-400 text-sm mb-8 max-w-md mx-auto">
            As assinaturas do MacroForge sao feitas dentro do app, pela Google Play. E mais
            rapido, e voce gerencia tudo direto na sua conta Google.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            {NIVEIS.map((n) => <CardPlano key={n} nivel={n} />)}
          </div>
          <p className="text-gray-400 text-xs mb-8 max-w-md mx-auto">{TUDO_INCLUIDO}</p>

          <div className="max-w-md mx-auto">
            <div className="bg-[#161B22] border border-gray-800 rounded-xl p-5 mb-6 text-left">
              <p className="text-sm text-gray-300 mb-3 font-semibold">Como assinar</p>
              <ol className="text-sm text-gray-400 space-y-2 list-decimal list-inside">
                <li>Instale o MacroForge pela Google Play</li>
                <li>Entre com a mesma conta que voce usa aqui</li>
                <li>Abra <span className="text-white">Planos</span> dentro do app</li>
              </ol>
            </div>

            <a
              href={URL_PLAY_STORE}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block w-full py-3 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-black transition-colors"
            >
              Abrir na Google Play
            </a>

            <p className="text-gray-400 text-sm mt-6">
              Todo plano inclui tambem <span className="text-white">1 computador</span> com o MacroForge PC (Windows).{" "}
              <Link href="/#pc" className="text-amber-500 hover:underline">Saiba mais</Link>
            </p>

            <p className="text-gray-500 text-xs mt-6">
              Ja assina? Veja seu plano na sua conta.{" "}
              <Link href="/painel" className="text-amber-500 hover:underline">Minha conta</Link>
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0D1117] text-white pt-20 px-4 pb-12">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <Image src="/icon.png" alt="MacroForge" width={60} height={60} className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Escolha seu plano</h1>
          <p className="text-gray-400 text-sm">Mensal. Sem renovacao automatica e sem fidelidade.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          {NIVEIS.map((n) => (
            <CardPlano key={n} nivel={n}>
              <button
                onClick={() => comprar(n)}
                disabled={comprando !== null}
                className={`w-full mt-5 py-3 rounded-lg font-bold transition-colors ${
                  comprando !== null
                    ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                    : n === DESTAQUE
                      ? "bg-amber-500 hover:bg-amber-600 text-black"
                      : "border border-gray-600 hover:border-amber-500 text-gray-300"
                }`}
              >
                {comprando === n ? "Redirecionando..." : token ? "Assinar" : "Entrar para assinar"}
              </button>
            </CardPlano>
          ))}
        </div>
        <p className="text-gray-400 text-xs text-center mb-6">{TUDO_INCLUIDO}</p>

        {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}

        {!token && (
          <p className="text-yellow-400 text-xs text-center mb-4">
            Para assinar, faca{" "}
            <Link href="/login" className="text-amber-500 hover:underline">login</Link>{" "}
            ou{" "}
            <Link href="/cadastro" className="text-amber-500 hover:underline">crie uma conta</Link>.
          </p>
        )}

        <div className="bg-[#161B22] border border-gray-800 rounded-xl p-5 text-sm text-gray-400 space-y-2">
          <p>Pagamento seguro via Mercado Pago: <span className="text-white">PIX ou cartao</span>.</p>
          <p>Comprou o mesmo plano que ja tem? <span className="text-white">Somamos 30 dias</span> ao seu plano.</p>
          <p>
            Comprou um plano diferente com outro ainda ativo? Ele <span className="text-white">entra na fila</span> e
            comeca quando o atual terminar.
          </p>
          <p>
            O plano fica na sua conta: entre no app e no MacroForge PC com o mesmo e-mail e senha do site.{" "}
            <Link href="/#pc" className="text-amber-500 hover:underline">Sobre o PC</Link>
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mt-4 py-3 rounded-lg bg-green-500/5 border border-green-500/20">
          <span className="text-green-400 text-lg">&#10003;</span>
          <p className="text-green-400 text-xs font-medium">
            7 dias de garantia — nao gostou, devolvemos seu dinheiro
          </p>
        </div>
      </div>
    </main>
  );
}
