// GET /api/forjados — a LOJA dos Macros Forjados da conta (ADR-MF-XCROSS-020, sql/12).
// Header: Authorization: Bearer <crachá>
// Resposta (HTTP 200): { ok, agora, plano_ativo, pacotes: [{ id, titulo, ordem, versao, min_versao_app, sha256, tamanho,
//                        gratis_ate, sempre_gratis, produto_play, comprado, presente, presente_ate, liberado,
//                        grupo, grupo_titulo, nivel }] }
// grupo/grupo_titulo/nivel (sql/19, 2026-11-24): o grupo da DG (ex.: "arena_caos" / "Arena do Caos" / "Lv.3"), para a
// loja do app juntar os níveis numa linha só; null = DG sem grupo. A resposta é a do banco, sem filtro: as chaves novas
// passam a vir assim que o sql/19 for rodado (antes dele, elas simplesmente não vêm — o app trata como "sem grupo").
// LIBERADO = comprou OU presente valendo OU agora < gratis_ate OU sempre_gratis — quem decide é o banco. O app usa esta
// lista pra mostrar a loja e pra conferir, antes de cada execução, se a DG ainda está liberada.
import { NextRequest } from "next/server";
import { falha, lerPedido, respostaDoBanco, rpc, semCracha } from "@/app/api/_lib/vagas";

export async function GET(req: NextRequest) {
  try {
    const { clienteId } = await lerPedido(req);
    if (!clienteId) return semCracha();
    const r = await rpc("mf_forjados_da_conta", { p_cliente_id: clienteId });
    return respostaDoBanco(r);
  } catch (e) {
    return falha("forjados", e);
  }
}
