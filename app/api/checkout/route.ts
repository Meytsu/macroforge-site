import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";

const PLANOS: Record<string, { title: string; price: number; days: number }> = {
  mensal: { title: "MacroForge — Mensal (TESTE)", price: 1.0, days: 30 },
  trimestral: { title: "MacroForge — Trimestral", price: 34.9, days: 90 },
  semestral: { title: "MacroForge — Semestral", price: 59.9, days: 180 },
};

export async function POST(req: NextRequest) {
  try {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json({ error: "Token do MP nao configurado" }, { status: 500 });
    }

    const body = await req.json();
    const { plano, email } = body;

    const plan = PLANOS[plano];
    if (!plan) {
      return NextResponse.json({ error: "Plano invalido" }, { status: 400 });
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "E-mail invalido" }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: [
          {
            id: plano,
            title: plan.title,
            quantity: 1,
            unit_price: plan.price,
            currency_id: "BRL",
          },
        ],
        payer: {
          email: email,
        },
        back_urls: {
          success: `${siteUrl}/sucesso`,
          failure: `${siteUrl}/falha`,
          pending: `${siteUrl}/pendente`,
        },
        auto_return: "approved",
        notification_url: `${siteUrl}/api/webhook`,
        metadata: {
          plano: plano,
          email: email,
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
