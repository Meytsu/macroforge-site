import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const PLANO_DIAS: Record<string, number> = {
  mensal: 30,
  trimestral: 90,
  semestral: 180,
};

const PLANO_VALOR: Record<string, number> = {
  mensal: 14.9,
  trimestral: 34.9,
  semestral: 59.9,
};

function gerarChave(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const parte = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `MF-${parte()}-${parte()}-${parte()}`;
}

async function supabaseFetch(path: string, options: RequestInit) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...options.headers,
    },
  });
  return res;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Mercado Pago envia vários tipos de notificação — só nos interessa "payment"
    if (body.type !== "payment" && body.action !== "payment.created") {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    // Busca detalhes do pagamento no Mercado Pago
    const payment = new Payment(client);
    const paymentData = await payment.get({ id: paymentId });

    // Só processa pagamentos aprovados
    if (paymentData.status !== "approved") {
      console.log(`Pagamento ${paymentId} com status: ${paymentData.status}`);
      return NextResponse.json({ ok: true, status: paymentData.status });
    }

    const email = paymentData.metadata?.email || paymentData.payer?.email;
    const plano = paymentData.metadata?.plano || "mensal";

    if (!email) {
      console.error("Pagamento sem e-mail:", paymentId);
      return NextResponse.json({ error: "E-mail não encontrado" }, { status: 400 });
    }

    console.log(`Pagamento aprovado! E-mail: ${email}, Plano: ${plano}`);

    // 1. Busca ou cria o cliente
    let clienteId: string;

    const clienteResp = await supabaseFetch(`clientes?email=eq.${encodeURIComponent(email)}`, {
      method: "GET",
    });
    const clientes = await clienteResp.json();

    if (clientes.length > 0) {
      clienteId = clientes[0].id;
    } else {
      // Cria cliente novo
      const novoResp = await supabaseFetch("clientes", {
        method: "POST",
        body: JSON.stringify({ nome: email.split("@")[0], email }),
      });
      const novos = await novoResp.json();
      clienteId = novos[0].id;
    }

    // 2. Gera a chave de licença
    const chave = gerarChave();
    const dias = PLANO_DIAS[plano] || 30;
    const valor = PLANO_VALOR[plano] || 14.9;
    const expiracao = new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString();

    const licencaResp = await supabaseFetch("licencas", {
      method: "POST",
      body: JSON.stringify({
        chave,
        cliente_id: clienteId,
        plano,
        valor,
        status: "ativa",
        data_expiracao: expiracao,
        mp_payment_id: String(paymentId),
      }),
    });

    if (licencaResp.ok) {
      console.log(`Licença gerada: ${chave} para ${email} (${plano})`);
      // TODO: Enviar e-mail com a chave para o cliente (Resend/EmailJS)
    } else {
      const err = await licencaResp.text();
      console.error("Erro ao criar licença:", err);
    }

    return NextResponse.json({ ok: true, chave });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro no webhook:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
