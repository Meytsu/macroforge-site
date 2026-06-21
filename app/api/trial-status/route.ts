import { NextRequest, NextResponse } from "next/server";

// Status do trial pro app decidir se MOSTRA o botão "Trial 7 dias" (MF-103).
// Responde { jaUsou } = true se o cliente OU o device já tiveram um trial.
// (Espelha as travas 2 e 3 do /api/ativar-trial — so leitura, nao cria nada.)

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

export async function POST(req: NextRequest) {
  try {
    const { email, device_id } = await req.json();

    // Trial já usado NESTE device?
    if (device_id && device_id.length >= 8) {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/licencas?device_id=eq.${encodeURIComponent(device_id)}&plano=eq.trial&select=id&limit=1`,
        { headers }
      );
      const rows = await r.json();
      if (Array.isArray(rows) && rows.length > 0) {
        return NextResponse.json({ jaUsou: true, motivo: "device" });
      }
    }

    // Trial já usado por ESTE cliente (qualquer device)?
    if (email && email.includes("@")) {
      const cRes = await fetch(
        `${SUPABASE_URL}/rest/v1/clientes?email=eq.${encodeURIComponent(email)}&select=id&limit=1`,
        { headers }
      );
      const clientes = await cRes.json();
      if (Array.isArray(clientes) && clientes.length > 0) {
        const r = await fetch(
          `${SUPABASE_URL}/rest/v1/licencas?cliente_id=eq.${clientes[0].id}&plano=eq.trial&select=id&limit=1`,
          { headers }
        );
        const rows = await r.json();
        if (Array.isArray(rows) && rows.length > 0) {
          return NextResponse.json({ jaUsou: true, motivo: "cliente" });
        }
      }
    }

    return NextResponse.json({ jaUsou: false });
  } catch (e) {
    // Em erro, NAO esconde o botao (deixa o servidor recusar na hora de ativar, como hoje).
    console.error("trial-status erro:", e);
    return NextResponse.json({ jaUsou: false });
  }
}
