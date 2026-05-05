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
    const { email, senha, chave } = await req.json();

    if (!email || !senha || !chave) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    // Verifica a senha do cliente (seguranca: so o dono pode resetar)
    const clienteRes = await fetch(
      `${SUPABASE_URL}/rest/v1/clientes?email=eq.${encodeURIComponent(email)}&select=id,senha_hash`,
      { headers }
    );
    const clientes = await clienteRes.json();

    if (clientes.length === 0) {
      return NextResponse.json({ error: "Cliente nao encontrado" }, { status: 404 });
    }

    const cliente = clientes[0];

    if (!cliente.senha_hash) {
      return NextResponse.json({ error: "Conta sem senha" }, { status: 401 });
    }

    const senhaCorreta = await bcrypt.compare(senha, cliente.senha_hash);
    if (!senhaCorreta) {
      return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
    }

    // Verifica se a licenca pertence ao cliente
    const licRes = await fetch(
      `${SUPABASE_URL}/rest/v1/licencas?chave=eq.${encodeURIComponent(chave)}&cliente_id=eq.${cliente.id}&select=id,device_id`,
      { headers }
    );
    const licencas = await licRes.json();

    if (licencas.length === 0) {
      return NextResponse.json({ error: "Licenca nao encontrada" }, { status: 404 });
    }

    // Zera o device_id
    const resetRes = await fetch(
      `${SUPABASE_URL}/rest/v1/licencas?chave=eq.${encodeURIComponent(chave)}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({ device_id: null }),
      }
    );

    if (resetRes.ok) {
      return NextResponse.json({ ok: true, message: "Dispositivo liberado com sucesso" });
    } else {
      return NextResponse.json({ error: "Erro ao resetar" }, { status: 500 });
    }
  } catch (error) {
    console.error("Erro no reset:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}
