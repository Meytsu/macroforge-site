// ============================================================
// GET /api/pagamento/status?id=<payment_id> — a situação de um pagamento no Mercado Pago (2026-11-24).
//
// Para a página /pendente: no Pix o Mercado Pago devolve a pessoa ao site ANTES de o banco aprovar ("pendente"), e
// ela ficava sem saber se deu certo. A página pergunta aqui a cada poucos segundos e mostra "Pagamento confirmado".
//
// Só a situação (approved / pending / rejected…) — nada de quem pagou nem valores. E só pagamentos do MacroForge
// (external_reference "mf-…", o que o /api/checkout cria). Quem CONCEDE o plano continua sendo só o /api/webhook.
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!/^\d{1,20}$/.test(id)) {
    return NextResponse.json({ error: "Pagamento invalido" }, { status: 400 });
  }
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json({ error: "Indisponivel" }, { status: 503 });
  }
  try {
    const pag = await new Payment(new MercadoPagoConfig({ accessToken })).get({ id });
    if (!String(pag.external_reference ?? "").startsWith("mf-")) {
      return NextResponse.json({ error: "Pagamento nao encontrado" }, { status: 404 });
    }
    return NextResponse.json(
      { status: pag.status ?? "desconhecido" },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ error: "Pagamento nao encontrado" }, { status: 404 });
  }
}
