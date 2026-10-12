import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { clienteIdDoHeader } from "@/app/api/_lib/auth";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const resend = new Resend(process.env.RESEND_API_KEY);

// TRIAL DE 7 DIAS — decisão do Henrique em 2026-08-10, fechando a ISSUE-MF-118.
//
// Volta ao valor original. Os 30 dias eram incentivo EXCLUSIVO do teste fechado, pra recrutar
// testador; no teste aberto entra qualquer um e viraria "um mês grátis pra cada futuro
// pagante". Ele considerou 14 como meio termo e decidiu por 7 — o que tem uma vantagem que
// nenhum outro valor tinha: **o app já diz 7 em todos os textos**, então nenhum AAB novo é
// necessário e os três lugares passam a concordar sem tocar no Android.
//
// 🔴 O ESTADO ANTERIOR ERA PIOR QUE ERRADO — ERA TRÊS NÚMEROS DIFERENTES:
//     banco gravava           30 dias
//     e-mail e app diziam      7 dias   (deliberado em 2026-06-28, "não alterar os textos")
//     painel do site dizia    30 dias grátis
// O cliente lia 7 no app, 30 no painel, e recebia 30. Agora é 7 em todos os lugares — e
// esta constante é a ÚNICA fonte: os textos abaixo a interpolam, não repetem o número.
//
// ⚠️ NÃO confundir com a "garantia de 7 dias" (reembolso via PIX) da landing e da /planos.
// São coisas diferentes e aquela continua sendo 7.
const TRIAL_DIAS_INSERT = 7;   // tempo REAL gravado no banco (data_expiracao)

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

function gerarChave(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const parte = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `MF-${parte()}-${parte()}-${parte()}`;
}

/**
 * Lê uma lista do PostgREST. Resposta de erro (permissão, tabela ausente, fora do ar) LANÇA e a rota responde 500.
 *
 * O trial é um PORTÃO: na dúvida, fecha. Antes, um erro do banco vinha como objeto ({code, message}), o
 * `.length` dava `undefined`, a comparação dava falso e o trial era concedido — foi assim que a falta de permissão
 * em `trials_usados` (2026-10-11) passou sem ninguém ver.
 */
async function lerLista<T>(res: Response, oQue: string): Promise<T[]> {
  const corpo = await res.json().catch(() => null);
  if (!res.ok || !Array.isArray(corpo)) {
    throw new Error(`consulta ${oQue} falhou: HTTP ${res.status}`);
  }
  return corpo as T[];
}

export async function POST(req: NextRequest) {
  try {
    const corpo = await req.json().catch(() => ({}));
    const emailCorpo = typeof corpo?.email === "string" ? corpo.email.trim() : "";
    const device_id = typeof corpo?.device_id === "string" ? corpo.device_id.trim() : "";

    // QUEM pede o trial. App novo (ADR-021): manda o CRACHÁ do login e o cliente sai DELE — o e-mail do corpo é
    // ignorado, então ninguém ativa o trial de outra pessoa só sabendo o e-mail dela (achado do pentest de
    // 2026-10-11). Sem crachá: caminho antigo por e-mail, que o app publicado hoje usa — sai junto com o
    // validar_licenca, quando o app novo estiver publicado.
    const authHeader = req.headers.get("authorization");
    const clienteIdCracha = authHeader ? await clienteIdDoHeader(authHeader) : null;
    if (authHeader && !clienteIdCracha) {
      return NextResponse.json(
        { error: "Sessao expirada. Faca login novamente.", codigo: "sem_cracha" },
        { status: 401 }
      );
    }

    if (!clienteIdCracha && (!emailCorpo || !emailCorpo.includes("@"))) {
      return NextResponse.json({ error: "E-mail invalido" }, { status: 400 });
    }

    if (device_id.length < 8 || device_id.length > 128) {
      return NextResponse.json({ error: "Device ID invalido" }, { status: 400 });
    }

    // 1. Busca o cliente (pelo crachá ou, no caminho antigo, pelo e-mail)
    const filtroCliente = clienteIdCracha
      ? `id=eq.${encodeURIComponent(clienteIdCracha)}`
      : `email=eq.${encodeURIComponent(emailCorpo)}`;
    const clienteRes = await fetch(
      `${SUPABASE_URL}/rest/v1/clientes?${filtroCliente}&select=id,nome,email,email_confirmado`,
      { headers }
    );
    const clientes = await lerLista<{ id: string; email: string; email_confirmado?: boolean }>(clienteRes, "clientes");

    if (clientes.length === 0) {
      return NextResponse.json({ error: "Conta nao encontrada. Cadastre-se primeiro." }, { status: 404 });
    }

    const cliente = clientes[0];
    const email = cliente.email; // o do banco: é pra ele que vai a confirmação

    // 1.5 — TRIAL EXIGE E-MAIL CONFIRMADO (ISSUE-MF-133)
    //
    // Este é o único portão de confirmação do sistema, e é aqui de propósito: o trial é a
    // ÚNICA coisa que o cadastro sozinho pode render — 7 dias de PRO sem pagar nada. É
    // exatamente o que tem valor pra quem cria conta em massa.
    //
    // Comprar continua liberado (decisão de 2026-08-09): quem está com o cartão na mão não
    // esbarra em burocracia, e pagar já confirma pelo /api/webhook.
    //
    // `=== false` e não `!cliente.email_confirmado`: se a coluna ainda não existir no banco
    // (sql/09 não rodado), o campo vem `undefined` e o `!` recusaria o trial de TODO MUNDO.
    // Assim, banco desatualizado deixa passar em vez de quebrar o app de quem já usa.
    if (cliente.email_confirmado === false) {
      return NextResponse.json(
        {
          error: "Confirme seu e-mail para ativar o trial.",
          precisaConfirmar: true,
        },
        { status: 403 }
      );
    }

    // 2. Verifica se esse device_id ja teve trial (registros antigos, de antes da lista `trials_usados`)
    const trialDeviceRes = await fetch(
      `${SUPABASE_URL}/rest/v1/licencas?device_id=eq.${encodeURIComponent(device_id)}&plano=eq.trial&select=id`,
      { headers }
    );
    const trialsDevice = await lerLista(trialDeviceRes, "trial do aparelho");

    if (trialsDevice.length > 0) {
      return NextResponse.json(
        { error: "Trial ja utilizado neste dispositivo. Assine para continuar." },
        { status: 409 }
      );
    }

    // 3. Verifica se esse cliente ja teve trial (qualquer device)
    const trialClienteRes = await fetch(
      `${SUPABASE_URL}/rest/v1/licencas?cliente_id=eq.${cliente.id}&plano=eq.trial&select=id`,
      { headers }
    );
    const trialsCliente = await lerLista(trialClienteRes, "trial do cliente");

    if (trialsCliente.length > 0) {
      return NextResponse.json(
        { error: "Voce ja utilizou seu trial gratuito." },
        { status: 409 }
      );
    }

    // 4. Verifica se esse cliente ja tem licenca ativa (paga)
    const licAtiva = await fetch(
      `${SUPABASE_URL}/rest/v1/licencas?cliente_id=eq.${cliente.id}&status=eq.ativa&data_expiracao=gt.${new Date().toISOString()}&select=id,chave`,
      { headers }
    );
    const ativas = await lerLista<{ chave: string }>(licAtiva, "licencas ativas");

    if (ativas.length > 0) {
      return NextResponse.json(
        { error: "Voce ja possui uma licenca ativa.", chave: ativas[0].chave },
        { status: 409 }
      );
    }

    // 5. RESERVA o aparelho na lista definitiva `trials_usados` (ADR-021, sql/10) ANTES de criar a licença.
    //
    // A chave primária (device_id) é a trava: dois pedidos ao mesmo tempo com o mesmo aparelho (até de contas
    // diferentes) não passam os dois — o segundo recebe 409 do banco. A lista não é apagada pelo reset/
    // "Desconectar" (o furo de bugs.md 2026-10-09). Sem `ignore-duplicates` de propósito: o conflito TEM de aparecer.
    const reservaRes = await fetch(`${SUPABASE_URL}/rest/v1/trials_usados`, {
      method: "POST",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify({ device_id, cliente_id: cliente.id }),
    });
    if (reservaRes.status === 409) {
      return NextResponse.json(
        { error: "Trial ja utilizado neste dispositivo. Assine para continuar." },
        { status: 409 }
      );
    }
    if (!reservaRes.ok) {
      throw new Error(`reserva em trials_usados falhou: HTTP ${reservaRes.status}`);
    }

    // 6. Gera chave trial
    const chave = gerarChave();
    const expiracao = new Date(Date.now() + TRIAL_DIAS_INSERT * 24 * 60 * 60 * 1000).toISOString();

    const licRes = await fetch(`${SUPABASE_URL}/rest/v1/licencas`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        chave,
        cliente_id: cliente.id,
        plano: "trial",
        valor: 0,
        status: "ativa",
        device_id,
        data_expiracao: expiracao,
        // ADR-021 (sql/10): o trial é um plano de 1 aparelho. Sem isto a coluna nova cairia no padrão
        // ('pro'), e o "Meu plano" do app mostraria "Pro" pra quem está no trial.
        nivel: "trial",
        max_dispositivos: 1,
        origem: "trial",
      }),
    });

    if (!licRes.ok) {
      console.error("Erro ao criar trial: HTTP", licRes.status);
      // Desfaz a reserva: o aparelho não ganhou trial nenhum, então pode tentar de novo.
      await fetch(`${SUPABASE_URL}/rest/v1/trials_usados?device_id=eq.${encodeURIComponent(device_id)}`, {
        method: "DELETE",
        headers: { ...headers, Prefer: "return=minimal" },
      }).catch((e) => console.error("Falhou desfazer a reserva do trial:", e));
      return NextResponse.json({ error: "Erro ao ativar trial" }, { status: 500 });
    }

    // Sem chave, e-mail nem aparelho no log (a chave ainda vale como credencial no app antigo).
    console.log(`Trial ativado para o cliente ${cliente.id}`);

    // 7. Envia email com a chave trial
    const dataExp = new Date(expiracao).toLocaleDateString("pt-BR");
    try {
      await resend.emails.send({
        from: "MacroForge <noreply@macroforge.com.br>",
        to: email,
        subject: `Seu trial MacroForge de ${TRIAL_DIAS_INSERT} dias esta ativo!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0D1117; color: #fff; padding: 32px; border-radius: 16px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #D4A017; margin: 0;">MacroForge</h1>
              <p style="color: #8B949E; font-size: 14px;">Automacao inteligente para mobile</p>
            </div>

            <div style="background: #161B22; border: 1px solid #30363D; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <p style="color: #4CAF50; font-size: 16px; font-weight: bold; margin: 0 0 8px 0;">Trial de ${TRIAL_DIAS_INSERT} dias ativado!</p>
              <p style="color: #8B949E; font-size: 14px; margin: 0 0 12px 0;">Sua chave:</p>
              <div style="background: #0D1117; border: 2px solid #D4A017; border-radius: 8px; padding: 16px; text-align: center;">
                <span style="font-family: monospace; font-size: 24px; font-weight: bold; color: #D4A017; letter-spacing: 2px;">${chave}</span>
              </div>
            </div>

            <div style="background: #161B22; border: 1px solid #30363D; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
              <table style="width: 100%; font-size: 14px;">
                <tr>
                  <td style="color: #8B949E; padding: 4px 0;">Plano</td>
                  <td style="color: #fff; text-align: right; padding: 4px 0;">Trial gratuito (${TRIAL_DIAS_INSERT} dias)</td>
                </tr>
                <tr>
                  <td style="color: #8B949E; padding: 4px 0;">Valido ate</td>
                  <td style="color: #fff; text-align: right; padding: 4px 0;">${dataExp}</td>
                </tr>
              </table>
            </div>

            <div style="background: #161B22; border: 1px solid #30363D; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
              <p style="color: #8B949E; font-size: 13px; margin: 0;">
                Aproveite todas as funcionalidades PRO durante ${TRIAL_DIAS_INSERT} dias. Ao final, assine para continuar usando:
                <a href="https://macroforge.com.br/planos" style="color: #D4A017;">ver planos</a>
              </p>
            </div>

            <div style="text-align: center; margin-top: 24px;">
              <p style="color: #8B949E; font-size: 12px;">
                Duvidas? Fale conosco:
                <a href="https://wa.me/5581973197753" style="color: #D4A017;">WhatsApp</a>
              </p>
              <p style="color: #30363D; font-size: 11px; margin-top: 16px;">MacroForge &copy; 2026</p>
            </div>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error("Erro ao enviar email trial:", emailErr);
    }

    return NextResponse.json({
      ok: true,
      chave,
      plano: "trial",
      expiracao,
      dias: TRIAL_DIAS_INSERT, // 7 — coerente com a data de expiração, com o e-mail e com o app
    });
  } catch (error) {
    console.error("Erro no ativar-trial:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}
