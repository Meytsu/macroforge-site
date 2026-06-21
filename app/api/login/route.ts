import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { emitirCracha } from "@/app/api/_lib/auth";

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

async function verificarBloqueio(email: string): Promise<string | null> {
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
      return `Muitas tentativas. Aguarde ${minRestantes} minuto(s).`;
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

export async function POST(req: NextRequest) {
  try {
    const { email, senha } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "E-mail invalido" }, { status: 400 });
    }

    if (!senha) {
      return NextResponse.json({ error: "Digite sua senha" }, { status: 400 });
    }

    // Verifica bloqueio
    const bloqueio = await verificarBloqueio(email);
    if (bloqueio) {
      return NextResponse.json({ error: bloqueio }, { status: 429 });
    }

    // Busca o cliente
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/clientes?email=eq.${encodeURIComponent(email)}&select=id,nome,email,whatsapp,pais,estado,cidade,senha_hash`,
      { headers }
    );
    const clientes = await res.json();

    if (clientes.length === 0) {
      await registrarTentativa(email, false);
      return NextResponse.json({ error: "E-mail nao encontrado" }, { status: 404 });
    }

    const cliente = clientes[0];

    if (!cliente.senha_hash) {
      return NextResponse.json({ error: "Conta sem senha. Crie sua conta primeiro." }, { status: 401 });
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
        return NextResponse.json(
          { error: `Conta bloqueada por ${BLOQUEIO_MINUTOS} minutos.` },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: `Senha incorreta. ${restantes} tentativa(s) restante(s).` },
        { status: 401 }
      );
    }

    // Sucesso — reseta tentativas
    await registrarTentativa(email, true);

    const { senha_hash, ...clienteSeguro } = cliente;

    const licRes = await fetch(
      `${SUPABASE_URL}/rest/v1/licencas?cliente_id=eq.${cliente.id}&order=criado_em.desc&select=chave,plano,valor,status,device_id,data_inicio,data_expiracao`,
      { headers }
    );
    const licencas = await licRes.json();

    // MF-103 Bloqueador 1: emite o crachá (JWT, 30 dias) pro app provar identidade depois.
    // Campo NOVO e opcional — o app antigo ignora; só o app novo usa. Não quebra ninguém.
    let token: string | null = null;
    try {
      token = await emitirCracha(cliente.id, cliente.email);
    } catch (e) {
      // Sem segredo configurado: loga e segue sem token (login continua funcionando).
      console.error("Falha ao emitir crachá (AUTH_JWT_SECRET?):", e);
    }

    return NextResponse.json({ cliente: clienteSeguro, licencas, token });
  } catch (error) {
    console.error("Erro no login:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}
