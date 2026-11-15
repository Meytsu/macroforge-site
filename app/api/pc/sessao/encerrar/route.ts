// POST /api/pc/sessao/encerrar — o programa fechou: libera a vaga na hora (só com o token ATUAL).
// Corpo: { sessao }   ·   Header: Authorization: Bearer <crachá>
// Resposta (200): { ok:true, liberada }   (liberada=false: o token já não era o atual, nada foi apagado)
//   400 token_invalido · 401 sem_cracha · 500
import { NextRequest } from "next/server";
import { falha, hashSessao, lerPedido, lerSessao, respostaPc, rpc, semCracha, sessaoMalFormada } from "@/app/api/_lib/pc";

export async function POST(req: NextRequest) {
  try {
    const { clienteId, body } = await lerPedido(req);
    if (!clienteId) return semCracha();
    const sessao = lerSessao(body.sessao);
    if (!sessao) return sessaoMalFormada();
    const r = await rpc("mf_pc_encerrar_sessao", { p_cliente_id: clienteId, p_token_hash: hashSessao(sessao) });
    return respostaPc(r);
  } catch (e) {
    return falha("pc/sessao/encerrar", e);
  }
}
