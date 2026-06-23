import { NextRequest, NextResponse } from "next/server";
import { clienteIdDoHeader } from "@/app/api/_lib/auth";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

/**
 * GET /api/painel
 *
 * Retorna dados do cliente + todas as licencas.
 *
 * SEGURANCA (MF-103 Bloqueador 1): o cliente e derivado do CRACHA assinado
 * (header `Authorization: Bearer <token>`), NUNCA de um parametro de e-mail.
 * Antes a rota aceitava `?email=` sem autenticacao e devolvia nome/telefone/
 * cidade/licencas de QUALQUER cliente — qualquer um que soubesse o e-mail lia
 * os dados. Agora, sem cracha valido -> 401, e cada um so ve os proprios dados.
 *
 * Usado pelo app Android (ChavesFragment) e pelo painel web — ambos enviam o
 * cracha obtido no login.
 */
export async function GET(req: NextRequest) {
  try {
    const clienteId = await clienteIdDoHeader(req.headers.get("authorization"));
    if (!clienteId) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    // Busca cliente pelo ID DO CRACHA (verificado), não por e-mail do parâmetro.
    const clienteRes = await fetch(
      `${SUPABASE_URL}/rest/v1/clientes?id=eq.${encodeURIComponent(clienteId)}&select=id,nome,email,whatsapp,pais,estado,cidade`,
      { headers }
    );
    const clientes = await clienteRes.json();

    if (!Array.isArray(clientes) || clientes.length === 0) {
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
