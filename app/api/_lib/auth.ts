// ============================================================
// Crachá de sessão (JWT) — MF-103 Bloqueador 1.
//
// Em vez de o app só "dizer" o número do cliente (forjável), o login passa a
// entregar um CRACHÁ assinado com um segredo que só o servidor conhece. O app
// guarda o crachá e o apresenta nos endpoints sensíveis (ex.: registrar compra
// do Play); o servidor confere a assinatura e deriva o clienteId DO CRACHÁ,
// nunca do corpo da requisição.
//
// Segredo: variável de ambiente AUTH_JWT_SECRET (só na Vercel, nunca no git).
// Validade: 30 dias (decisão Henrique 2026-06-20).
// ============================================================

import { SignJWT, jwtVerify } from "jose";

const VALIDADE_DIAS = 30;

/** Lê o segredo do ambiente e converte pra o formato que a `jose` usa. */
function getSecret(): Uint8Array {
  const s = process.env.AUTH_JWT_SECRET;
  if (!s) {
    // Falha barulhenta no servidor — nunca emitir/validar crachá sem segredo.
    throw new Error("AUTH_JWT_SECRET não configurado no ambiente");
  }
  return new TextEncoder().encode(s);
}

/**
 * Emite um crachá pro cliente. Guarda o id (e o email só pra conveniência/log).
 * Expira em {@link VALIDADE_DIAS} dias.
 */
export async function emitirCracha(clienteId: string, email: string): Promise<string> {
  return await new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(clienteId) // o "dono" do crachá = clienteId (lido depois via .sub)
    .setIssuedAt()
    .setExpirationTime(`${VALIDADE_DIAS}d`)
    .sign(getSecret());
}

/** Resultado da verificação de um crachá. */
export interface CrachaVerificado {
  clienteId: string;
  email?: string;
}

/**
 * Confere um crachá: assinatura válida + não expirado. Retorna o clienteId
 * (do campo assinado, não do corpo). Lança erro se inválido/expirado/ausente —
 * o chamador deve responder 401.
 */
export async function verificarCracha(token: string): Promise<CrachaVerificado> {
  const { payload } = await jwtVerify(token, getSecret());
  if (!payload.sub) throw new Error("Crachá sem dono (sub)");
  return { clienteId: payload.sub, email: typeof payload.email === "string" ? payload.email : undefined };
}

/**
 * Helper pra endpoints: extrai e valida o crachá do header Authorization
 * ("Bearer <token>"). Retorna o clienteId verificado, ou null se ausente/inválido.
 */
export async function clienteIdDoHeader(authHeader: string | null): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return null;
  try {
    const v = await verificarCracha(token);
    return v.clienteId;
  } catch {
    return null;
  }
}
