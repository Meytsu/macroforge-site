// ============================================================
// Vagas de aparelho — ADR-MF-XCROSS-021 / ISSUE-MF-145 (2026-10-11).
//
// O plano é da CONTA (Pro 3 · Mega 6 · Ultra 10 aparelhos ao mesmo tempo). Cada
// aparelho com o macro aberto ocupa uma VAGA no banco (`sessoes`), que vence em
// 15 min sem sinal de vida. Quem decide tudo é o banco (funções `mf_*` do sql/10,
// que só o service_role executa); estas rotas só:
//   1) conferem o CRACHÁ (login) e tiram o cliente DELE — nunca do corpo;
//   2) conferem o identificador do aparelho;
//   3) repassam a resposta do banco.
//
// Respostas de negócio ("limite", "desconectada", "sem_plano") voltam com HTTP 200
// e `ok:false` + `codigo` — o app decide pelo `codigo`. HTTP 401 = sem crachá ou
// conta apagada (login de novo); 400 = pedido mal formado; 500 = falha (o app trata
// como "tente de novo" e NÃO derruba quem está usando: a vaga ainda vale até 15 min).
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { crachaDoHeader, emitirCracha } from "@/app/api/_lib/auth";
import { rpc } from "@/app/api/_lib/rpc";

export { rpc };

/** 401 padrão: sem crachá válido. */
export function semCracha() {
  return NextResponse.json(
    { ok: false, erro: "Sessão expirada. Faça login novamente.", codigo: "sem_cracha" },
    { status: 401 }
  );
}

/** 400 padrão: identificador de aparelho ausente ou mal formado. */
export function aparelhoInvalido() {
  return NextResponse.json(
    { ok: false, erro: "Aparelho não identificado", codigo: "aparelho_invalido" },
    { status: 400 }
  );
}

/**
 * Repassa a resposta do banco. Exceção: `conta_inexistente` (o crachá vale 30 dias, mas a conta pode ter sido
 * apagada nesse meio-tempo — ex.: faxina de não confirmados) vira 401, pra o app pedir login de novo.
 */
export function respostaDoBanco(r: unknown, crachaNovo?: string | null) {
  if (r && typeof r === "object" && (r as { codigo?: unknown }).codigo === "conta_inexistente") return semCracha();
  if (crachaNovo && r && typeof r === "object" && !Array.isArray(r)) {
    return NextResponse.json({ ...(r as Record<string, unknown>), cracha_novo: crachaNovo });
  }
  return NextResponse.json(r);
}

/**
 * Crachá com mais de 7 dias é RENOVADO na vaga/sinal de vida (devolvido em `cracha_novo`): quem usa o app não
 * cai pro login a cada 30 dias no meio de um macro. Quem fica 30 dias sem abrir o overlay entra de novo.
 */
const RENOVAR_CRACHA_APOS_S = 7 * 24 * 60 * 60;

/** 500 padrão: o app tenta de novo depois (a vaga continua valendo até vencer). */
export function falha(rota: string, e: unknown) {
  console.error(`[${rota}] erro:`, e);
  return NextResponse.json(
    { ok: false, erro: "Falha no servidor. Tente novamente.", codigo: "erro_interno" },
    { status: 500 }
  );
}

// Caracteres que o Postgres recusa (NUL) ou que não fazem sentido num nome: controle C0 e DEL.
const CONTROLE = /[\u0000-\u001f\u007f]/g;
// Metade de um emoji sem a outra metade: o Postgres recusa ("Unicode low surrogate...") e a vaga daria 500 sempre.
const SURROGATE_SOLTO = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g;

/**
 * Identificador do aparelho (ANDROID_ID no app, hexadecimal). Mesma regra da tabela `sessoes`:
 * não vazio e até 128 caracteres. Recusa caractere de controle e emoji. Devolve null se inválido.
 */
export function lerAparelho(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const d = valor.trim();
  if (d.length < 1 || d.length > 128) return null;
  if (/[\u0000-\u001f\u007f\uD800-\uDFFF]/.test(d)) return null;
  return d;
}

/** Apelido do aparelho (ex.: modelo do celular). Opcional, até 80 caracteres (contados como o Postgres conta). */
export function lerApelido(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const limpo = valor.replace(CONTROLE, "").replace(SURROGATE_SOLTO, "").trim();
  const a = Array.from(limpo).slice(0, 80).join("").trim();
  return a.length > 0 ? a : null;
}

/** Cliente do crachá + corpo JSON (vazio se não vier) + crachá renovado (quando o atual já passou de 7 dias). */
export async function lerPedido(req: NextRequest): Promise<{
  clienteId: string | null;
  body: Record<string, unknown>;
  crachaNovo: string | null;
}> {
  const c = await crachaDoHeader(req.headers.get("authorization"));
  const body = req.method === "GET" ? {} : await req.json().catch(() => ({}));
  let crachaNovo: string | null = null;
  if (c && c.emitidoEm && Date.now() / 1000 - c.emitidoEm > RENOVAR_CRACHA_APOS_S) {
    crachaNovo = await emitirCracha(c.clienteId, c.email ?? "");
  }
  return {
    clienteId: c ? c.clienteId : null,
    body: body && typeof body === "object" ? (body as Record<string, unknown>) : {},
    crachaNovo,
  };
}
