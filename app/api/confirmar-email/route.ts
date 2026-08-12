// Confirmação de e-mail — as duas pontas do passo 2 do cadastro (ISSUE-MF-133).
//
//   POST  { codigo }        valida e confirma. É o que o campo do wizard e o link do
//                           e-mail chamam — o link só preenche o campo sozinho.
//   GET   ?pendencia=...    responde só { confirmado: true|false }. É o que a aba que
//                           está esperando pergunta de tempos em tempos.
//
// POR QUE A ESPERA PRECISA DE UM IDENTIFICADOR PRÓPRIO
// O passo 2 fecha sozinho quando a pessoa clica no link — que pode ser no CELULAR, com a
// página aberta no COMPUTADOR. A aba não tem como saber; ela pergunta ao servidor.
// Se a pergunta fosse "fulano@x.com já confirmou?", qualquer um varreria endereços pra
// descobrir quem tem conta aqui. A `pendencia` é opaca e só a aba que cadastrou recebeu.
// Ela NÃO confirma nada: quem a tiver só consegue saber "sim ou não".
import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

/** Sem cache: a resposta muda de "não" pra "sim" e a aba precisa enxergar a virada. */
const semCache = { "Cache-Control": "no-store" };

/**
 * O que o usuário digita não é o que está no banco: ele copia com espaço, cola com quebra
 * de linha, digita minúsculo, ou põe hífen no meio porque o campo está dividido em blocos.
 * O alfabeto do código não tem nenhum desses caracteres, então limpar é seguro — e evita
 * o pior tipo de bug de UX: o código CERTO sendo recusado.
 */
function normalizar(bruto: unknown): string {
  return String(bruto ?? "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}

// ---------------------------------------------------------------------------
// POST — confirma
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    const corpo = await req.json();
    const codigo = normalizar(corpo?.codigo);

    if (codigo.length !== 8) {
      return NextResponse.json({ error: "Codigo invalido" }, { status: 400 });
    }

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/confirmacoes_email?codigo=eq.${encodeURIComponent(codigo)}` +
        `&select=codigo,cliente_id,expira_em,usado_em`,
      { headers }
    );
    const linhas = await res.json();

    if (!Array.isArray(linhas) || linhas.length === 0) {
      return NextResponse.json({ error: "Codigo invalido" }, { status: 400 });
    }

    const conv = linhas[0];

    // Já usado NÃO é erro pro usuário: ele clicou no link e depois digitou o código, ou
    // clicou duas vezes. A conta está confirmada, que é o que ele queria — responder erro
    // aqui faria uma tela de fracasso pra uma operação que deu certo.
    if (conv.usado_em) {
      return NextResponse.json({ ok: true, jaConfirmado: true }, { headers: semCache });
    }

    if (new Date(conv.expira_em) < new Date()) {
      return NextResponse.json(
        { error: "Codigo expirado. Peca um novo.", expirado: true },
        { status: 400 }
      );
    }

    // Ordem proposital: confirma o CLIENTE primeiro, carimba o convite depois.
    //
    // Se o processo morrer entre os dois, o pior caso é um convite ainda válido pra uma
    // conta já confirmada — inofensivo, e o próximo uso cai no ramo `jaConfirmado`.
    // Na ordem inversa o pior caso seria um convite queimado e a conta AINDA pendente:
    // o cliente ficaria sem como confirmar e seria apagado pela faxina em 48 h.
    const upCliente = await fetch(
      `${SUPABASE_URL}/rest/v1/clientes?id=eq.${conv.cliente_id}`,
      { method: "PATCH", headers, body: JSON.stringify({ email_confirmado: true }) }
    );

    if (!upCliente.ok) {
      console.error("confirmar-email: falha ao marcar cliente", await upCliente.text());
      return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
    }

    await fetch(
      `${SUPABASE_URL}/rest/v1/confirmacoes_email?codigo=eq.${encodeURIComponent(codigo)}`,
      { method: "PATCH", headers, body: JSON.stringify({ usado_em: new Date().toISOString() }) }
    );

    return NextResponse.json({ ok: true }, { headers: semCache });
  } catch (error) {
    console.error("Erro em confirmar-email (POST):", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// GET — a aba pergunta "já confirmou?"
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  try {
    const pendencia = req.nextUrl.searchParams.get("pendencia") || "";

    // Resposta pobre de propósito: só o booleano. Sem nome, sem e-mail, sem id. Quem tiver
    // uma pendência alheia não aprende nada além de "sim/não" sobre uma conta que não sabe
    // de quem é.
    if (!pendencia) {
      return NextResponse.json({ confirmado: false }, { headers: semCache });
    }

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/confirmacoes_email?pendencia=eq.${encodeURIComponent(pendencia)}` +
        `&select=cliente_id`,
      { headers }
    );
    const linhas = await res.json();

    if (!Array.isArray(linhas) || linhas.length === 0) {
      // Pendência desconhecida: convite substituído por um reenvio, ou lixo. "Não
      // confirmado" é a resposta certa e não revela qual dos dois casos é.
      return NextResponse.json({ confirmado: false }, { headers: semCache });
    }

    // Consulta o CLIENTE, não o `usado_em` do convite.
    //
    // Parece rodeio, mas é o que torna a espera correta: existem caminhos que confirmam
    // o cliente SEM passar por este convite — pagamento aprovado marca `email_confirmado`
    // pelo /api/webhook. Olhando só o convite, a aba ficaria girando pra sempre com a
    // conta já liberada.
    const resCli = await fetch(
      `${SUPABASE_URL}/rest/v1/clientes?id=eq.${linhas[0].cliente_id}&select=email_confirmado`,
      { headers }
    );
    const clientes = await resCli.json();

    return NextResponse.json(
      { confirmado: clientes?.[0]?.email_confirmado === true },
      { headers: semCache }
    );
  } catch (error) {
    console.error("Erro em confirmar-email (GET):", error);
    // Erro não é "confirmado". A aba continua esperando em vez de liberar por engano.
    return NextResponse.json({ confirmado: false }, { headers: semCache });
  }
}
