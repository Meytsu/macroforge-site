// ============================================================
// Programa do PC — ajudante das rotas /api/pc/* (docs/pc/licenca-pc.md §6, sql/13).
//
// Mesmo padrão de _lib/vagas.ts: o BANCO decide (funções mf_pc_*, só o service_role executa); as rotas
//   1) conferem o crachá e tiram a conta DELE (nunca do corpo);
//   2) conferem o formato do que chegou;
//   3) sorteiam o token da sessão e mandam ao banco só o HASH dele;
//   4) repassam a resposta.
// Repositório PÚBLICO: nenhum segredo aqui. Segredos só por variável de ambiente (SUPABASE_SERVICE_KEY, AUTH_JWT_SECRET).
//
// Regras: o token da sessão e a chave do pacote NUNCA vão na URL nem no log. Estas funções não logam corpo nem resposta.
// ============================================================

import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { rpc } from "@/app/api/_lib/rpc";

export { rpc };
export { falha, lerApelido, lerPedido } from "@/app/api/_lib/vagas";

/** Versão mínima do programa (inteiro, igual ao `min_versao_programa` dos pacotes). Não é segredo. */
export const PC_VERSAO_MINIMA = 1;
/** Onde o programa manda baixar a versão nova (mostrado em `atualize_o_programa`). */
export const PC_LINK_BAIXAR = "https://macroforge.com.br";

/** Respostas do PC: nunca em cache (levam token de sessão ou chave de pacote). */
const NO_STORE = { "Cache-Control": "no-store" };

export function jsonPc(corpo: unknown, status = 200) {
  return NextResponse.json(corpo, { status, headers: NO_STORE });
}

/** `maquina_id`: sha256 em hex minúsculo (64). Devolve null se inválido (a rota responde 400). */
export function lerMaquina(v: unknown): string | null {
  return typeof v === "string" && /^[0-9a-f]{64}$/.test(v) ? v : null;
}

/** Token da sessão: 32 bytes em base64url (43 caracteres). Devolve null se inválido (400). */
export function lerSessao(v: unknown): string | null {
  return typeof v === "string" && /^[A-Za-z0-9_-]{43}$/.test(v) ? v : null;
}

/** Id do pacote (mesma CHECK da tabela `pacotes_pc`). */
export function lerPacoteId(v: unknown): string | null {
  return typeof v === "string" && /^[a-z0-9_]{1,40}$/.test(v) ? v : null;
}

export function novaSessao(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessao(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function maquinaInvalida() {
  return jsonPc({ ok: false, erro: "Máquina não identificada", codigo: "maquina_invalida" }, 400);
}

export function sessaoMalFormada() {
  return jsonPc({ ok: false, erro: "Sessão inválida", codigo: "token_invalido" }, 400);
}

/** 401 padrão: sem crachá válido (ou conta apagada). */
export function semCracha() {
  return jsonPc(
    { ok: false, erro: "Sessão expirada. Faça login novamente.", codigo: "sem_cracha" },
    401
  );
}

/**
 * Confere `versao_programa` (inteiro). Devolve a resposta de erro a mandar, ou null se está tudo certo.
 * Ausente/mal formada = 400; menor que a mínima = `atualize_o_programa` (HTTP 200, regra de negócio).
 */
export function conferirVersao(v: unknown) {
  if (typeof v !== "number" || !Number.isInteger(v) || v < 0 || v > 1_000_000) {
    return jsonPc({ ok: false, erro: "Versão do programa inválida", codigo: "versao_invalida" }, 400);
  }
  if (v < PC_VERSAO_MINIMA) {
    return jsonPc({
      ok: false,
      erro: "Atualize o MacroForge PC para continuar.",
      codigo: "atualize_o_programa",
      baixar: PC_LINK_BAIXAR,
    });
  }
  return null;
}

/**
 * Repassa a resposta do banco. `conta_inexistente` vira 401 (conta apagada); `muitos_pedidos` vira 429.
 * `extra` só é somado quando a resposta é `ok:true` (ex.: o token da sessão, o crachá novo); null/undefined são omitidos.
 */
export function respostaPc(r: unknown, extra?: Record<string, unknown>) {
  const obj = r && typeof r === "object" && !Array.isArray(r) ? (r as Record<string, unknown>) : null;
  if (obj?.codigo === "conta_inexistente") return semCracha();
  if (obj?.codigo === "muitos_pedidos") return jsonPc(obj, 429);
  if (obj && obj.ok === true && extra) {
    const limpo = Object.fromEntries(Object.entries(extra).filter(([, v]) => v !== null && v !== undefined));
    return jsonPc({ ...obj, ...limpo });
  }
  return jsonPc(r);
}

/** IPv6 agrupado por /64 (os 4 primeiros grupos, expandindo o `::`); IPv4 e IPv4-mapeado ficam como estão. */
function agruparIpv6(ip: string): string {
  if (!ip.includes(":")) return ip;
  const mapeado = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapeado) return mapeado[1];
  const [esq, dir] = ip.split("::");
  const a = esq ? esq.split(":") : [];
  const b = dir !== undefined && dir ? dir.split(":") : [];
  const falta = ip.includes("::") ? Math.max(0, 8 - a.length - b.length) : 0;
  const grupos = [...a, ...Array(falta).fill("0"), ...b];
  if (grupos.length < 4) return ip;
  return grupos.slice(0, 4).map((g) => g.toLowerCase().padStart(4, "0")).join(":") + "::/64";
}

/**
 * IP do cliente para o limitador: `x-real-ip` (a Vercel preenche), senão o 1º valor de `x-forwarded-for`.
 * IPv6 vira o prefixo /64 (um cliente tem milhões de endereços no mesmo /64). Limitado a 64 caracteres.
 */
export function ipDoPedido(headers: Headers): string {
  const bruto = headers.get("x-real-ip") || (headers.get("x-forwarded-for") ?? "").split(",")[0];
  const ip = (bruto ?? "").trim().replace(/[^0-9a-fA-F:.]/g, "").slice(0, 64);
  return ip ? agruparIpv6(ip).slice(0, 64) : "desconhecido";
}
