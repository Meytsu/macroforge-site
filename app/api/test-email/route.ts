import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Rota temporaria para testar envio de email pelo dominio macroforge.com.br
// REMOVER antes de publicar em producao
export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email obrigatorio" }, { status: 400 });
    }

    const result = await resend.emails.send({
      from: "MacroForge <noreply@macroforge.com.br>",
      to: email,
      subject: "Teste de email — MacroForge",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0D1117; color: #fff; padding: 32px; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #D4A017; margin: 0;">MacroForge</h1>
            <p style="color: #8B949E; font-size: 14px;">Automacao inteligente para mobile</p>
          </div>

          <div style="background: #161B22; border: 1px solid #30363D; border-radius: 12px; padding: 24px; text-align: center;">
            <p style="color: #4CAF50; font-size: 18px; font-weight: bold; margin: 0 0 8px 0;">Email funcionando!</p>
            <p style="color: #8B949E; font-size: 14px; margin: 0;">
              Este email foi enviado de <strong style="color: #D4A017;">noreply@macroforge.com.br</strong>
            </p>
            <p style="color: #8B949E; font-size: 12px; margin-top: 16px;">
              Se voce recebeu este email, o dominio esta configurado corretamente.
            </p>
          </div>

          <div style="text-align: center; margin-top: 24px;">
            <p style="color: #30363D; font-size: 11px;">MacroForge &copy; 2026 — Email de teste</p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true, id: result.data?.id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
