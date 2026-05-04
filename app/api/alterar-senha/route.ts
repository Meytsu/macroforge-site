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
    const { email, senhaAtual, novaSenha } = await req.json();

    if (!email || !senhaAtual || !novaSenha) {
      return NextResponse.json({ error: "Todos os campos sao obrigatorios" }, { status: 400 });
    }

    // Validação da nova senha
    if (novaSenha.length < 8) {
      return NextResponse.json({ error: "Nova senha deve ter no minimo 8 caracteres" }, { status: 400 });
    }
    if (!/[A-Z]/.test(novaSenha)) {
      return NextResponse.json({ error: "Nova senha deve ter pelo menos 1 letra maiuscula" }, { status: 400 });
    }
    if (!/[a-z]/.test(novaSenha)) {
      return NextResponse.json({ error: "Nova senha deve ter pelo menos 1 letra minuscula" }, { status: 400 });
    }
    if (!/[!@#$%&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(novaSenha)) {
      return NextResponse.json({ error: "Nova senha deve ter pelo menos 1 caractere especial" }, { status: 400 });
    }

    // Busca o cliente
    const checkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/clientes?email=eq.${encodeURIComponent(email)}&select=id,senha_hash`,
      { headers }
    );
    const clientes = await checkRes.json();

    if (clientes.length === 0) {
      return NextResponse.json({ error: "Cliente nao encontrado" }, { status: 404 });
    }

    const cliente = clientes[0];

    // Verifica senha atual
    if (!cliente.senha_hash) {
      return NextResponse.json({ error: "Conta sem senha cadastrada" }, { status: 400 });
    }

    const senhaCorreta = await bcrypt.compare(senhaAtual, cliente.senha_hash);
    if (!senhaCorreta) {
      return NextResponse.json({ error: "Senha atual incorreta" }, { status: 401 });
    }

    // Criptografa nova senha
    const novoHash = await bcrypt.hash(novaSenha, 10);

    // Atualiza
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/clientes?id=eq.${cliente.id}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({ senha_hash: novoHash }),
      }
    );

    if (res.ok) {
      return NextResponse.json({ ok: true, message: "Senha alterada com sucesso" });
    } else {
      return NextResponse.json({ error: "Erro ao alterar senha" }, { status: 500 });
    }
  } catch (error) {
    console.error("Erro ao alterar senha:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}
