import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const resend = new Resend(process.env.RESEND_API_KEY);

const TRIAL_DIAS = 7;

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

function gerarChave(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const parte = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `MF-${parte()}-${parte()}-${parte()}`;
}

export async function POST(req: NextRequest) {
  try {
    const { email, device_id } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "E-mail invalido" }, { status: 400 });
    }

    if (!device_id || device_id.length < 8) {
      return NextResponse.json({ error: "Device ID invalido" }, { status: 400 });
    }

    // 1. Busca o cliente
    const clienteRes = await fetch(
      `${SUPABASE_URL}/rest/v1/clientes?email=eq.${encodeURIComponent(email)}&select=id,nome,email`,
      { headers }
    );
    const clientes = await clienteRes.json();

    if (clientes.length === 0) {
      return NextResponse.json({ error: "Conta nao encontrada. Cadastre-se primeiro." }, { status: 404 });
    }

    const cliente = clientes[0];

    // 2. Verifica se esse device_id ja teve trial
    const trialDeviceRes = await fetch(
      `${SUPABASE_URL}/rest/v1/licencas?device_id=eq.${encodeURIComponent(device_id)}&plano=eq.trial&select=id,chave,data_expiracao`,
      { headers }
    );
    const trialsDevice = await trialDeviceRes.json();

    if (trialsDevice.length > 0) {
      return NextResponse.json(
        { error: "Trial ja utilizado neste dispositivo. Assine para continuar." },
        { status: 409 }
      );
    }

    // 3. Verifica se esse cliente ja teve trial (qualquer device)
    const trialClienteRes = await fetch(
      `${SUPABASE_URL}/rest/v1/licencas?cliente_id=eq.${cliente.id}&plano=eq.trial&select=id`,
      { headers }
    );
    const trialsCliente = await trialClienteRes.json();

    if (trialsCliente.length > 0) {
      return NextResponse.json(
        { error: "Voce ja utilizou seu trial gratuito." },
        { status: 409 }
      );
    }

    // 4. Verifica se esse cliente ja tem licenca ativa (paga)
    const licAtiva = await fetch(
      `${SUPABASE_URL}/rest/v1/licencas?cliente_id=eq.${cliente.id}&status=eq.ativa&data_expiracao=gt.${new Date().toISOString()}&select=id,chave`,
      { headers }
    );
    const ativas = await licAtiva.json();

    if (ativas.length > 0) {
      return NextResponse.json(
        { error: "Voce ja possui uma licenca ativa.", chave: ativas[0].chave },
        { status: 409 }
      );
    }

    // 5. Gera chave trial
    const chave = gerarChave();
    const expiracao = new Date(Date.now() + TRIAL_DIAS * 24 * 60 * 60 * 1000).toISOString();

    const licRes = await fetch(`${SUPABASE_URL}/rest/v1/licencas`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        chave,
        cliente_id: cliente.id,
        plano: "trial",
        valor: 0,
        status: "ativa",
        device_id,
        data_expiracao: expiracao,
      }),
    });

    if (!licRes.ok) {
      const err = await licRes.text();
      console.error("Erro ao criar trial:", err);
      return NextResponse.json({ error: "Erro ao ativar trial" }, { status: 500 });
    }

    console.log(`Trial ativado: ${chave} para ${email} (device: ${device_id})`);

    // 6. Envia email com a chave trial
    const dataExp = new Date(expiracao).toLocaleDateString("pt-BR");
    try {
      await resend.emails.send({
        from: "MacroForge <noreply@macroforge.com.br>",
        to: email,
        subject: "Seu trial MacroForge de 7 dias esta ativo!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0D1117; color: #fff; padding: 32px; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #D4A017; margin: 0;">MacroForge</h1>
              <p style="color: #8B949E; font-size: 14px;">Automacao inteligente para mobile</p>
            </div>

            <div style="background: #161B22; border: 1px solid #30363D; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <p style="color: #4CAF50; font-size: 16px; font-weight: bold; margin: 0 0 8px 0;">Trial de 7 dias ativado!</p>
              <p style="color: #8B949E; font-size: 14px; margin: 0 0 12px 0;">Sua chave:</p>
              <div style="background: #0D1117; border: 2px solid #D4A017; border-radius: 8px; padding: 16px; text-align: center;">
                <span style="font-family: monospace; font-size: 24px; font-weight: bold; color: #D4A017; letter-spacing: 2px;">${chave}</span>
              </div>
            </div>

            <div style="background: #161B22; border: 1px solid #30363D; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
              <table style="width: 100%; font-size: 14px;">
                <tr>
                  <td style="color: #8B949E; padding: 4px 0;">Plano</td>
                  <td style="color: #fff; text-align: right; padding: 4px 0;">Trial gratuito (7 dias)</td>
                </tr>
                <tr>
                  <td style="color: #8B949E; padding: 4px 0;">Valido ate</td>
                  <td style="color: #fff; text-align: right; padding: 4px 0;">${dataExp}</td>
                </tr>
              </table>
            </div>

            <div style="background: #161B22; border: 1px solid #30363D; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
              <p style="color: #8B949E; font-size: 13px; margin: 0;">
                Aproveite todas as funcionalidades PRO durante 7 dias. Ao final, assine para continuar usando:
                <a href="https://macroforge.com.br/planos" style="color: #D4A017;">ver planos</a>
              </p>
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
    } catch (emailErr) {
      console.error("Erro ao enviar email trial:", emailErr);
    }

    return NextResponse.json({
      ok: true,
      chave,
      plano: "trial",
      expiracao,
      dias: TRIAL_DIAS,
    });
  } catch (error) {
    console.error("Erro no ativar-trial:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}
