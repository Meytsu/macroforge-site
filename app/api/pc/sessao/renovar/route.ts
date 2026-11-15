// POST /api/pc/sessao/renovar — sinal de vida (a cada 5 min).
// Corpo: { maquina_id, sessao }   ·   Header: Authorization: Bearer <crachá>
// Resposta (200): { ok:true, nova:false, expira_em, renovar_s, tolerancia_s, nivel, valido_ate, cracha_novo? }
//   { ok:false, codigo:"desconectado" | "sem_sessao" | "sessao_invalida" | "sem_plano" | "trial_sem_pc" | "trial_pc_usado" }
//   400 maquina_invalida / token_invalido · 401 sem_cracha · 500 (o programa NÃO se derruba: segue na tolerância)
import { NextRequest } from "next/server";
import {
  falha, hashSessao, lerMaquina, lerPedido, lerSessao, maquinaInvalida, respostaPc, rpc, semCracha,
  sessaoMalFormada,
} from "@/app/api/_lib/pc";

export async function POST(req: NextRequest) {
  try {
    const { clienteId, body, crachaNovo } = await lerPedido(req, { renovar: true });
    if (!clienteId) return semCracha();
    const maquina = lerMaquina(body.maquina_id);
    if (!maquina) return maquinaInvalida();
    const sessao = lerSessao(body.sessao);
    if (!sessao) return sessaoMalFormada();

    const r = await rpc("mf_pc_sessao_pedir", {
      p_cliente_id: clienteId,
      p_maquina_id: maquina,
      p_apelido: null,
      p_token_hash: hashSessao(sessao),
      p_modo: "sinal",
    });
    return respostaPc(r, { cracha_novo: crachaNovo });
  } catch (e) {
    return falha("pc/sessao/renovar", e);
  }
}
