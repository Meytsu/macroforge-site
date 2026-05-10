import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

const MAX_PEDIDOS = 3;
const BLOQUEIO_MINUTOS_RECUP = 30;

async function verificarBloqueioRecup(email: string): Promise<string | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/tentativas_login?email=eq.${encodeURIComponent(email)}&tipo=eq.recuperacao&order=ultima_tentativa.desc&limit=1`,
    { headers }
  );
  const dados = await res.json();
  if (dados.length === 0) return null;

  const reg = dados[0];
  if (reg.bloqueado_ate && new Date() < new Date(reg.bloqueado_ate)) {
    const min = Math.ceil((new Date(reg.bloqueado_ate).getTime() - Date.now()) / 60000);
    return `Muitos pedidos. Aguarde ${min} minuto(s).`;
  }
  // Expirou — reseta
  if (reg.bloqueado_ate) {
    await fetch(`${SUPABASE_URL}/rest/v1/tentativas_login?id=eq.${reg.id}`,
      { method: "PATCH", headers, body: JSON.stringify({ tentativas: 0, bloqueado_ate: null }) });
  }
  return null;
}

async function registrarPedidoRecup(email: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/tentativas_login?email=eq.${encodeURIComponent(email)}&tipo=eq.recuperacao&order=ultima_tentativa.desc&limit=1`,
    { headers }
  );
  const dados = await res.json();

  if (dados.length > 0) {
    const novas = dados[0].tentativas + 1;
    const bloqueio = novas >= MAX_PEDIDOS
      ? new Date(Date.now() + BLOQUEIO_MINUTOS_RECUP * 60 * 1000).toISOString() : null;
    await fetch(`${SUPABASE_URL}/rest/v1/tentativas_login?id=eq.${dados[0].id}`,
      { method: "PATCH", headers, body: JSON.stringify({
          tentativas: novas, ultima_tentativa: new Date().toISOString(), bloqueado_ate: bloqueio }) });
  } else {
    await fetch(`${SUPABASE_URL}/rest/v1/tentativas_login`,
      { method: "POST", headers, body: JSON.stringify({
          email, tipo: "recuperacao", tentativas: 1, ultima_tentativa: new Date().toISOString() }) });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "E-mail invalido" }, { status: 400 });
    }

    // Verifica bloqueio
    const bloqueio = await verificarBloqueioRecup(email);
    if (bloqueio) {
      return NextResponse.json({ error: bloqueio }, { status: 429 });
    }

    // Registra tentativa
    await registrarPedidoRecup(email);

    // Verifica se o cliente existe
    const clienteRes = await fetch(
      `${SUPABASE_URL}/rest/v1/clientes?email=eq.${encodeURIComponent(email)}&select=id,nome`,
      { headers }
    );
    const clientes = await clienteRes.json();

    if (clientes.length === 0) {
      return NextResponse.json({ error: "E-mail nao encontrado" }, { status: 404 });
    }

    const nome = clientes[0].nome?.split(" ")[0] || "Cliente";

    // Gera codigo de 6 digitos
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expira = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutos

    // Salva no banco
    await fetch(`${SUPABASE_URL}/rest/v1/codigos_recuperacao`, {
      method: "POST",
      headers,
      body: JSON.stringify({ email, codigo, expira_em: expira }),
    });

    // Envia email
    await resend.emails.send({
      from: "MacroForge <noreply@macroforge.com.br>",
      to: email,
      subject: "Codigo de recuperacao — MacroForge",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; background: #0D1117; color: #fff; padding: 32px; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #D4A017; margin: 0;">MacroForge</h1>
          </div>
          <p style="color: #8B949E; text-align: center;">Ola, ${nome}!</p>
          <p style="color: #8B949E; text-align: center; font-size: 14px;">Seu codigo de recuperacao de senha:</p>
          <div style="background: #161B22; border: 2px solid #D4A017; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-family: monospace; font-size: 36px; font-weight: bold; color: #D4A017; letter-spacing: 8px;">${codigo}</span>
          </div>
          <p style="color: #8B949E; text-align: center; font-size: 12px;">Valido por 15 minutos. Se nao foi voce, ignore este e-mail.</p>
          <p style="color: #30363D; text-align: center; font-size: 11px; margin-top: 24px;">MacroForge &copy; 2026</p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true, message: "Codigo enviado para seu e-mail" });
  } catch (error) {
    console.error("Erro na recuperacao:", error);
    return NextResponse.json({ error: "Erro ao enviar codigo" }, { status: 500 });
  }
}
