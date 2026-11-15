// POST /api/pc/sessao/pedir — o programa abriu: pega a vaga do PC (1 por conta).
// Corpo: { maquina_id, apelido?, assumir?, versao_programa }   ·   Header: Authorization: Bearer <crachá>
// Resposta (200): { ok:true, nova, assumiu, expira_em, renovar_s, tolerancia_s, nivel, valido_ate, sessao, cracha_novo? }
//   `sessao` = token da sessão (guardar cifrado; só aparece AQUI, quando o banco aceitou).
//   { ok:false, codigo:"outro_pc", outro_pc:{apelido,iniciada_em,renovada_em} } → perguntar e repetir com assumir:true
//   { ok:false, codigo:"sem_plano" | "trial_sem_pc" | "trial_pc_usado" | "atualize_o_programa" }
//   400 maquina_invalida / versao_invalida · 401 sem_cracha · 429 muitos_pedidos · 500
import { NextRequest } from "next/server";
import {
  conferirVersao, falha, hashSessao, lerApelido, lerMaquina, lerPedido, maquinaInvalida, novaSessao, respostaPc,
  rpc, semCracha,
} from "@/app/api/_lib/pc";

export async function POST(req: NextRequest) {
  try {
    const { clienteId, body, crachaNovo } = await lerPedido(req, { renovar: true });
    if (!clienteId) return semCracha();
    const maquina = lerMaquina(body.maquina_id);
    if (!maquina) return maquinaInvalida();
    const erroVersao = conferirVersao(body.versao_programa);
    if (erroVersao) return erroVersao;

    const token = novaSessao();
    const r = await rpc("mf_pc_sessao_pedir", {
      p_cliente_id: clienteId,
      p_maquina_id: maquina,
      p_apelido: lerApelido(body.apelido),
      p_token_hash: hashSessao(token),
      p_modo: body.assumir === true ? "assumir" : "abrir",
    });
    return respostaPc(r, { sessao: token, cracha_novo: crachaNovo });
  } catch (e) {
    return falha("pc/sessao/pedir", e);
  }
}
