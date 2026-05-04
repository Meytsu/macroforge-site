import { NextRequest, NextResponse } from "next/server";

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
    const { email, nome, whatsapp, pais, estado, cidade, codigo_pais } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "E-mail obrigatorio" }, { status: 400 });
    }

    if (!nome || !nome.trim()) {
      return NextResponse.json({ error: "Nome obrigatorio" }, { status: 400 });
    }

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/clientes?email=eq.${encodeURIComponent(email)}`,
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
