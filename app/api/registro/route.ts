import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

// Dominios de email temporario/descartavel — bloquear cadastro
const DOMINIOS_BLOQUEADOS = new Set([
  "tempmail.com", "temp-mail.org", "tempmail.net", "temp-mail.io",
  "guerrillamail.com", "guerrillamail.net", "guerrillamail.org", "guerrilla.ml",
  "yopmail.com", "yopmail.fr", "yopmail.net",
  "mailinator.com", "mailinator2.com",
  "throwaway.email", "throwawaymail.com",
  "sharklasers.com", "guerrillamailblock.com", "grr.la", "dispostable.com",
  "maildrop.cc", "mailnesia.com", "mailcatch.com",
  "10minutemail.com", "10minutemail.net", "10minute.email",
  "trashmail.com", "trashmail.net", "trashmail.me",
  "getnada.com", "nada.email", "nada.ltd",
  "mohmal.com", "emailondeck.com", "tempr.email",
  "fakeinbox.com", "fakemail.net",
  "crazymailing.com", "tmail.ws",
  "burnermail.io", "inboxkitten.com",
  "mailsac.com", "harakirimail.com",
  "tempail.com", "tmpmail.net", "tmpmail.org",
  "disposableemailaddresses.emailmiser.com",
  "mytemp.email", "emailfake.com",
  "mintemail.com", "flitmail.com",
  "getairmail.com", "filzmail.com",
  "mailnull.com", "spamfree24.org",
  "bugmenot.com", "discard.email",
  "discardmail.com", "discardmail.de",
  "mailexpire.com", "safetymail.info",
  "squizzy.de", "trashinbox.com",
]);

function isEmailDescartavel(email: string): boolean {
  const dominio = email.split("@")[1]?.toLowerCase();
  if (!dominio) return false;
  return DOMINIOS_BLOQUEADOS.has(dominio);
}

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

export async function POST(req: NextRequest) {
  try {
    const { nome, email, senha, whatsapp, pais, estado, cidade, codigo_pais } =
      await req.json();

    // Validações
    if (!nome || !email || !senha) {
      return NextResponse.json(
        { error: "Nome, e-mail e senha sao obrigatorios" },
        { status: 400 }
      );
    }

    if (!email.includes("@")) {
      return NextResponse.json({ error: "E-mail invalido" }, { status: 400 });
    }

    // Bloqueia emails temporarios/descartaveis
    if (isEmailDescartavel(email)) {
      return NextResponse.json(
        { error: "E-mails temporarios nao sao permitidos. Use seu e-mail real." },
        { status: 400 }
      );
    }

    // Validação da senha
    if (senha.length < 8) {
      return NextResponse.json(
        { error: "Senha deve ter no minimo 8 caracteres" },
        { status: 400 }
      );
    }
    if (!/[A-Z]/.test(senha)) {
      return NextResponse.json(
        { error: "Senha deve ter pelo menos 1 letra maiuscula" },
        { status: 400 }
      );
    }
    if (!/[a-z]/.test(senha)) {
      return NextResponse.json(
        { error: "Senha deve ter pelo menos 1 letra minuscula" },
        { status: 400 }
      );
    }
    if (!/[!@#$%&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(senha)) {
      return NextResponse.json(
        { error: "Senha deve ter pelo menos 1 caractere especial (!@#$%&*)" },
        { status: 400 }
      );
    }

    // Verifica se e-mail já existe
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/clientes?email=eq.${encodeURIComponent(email)}&select=id,senha_hash`,
      { headers }
    );
    const existing = await checkRes.json();

    // Criptografa a senha
    const senha_hash = await bcrypt.hash(senha, 10);

    if (existing.length > 0) {
      if (existing[0].senha_hash) {
        return NextResponse.json(
          { error: "E-mail ja cadastrado. Use a pagina de login." },
          { status: 409 }
        );
      }
      // Cliente existe (criado pelo webhook) mas sem senha — atualiza
      await fetch(
        `${SUPABASE_URL}/rest/v1/clientes?id=eq.${existing[0].id}`,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            nome,
            senha_hash,
            whatsapp: whatsapp || null,
            pais: pais || null,
            estado: estado || null,
            cidade: cidade || null,
            codigo_pais: codigo_pais || null,
          }),
        }
      );
      return NextResponse.json({ ok: true, message: "Conta atualizada com sucesso" });
    }

    // Cria cliente novo
    const res = await fetch(`${SUPABASE_URL}/rest/v1/clientes`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        nome,
        email,
        senha_hash,
        whatsapp: whatsapp || null,
        pais: pais || null,
        estado: estado || null,
        cidade: cidade || null,
        codigo_pais: codigo_pais || null,
      }),
    });

    if (res.ok) {
      return NextResponse.json({ ok: true, message: "Conta criada com sucesso" });
    } else {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: 500 });
    }
  } catch (error) {
    console.error("Erro no registro:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}
