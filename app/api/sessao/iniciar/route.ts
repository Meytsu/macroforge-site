// POST /api/sessao/iniciar — o app abriu o macro: pega (ou reaproveita) a vaga deste aparelho.
// Corpo: { device_id, apelido? }   ·   Header: Authorization: Bearer <crachá>
// Respostas (HTTP 200): { ok:true, nova, expira_em, nivel, limite, valido_ate }
//                       { ok:false, codigo:"limite", aparelhos:[...] }  → o app mostra a lista e o "Desconectar"
//                       { ok:false, codigo:"sem_plano" }                → o app manda pra tela de planos
// HTTP 401 = crachá inválido OU conta apagada (login de novo) · 400 = aparelho inválido · 500 = tente de novo
import { NextRequest } from "next/server";
import { aparelhoInvalido, falha, lerAparelho, lerApelido, lerPedido, respostaDoBanco, rpc, semCracha } from "@/app/api/_lib/vagas";

export async function POST(req: NextRequest) {
  try {
    const { clienteId, body } = await lerPedido(req);
    if (!clienteId) return semCracha();
    const device = lerAparelho(body.device_id);
    if (!device) return aparelhoInvalido();
    const r = await rpc("mf_iniciar_sessao", {
      p_cliente_id: clienteId,
      p_device_id: device,
      p_apelido: lerApelido(body.apelido),
    });
    return respostaDoBanco(r);
  } catch (e) {
    return falha("sessao/iniciar", e);
  }
}
