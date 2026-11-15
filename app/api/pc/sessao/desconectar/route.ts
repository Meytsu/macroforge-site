// POST /api/pc/sessao/desconectar — o PAINEL do site derruba o PC conectado (sem corpo).
// Header: Authorization: Bearer <crachá do login do site>
// Resposta (200): { ok:true, desconectado }   · 401 sem_cracha · 500
// O PC derrubado recebe `desconectado` no próximo sinal e para.
import { NextRequest } from "next/server";
import { falha, lerPedido, respostaPc, rpc, semCracha } from "@/app/api/_lib/pc";

export async function POST(req: NextRequest) {
  try {
    const { clienteId } = await lerPedido(req);
    if (!clienteId) return semCracha();
    const r = await rpc("mf_pc_desconectar", { p_cliente_id: clienteId });
    return respostaPc(r);
  } catch (e) {
    return falha("pc/sessao/desconectar", e);
  }
}
