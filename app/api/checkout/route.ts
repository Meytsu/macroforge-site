// ============================================================
// POST /api/checkout — monta a tela de pagamento do Mercado Pago (Checkout Pro) para um plano.
//
// Reescrito em 2026-11-22 (ISSUE-MF-156, ADR-MF-XCROSS-022). Antes vendia CHAVES por quantidade; agora vende o
// PLANO DA CONTA: Pro / Mega / Ultra, só mensal.
//
// Corpo: { nivel: "pro" | "mega" | "ultra" }      Header: Authorization: Bearer <crachá do login>
//
// O QUE ESTA ROTA NUNCA FAZ
//   1. Ler o cliente do corpo. Vem do CRACHÁ assinado (como /api/painel e /api/play-purchase-verify).
//   2. Ler o preço do corpo. Vem de `precoNivel` (app/lib/precos.ts) — a mesma função que a tela mostra e que o
//      /api/webhook usa para conferir o valor pago.
//   3. Conceder qualquer coisa. Aqui não houve pagamento: quem concede é o /api/webhook, depois de perguntar ao
//      Mercado Pago se o pagamento foi aprovado.
// ============================================================

import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { clienteIdDoHeader } from "@/app/api/_lib/auth";
import {
  precoNivel, ehNivelValido, NOME_NIVEL, APARELHOS_DO_NIVEL,
  VENDA_PELO_SITE_ATIVA, URL_PLAY_STORE,
} from "@/app/lib/precos";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

export async function POST(req: NextRequest) {
  try {
    // VENDA PELO SITE DESLIGADA. Checado ANTES de qualquer coisa — antes de ler o corpo, antes de falar com o
    // Mercado Pago, antes de tocar no banco. Esconder o botão de /planos não bastaria: a URL continuaria viva.
    // Teste controlado (2026-11-22, ISSUE-MF-156): com a venda desligada, só os e-mails da variável MP_TESTE_EMAILS (no
    // painel da Vercel — nunca no código, o repo é público) passam; a conferência do e-mail é no passo 3, pela conta.
    const emailsTeste = (process.env.MP_TESTE_EMAILS || "")
      .split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
    if (!VENDA_PELO_SITE_ATIVA && emailsTeste.length === 0) {
      return NextResponse.json(
        {
          error: "As assinaturas estao disponiveis pelo aplicativo na Google Play.",
          vendaDesativada: true,
          urlApp: URL_PLAY_STORE,
        },
        { status: 503 }
      );
    }

    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json({ error: "Pagamento indisponivel no momento." }, { status: 500 });
    }
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      // Sem banco não dá pra provar que a conta existe — recusa em vez de deixar passar.
      console.error("checkout: Supabase nao configurado; recusando por seguranca");
      return NextResponse.json({ error: "Servico indisponivel" }, { status: 503 });
    }

    // 1) Quem está comprando — do crachá, nunca do corpo (ISSUE-MF-140: só compra quem tem conta).
    const clienteId = await clienteIdDoHeader(req.headers.get("authorization"));
    if (!clienteId) {
      return NextResponse.json(
        { error: "Sessao expirada. Faca login novamente.", precisaLogin: true },
        { status: 401 }
      );
    }

    // 2) O que está comprando — só o nível; o preço é do servidor.
    const body = await req.json().catch(() => ({}));
    const nivel = body?.nivel;
    if (!ehNivelValido(nivel)) {
      return NextResponse.json({ error: "Plano invalido. Escolha Pro, Mega ou Ultra." }, { status: 400 });
    }
    const preco = precoNivel(nivel);

    // 3) A conta existe? (o crachá vale 30 dias; a conta pode ter sido apagada nesse meio-tempo)
    const cliRes = await fetch(
      `${SUPABASE_URL}/rest/v1/clientes?id=eq.${encodeURIComponent(clienteId)}&select=id,nome,email`,
      {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        cache: "no-store",
      }
    );
    if (!cliRes.ok) {
      console.error("checkout: falha ao ler cliente", cliRes.status);
      return NextResponse.json({ error: "Servico indisponivel" }, { status: 503 });
    }
    const clientes = await cliRes.json();
    if (!Array.isArray(clientes) || clientes.length === 0) {
      return NextResponse.json({ error: "Crie sua conta antes de comprar.", precisaCadastro: true }, { status: 403 });
    }
    const cliente = clientes[0] as { id: string; nome?: string | null; email: string };
    if (!VENDA_PELO_SITE_ATIVA && !emailsTeste.includes((cliente.email || "").trim().toLowerCase())) {
      return NextResponse.json(
        { error: "As assinaturas estao disponiveis pelo aplicativo na Google Play.", vendaDesativada: true, urlApp: URL_PLAY_STORE },
        { status: 503 }
      );
    }

    // 4) A preferência no Mercado Pago.
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const local = siteUrl.includes("localhost");

    // Um id por PEDIDO (não por cliente): o mesmo cliente pode abrir duas compras. Só para rastrear no painel do MP —
    // a idempotência da concessão é pelo id do PAGAMENTO, no banco (sql/15).
    const externalReference = `mf-${nivel}-${randomUUID()}`;

    const preference = new Preference(new MercadoPagoConfig({ accessToken }));
    const result = await preference.create({
      body: {
        items: [
          {
            id: `${nivel}-mensal`,
            title: `MacroForge ${NOME_NIVEL[nivel]} — mensal (${APARELHOS_DO_NIVEL[nivel]} aparelhos + 1 PC)`,
            quantity: 1,
            unit_price: preco,
            currency_id: "BRL",
          },
        ],
        // SEM o e-mail do pagador (2026-11-22): com ele preenchido, a conta cujo e-mail é o da conta vendedora do Mercado
        // Pago ficava com o "Gerar código" bloqueado (o MP vê como pagar a si mesmo). O MP pede o e-mail na hora; quem
        // recebe o plano é a CONTA do site (metadata.cliente_id), não o e-mail de quem paga.
        payer: { name: cliente.nome || undefined },
        // PIX e cartão (decisão do Henrique, 2026-11-22). Fora: boleto ("ticket") e lotérica/caixa ("atm") — demoram
        // dias para confirmar e o plano ficaria "pendente".
        payment_methods: {
          excluded_payment_types: [{ id: "ticket" }, { id: "atm" }],
          installments: 1,
        },
        external_reference: externalReference,
        statement_descriptor: "MACROFORGE",
        ...(local ? {} : {
          back_urls: {
            success: `${siteUrl}/sucesso`,
            failure: `${siteUrl}/falha`,
            pending: `${siteUrl}/pendente`,
          },
          auto_return: "approved" as const,
        }),
        notification_url: local ? undefined : `${siteUrl}/api/webhook`,
        // O webhook lê DAQUI quem e o quê (e confere o valor pago contra precoNivel(nivel)).
        metadata: {
          cliente_id: cliente.id,
          nivel,
          duracao: "mensal",
        },
      },
    });

    return NextResponse.json({
      checkout_url: result.init_point,
      sandbox_url: result.sandbox_init_point,
    });
  } catch (error) {
    console.error("Erro ao criar checkout:", error);
    return NextResponse.json({ error: "Erro ao iniciar o pagamento. Tente novamente." }, { status: 500 });
  }
}
