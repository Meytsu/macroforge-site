// ============================================================
// POST /api/play-purchase-verify — o "conferente" da compra no Google Play.
//
// ISSUE-MF-103 Fase 2. Escrito em 2026-08-03. NUNCA EXECUTADO — falta a conta
// de serviço no Google Cloud (GOOGLE_SERVICE_ACCOUNT_JSON na Vercel).
//
// ------------------------------------------------------------
// O FLUXO
// ------------------------------------------------------------
//   app          → "comprei; token XYZ" + crachá no header Authorization
//   este arquivo → confere o crachá e tira o cliente_id DELE
//                → pergunta ao GOOGLE qual plano e até quando vale
//                → chama conceder_play_subscription no banco
//   app          ← as chaves
//
// ------------------------------------------------------------
// AS TRÊS COISAS QUE ESTE ARQUIVO NUNCA FAZ
// ------------------------------------------------------------
// 1. NÃO lê o cliente do corpo da requisição. Vem do crachá assinado. Ler do
//    corpo permitiria vincular a compra a qualquer conta.
//
// 2. NÃO lê plano/quantidade/validade do corpo. Vêm do Google. É o furo
//    "comprei o mensal de R$ 9,90 e pedi o anual de 5 chaves" — e o app, de
//    propósito, nem manda esses campos.
//
// 3. NÃO confirma a compra (acknowledge). Isso é do app, e SÓ depois de esta
//    rota devolver ok. Se fosse confirmado antes e a concessão falhasse, o
//    cliente pagaria, o Google consideraria entregue e ninguém devolveria o
//    dinheiro. Na ordem certa, falha aqui = o Google reembolsa sozinho
//    (3 dias em produção, 3 MINUTOS em compra de testador).
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { clienteIdDoHeader } from "@/app/api/_lib/auth";
import {
  consultarAssinatura,
  decomporBasePlanId,
  PRODUTO_ASSINATURA,
} from "@/app/api/_lib/play";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

/** Chama uma função do banco (RPC do PostgREST) com a service key. */
async function rpc(fn: string, args: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
    cache: "no-store",
  });
  const texto = await res.text();
  if (!res.ok) {
    throw new Error(`rpc ${fn} falhou: ${res.status} ${texto.slice(0, 300)}`);
  }
  try {
    return JSON.parse(texto);
  } catch {
    throw new Error(`rpc ${fn} devolveu resposta não-JSON: ${texto.slice(0, 200)}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    // ---------------------------------------------------------
    // 1) Quem está pedindo — do crachá, nunca do corpo
    // ---------------------------------------------------------
    const clienteId = await clienteIdDoHeader(req.headers.get("authorization"));
    if (!clienteId) {
      return NextResponse.json(
        { ok: false, erro: "Sessão expirada. Faça login novamente.", codigo: "sem_cracha" },
        { status: 401 }
      );
    }

    // ---------------------------------------------------------
    // 2) O comprovante
    // ---------------------------------------------------------
    const body = await req.json().catch(() => ({}));
    const purchaseToken = typeof body.purchaseToken === "string" ? body.purchaseToken.trim() : "";
    if (!purchaseToken) {
      return NextResponse.json(
        { ok: false, erro: "purchaseToken obrigatório", codigo: "sem_token" },
        { status: 400 }
      );
    }

    // O app manda o productId por completude. Se vier diferente do nosso único
    // produto, é comprovante de outro app — recusa antes de gastar chamada.
    if (typeof body.productId === "string" && body.productId && body.productId !== PRODUTO_ASSINATURA) {
      return NextResponse.json(
        { ok: false, erro: "Produto desconhecido", codigo: "produto_invalido" },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // 3) O que o GOOGLE diz que é esta compra
    // ---------------------------------------------------------
    const assin = await consultarAssinatura(purchaseToken);
    if (!assin) {
      // 404 do Google: token que não existe, ou é de outro pacote.
      return NextResponse.json(
        { ok: false, erro: "Comprovante de compra inválido.", codigo: "token_desconhecido" },
        { status: 400 }
      );
    }

    // Boleto/lotérica: o Google confirma dias depois. Nada a conceder ainda, e
    // NÃO é erro — o app mostra "aguardando pagamento".
    if (assin.pendente) {
      return NextResponse.json({
        ok: true,
        pendente: true,
        obs: "Pagamento em processamento pelo Google.",
        subscriptionState: assin.subscriptionState,
      });
    }

    // Assinatura já morta (expirou ou foi revogada antes de chegar aqui).
    if (assin.status === "cancelada") {
      return NextResponse.json(
        {
          ok: false,
          erro: "Esta assinatura não está mais ativa.",
          codigo: "assinatura_encerrada",
          subscriptionState: assin.subscriptionState,
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // 4) Traduzir o plano base
    // ---------------------------------------------------------
    const p = decomporBasePlanId(assin.basePlanId);
    if (!p) {
      // Plano base fora do padrão `<tier>-<plano>-<qtd>`. RECUSAR é o certo: a
      // trava do banco recusaria de qualquer forma, e aqui a mensagem é útil.
      // Conserto = renomear/criar o plano base no Console seguindo o padrão.
      console.error("[play-verify] basePlanId fora do padrão:", assin.basePlanId);
      return NextResponse.json(
        {
          ok: false,
          erro: "Plano não reconhecido. Avise o suporte.",
          codigo: "base_plan_desconhecido",
          basePlanId: assin.basePlanId,
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------------------
    // 5) Valor por chave
    // ---------------------------------------------------------
    // ⚠️ LIMITAÇÃO CONHECIDA, registrada de propósito. Usamos o preço RECORRENTE
    // que o Google informa (o do plano base). Para quem entrou por uma OFERTA, o
    // valor cobrado AGORA é menor — R$ 9,90 contra os R$ 14,90 do plano base.
    //
    // Por que assim, por enquanto:
    //  · o preço vem do Google, não codificado aqui — não há tabela de preço
    //    duplicada pra divergir do Console;
    //  · o `offer_id` é gravado junto, então dá pra derivar depois exatamente o
    //    que foi cobrado. O dado não se perde, só não está normalizado.
    //
    // O conserto correto é ler a fase atual da oferta (`lineItems[].offerPhase`),
    // cuja forma exata a documentação do `subscriptionsv2.get` não publica — vou
    // olhar na primeira resposta real de teste em vez de chutar campo.
    if (assin.precoRecorrente == null) {
      // Dinheiro não tem valor-padrão razoável: o próprio `sql/05` recusa
      // `p_valor` nulo por isso. 500 → o app tenta de novo, e nada é gravado
      // errado. Melhor recusar do que registrar receita fantasma.
      console.error("[play-verify] Google não informou preço:", assin.basePlanId, assin.subscriptionState);
      return NextResponse.json(
        { ok: false, erro: "Não foi possível confirmar o valor da assinatura.", codigo: "sem_preco" },
        { status: 500 }
      );
    }
    const valorPorChave = Math.round((assin.precoRecorrente / p.qtdChaves) * 100) / 100;

    // ---------------------------------------------------------
    // 6) Conceder no banco (atômico: ou todas as chaves, ou nenhuma)
    // ---------------------------------------------------------
    const r = await rpc("conceder_play_subscription", {
      p_purchase_token: purchaseToken,
      p_cliente_id: clienteId,
      p_product_id: PRODUTO_ASSINATURA,
      p_base_plan_id: assin.basePlanId,
      p_plano: p.plano,
      p_qtd_chaves: p.qtdChaves,
      p_data_expiracao: assin.expiryTime,
      p_valor: valorPorChave,
      p_linked_purchase_token: assin.linkedPurchaseToken,
      p_auto_renews: assin.autoRenewing,
      p_offer_id: assin.offerId,
      p_tier: p.tier,
    });

    if (!r?.ok) {
      // Erro TRATADO do banco (dono errado, assinatura cancelada, revogada
      // antes de conceder...). 400 e não 500: o app não deve ficar retentando.
      console.warn("[play-verify] banco recusou:", r?.codigo, r?.erro);
      return NextResponse.json(
        { ok: false, erro: r?.erro ?? "Não foi possível liberar a assinatura.", codigo: r?.codigo },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      novo: r.novo === true,
      renovado: r.renovado === true,
      chaves: r.chaves ?? [],
      data_expiracao: r.data_expiracao ?? assin.expiryTime,
      // Útil no teste: distingue compra de testador de licença de compra real.
      teste: assin.ehTeste,
    });
  } catch (e) {
    // Falha de rede/permissão com o Google, ou o banco fora do ar. 500 de
    // propósito: o app deve tentar de novo, e NUNCA conceder por otimismo.
    console.error("[play-verify] erro:", e);
    return NextResponse.json(
      { ok: false, erro: "Falha ao verificar a compra. Tente novamente.", codigo: "erro_interno" },
      { status: 500 }
    );
  }
}
