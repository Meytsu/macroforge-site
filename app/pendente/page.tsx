import { Suspense } from "react";
import Acompanhar from "./Acompanhar";

// Pix e outros pagamentos que voltam do Mercado Pago antes de aprovados: a página confere sozinha e mostra a confirmação
// quando o banco aprovar (2026-11-24 — antes ela só dizia "pendente").
export default function Pendente() {
  return (
    <main className="min-h-screen bg-[#0D1117] text-white flex items-center justify-center px-6">
      <Suspense fallback={null}>
        <Acompanhar />
      </Suspense>
    </main>
  );
}
