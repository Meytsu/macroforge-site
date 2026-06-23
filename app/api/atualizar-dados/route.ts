import { NextRequest, NextResponse } from "next/server";
import { clienteIdDoHeader } from "@/app/api/_lib/auth";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

/**
 * POST /api/atualizar-dados
 *
 * SEGURANCA (MF-103 Bloqueador 1): protegido por CRACHA (Authorization: Bearer).
 * O cliente alterado é derivado do crachá assinado, NUNCA do e-mail do corpo.
 * Antes era sem autenticação — qualquer um podia sobrescrever o perfil (nome/
 * whatsapp/cidade) de outro cliente só sabendo o e-mail dele.
 */
export async function POST(req: NextRequest) {
  try {
    const clienteId = await clienteIdDoHeader(req.headers.get("authorization"));
    if (!clienteId) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 401 });
    }

    const { nome, whatsapp, pais, estado, cidade, codigo_pais } = await req.json();

    if (!nome || !nome.trim()) {
      return NextResponse.json({ error: "Nome obrigatorio" }, { status: 400 });
    }

    // PATCH pelo ID DO CRACHA (verificado), não por e-mail do corpo.
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/clientes?id=eq.${encodeURIComponent(clienteId)}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          nome,
          whatsapp: whatsapp || null,
          pais: pais || null,
          estado: estado || null,
          cidade: cidade || null,
          codigo_pais: codigo_pais || null,
        }),
      }
    );

    if (res.ok) {
      const updated = await res.json();
      return NextResponse.json({ ok: true, cliente: updated[0] });
    } else {
      return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
    }
  } catch (error) {
    console.error("Erro ao atualizar dados:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}
