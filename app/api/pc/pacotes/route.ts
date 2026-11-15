// POST /api/pc/pacotes — lista dos pacotes (SEM chave). Só com sessão de PC válida agora.
// Corpo: { maquina_id, sessao }   ·   Header: Authorization: Bearer <crachá>
// Resposta (200): { ok:true, agora, pacotes:[{ id, versao, sha256, tamanho, min_versao_programa, liberado }] }
//   { ok:false, codigo:"sem_sessao" | "desconectado" | "sessao_invalida" | "sessao_vencida" | "sem_plano" | "trial_*" }
//   400 maquina_invalida / token_invalido · 401 sem_cracha · 500
// POST (e não GET) de propósito: o token da sessão não pode ir na URL (fica no log).
import { NextRequest } from "next/server";
import {
  falha, hashSessao, lerMaquina, lerPedido, lerSessao, maquinaInvalida, respostaPc, rpc, semCracha, sessaoMalFormada,
} from "@/app/api/_lib/pc";

export async function POST(req: NextRequest) {
  try {
    const { clienteId, body } = await lerPedido(req);
    if (!clienteId) return semCracha();
    const maquina = lerMaquina(body.maquina_id);
    if (!maquina) return maquinaInvalida();
    const sessao = lerSessao(body.sessao);
    if (!sessao) return sessaoMalFormada();
    const r = await rpc("mf_pc_pacotes", {
      p_cliente_id: clienteId,
      p_maquina_id: maquina,
      p_token_hash: hashSessao(sessao),
    });
    return respostaPc(r);
  } catch (e) {
    return falha("pc/pacotes", e);
  }
}
