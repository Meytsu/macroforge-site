// POST /api/aparelhos/desconectar — "Desconectar este aparelho" (do app de outro aparelho da conta ou do painel).
// Libera a vaga NA HORA; o aparelho derrubado recebe "desconectada" no próximo sinal (até 5 min) e para o macro.
// Corpo: { device_id }  (o aparelho ALVO)   ·   Header: Authorization: Bearer <crachá>
// Resposta (HTTP 200): { ok:true, desconectado }
// Só mexe em aparelhos DA PRÓPRIA conta: o banco filtra pelo cliente do crachá.
import { NextRequest } from "next/server";
import { aparelhoInvalido, falha, lerAparelho, lerPedido, respostaDoBanco, rpc, semCracha } from "@/app/api/_lib/vagas";

export async function POST(req: NextRequest) {
  try {
    const { clienteId, body } = await lerPedido(req);
    if (!clienteId) return semCracha();
    const alvo = lerAparelho(body.device_id);
    if (!alvo) return aparelhoInvalido();
    const r = await rpc("mf_desconectar_aparelho", { p_cliente_id: clienteId, p_device_alvo: alvo });
    return respostaDoBanco(r);
  } catch (e) {
    return falha("aparelhos/desconectar", e);
  }
}
