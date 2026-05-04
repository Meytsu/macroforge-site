import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ exists: false });
    }

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/clientes?email=eq.${encodeURIComponent(email)}&select=id,senha_hash`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );
    const data = await res.json();

    if (data.length === 0) {
      return NextResponse.json({ exists: false });
    }

    const temSenha = !!data[0].senha_hash;
    return NextResponse.json({ exists: true, temSenha });
  } catch {
    return NextResponse.json({ exists: false });
  }
}
