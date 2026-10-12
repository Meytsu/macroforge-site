// Chamada a uma função do banco (RPC do PostgREST) com a service key — só no servidor.
// Fonte única: antes havia uma cópia em cada rota (play-purchase-verify, vagas...).

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

/** Chama `fn` com `args`. Lança erro em resposta fora de 2xx ou não-JSON (a rota responde 500). */
export async function rpc(fn: string, args: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
    cache: "no-store",
  });
  const texto = await res.text();
  if (!res.ok) {
    throw new Error(`rpc ${fn} falhou: ${res.status} ${texto.slice(0, 300)}`);
  }
  try {
    return JSON.parse(texto);
  } catch {
    throw new Error(`rpc ${fn} devolveu resposta não-JSON: ${texto.slice(0, 200)}`);
  }
}
