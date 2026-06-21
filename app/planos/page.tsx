"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Planos alinhados ao app (MF-103): sem trimestral; precoLancamento = preco fixo de 1 chave
// (igual ao app), arredondado a ,90. POPULAR no Semestral; MELHOR VALOR no Anual.
// precoRegular = preco "de" (riscado) = equivalente mensal avulso (9,90 x meses), pra mostrar
// a economia da assinatura longa. economia = desconto da assinatura (floor, nunca infla).
const PLANOS = [
  {
    id: "mensal",
    nome: "Mensal",
    precoRegular: 9.9,
    precoLancamento: 9.9,
    periodo: "/mes",
    meses: 1,
    destaque: false,
  },
  {
    id: "semestral",
    nome: "Semestral",
    precoRegular: 59.4, // 9,90 x 6 (mensal avulso)
    precoLancamento: 47.9,
    periodo: "/6 meses",
    meses: 6,
    destaque: true,
    economia: "19%",
  },
  {
    id: "anual",
    nome: "Anual",
    precoRegular: 118.8, // 9,90 x 12 (mensal avulso)
    precoLancamento: 79.9,
    periodo: "/ano",
    meses: 12,
    destaque: false,
    economia: "32%",
    melhorValor: true,
    bonus: "4 meses gratis",
  },
];

// Teto de quantidade no site (app usa fixo 1/3/5; site permite ate este maximo).
const MAX_CHAVES = 25;

function getDesconto(qty: number): number {
  if (qty >= 20) return 0.3;
  if (qty >= 10) return 0.25;
  if (qty >= 5) return 0.15;
  if (qty >= 3) return 0.1;
  return 0;
}

function formatPrice(value: number): string {
  return value.toFixed(2).replace(".", ",");
}

export default function PlanosPage() {
  const router = useRouter();
  const [planoId, setPlanoId] = useState("mensal");
  const [quantidade, setQuantidade] = useState(1);
  const [customQty, setCustomQty] = useState("");
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
      } catch {
        /* ignora */
      }
    }
  }, []);

  const plano = PLANOS.find((p) => p.id === planoId) ?? PLANOS[0];
  const mensalRef = PLANOS.find((p) => p.id === "mensal")!;
  const mesesNoPlano = plano.meses;
  const desconto = getDesconto(quantidade);
  const precoUnitario = plano.precoLancamento * (1 - desconto);
  const totalComDesconto = precoUnitario * quantidade;
  const totalSemDesconto = plano.precoLancamento * quantidade;

  // Economia do periodo (tri/sem vs mensal equivalente)
  const equivalenteMensal = mensalRef.precoLancamento * mesesNoPlano * quantidade;
  const economiaPeriodo = equivalenteMensal - totalSemDesconto;

  // Economia do volume (desconto por quantidade)
  const economiaVolume = totalSemDesconto - totalComDesconto;

  // Total economizado
  const economiaTotal = economiaPeriodo + economiaVolume;

  function handleQtyButton(qty: number) {
    setQuantidade(qty);
    setCustomQty("");
  }

  function handleCustomQty(value: string) {
    setCustomQty(value);
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 1 && num <= MAX_CHAVES) {
      setQuantidade(num);
    } else if (value === "") {
      setQuantidade(1);
    }
  }

  async function handleComprar() {
    if (!email || !email.includes("@")) {
      setError("Digite um e-mail valido");
      return;
    }

    if (!logado) {
      router.push("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plano: planoId, email, quantidade }),
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
        {/* Banner de lancamento */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 mb-6 text-center">
          <p className="text-amber-400 text-sm font-semibold">
            Promocao de lancamento — oferta por tempo limitado
          </p>
        </div>

        <div className="text-center mb-8">
          <Image
            src="/icon.png"
            alt="MacroForge"
            width={60}
            height={60}
            className="mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold mb-2">Escolha seu plano</h1>
          <p className="text-gray-400 text-sm">
            Cancele quando quiser. Sem fidelidade.
          </p>
        </div>

        {/* Planos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {PLANOS.map((p) => (
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
              {p.melhorValor && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-green-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Melhor valor
                </div>
              )}
              <p className="font-bold">{p.nome}</p>
              <p className="text-gray-500 text-sm line-through mt-1">
                R$ {formatPrice(p.precoRegular)}
              </p>
              <p className="text-amber-500 font-bold text-2xl">
                R$ {formatPrice(p.precoLancamento)}
              </p>
              <p className="text-gray-500 text-xs">{p.periodo}</p>
              {p.meses > 1 && (
                <p className="text-gray-400 text-xs mt-1">
                  R$ {formatPrice(p.precoLancamento / p.meses)}/mes
                </p>
              )}
              {p.economia && (
                <p className="text-green-400 text-xs mt-1">
                  Economia de {p.economia}
                </p>
              )}
              {p.bonus && (
                <p className="text-amber-400 text-xs mt-1 font-semibold">
                  {p.bonus}
                </p>
              )}
            </button>
          ))}
        </div>

        {/* Multichave */}
        <div className="bg-[#161B22] border border-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-bold text-gray-300 mb-4">
            Quantidade de chaves
          </h2>

          <div className="flex gap-2 mb-4">
            {[1, 3, 5, 10].map((qty) => {
              const d = getDesconto(qty);
              return (
                <button
                  key={qty}
                  onClick={() => handleQtyButton(qty)}
                  className={`flex-1 py-3 rounded-lg border text-center transition-all ${
                    quantidade === qty && customQty === ""
                      ? "border-amber-500 bg-amber-500/10 text-amber-400"
                      : "border-gray-700 bg-[#0D1117] text-gray-400 hover:border-gray-500"
                  }`}
                >
                  <span className="block font-bold text-lg">{qty}</span>
                  <span className={`block text-xs ${d > 0 ? "text-green-400" : "text-gray-600"}`}>
                    {d > 0 ? `-${Math.round(d * 100)}%` : "—"}
                  </span>
                </button>
              );
            })}

            {/* Campo personalizado inline */}
            <div
              className={`flex-1 rounded-lg border text-center transition-all flex flex-col items-center justify-center py-2 ${
                customQty !== ""
                  ? "border-amber-500 bg-amber-500/10"
                  : "border-gray-700 bg-[#0D1117]"
              }`}
            >
              <input
                type="number"
                min={1}
                max={MAX_CHAVES}
                value={customQty}
                onChange={(e) => handleCustomQty(e.target.value)}
                placeholder="Qtd"
                className="w-14 bg-transparent text-white text-lg font-bold text-center focus:outline-none placeholder-gray-600"
              />
              <span className={`block text-xs ${customQty !== "" && desconto > 0 ? "text-green-400" : "text-gray-600"}`}>
                {customQty !== ""
                  ? desconto > 0
                    ? `-${Math.round(desconto * 100)}%`
                    : "0%"
                  : "%"}
              </span>
            </div>
          </div>

          {/* Resumo do preco */}
          <div className="bg-[#0D1117] border border-gray-700 rounded-lg p-4">
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-gray-400 text-sm">
                {quantidade} {quantidade === 1 ? "chave" : "chaves"} x{" "}
                {plano.nome}
              </span>
              {(economiaPeriodo > 0 || economiaVolume > 0) && (
                <span className="text-gray-500 text-sm line-through">
                  R$ {formatPrice(equivalenteMensal)}
                </span>
              )}
            </div>

            {/* Breakdown de descontos */}
            {economiaPeriodo > 0 && (
              <div className="flex justify-between text-xs mt-2">
                <span className="text-blue-400">
                  Desconto {plano.nome.toLowerCase()} ({plano.economia})
                </span>
                <span className="text-blue-400">
                  -R$ {formatPrice(economiaPeriodo)}
                </span>
              </div>
            )}
            {economiaVolume > 0 && (
              <div className="flex justify-between text-xs mt-1">
                <span className="text-green-400">
                  Desconto de volume ({Math.round(desconto * 100)}%)
                </span>
                <span className="text-green-400">
                  -R$ {formatPrice(economiaVolume)}
                </span>
              </div>
            )}

            {(economiaPeriodo > 0 || economiaVolume > 0) && (
              <div className="border-t border-gray-700 mt-3 pt-3" />
            )}

            <div className="flex items-baseline justify-between">
              <span className="text-white font-bold text-lg">Total</span>
              <span className="text-amber-500 font-bold text-2xl">
                R$ {formatPrice(totalComDesconto)}
              </span>
            </div>

            {economiaTotal > 0 && (
              <p className="text-green-400 text-xs mt-2 text-right font-semibold">
                Economia total: R$ {formatPrice(economiaTotal)}
              </p>
            )}

            {quantidade > 1 && (
              <p className="text-gray-500 text-xs mt-1 text-right">
                R$ {formatPrice(precoUnitario)} por chave
                {plano.meses > 1 && (
                  <> · R$ {formatPrice(precoUnitario / plano.meses)}/mes por chave</>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Email com LED verde */}
        <div className="bg-[#161B22] border border-gray-800 rounded-xl p-6 mb-6">
          <label className="block text-sm text-gray-400 mb-2">
            E-mail da conta
          </label>
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailConfirmado(false);
              }}
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
                <span className="text-green-400 text-xs font-medium">
                  Confirmado
                </span>
              </div>
            )}
          </div>
          {emailConfirmado && (
            <p className="text-green-400 text-xs mt-2">
              {quantidade === 1
                ? "A licenca sera vinculada a este e-mail. Correto?"
                : `As ${quantidade} chaves serao enviadas para este e-mail.`}
            </p>
          )}
          {!logado && (
            <p className="text-yellow-400 text-xs mt-2">
              Voce precisa fazer{" "}
              <a href="/login" className="text-amber-500 hover:underline">
                login
              </a>{" "}
              ou{" "}
              <a href="/cadastro" className="text-amber-500 hover:underline">
                criar uma conta
              </a>{" "}
              primeiro.
            </p>
          )}

          {error && (
            <p className="text-red-400 text-sm mt-3 text-center">{error}</p>
          )}

          <button
            onClick={handleComprar}
            disabled={loading || !logado}
            className={`w-full mt-4 py-4 rounded-xl font-bold text-lg transition-colors ${
              loading || !logado
                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                : "bg-amber-500 hover:bg-amber-600 text-black"
            }`}
          >
            {loading
              ? "Redirecionando..."
              : !logado
                ? "Faca login para continuar"
                : quantidade === 1
                  ? "Pagar com Mercado Pago"
                  : `Comprar ${quantidade} chaves — R$ ${formatPrice(totalComDesconto)}`}
          </button>

          <p className="text-gray-500 text-xs text-center mt-3">
            Pagamento seguro via Mercado Pago. Aceitamos PIX, cartao e boleto.
          </p>

          {/* Garantia */}
          <div className="flex items-center justify-center gap-2 mt-4 py-3 rounded-lg bg-green-500/5 border border-green-500/20">
            <span className="text-green-400 text-lg">&#10003;</span>
            <p className="text-green-400 text-xs font-medium">
              7 dias de garantia — nao gostou, devolvemos seu dinheiro
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
