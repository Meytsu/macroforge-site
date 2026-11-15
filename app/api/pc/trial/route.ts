// POST /api/pc/trial — ativa o teste grátis (3 dias) pelo programa do PC. 1 trial por conta (app OU PC) e 1 por máquina.
// Corpo: { maquina_id, versao_programa }   ·   Header: Authorization: Bearer <crachá>
// Resposta (200): { ok:true, ... }  (o que mf_pc_ativar_trial devolver: licença trial criada, validade)
//   Recusas do banco (mf_pc_ativar_trial, sql/13), sempre { ok:false, codigo, erro }:
//     400 conta_ausente · 404 conta_inexistente · 403 email_nao_confirmado · trial_sem_pc (403, o plano trial não inclui PC)
//     409 trial_ja_usado (conta já teve trial) · ja_tem_plano (conta já tem plano ativo) · trial_pc_usado (esta máquina já usou o teste)
//   { ok:false, codigo:"atualize_o_programa" }
//   400 maquina_invalida / versao_invalida · 401 sem_cracha · 429 muitos_pedidos · 500
import { NextRequest } from "next/server";
import { conferirVersao, falha, jsonPc, lerMaquina, lerPedido, maquinaInvalida, respostaPc, rpc, semCracha } from "@/app/api/_lib/pc";

/** Status HTTP de cada recusa do banco (códigos de mf_pc_ativar_trial). Recusa desconhecida segue 200 como o banco mandou. */
const STATUS_RECUSA: Record<string, number> = {
  conta_ausente: 400,
  conta_inexistente: 404,
  email_nao_confirmado: 403,
  trial_sem_pc: 403,
  trial_ja_usado: 409,
  ja_tem_plano: 409,
  trial_pc_usado: 409,
};

export async function POST(req: NextRequest) {
  try {
    const { clienteId, body } = await lerPedido(req);
    if (!clienteId) return semCracha();
    const maquina = lerMaquina(body.maquina_id);
    if (!maquina) return maquinaInvalida();
    const erroVersao = conferirVersao(body.versao_programa);
    if (erroVersao) return erroVersao;

    // Limite por conta: 5 pedidos por hora (bloqueio de 60 min). Se o limitador falhar, segue (o banco é a trava).
    try {
      const lim = await rpc("mf_registrar_tentativa", {
        p_chave: `conta:${clienteId}`,
        p_tipo: "trial-pc",
        p_max: 5,
        p_janela_min: 60,
        p_bloqueio_min: 60,
      });
      const l = Array.isArray(lim) ? lim[0] : lim;
      if (l?.bloqueado) {
        return jsonPc(
          {
            ok: false,
            codigo: "muitos_pedidos",
            erro: "Muitos pedidos seguidos. Tente de novo mais tarde.",
            segundos: Number(l.segundos_restantes) || 3600,
          },
          429
        );
      }
    } catch (e) {
      console.error("[pc/trial] limite indisponível, seguindo:", e);
    }

    const r = await rpc("mf_pc_ativar_trial", { p_cliente_id: clienteId, p_maquina_id: maquina });
    // O banco é a fonte de verdade (inclusive do e-mail confirmado): aqui só traduz a recusa em status HTTP.
    const codigo = r && typeof r === "object" ? (r as { codigo?: unknown }).codigo : undefined;
    if (r && (r as { ok?: unknown }).ok === false && typeof codigo === "string" && codigo in STATUS_RECUSA) {
      return jsonPc(r, STATUS_RECUSA[codigo]);
    }
    return respostaPc(r);
  } catch (e) {
    return falha("pc/trial", e);
  }
}
