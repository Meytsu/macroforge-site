import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";

// Preços alinhados ao app e à página /planos (MF-103, 2026-06-20). Trimestral removido.
// price = preço de 1 chave (base); o desconto de volume é aplicado por getDesconto().
const PLANOS: Record<string, { title: string; price: number; days: number }> = {
  mensal: { title: "MacroForge — Mensal", price: 9.9, days: 30 },
  semestral: { title: "MacroForge — Semestral", price: 47.9, days: 180 },
  anual: { title: "MacroForge — Anual", price: 79.9, days: 365 },
};

function getDesconto(qty: number): number {
  if (qty >= 20) return 0.3;
  if (qty >= 10) return 0.25;
  if (qty >= 5) return 0.15;
  if (qty >= 3) return 0.1;
  return 0;
}

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

export async function POST(req: NextRequest) {
  try {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json({ error: "Token do MP nao configurado" }, { status: 500 });
    }

    const body = await req.json();
    const { plano, email, nome, whatsapp, pais, estado, cidade, codigo_pais } = body;
    const quantidade = Math.max(1, Math.min(25, parseInt(body.quantidade, 10) || 1));

    const plan = PLANOS[plano];
    if (!plan) {
      return NextResponse.json({ error: "Plano invalido" }, { status: 400 });
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "E-mail invalido" }, { status: 400 });
    }

    // Calcula preco com desconto de volume
    const desconto = getDesconto(quantidade);
    const precoUnitario = Math.round(plan.price * (1 - desconto) * 100) / 100;
    const total = Math.round(precoUnitario * quantidade * 100) / 100;

    // Salva/atualiza o cliente no Supabase antes do pagamento
    if (nome && SUPABASE_URL && SUPABASE_KEY) {
      const headers = {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      };

      const checkRes = await fetch(
        `${SUPABASE_URL}/rest/v1/clientes?email=eq.${encodeURIComponent(email)}`,
        { headers }
      );
      const existing = await checkRes.json();

      const clienteData = {
        nome,
        email,
        whatsapp: whatsapp || null,
        pais: pais || null,
        estado: estado || null,
        cidade: cidade || null,
        codigo_pais: codigo_pais || null,
      };

      if (existing.length > 0) {
        await fetch(
          `${SUPABASE_URL}/rest/v1/clientes?email=eq.${encodeURIComponent(email)}`,
          { method: "PATCH", headers, body: JSON.stringify(clienteData) }
        );
      } else {
        await fetch(
          `${SUPABASE_URL}/rest/v1/clientes`,
          { method: "POST", headers, body: JSON.stringify(clienteData) }
        );
      }
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const titleSuffix = quantidade > 1 ? ` (${quantidade} chaves)` : "";

    const result = await preference.create({
      body: {
        items: [
          {
            id: `${plano}_x${quantidade}`,
            title: `${plan.title}${titleSuffix}`,
            quantity: 1,
            unit_price: total,
            currency_id: "BRL",
          },
        ],
        payer: {
          email: email,
          name: nome || undefined,
        },
        ...(siteUrl.includes("localhost") ? {} : {
          back_urls: {
            success: `${siteUrl}/sucesso`,
            failure: `${siteUrl}/falha`,
            pending: `${siteUrl}/pendente`,
          },
          auto_return: "approved" as const,
        }),
        notification_url: siteUrl.includes("localhost")
          ? undefined
          : `${siteUrl}/api/webhook`,
        metadata: {
          plano: plano,
          email: email,
          nome: nome || "",
          quantidade: quantidade,
        },
      },
    });

    return NextResponse.json({
      checkout_url: result.init_point,
      sandbox_url: result.sandbox_init_point,
    });
  } catch (error) {
    console.error("Erro ao criar checkout:", error);
    const message = error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null
        ? JSON.stringify(error)
        : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
