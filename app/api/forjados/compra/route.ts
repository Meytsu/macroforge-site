// POST /api/forjados/compra — o "conferente" da compra AVULSA de uma DG no Google Play (ADR-MF-XCROSS-020, sql/12).
// Corpo: { purchaseToken, productId }   ·   Header: Authorization: Bearer <crachá>
// Respostas: { ok:true, dg_id, novo }      → o app CONFIRMA a compra (acknowledge, sem consumir) e baixa a DG
//            { ok:true, pendente:true }    → boleto/lotérica: nada concedido ainda (NÃO confirmar)
//            { ok:false, codigo, erro }    → recusada
// Mesmas regras do play-purchase-verify: o cliente sai do CRACHÁ (nunca do corpo), o que foi comprado e se foi pago
// vêm do GOOGLE, e quem confirma a compra é o app, só DEPOIS de esta rota conceder (falha aqui = o Google reembolsa
// sozinho em 3 dias, em vez de o cliente pagar e ficar sem a DG).
import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { consultarCompraAvulsa } from "@/app/api/_lib/play";
import { falha, lerPedido, rpc, semCracha } from "@/app/api/_lib/vagas";

function recusa(erro: string, codigo: string, status = 400) {
  return NextResponse.json({ ok: false, erro, codigo }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const { clienteId, body } = await lerPedido(req);
    if (!clienteId) return semCracha();

    const productId = typeof body.productId === "string" ? body.productId.trim() : "";
    const purchaseToken = typeof body.purchaseToken === "string" ? body.purchaseToken.trim() : "";
    if (!/^dg_[a-z0-9_]{1,40}$/.test(productId)) return recusa("Produto inválido", "produto_invalido");
    if (!purchaseToken || purchaseToken.length > 4096) return recusa("Comprovante inválido", "sem_token");

    const compra = await consultarCompraAvulsa(productId, purchaseToken);
    if (!compra) return recusa("Comprovante de compra inválido.", "token_desconhecido");
    if (compra.estado === 2) {
      return NextResponse.json({ ok: true, pendente: true, obs: "Pagamento em processamento pelo Google." });
    }
    if (compra.estado !== 0) return recusa("Esta compra foi cancelada.", "compra_cancelada");

    // A compra foi feita por OUTRA conta MacroForge neste aparelho? (o app manda o hash da conta na compra)
    const meuHash = crypto.createHash("sha256").update(clienteId).digest("hex");
    if (compra.contaOfuscada && compra.contaOfuscada !== meuHash) {
      console.warn(`[forjados/compra] conta diferente da que comprou (token ...${purchaseToken.slice(-8)})`);
      return recusa("Esta compra foi feita por outra conta MacroForge.", "outra_conta");
    }

    const r = await rpc("mf_conceder_dg", {
      p_cliente_id: clienteId,
      p_produto_play: productId,
      p_purchase_token: purchaseToken,
      p_order_id: compra.orderId,
    });
    if (!r?.ok) {
      console.warn("[forjados/compra] banco recusou:", r?.codigo);
      if (r?.codigo === "conta_inexistente") return semCracha();
      return recusa(r?.erro ?? "Não foi possível liberar a DG.", r?.codigo ?? "recusada");
    }
    return NextResponse.json({ ok: true, dg_id: r.dg_id, novo: r.novo === true, teste: compra.ehTeste });
  } catch (e) {
    return falha("forjados/compra", e);
  }
}
