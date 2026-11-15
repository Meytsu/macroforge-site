// POST /api/pc/pacotes/baixar — link temporário (120 s) do pacote CIFRADO + a chave daquela versão.
// Corpo: { maquina_id, sessao, id }   ·   Header: Authorization: Bearer <crachá>
// Resposta (200, Cache-Control: no-store): { ok:true, url, sha256, versao, tamanho, alg:"AES-256-GCM", chave }
//   { ok:false, codigo:"sem_sessao" | "desconectado" | "sessao_invalida" | "sessao_vencida" | "sem_plano" | "trial_*"
//                       | "nao_existe" | "nao_liberado" }
//   400 maquina_invalida / token_invalido / invalido(id) · 401 sem_cracha · 429 muitos_pedidos · 500
// NUNCA logar corpo nem resposta (token e chave). O bucket `pacotes-pc` é privado; sem este link ninguém baixa.
import { NextRequest } from "next/server";
import {
  falha, hashSessao, jsonPc, lerMaquina, lerPacoteId, lerPedido, lerSessao, maquinaInvalida, respostaPc, rpc,
  semCracha, sessaoMalFormada,
} from "@/app/api/_lib/pc";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const BUCKET = "pacotes-pc";
const VALIDADE_LINK_S = 120;

export async function POST(req: NextRequest) {
  try {
    const { clienteId, body } = await lerPedido(req);
    if (!clienteId) return semCracha();
    const maquina = lerMaquina(body.maquina_id);
    if (!maquina) return maquinaInvalida();
    const sessao = lerSessao(body.sessao);
    if (!sessao) return sessaoMalFormada();
    const id = lerPacoteId(body.id);
    if (!id) return jsonPc({ ok: false, erro: "Pacote inválido", codigo: "invalido" }, 400);

    const r = await rpc("mf_pc_pacote_para_baixar", {
      p_cliente_id: clienteId,
      p_maquina_id: maquina,
      p_token_hash: hashSessao(sessao),
      p_pacote_id: id,
    });
    if (!r || r.ok !== true) return respostaPc(r);

    // O caminho vem do banco e já passou pela CHECK (`<id>/v<versao>.mfp`).
    const arquivo = String(r.arquivo);
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/${BUCKET}/${arquivo}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn: VALIDADE_LINK_S }),
      cache: "no-store",
    });
    const assinado = await res.json().catch(() => null);
    const caminho = assinado?.signedURL ?? assinado?.signedUrl;
    if (!res.ok || typeof caminho !== "string") {
      throw new Error(`assinar ${arquivo} falhou: HTTP ${res.status}`);
    }

    return jsonPc({
      ok: true,
      url: `${SUPABASE_URL}/storage/v1${caminho}`,
      sha256: r.sha256,
      versao: r.versao,
      tamanho: r.tamanho,
      alg: r.alg ?? "AES-256-GCM",
      chave: r.chave,
    });
  } catch (e) {
    return falha("pc/pacotes/baixar", e);
  }
}
