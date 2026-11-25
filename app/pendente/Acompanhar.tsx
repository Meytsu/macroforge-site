"use client";

// A página /pendente acompanha o pagamento sozinha (2026-11-24): no Pix o Mercado Pago devolve a pessoa ao site antes
// de o banco aprovar. Pergunta a /api/pagamento/status a cada 4 s (por até 15 min) e, aprovado, mostra a confirmação.

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const INTERVALO_MS = 4000;
const LIMITE_MS = 15 * 60 * 1000;

type Situacao = "aguardando" | "aprovado" | "recusado" | "sem_id";

export default function Acompanhar() {
  const params = useSearchParams();
  const id = params.get("payment_id") ?? params.get("collection_id") ?? "";
  const [situacao, setSituacao] = useState<Situacao>(/^\d+$/.test(id) ? "aguardando" : "sem_id");

  useEffect(() => {
    if (!/^\d+$/.test(id)) return;
    const inicio = Date.now();
    let parar = false;
    async function perguntar() {
      if (parar || Date.now() - inicio > LIMITE_MS) return;
      try {
        const r = await fetch(`/api/pagamento/status?id=${id}`, { cache: "no-store" });
        if (r.ok) {
          const { status } = await r.json();
          if (status === "approved") { setSituacao("aprovado"); return; }
          if (status === "rejected" || status === "cancelled") { setSituacao("recusado"); return; }
        }
      } catch { /* sem internet: tenta de novo */ }
      setTimeout(perguntar, INTERVALO_MS);
    }
    perguntar();
    return () => { parar = true; };
  }, [id]);

  if (situacao === "aprovado") {
    return (
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-600 text-5xl">
          &#10003;
        </div>
        <h1 className="text-3xl font-bold mb-4 text-green-400">Pagamento confirmado!</h1>
        <p className="text-gray-400 mb-2">
          Seu plano foi liberado na sua conta. Entre no app ou no PC com o mesmo e-mail e senha do site. A confirmacao
          chega no seu e-mail em instantes.
        </p>
        <p className="text-gray-500 text-sm mb-8">Verifique tambem a caixa de spam.</p>
        <Link href="/" className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-8 py-3 rounded-xl transition-colors">
          Voltar ao inicio
        </Link>
      </div>
    );
  }

  if (situacao === "recusado") {
    return (
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">&#10007;</div>
        <h1 className="text-3xl font-bold mb-4 text-red-400">Pagamento nao aprovado</h1>
        <p className="text-gray-400 mb-8">O Mercado Pago nao aprovou este pagamento. Nada foi cobrado.</p>
        <Link href="/planos" className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-8 py-3 rounded-xl transition-colors">
          Tentar de novo
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center max-w-md">
      <div className="text-6xl mb-6">&#9203;</div>
      <h1 className="text-3xl font-bold mb-4 text-amber-400">Pagamento pendente</h1>
      <p className="text-gray-400 mb-6">
        Estamos aguardando a confirmacao do pagamento. Assim que confirmado, seu plano e liberado na sua conta e voce
        recebe um e-mail.
      </p>
      {situacao === "aguardando" && (
        <p className="text-gray-500 text-sm mb-8 flex items-center justify-center gap-2">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          Conferindo o pagamento... pode deixar esta pagina aberta.
        </p>
      )}
      <Link href="/" className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-8 py-3 rounded-xl transition-colors">
        Voltar ao inicio
      </Link>
    </div>
  );
}
