import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { Resend } from "resend";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

const resend = new Resend(process.env.RESEND_API_KEY);

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

const PLANO_NOME: Record<string, string> = {
  mensal: "Mensal (30 dias)",
  trimestral: "Trimestral (90 dias)",
  semestral: "Semestral (180 dias)",
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

async function enviarEmailChave(email: string, chave: string, plano: string, expiracao: string) {
  const dataExp = new Date(expiracao).toLocaleDateString("pt-BR");
  const planoNome = PLANO_NOME[plano] || plano;

  try {
    await resend.emails.send({
      from: "MacroForge <onboarding@resend.dev>",
      to: email,
      subject: "Sua chave MacroForge esta pronta!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0D1117; color: #fff; padding: 32px; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #D4A017; margin: 0;">MacroForge</h1>
            <p style="color: #8B949E; font-size: 14px;">Automacao inteligente para mobile</p>
          </div>

          <div style="background: #161B22; border: 1px solid #30363D; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <p style="color: #8B949E; font-size: 14px; margin: 0 0 8px 0;">Sua chave de licenca:</p>
            <div style="background: #0D1117; border: 2px solid #D4A017; border-radius: 8px; padding: 16px; text-align: center;">
              <span style="font-family: monospace; font-size: 24px; font-weight: bold; color: #D4A017; letter-spacing: 2px;">${chave}</span>
            </div>
          </div>

          <div style="background: #161B22; border: 1px solid #30363D; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
            <table style="width: 100%; font-size: 14px;">
              <tr>
                <td style="color: #8B949E; padding: 4px 0;">Plano</td>
                <td style="color: #fff; text-align: right; padding: 4px 0;">${planoNome}</td>
              </tr>
              <tr>
                <td style="color: #8B949E; padding: 4px 0;">Valor</td>
                <td style="color: #fff; text-align: right; padding: 4px 0;">R$ ${PLANO_VALOR[plano]?.toFixed(2).replace(".", ",") || "14,90"}</td>
              </tr>
              <tr>
                <td style="color: #8B949E; padding: 4px 0;">Valido ate</td>
                <td style="color: #fff; text-align: right; padding: 4px 0;">${dataExp}</td>
              </tr>
            </table>
          </div>

          <div style="background: #161B22; border: 1px solid #30363D; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
            <p style="color: #D4A017; font-weight: bold; margin: 0 0 8px 0;">Como ativar:</p>
            <ol style="color: #8B949E; font-size: 13px; padding-left: 20px; margin: 0;">
              <li style="margin-bottom: 4px;">Baixe o MacroForge no seu painel: <a href="https://macroforge-app.vercel.app/login" style="color: #D4A017;">macroforge-app.vercel.app</a></li>
              <li style="margin-bottom: 4px;">Instale o APK no celular ou BlueStacks</li>
              <li style="margin-bottom: 4px;">Abra o app e digite a chave acima</li>
              <li>Pronto! Crie seus macros e automatize</li>
            </ol>
          </div>

          <div style="text-align: center; margin-top: 24px;">
            <p style="color: #8B949E; font-size: 12px;">
              Duvidas? Fale conosco:
              <a href="https://wa.me/5581973197753" style="color: #D4A017;">WhatsApp</a>
            </p>
            <p style="color: #30363D; font-size: 11px; margin-top: 16px;">MacroForge &copy; 2026</p>
          </div>
        </div>
      `,
    });
    console.log(`Email enviado para ${email} com chave ${chave}`);
  } catch (error) {
    console.error("Erro ao enviar email:", error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.type !== "payment" && body.action !== "payment.created") {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const payment = new Payment(client);
    const paymentData = await payment.get({ id: paymentId });

    if (paymentData.status !== "approved") {
      console.log(`Pagamento ${paymentId} com status: ${paymentData.status}`);
      return NextResponse.json({ ok: true, status: paymentData.status });
    }

    const email = paymentData.metadata?.email || paymentData.payer?.email;
    const plano = paymentData.metadata?.plano || "mensal";

    if (!email) {
      console.error("Pagamento sem e-mail:", paymentId);
      return NextResponse.json({ error: "E-mail nao encontrado" }, { status: 400 });
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
      const novoResp = await supabaseFetch("clientes", {
        method: "POST",
        body: JSON.stringify({ nome: email.split("@")[0], email }),
      });
      const novos = await novoResp.json();
      clienteId = novos[0].id;
    }

    // 2. Gera a chave de licenca
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
      console.log(`Licenca gerada: ${chave} para ${email} (${plano})`);

      // 3. Envia email com a chave
      await enviarEmailChave(email, chave, plano, expiracao);
    } else {
      const err = await licencaResp.text();
      console.error("Erro ao criar licenca:", err);
    }

    return NextResponse.json({ ok: true, chave });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro no webhook:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
