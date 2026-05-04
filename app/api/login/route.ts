import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

export async function POST(req: NextRequest) {
  try {
    const { email, senha } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "E-mail invalido" }, { status: 400 });
    }

    if (!senha) {
      return NextResponse.json({ error: "Digite sua senha" }, { status: 400 });
    }

    // Busca o cliente pelo e-mail
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/clientes?email=eq.${encodeURIComponent(email)}&select=id,nome,email,whatsapp,pais,estado,cidade,senha_hash`,
      { headers }
    );
    const clientes = await res.json();

    if (clientes.length === 0) {
      return NextResponse.json(
        { error: "E-mail nao encontrado" },
        { status: 404 }
      );
    }

    const cliente = clientes[0];

    // Verifica se tem senha cadastrada
    if (!cliente.senha_hash) {
      return NextResponse.json(
        { error: "Conta sem senha. Crie sua conta primeiro." },
        { status: 401 }
      );
    }

    // Verifica a senha
    const senhaCorreta = await bcrypt.compare(senha, cliente.senha_hash);
    if (!senhaCorreta) {
      return NextResponse.json(
        { error: "Senha incorreta" },
        { status: 401 }
      );
    }

    // Remove o hash da resposta (nunca enviar pro frontend)
    const { senha_hash, ...clienteSeguro } = cliente;

    // Busca as licenças do cliente
    const licRes = await fetch(
      `${SUPABASE_URL}/rest/v1/licencas?cliente_id=eq.${cliente.id}&order=criado_em.desc&select=chave,plano,valor,status,device_id,data_inicio,data_expiracao`,
      { headers }
    );
    const licencas = await licRes.json();

    return NextResponse.json({ cliente: clienteSeguro, licencas });
  } catch (error) {
    console.error("Erro no login:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}
