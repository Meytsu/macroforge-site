import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

export async function POST(req: NextRequest) {
  try {
    const { email, codigo } = await req.json();

    if (!email || !codigo) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    // Busca o codigo mais recente nao usado
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/codigos_recuperacao?email=eq.${encodeURIComponent(email)}&codigo=eq.${codigo}&usado=eq.false&order=criado_em.desc&limit=1`,
      { headers }
    );
    const codigos = await res.json();

    if (codigos.length === 0) {
      return NextResponse.json({ error: "Codigo incorreto" }, { status: 401 });
    }

    const registro = codigos[0];

    // Verifica se expirou
    if (new Date(registro.expira_em) < new Date()) {
      return NextResponse.json({ error: "Codigo expirado. Solicite um novo." }, { status: 410 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro na verificacao:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}
