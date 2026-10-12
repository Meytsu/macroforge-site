// POST /api/forjados/baixar — link TEMPORÁRIO (2 min) pra baixar o pacote de uma DG (ADR-MF-XCROSS-020, sql/12).
// Corpo: { id }   ·   Header: Authorization: Bearer <crachá>
// Respostas (HTTP 200): { ok:true, url, sha256, versao, tamanho }   → o app baixa, confere o sha256 e instala
//                       { ok:false, codigo:"sem_plano" | "nao_liberado" | "nao_existe", produto_play? }
//            (HTTP 429)  { ok:false, codigo:"muitos_pedidos" }  → passou do limite de links da conta (sql/12 v3)
// Só sai link pra conta com plano ativo e com a DG liberada (o banco decide). O bucket é PRIVADO: sem este link
// assinado, ninguém baixa nada.
import { NextRequest, NextResponse } from "next/server";
import { falha, lerPedido, respostaDoBanco, rpc, semCracha } from "@/app/api/_lib/vagas";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const BUCKET = "pacotes-dg";
// O app baixa assim que recebe; o link só precisa valer pra COMEÇAR o download (o que já começou termina).
const VALIDADE_LINK_S = 120;

export async function POST(req: NextRequest) {
  try {
    const { clienteId, body } = await lerPedido(req);
    if (!clienteId) return semCracha();
    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!/^[a-z0-9_]{1,40}$/.test(id)) {
      return NextResponse.json({ ok: false, erro: "DG inválida", codigo: "invalido" }, { status: 400 });
    }

    const lim = await rpc("mf_forjados_limite", { p_cliente_id: clienteId, p_tipo: "baixar" });
    if (!lim?.ok) {
      if (lim?.codigo === "conta_inexistente") return semCracha();
      return NextResponse.json(lim ?? { ok: false, codigo: "muitos_pedidos" }, { status: 429 });
    }

    const r = await rpc("mf_pacote_para_baixar", { p_cliente_id: clienteId, p_dg_id: id });
    if (!r || r.ok !== true) return respostaDoBanco(r);

    // O caminho vem do banco e já passou pela CHECK (`<id>/<arquivo>.zip`, só caracteres seguros).
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

    return NextResponse.json({
      ok: true,
      url: `${SUPABASE_URL}/storage/v1${caminho}`,
      sha256: r.sha256,
      versao: r.versao,
      tamanho: r.tamanho,
    });
  } catch (e) {
    return falha("forjados/baixar", e);
  }
}
