// POST /api/sessao/encerrar — o app fechou o macro (ou saiu da conta): libera a vaga NA HORA.
// Corpo: { device_id }   ·   Header: Authorization: Bearer <crachá>
// Resposta (HTTP 200): { ok:true, liberada }
import { NextRequest } from "next/server";
import { aparelhoInvalido, falha, lerAparelho, lerPedido, respostaDoBanco, rpc, semCracha } from "@/app/api/_lib/vagas";

export async function POST(req: NextRequest) {
  try {
    const { clienteId, body } = await lerPedido(req);
    if (!clienteId) return semCracha();
    const device = lerAparelho(body.device_id);
    if (!device) return aparelhoInvalido();
    const r = await rpc("mf_encerrar_sessao", { p_cliente_id: clienteId, p_device_id: device });
    return respostaDoBanco(r);
  } catch (e) {
    return falha("sessao/encerrar", e);
  }
}
