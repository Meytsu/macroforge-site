import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { Resend } from "resend";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

const resend = new Resend(process.env.RESEND_API_KEY);

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

// Alinhado ao app/checkout/página (MF-103, 2026-06-20). Trimestral removido.
// (Chaves antigas com plano='trimestral' seguem validas; o mapa só serve pra novas compras.)
const PLANO_DIAS: Record<string, number> = {
  mensal: 30,
  semestral: 180,
  anual: 365,
};

const PLANO_VALOR: Record<string, number> = {
  mensal: 9.9,
  semestral: 47.9,
  anual: 79.9,
};

const PLANO_NOME: Record<string, string> = {
  mensal: "Mensal (30 dias)",
  semestral: "Semestral (180 dias)",
  anual: "Anual (365 dias)",
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
      from: "MacroForge <noreply@macroforge.com.br>",
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
                <td style="color: #8B949E; padding: 4px 0;">Valido ate</td>
                <td style="color: #fff; text-align: right; padding: 4px 0;">${dataExp}</td>
              </tr>
            </table>
          </div>

          <div style="background: #161B22; border: 1px solid #30363D; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
            <p style="color: #D4A017; font-weight: bold; margin: 0 0 8px 0;">Como ativar:</p>
            <ol style="color: #8B949E; font-size: 13px; padding-left: 20px; margin: 0;">
              <li style="margin-bottom: 4px;">Baixe o MacroForge no seu painel: <a href="https://macroforge.com.br/login" style="color: #D4A017;">macroforge.com.br</a></li>
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

async function enviarEmailMultichave(email: string, chaves: string[], plano: string, expiracao: string) {
  const dataExp = new Date(expiracao).toLocaleDateString("pt-BR");
  const planoNome = PLANO_NOME[plano] || plano;

  const chavesHtml = chaves
    .map(
      (c, i) =>
        `<div style="background: #0D1117; border: 2px solid #D4A017; border-radius: 8px; padding: 12px; text-align: center; margin-bottom: 8px;">
          <span style="color: #8B949E; font-size: 12px;">Chave ${i + 1}</span><br/>
          <span style="font-family: monospace; font-size: 20px; font-weight: bold; color: #D4A017; letter-spacing: 2px;">${c}</span>
        </div>`
    )
    .join("");

  try {
    await resend.emails.send({
      from: "MacroForge <noreply@macroforge.com.br>",
      to: email,
      subject: `Suas ${chaves.length} chaves MacroForge estao prontas!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0D1117; color: #fff; padding: 32px; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #D4A017; margin: 0;">MacroForge</h1>
            <p style="color: #8B949E; font-size: 14px;">Automacao inteligente para mobile</p>
          </div>

          <div style="background: #161B22; border: 1px solid #30363D; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <p style="color: #8B949E; font-size: 14px; margin: 0 0 12px 0;">Suas ${chaves.length} chaves de licenca:</p>
            ${chavesHtml}
          </div>

          <div style="background: #161B22; border: 1px solid #30363D; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
            <table style="width: 100%; font-size: 14px;">
              <tr>
                <td style="color: #8B949E; padding: 4px 0;">Plano</td>
                <td style="color: #fff; text-align: right; padding: 4px 0;">${planoNome}</td>
              </tr>
              <tr>
                <td style="color: #8B949E; padding: 4px 0;">Quantidade</td>
                <td style="color: #fff; text-align: right; padding: 4px 0;">${chaves.length} chaves</td>
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
              <li style="margin-bottom: 4px;">Cada chave ativa em 1 dispositivo</li>
              <li style="margin-bottom: 4px;">Baixe o MacroForge: <a href="https://macroforge.com.br/login" style="color: #D4A017;">macroforge.com.br</a></li>
              <li style="margin-bottom: 4px;">Instale o APK e digite a chave</li>
              <li>Distribua as chaves restantes para seu grupo</li>
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
    console.log(`Email enviado para ${email} com ${chaves.length} chaves`);
  } catch (error) {
    console.error("Erro ao enviar email multichave:", error);
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
    const quantidade = Math.max(1, parseInt(paymentData.metadata?.quantidade, 10) || 1);

    if (!email) {
      console.error("Pagamento sem e-mail:", paymentId);
      return NextResponse.json({ error: "E-mail nao encontrado" }, { status: 400 });
    }

    console.log(`Pagamento aprovado! E-mail: ${email}, Plano: ${plano}, Qty: ${quantidade}`);

    // 0. Idempotência: o Mercado Pago REENVIA notificações de rotina (e poderiam ser
    // repetidas/maliciosas). Se já criamos licença(s) pra este pagamento, não cria de
    // novo — senão o mesmo pagamento gera chaves duplicadas (chave grátis extra).
    const jaResp = await supabaseFetch(
      `licencas?mp_payment_id=eq.${encodeURIComponent(String(paymentId))}&select=chave`,
      { method: "GET" }
    );
    const jaExistentes = await jaResp.json();
    if (Array.isArray(jaExistentes) && jaExistentes.length > 0) {
      console.log(`Pagamento ${paymentId} já processado (${jaExistentes.length} chave(s)). Duplicata ignorada.`);
      return NextResponse.json({ ok: true, jaProcessado: true });
    }

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

    // 2. Gera N chaves de licenca
    const dias = PLANO_DIAS[plano] || 30;
    const valor = paymentData.transaction_amount
      ? Number(paymentData.transaction_amount) / quantidade
      : PLANO_VALOR[plano] || 9.9;
    const expiracao = new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString();

    const chaves: string[] = [];

    for (let i = 0; i < quantidade; i++) {
      const chave = gerarChave();

      const licencaResp = await supabaseFetch("licencas", {
        method: "POST",
        body: JSON.stringify({
          chave,
          cliente_id: clienteId,
          plano,
          valor: Math.round(valor * 100) / 100,
          status: "ativa",
          data_expiracao: expiracao,
          mp_payment_id: String(paymentId),
        }),
      });

      if (licencaResp.ok) {
        chaves.push(chave);
        console.log(`Licenca ${i + 1}/${quantidade} gerada: ${chave}`);
      } else {
        const err = await licencaResp.text();
        console.error(`Erro ao criar licenca ${i + 1}:`, err);
      }
    }

    // 3. Envia email com a(s) chave(s)
    if (chaves.length === 1) {
      await enviarEmailChave(email, chaves[0], plano, expiracao);
    } else if (chaves.length > 1) {
      await enviarEmailMultichave(email, chaves, plano, expiracao);
    }

    return NextResponse.json({ ok: true, chaves });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    console.error("Erro no webhook:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
