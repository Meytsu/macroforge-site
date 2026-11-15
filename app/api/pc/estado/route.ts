// GET /api/pc/estado — painel do site e tela "Conta" do programa.
// Header: Authorization: Bearer <crachá>
// Resposta (200): { ok:true, plano, pc_incluido, pc }   (pc = null ou { apelido, iniciada_em, renovada_em, expira_em })
//   401 sem_cracha · 500
import { NextRequest } from "next/server";
import { falha, jsonPc, lerPedido, rpc, semCracha } from "@/app/api/_lib/pc";

export async function GET(req: NextRequest) {
  try {
    const { clienteId } = await lerPedido(req);
    if (!clienteId) return semCracha();
    const r = await rpc("mf_pc_estado", { p_cliente_id: clienteId });
    return jsonPc({ ok: true, plano: r?.plano ?? null, pc_incluido: r?.pc_incluido === true, pc: r?.pc ?? null });
  } catch (e) {
    return falha("pc/estado", e);
  }
}
