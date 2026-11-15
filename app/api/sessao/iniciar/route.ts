// POST /api/sessao/iniciar — o app abriu o macro: pega (ou reaproveita) a vaga deste aparelho.
// Corpo: { device_id, apelido? }   ·   Header: Authorization: Bearer <crachá>
// Respostas (HTTP 200): { ok:true, nova, expira_em, nivel, limite, valido_ate }
//                       { ok:false, codigo:"limite", aparelhos:[...] }  → o app mostra a lista e o "Desconectar"
//                       { ok:false, codigo:"sem_plano" }                → o app manda pra tela de planos
//                       { ok:false, codigo:"trial_aparelho_usado", erro } → conta em teste grátis num aparelho que já gastou o teste em outra conta (o app mostra `erro`)
// HTTP 401 = crachá inválido OU conta apagada (login de novo) · 400 = aparelho inválido · 500 = tente de novo
// `cracha_novo` (opcional): crachá renovado — o app guarda no lugar do atual.
import { NextRequest, NextResponse } from "next/server";
import { aparelhoInvalido, falha, lerAparelho, lerApelido, lerPedido, recusaDoTrial, respostaDoBanco, rpc, semCracha } from "@/app/api/_lib/vagas";

export async function POST(req: NextRequest) {
  try {
    const { clienteId, body, crachaNovo } = await lerPedido(req, { renovar: true });
    if (!clienteId) return semCracha();
    const device = lerAparelho(body.device_id);
    if (!device) return aparelhoInvalido();
    const recusa = await recusaDoTrial(clienteId, device, "sessao/iniciar");
    if (recusa) return NextResponse.json(recusa);
    const r = await rpc("mf_iniciar_sessao", {
      p_cliente_id: clienteId,
      p_device_id: device,
      p_apelido: lerApelido(body.apelido),
    });
    return respostaDoBanco(r, crachaNovo);
  } catch (e) {
    return falha("sessao/iniciar", e);
  }
}
