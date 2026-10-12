// POST /api/sessao/sinal — sinal de vida (a cada 5 min com o macro aberto): empurra a vaga +15 min.
// Corpo: { device_id }   ·   Header: Authorization: Bearer <crachá>
// Respostas (HTTP 200): { ok:true, nova, expira_em, ... }  (nova:true = a vaga tinha vencido e foi pega de novo)
//                       { ok:false, codigo:"desconectada" } → outro aparelho da conta derrubou este: parar o macro
//                       { ok:false, codigo:"limite" }       → a vaga tinha vencido e a conta encheu enquanto isso,
//                                                             ou o plano DIMINUIU e este aparelho ficou acima do limite
//                       { ok:false, codigo:"sem_plano" }    → o plano acabou
// HTTP 401 = crachá inválido OU conta apagada (login de novo) · 400 = aparelho inválido · 500 = tente de novo
import { NextRequest } from "next/server";
import { aparelhoInvalido, falha, lerAparelho, lerPedido, respostaDoBanco, rpc, semCracha } from "@/app/api/_lib/vagas";

export async function POST(req: NextRequest) {
  try {
    const { clienteId, body } = await lerPedido(req);
    if (!clienteId) return semCracha();
    const device = lerAparelho(body.device_id);
    if (!device) return aparelhoInvalido();
    const r = await rpc("mf_renovar_sessao", { p_cliente_id: clienteId, p_device_id: device });
    return respostaDoBanco(r);
  } catch (e) {
    return falha("sessao/sinal", e);
  }
}
