// GET /api/aparelhos — "Meu plano" + aparelhos usando a conta agora (app e painel do site).
// Header: Authorization: Bearer <crachá>
// Resposta (HTTP 200): { plano: { ok, nivel, limite, valido_ate, duracao, origem, renova_sozinho } | { ok:false, codigo:"sem_plano" },
//                        aparelhos: [{ device_id, apelido, iniciada_em, renovada_em, expira_em }] }
import { NextRequest } from "next/server";
import { falha, lerPedido, respostaDoBanco, rpc, semCracha } from "@/app/api/_lib/vagas";

export async function GET(req: NextRequest) {
  try {
    const { clienteId } = await lerPedido(req);
    if (!clienteId) return semCracha();
    const r = await rpc("mf_listar_aparelhos", { p_cliente_id: clienteId });
    return respostaDoBanco(r);
  } catch (e) {
    return falha("aparelhos", e);
  }
}
