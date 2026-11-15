import { NextRequest, NextResponse } from "next/server";
import { emitirCracha } from "@/app/api/_lib/auth";
import { rpc } from "@/app/api/_lib/rpc";
import { conferirLogin } from "@/app/api/_lib/login";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

export async function POST(req: NextRequest) {
  try {
    const { email, senha } = await req.json();

    // Conferência de e-mail + senha e freio por e-mail: _lib/login.ts (compartilhado com /api/pc/entrar).
    const r = await conferirLogin(email, senha);
    if (!r.ok) {
      return NextResponse.json({ error: r.error }, { status: r.status });
    }
    const cliente = r.cliente;

    const { senha_hash, ...clienteSeguro } = cliente;

    const licRes = await fetch(
      `${SUPABASE_URL}/rest/v1/licencas?cliente_id=eq.${cliente.id}&order=criado_em.desc&select=chave,plano,valor,status,device_id,data_inicio,data_expiracao`,
      { headers }
    );
    const licencas = await licRes.json();

    // ADR-021: o plano que vale pra conta (nível, aparelhos, validade). Campo NOVO — o app antigo ignora.
    // Falhar aqui não impede o login: o app novo pergunta de novo em /api/aparelhos.
    let plano: unknown = null;
    try {
      plano = await rpc("mf_plano_da_conta", { p_cliente_id: cliente.id });
    } catch (e) {
      console.error("Login ok, mas falhou ler o plano (mf_plano_da_conta):", e);
    }

    // MF-103 Bloqueador 1: emite o crachá (JWT, 30 dias) pro app provar identidade depois.
    // Campo NOVO e opcional — o app antigo ignora; só o app novo usa. Não quebra ninguém.
    let token: string | null = null;
    try {
      token = await emitirCracha(cliente.id, cliente.email);
    } catch (e) {
      // Sem segredo configurado: loga e segue sem token (login continua funcionando).
      console.error("Falha ao emitir crachá (AUTH_JWT_SECRET?):", e);
    }

    return NextResponse.json({ cliente: clienteSeguro, licencas, token, plano });
  } catch (error) {
    console.error("Erro no login:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}
