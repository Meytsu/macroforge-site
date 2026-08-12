// Faxina diária de contas não confirmadas (ISSUE-MF-133).
//
// Chamada pelo cron da Vercel, uma vez por dia. NÃO é chamável por qualquer um: exige o
// `CRON_SECRET`, que a Vercel envia sozinha no header Authorization quando a variável de
// ambiente existe no projeto.
//
// ⚠️ ESTA ROTA APAGA CLIENTES. Todo o cuidado abaixo é proporcional a isso.
//
// As regras de QUEM pode ser apagado NÃO estão aqui — estão dentro de
// `mf_faxina_nao_confirmados` (sql/09), com quatro travas. Foi de propósito: assim o DELETE
// só existe por um caminho, e nenhuma chamada errada daqui consegue apagar quem não devia.
// Esta rota é só o despertador.
import type { NextRequest } from "next/server";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

/**
 * Tem que casar com o default da função no banco (sql/09) E com `HORAS_VALIDADE` em
 * `_lib/confirmacao.ts`. Os três são a mesma promessa vista de lugares diferentes.
 *
 * 120 -> 240 em 2026-08-09 (achado nº 4 da auditoria): o relógio conta desde o CADASTRO, e o
 * vencimento do boleto (3 dias úteis) queima esse prazo ANTES de o pagamento existir. Ver o
 * bloco do BOLETO no sql/09.
 */
const HORAS = 240;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // `!cronSecret` primeiro, e isso importa: se a variável não estiver configurada, a rota
  // recusa TUDO em vez de virar um endpoint público que apaga contas. Esquecer de
  // configurar deixa a faxina inerte — nunca aberta. É o exemplo da própria doc da Vercel.
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  // `?simular=...` conta sem apagar. Serve pra conferir em produção, com segurança, o que a
  // próxima execução real faria.
  //
  // ⚠️ Antes era `=== "1"`, e só essa grafia exata simulava: `?simular=true` e `?simular=sim`
  // caíam no ramo que APAGA DE VERDADE — o oposto do que a pessoa quis. Agora qualquer valor
  // presente simula, exceto "0"/"false" ditos na cara. O cron não manda o parâmetro, então
  // ausência continua significando execução real, que é o comportamento que ele precisa.
  const p = request.nextUrl.searchParams.get("simular");
  const simular = p !== null && p !== "0" && p.toLowerCase() !== "false";

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/mf_faxina_nao_confirmados`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ p_horas: HORAS, p_simular: simular }),
    });

    if (!res.ok) {
      const erro = await res.text();
      console.error("faxina: RPC falhou", erro);
      return Response.json({ ok: false, erro }, { status: 500 });
    }

    const linhas = await res.json();
    const apagados = linhas?.[0]?.apagados ?? 0;

    // Log SEMPRE, inclusive quando não apaga nada. A Vercel não repete execução que falha,
    // então o log é a única evidência de que a faxina rodou — e "rodou e não achou nada" é
    // informação diferente de "não rodou".
    console.log(`faxina: ${simular ? "SIMULACAO" : "REAL"} — ${apagados} conta(s), prazo ${HORAS}h`);

    return Response.json({ ok: true, apagados, simulado: simular, horas: HORAS });
  } catch (e) {
    console.error("faxina: erro", e);
    return Response.json({ ok: false }, { status: 500 });
  }
}
