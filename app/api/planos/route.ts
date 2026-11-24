// ============================================================
// GET /api/planos — os planos à venda, para o MacroForge PC mostrar na aba Início (2026-11-24).
//
// Público e sem dados de ninguém: só a tabela de app/lib/precos.ts (a MESMA que /planos mostra, que o /api/checkout
// cobra e que o /api/webhook confere). Mudou um preço lá = o programa mostra o novo, sem versão nova do programa.
// ============================================================

import { NextResponse } from "next/server";
import {
  NIVEIS, NOME_NIVEL, APARELHOS_DO_NIVEL, PCS_POR_PLANO, DIAS_DO_PLANO, VENDA_PELO_SITE_ATIVA, precoNivel,
} from "@/app/lib/precos";

export async function GET() {
  return NextResponse.json(
    {
      venda_ativa: VENDA_PELO_SITE_ATIVA,
      planos: NIVEIS.map((id) => ({
        id,
        nome: NOME_NIVEL[id],
        preco: precoNivel(id),
        aparelhos: APARELHOS_DO_NIVEL[id],
        pcs: PCS_POR_PLANO,
        dias: DIAS_DO_PLANO,
      })),
    },
    { headers: { "Cache-Control": "public, max-age=300" } }
  );
}
