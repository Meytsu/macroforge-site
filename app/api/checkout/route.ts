import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";

const PLANOS: Record<string, { title: string; price: number; days: number }> = {
  mensal: { title: "MacroForge — Mensal", price: 14.9, days: 30 },
  trimestral: { title: "MacroForge — Trimestral", price: 34.9, days: 90 },
  semestral: { title: "MacroForge — Semestral", price: 59.9, days: 180 },
};

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

    const plan = PLANOS[plano];
    if (!plan) {
      return NextResponse.json({ error: "Plano invalido" }, { status: 400 });
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "E-mail invalido" }, { status: 400 });
    }

    // Salva/atualiza o cliente no Supabase antes do pagamento
    if (nome && SUPABASE_URL && SUPABASE_KEY) {
      const headers = {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      };

      // Verifica se o cliente já existe
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
        // Atualiza dados do cliente existente
        await fetch(
          `${SUPABASE_URL}/rest/v1/clientes?email=eq.${encodeURIComponent(email)}`,
          { method: "PATCH", headers, body: JSON.stringify(clienteData) }
        );
      } else {
        // Cria cliente novo
        await fetch(
          `${SUPABASE_URL}/rest/v1/clientes`,
          { method: "POST", headers, body: JSON.stringify(clienteData) }
        );
      }
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
