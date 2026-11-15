// ============================================================
// Conferência de e-mail + senha, com o freio por e-mail (tentativas_login, tipo "login").
//
// Fonte única: o /api/login (app Android) e o /api/pc/entrar (programa do PC) usam ESTA função, então o contador
// de erros é o MESMO (5 erros = 15 min de bloqueio) e o PC não vira uma porta extra pra chutar senha.
// Extraída do /api/login sem mudar o comportamento (mesmas mensagens, mesmos status, mesmos efeitos no banco).
// ============================================================

import bcrypt from "bcryptjs";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const MAX_TENTATIVAS = 5;
const BLOQUEIO_MINUTOS = 15;

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

/** Linha de `clientes` que o login lê (inclui o hash: quem chama NUNCA devolve `senha_hash` ao cliente). */
export interface ClienteLogin {
  id: string;
  nome: string;
  email: string;
  whatsapp: string | null;
  pais: string | null;
  estado: string | null;
  cidade: string | null;
  senha_hash: string | null;
}

/** Por que a conferência falhou. `error` é a mensagem em PT-BR que o /api/login devolve como está. */
export type MotivoLogin =
  | "email_invalido" // 400
  | "senha_vazia" // 400
  | "bloqueado" // 429 (já estava bloqueado, ou este erro estourou o limite)
  | "email_nao_encontrado" // 404
  | "sem_senha" // 401
  | "senha_incorreta"; // 401

export type ResultadoLogin =
  | { ok: true; cliente: ClienteLogin }
  | { ok: false; motivo: MotivoLogin; status: number; error: string; restantes?: number; minutos?: number };

async function verificarBloqueio(email: string): Promise<{ mensagem: string; minutos: number } | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/tentativas_login?email=eq.${encodeURIComponent(email)}&tipo=eq.login&order=ultima_tentativa.desc&limit=1`,
    { headers }
  );
  const dados = await res.json();

  if (dados.length === 0) return null;

  const reg = dados[0];

  // Verifica se esta bloqueado
  if (reg.bloqueado_ate) {
    const bloqueadoAte = new Date(reg.bloqueado_ate);
    if (new Date() < bloqueadoAte) {
      const minRestantes = Math.ceil((bloqueadoAte.getTime() - Date.now()) / 60000);
      return { mensagem: `Muitas tentativas. Aguarde ${minRestantes} minuto(s).`, minutos: minRestantes };
    }
    // Bloqueio expirou — reseta
    await fetch(
      `${SUPABASE_URL}/rest/v1/tentativas_login?id=eq.${reg.id}`,
      { method: "PATCH", headers, body: JSON.stringify({ tentativas: 0, bloqueado_ate: null }) }
    );
    return null;
  }

  return null;
}

async function registrarTentativa(email: string, sucesso: boolean) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/tentativas_login?email=eq.${encodeURIComponent(email)}&tipo=eq.login&order=ultima_tentativa.desc&limit=1`,
    { headers }
  );
  const dados = await res.json();

  if (sucesso) {
    // Reseta contador ao acertar
    if (dados.length > 0) {
      await fetch(
        `${SUPABASE_URL}/rest/v1/tentativas_login?id=eq.${dados[0].id}`,
        { method: "PATCH", headers, body: JSON.stringify({ tentativas: 0, bloqueado_ate: null }) }
      );
    }
    return;
  }

  // Tentativa errada
  if (dados.length > 0) {
    const novasTentativas = dados[0].tentativas + 1;
    const bloqueio = novasTentativas >= MAX_TENTATIVAS
      ? new Date(Date.now() + BLOQUEIO_MINUTOS * 60 * 1000).toISOString()
      : null;

    await fetch(
      `${SUPABASE_URL}/rest/v1/tentativas_login?id=eq.${dados[0].id}`,
      { method: "PATCH", headers, body: JSON.stringify({
          tentativas: novasTentativas,
          ultima_tentativa: new Date().toISOString(),
          bloqueado_ate: bloqueio,
        })
      }
    );
  } else {
    // Primeiro erro — cria registro
    await fetch(
      `${SUPABASE_URL}/rest/v1/tentativas_login`,
      { method: "POST", headers, body: JSON.stringify({
          email, tipo: "login", tentativas: 1,
          ultima_tentativa: new Date().toISOString(),
        })
      }
    );
  }
}

/**
 * Confere e-mail + senha. Lança erro em falha de infraestrutura (a rota responde 500).
 * `email` e `senha` vêm do corpo do pedido, sem tratamento (o tipo é conferido aqui).
 */
export async function conferirLogin(email: unknown, senha: unknown): Promise<ResultadoLogin> {
  if (typeof email !== "string" || !email || !email.includes("@")) {
    return { ok: false, motivo: "email_invalido", status: 400, error: "E-mail invalido" };
  }

  if (!senha || typeof senha !== "string") {
    return { ok: false, motivo: "senha_vazia", status: 400, error: "Digite sua senha" };
  }

  // Verifica bloqueio
  const bloqueio = await verificarBloqueio(email);
  if (bloqueio) {
    return { ok: false, motivo: "bloqueado", status: 429, error: bloqueio.mensagem, minutos: bloqueio.minutos };
  }

  // Busca o cliente
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/clientes?email=eq.${encodeURIComponent(email)}&select=id,nome,email,whatsapp,pais,estado,cidade,senha_hash`,
    { headers }
  );
  const clientes = await res.json();

  if (clientes.length === 0) {
    await registrarTentativa(email, false);
    return { ok: false, motivo: "email_nao_encontrado", status: 404, error: "E-mail nao encontrado" };
  }

  const cliente = clientes[0] as ClienteLogin;

  if (!cliente.senha_hash) {
    return { ok: false, motivo: "sem_senha", status: 401, error: "Conta sem senha. Crie sua conta primeiro." };
  }

  const senhaCorreta = await bcrypt.compare(senha, cliente.senha_hash);
  if (!senhaCorreta) {
    await registrarTentativa(email, false);

    // Informa quantas tentativas restam
    const tentRes = await fetch(
      `${SUPABASE_URL}/rest/v1/tentativas_login?email=eq.${encodeURIComponent(email)}&tipo=eq.login&order=ultima_tentativa.desc&limit=1`,
      { headers }
    );
    const tentDados = await tentRes.json();
    const restantes = MAX_TENTATIVAS - (tentDados[0]?.tentativas || 0);

    if (restantes <= 0) {
      return {
        ok: false, motivo: "bloqueado", status: 429,
        error: `Conta bloqueada por ${BLOQUEIO_MINUTOS} minutos.`, minutos: BLOQUEIO_MINUTOS,
      };
    }

    return {
      ok: false, motivo: "senha_incorreta", status: 401,
      error: `Senha incorreta. ${restantes} tentativa(s) restante(s).`, restantes,
    };
  }

  // Sucesso — reseta tentativas
  await registrarTentativa(email, true);

  return { ok: true, cliente };
}
