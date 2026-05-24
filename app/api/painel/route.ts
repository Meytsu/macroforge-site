import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

/**
 * GET /api/painel?email=user@email.com
 *
 * Retorna dados do cliente + todas as licencas.
 * Usado pelo app Android (ChavesFragment) pra listar chaves.
 */
export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "E-mail invalido" }, { status: 400 });
    }

    // Busca cliente
    const clienteRes = await fetch(
      `${SUPABASE_URL}/rest/v1/clientes?email=eq.${encodeURIComponent(email)}&select=id,nome,email,whatsapp,pais,estado,cidade`,
      { headers }
    );
    const clientes = await clienteRes.json();

    if (clientes.length === 0) {
      return NextResponse.json({ error: "Cliente nao encontrado" }, { status: 404 });
    }

    const cliente = clientes[0];

    // Busca licencas
    const licRes = await fetch(
      `${SUPABASE_URL}/rest/v1/licencas?cliente_id=eq.${cliente.id}&order=criado_em.desc&select=chave,plano,valor,status,device_id,data_inicio,data_expiracao`,
      { headers }
    );
    const licencas = await licRes.json();

    return NextResponse.json({ cliente, licencas });
  } catch (error) {
    console.error("Erro no painel:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}
