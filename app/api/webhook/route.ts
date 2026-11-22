// ============================================================
// POST /api/webhook — aviso do Mercado Pago de que um pagamento mudou.
//
// Reescrito em 2026-11-22 (ISSUE-MF-156). Antes gerava N chaves `MF-XXXX` e as mandava por e-mail; agora concede o
// PLANO DA CONTA (Pro/Mega/Ultra, mensal) numa única chamada atômica ao banco.
//
// O FLUXO
//   MP           → "o pagamento 123 mudou"   (o corpo NÃO é confiável: qualquer um pode fazer POST aqui)
//   esta rota    → pergunta ao MERCADO PAGO como está o pagamento 123 (com o nosso token)
//                → só `approved` segue
//                → confere: metadata (cliente_id, nivel, duracao="mensal") + valor pago == precoNivel(nivel) em BRL
//                     não bate → registra a recusa (mp_pagamentos) e responde 200 — NÃO concede
//                → rpc mf_conceder_mercado_pago (sql/15): idempotente pelo id do pagamento; mesmo plano soma 30 dias,
//                  plano diferente entra na fila
//                     erro do banco → 500 → o Mercado Pago REENVIA (corrige o defeito 2: antes respondia 200 e o
//                     cliente ficava sem nada)
//                → e-mail de confirmação (sem chave nenhuma)
//
// RESPOSTAS
//   200 = "pode parar de mandar" (tratado, ignorado, recusado de propósito ou repetido)
//   500 = "tente de novo"        (Mercado Pago fora, banco fora) — nunca conceder por otimismo
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { Resend } from "resend";
import { rpc } from "@/app/api/_lib/rpc";
import {
  precoNivel, ehNivelValido, NOME_NIVEL, APARELHOS_DO_NIVEL, type NivelId,
} from "@/app/lib/precos";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** O id do pagamento, venha no corpo (formato novo) ou na URL (formato antigo `?topic=payment&id=`). */
function idDoPagamento(req: NextRequest, body: Record<string, unknown>): string | null {
  const q = req.nextUrl.searchParams;
  const tipo = (body.type as string) || (body.topic as string) || q.get("type") || q.get("topic") || "";
  const acao = typeof body.action === "string" ? body.action : "";
  if (tipo !== "payment" && !acao.startsWith("payment.")) return null;
  const data = body.data as { id?: unknown } | undefined;
  const id = data?.id ?? q.get("data.id") ?? q.get("id") ?? body.id;
  const s = id == null ? "" : String(id).trim();
  return /^\d+$/.test(s) ? s : null;
}

function dataBR(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

async function emailDoCliente(clienteId: string): Promise<string | null> {
  const r = await fetch(
    `${SUPABASE_URL}/rest/v1/clientes?id=eq.${encodeURIComponent(clienteId)}&select=email`,
    { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }, cache: "no-store" }
  );
  if (!r.ok) return null;
  const linhas = await r.json();
  return Array.isArray(linhas) && linhas[0]?.email ? String(linhas[0].email) : null;
}

/** E-mail de confirmação. Falhar aqui NÃO desfaz nada: o plano já está na conta (só registra no log). */
async function enviarConfirmacao(
  email: string, nivel: NivelId, acao: string, dataInicio: string, dataExpiracao: string
) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error("webhook: RESEND_API_KEY ausente; e-mail de confirmacao nao enviado");
    return;
  }
  const nome = NOME_NIVEL[nivel];
  const naFila = new Date(dataInicio).getTime() > Date.now() + 60_000;
  const frase = naFila
    ? acao === "somou"
      ? `Somamos 30 dias ao seu plano <b>${nome}</b>: o novo período começa em <b>${dataBR(dataInicio)}</b> e vai até <b>${dataBR(dataExpiracao)}</b>.`
      : `Seu plano <b>${nome}</b> entrou na fila e começa em <b>${dataBR(dataInicio)}</b>, quando o plano atual terminar. Ele vale até <b>${dataBR(dataExpiracao)}</b>.`
    : `Seu plano <b>${nome}</b> está ativo até <b>${dataBR(dataExpiracao)}</b>.`;

  try {
    await new Resend(key).emails.send({
      from: "MacroForge <noreply@macroforge.com.br>",
      to: email,
      subject: naFila ? `Pagamento confirmado — plano ${nome} na fila` : `Pagamento confirmado — plano ${nome} ativo`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0D1117; color: #fff; padding: 32px; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #D4A017; margin: 0;">MacroForge</h1>
          </div>
          <div style="background: #161B22; border: 1px solid #30363D; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <p style="color: #fff; font-size: 15px; margin: 0 0 12px 0;">Pagamento confirmado. Obrigado!</p>
            <p style="color: #C9D1D9; font-size: 14px; margin: 0;">${frase}</p>
            <p style="color: #8B949E; font-size: 13px; margin: 12px 0 0 0;">
              ${APARELHOS_DO_NIVEL[nivel]} aparelhos no app + 1 computador com o MacroForge PC. Tudo incluído.
            </p>
          </div>
          <div style="background: #161B22; border: 1px solid #30363D; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
            <p style="color: #D4A017; font-weight: bold; margin: 0 0 8px 0;">Como usar:</p>
            <ol style="color: #8B949E; font-size: 13px; padding-left: 20px; margin: 0;">
              <li style="margin-bottom: 4px;">Instale o MacroForge pela Google Play (ou o MacroForge PC pelo site)</li>
              <li style="margin-bottom: 4px;">Entre com o mesmo e-mail e senha da sua conta do site</li>
              <li>Pronto: o plano já está na sua conta</li>
            </ol>
          </div>
          <div style="text-align: center; margin-top: 24px;">
            <p style="color: #8B949E; font-size: 12px;">
              Dúvidas? <a href="https://wa.me/5581973197753" style="color: #D4A017;">WhatsApp</a> ·
              <a href="https://macroforge.com.br/painel" style="color: #D4A017;">Minha conta</a>
            </p>
            <p style="color: #30363D; font-size: 11px; margin-top: 16px;">MacroForge &copy; 2026</p>
          </div>
        </div>
      `,
    });
  } catch (e) {
    console.error("webhook: erro ao enviar e-mail de confirmacao:", e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const paymentId = idDoPagamento(req, body);
    if (!paymentId) {
      return NextResponse.json({ ok: true, ignorado: true });
    }

    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken || !SUPABASE_URL || !SUPABASE_KEY) {
      console.error("webhook: ambiente incompleto (MP/Supabase); pedindo reenvio");
      return NextResponse.json({ error: "Servico indisponivel" }, { status: 500 });
    }

    // 1) A verdade vem do Mercado Pago, não do corpo. Se o MP falhar, lança → 500 → ele reenvia.
    const pag = await new Payment(new MercadoPagoConfig({ accessToken })).get({ id: paymentId });

    if (pag.status !== "approved") {
      console.log(`webhook: pagamento ${paymentId} com status ${pag.status}`);
      return NextResponse.json({ ok: true, status: pag.status });
    }

    // 2) Quem e o quê — da metadata que o NOSSO /api/checkout gravou (o MP devolve as chaves em snake_case).
    const meta = (pag.metadata ?? {}) as Record<string, unknown>;
    const clienteId = typeof meta.cliente_id === "string" && UUID_RE.test(meta.cliente_id) ? meta.cliente_id : null;
    const nivelBruto = meta.nivel;
    const duracao = meta.duracao;
    const valorPago = Number(pag.transaction_amount);
    const moeda = pag.currency_id;

    let motivo: string | null = null;
    if (!clienteId) motivo = "metadata sem cliente_id valido";
    else if (!ehNivelValido(nivelBruto)) motivo = `nivel invalido na metadata: ${String(nivelBruto)}`;
    else if (duracao !== "mensal") motivo = `duracao inesperada: ${String(duracao)}`;
    else if (moeda !== "BRL") motivo = `moeda inesperada: ${String(moeda)}`;
    else if (!Number.isFinite(valorPago) || Math.round(valorPago * 100) !== Math.round(precoNivel(nivelBruto) * 100)) {
      motivo = `valor pago ${valorPago} diferente do preco ${precoNivel(nivelBruto)} (${nivelBruto})`;
    }

    if (motivo) {
      // NÃO concede. Fica o recibo para o Henrique olhar (e devolver o dinheiro, se for o caso). 200 = o MP para.
      // Se nem o registro der certo, 500: melhor o MP reenviar do que a recusa sumir sem rastro.
      console.error(`webhook: pagamento ${paymentId} APROVADO mas RECUSADO: ${motivo}`);
      await rpc("mf_mp_registrar_recusa", {
        p_payment_id: paymentId,
        p_cliente_id: clienteId,
        p_nivel: typeof nivelBruto === "string" ? nivelBruto : null,
        p_valor: Number.isFinite(valorPago) ? valorPago : null,
        p_motivo: motivo,
      });
      return NextResponse.json({ ok: true, recusado: true });
    }

    const nivel = nivelBruto as NivelId;

    // 3) Concessão atômica e idempotente. Erro de rede/banco LANÇA → catch → 500 → o MP reenvia.
    const r = await rpc("mf_conceder_mercado_pago", {
      p_payment_id: paymentId,
      p_cliente_id: clienteId,
      p_nivel: nivel,
      p_valor: valorPago,
    });

    if (!r?.ok) {
      // Recusa TRATADA do banco (conta apagada, pagamento de outra conta, já recusado antes). Reenviar não muda nada.
      console.error(`webhook: banco recusou o pagamento ${paymentId}:`, r?.codigo, r?.erro);
      return NextResponse.json({ ok: true, recusado: true, codigo: r?.codigo });
    }

    if (r.repetido) {
      // Reenvio do MP para um pagamento já concedido: nada a fazer (o e-mail já foi na 1ª vez).
      return NextResponse.json({ ok: true, repetido: true });
    }

    console.log(`webhook: pagamento ${paymentId} concedido: ${nivel} ${r.acao} ate ${r.data_expiracao}`);

    // 4) E-mail de confirmação (falha aqui não muda a resposta: o plano já está na conta).
    const email = (await emailDoCliente(clienteId!)) ?? pag.payer?.email ?? null;
    if (email) {
      await enviarConfirmacao(email, nivel, String(r.acao), String(r.data_inicio), String(r.data_expiracao));
    }

    return NextResponse.json({ ok: true, acao: r.acao });
  } catch (error: unknown) {
    console.error("webhook: erro (pedindo reenvio ao Mercado Pago):", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
