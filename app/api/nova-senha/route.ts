import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

export async function POST(req: NextRequest) {
  try {
    const { email, codigo, novaSenha } = await req.json();

    if (!email || !codigo || !novaSenha) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    // Validacao da senha
    if (novaSenha.length < 8) return NextResponse.json({ error: "Minimo 8 caracteres" }, { status: 400 });
    if (!/[A-Z]/.test(novaSenha)) return NextResponse.json({ error: "Precisa de maiuscula" }, { status: 400 });
    if (!/[a-z]/.test(novaSenha)) return NextResponse.json({ error: "Precisa de minuscula" }, { status: 400 });
    if (!/[!@#$%&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(novaSenha)) return NextResponse.json({ error: "Precisa de caractere especial" }, { status: 400 });

    // Verifica o codigo novamente
    const codRes = await fetch(
      `${SUPABASE_URL}/rest/v1/codigos_recuperacao?email=eq.${encodeURIComponent(email)}&codigo=eq.${codigo}&usado=eq.false&order=criado_em.desc&limit=1`,
      { headers }
    );
    const codigos = await codRes.json();

    if (codigos.length === 0) {
      return NextResponse.json({ error: "Codigo invalido" }, { status: 401 });
    }

    if (new Date(codigos[0].expira_em) < new Date()) {
      return NextResponse.json({ error: "Codigo expirado" }, { status: 410 });
    }

    // Marca o codigo como usado
    await fetch(
      `${SUPABASE_URL}/rest/v1/codigos_recuperacao?id=eq.${codigos[0].id}`,
      { method: "PATCH", headers, body: JSON.stringify({ usado: true }) }
    );

    // Atualiza a senha
    const senha_hash = await bcrypt.hash(novaSenha, 10);
    const updateRes = await fetch(
      `${SUPABASE_URL}/rest/v1/clientes?email=eq.${encodeURIComponent(email)}`,
      { method: "PATCH", headers, body: JSON.stringify({ senha_hash }) }
    );

    if (updateRes.ok) {
      return NextResponse.json({ ok: true, message: "Senha alterada com sucesso" });
    } else {
      return NextResponse.json({ error: "Erro ao atualizar senha" }, { status: 500 });
    }
  } catch (error) {
    console.error("Erro na nova senha:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}
