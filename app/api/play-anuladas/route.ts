// Corta o acesso de compras ANULADAS no Google Play — reembolso, fraude, chargeback.
//
// ============================================================
// POR QUE ESTA ROTA EXISTE (achado nº 1 da auditoria do Billing)
//
// Até 2026-08-10 NADA no sistema consumia anulação de compra. Consequência: o cliente pedia
// reembolso, o Google devolvia o dinheiro, e ele **continuava usando até a data vencer** — até
// UM ANO no plano anual. Pior: a compra reembolsada desaparece da lista do app, então o
// `recuperarCompras()` para de reenviá-la e nunca mais ninguém descobre.
//
// A issue original falava em consumir **RTDN**, que exige Pub/Sub no Google Cloud —
// infraestrutura que este projeto não tem. Mas existe caminho mais barato: a API
// `purchases.voidedpurchases.list` funciona com a MESMA conta de serviço que já usamos, e o
// código dela (`listarComprasAnuladas`) já estava escrito e com ZERO chamadores. Faltava
// ligar, não escrever.
//
// Rodando 1×/dia, o pior caso cai de **até um ano** para **24 horas**.
// ============================================================
import type { NextRequest } from "next/server";
import { listarComprasAnuladas, ORIGEM_ANULACAO } from "@/app/api/_lib/play";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

/**
 * Janela de busca. 48 h e não 24 h de propósito: o cron da Vercel no plano Hobby tem
 * precisão de ±59 min, pode PULAR uma execução (a entrega é "best effort", documentado) e
 * pode invocar duas vezes. A sobreposição cobre o pulo; o dedupe por `evento_id` cobre a
 * duplicata. Uma janela justa de 24 h perderia reembolso a cada execução falhada.
 */
const HORAS_JANELA = 48;

async function rpc(fn: string, args: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
    cache: "no-store",
  });
  const texto = await res.text();
  if (!res.ok) throw new Error(`rpc ${fn} falhou: ${res.status} ${texto.slice(0, 300)}`);
  try {
    return JSON.parse(texto);
  } catch {
    throw new Error(`rpc ${fn} devolveu resposta não-JSON: ${texto.slice(0, 200)}`);
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Mesmo padrão da faxina: `!cronSecret` PRIMEIRO. Sem a variável configurada, a rota
  // recusa tudo em vez de virar endpoint público que mexe em licença de cliente.
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const simular = request.nextUrl.searchParams.get("simular") !== null
    && request.nextUrl.searchParams.get("simular") !== "0"
    && request.nextUrl.searchParams.get("simular")?.toLowerCase() !== "false";

  try {
    const desde = new Date(Date.now() - HORAS_JANELA * 60 * 60 * 1000);
    const anuladas = await listarComprasAnuladas(desde);

    const cortadas: string[] = [];
    const parciais: string[] = [];
    const falhas: string[] = [];

    for (const a of anuladas) {
      // Reembolso PARCIAL por quantidade não corta acesso — a pessoa devolveu parte das
      // unidades, não a assinatura. Na prática não deve aparecer (a chamada não pede essas
      // linhas, e os planos de 3/5 chaves são planos base separados, não quantidade), mas
      // tratar é barato e a alternativa é cortar acesso de quem não pediu reembolso.
      if (a.quantidadeAnulada !== undefined) {
        parciais.push(`${a.orderId} (qtd ${a.quantidadeAnulada})`);
        console.warn(`[play-anuladas] PARCIAL ignorado: ${a.orderId} qtd=${a.quantidadeAnulada}`);
        continue;
      }

      if (!a.orderId) {
        // Sem orderId não há chave de dedupe confiável. O purchaseToken NÃO serve: renovações
        // de assinatura repetem o mesmo token (doc oficial), então o segundo reembolso da
        // mesma assinatura seria engolido como duplicata.
        falhas.push(`sem orderId (token ...${a.purchaseToken.slice(-8)})`);
        console.error("[play-anuladas] anulacao sem orderId:", a);
        continue;
      }

      const origem = ORIGEM_ANULACAO[a.origem] ?? `origem(${a.origem})`;
      const etiqueta = `${a.orderId} motivo=${a.motivoTexto} origem=${origem}`;

      if (simular) {
        cortadas.push(etiqueta);
        continue;
      }

      try {
        // `evento_id` DETERMINÍSTICO a partir do orderId: rodar de novo bate na chave
        // primária de `play_eventos` e não faz nada duas vezes. É o que torna esta rota
        // segura contra a invocação duplicada que a Vercel documenta.
        const r = await rpc("aplicar_evento_play", {
          p_evento_id: `voided:${a.orderId}`,
          p_purchase_token: a.purchaseToken,
          p_tipo: "voided",
          p_payload: {
            fonte: "voidedpurchases.list",
            orderId: a.orderId,
            motivo: a.motivo,
            motivoTexto: a.motivoTexto,
            origem: a.origem,
            anuladaEm: a.anuladaEm,
          },
          p_status: "cancelada",
        });

        if (r?.ok === false) {
          // Erro TRATADO do banco (token desconhecido, evento já aplicado). Não é falha de
          // infraestrutura — registra e segue, senão um token órfão travaria a fila inteira.
          console.warn(`[play-anuladas] banco recusou ${etiqueta}: ${r?.erro}`);
          falhas.push(`${etiqueta} -> ${r?.erro}`);
          continue;
        }

        cortadas.push(etiqueta);
        console.log(`[play-anuladas] CORTADO ${etiqueta}`);
      } catch (e) {
        console.error(`[play-anuladas] falha ao cortar ${etiqueta}:`, e);
        falhas.push(etiqueta);
      }
    }

    // Log SEMPRE, inclusive quando não há nada. A Vercel não repete cron que falhou, então o
    // log é a única evidência de que rodou — e "rodou e não achou nada" é informação
    // diferente de "não rodou".
    console.log(
      `[play-anuladas] ${simular ? "SIMULACAO" : "REAL"} — janela ${HORAS_JANELA}h · ` +
      `${anuladas.length} anulacao(oes) · ${cortadas.length} cortada(s) · ` +
      `${parciais.length} parcial(is) ignorada(s) · ${falhas.length} falha(s)`
    );

    return Response.json({
      ok: true,
      simulado: simular,
      janelaHoras: HORAS_JANELA,
      encontradas: anuladas.length,
      cortadas,
      parciaisIgnoradas: parciais,
      falhas,
    });
  } catch (e) {
    // Falha de rede/permissão com o Google. Responder 500 é o certo: aparece no painel de
    // Cron Jobs como execução com erro, em vez de sumir num "ok" mentiroso.
    console.error("[play-anuladas] erro:", e);
    return Response.json({ ok: false, erro: String(e) }, { status: 500 });
  }
}
