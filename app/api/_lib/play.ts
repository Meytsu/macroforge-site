// ============================================================
// Conversa com a API do Google Play (ISSUE-MF-103 Fase 2).
//
// Escrito em 2026-08-03. NUNCA EXECUTADO — falta a conta de serviço no
// Google Cloud e a variável de ambiente na Vercel.
//
// ------------------------------------------------------------
// POR QUE ESTE ARQUIVO EXISTE
// ------------------------------------------------------------
// O app manda um comprovante de compra e diz "sou o cliente X". O comprovante
// prova que ALGUMA compra aconteceu, mas NÃO diz o que foi comprado nem até
// quando vale. Conferido no próprio código da Billing Library 9.1.0 — o objeto
// `Purchase` que o app recebe tem:
//
//     getPurchaseToken()  ✅   getProducts()  ✅ → "macroforge_assinatura"
//     getSignature()      ✅   isAutoRenewing() ✅
//     data de validade    ❌   qual plano base  ❌
//
// O `productId` é o MESMO para os três planos (mensal/semestral/anual) — quem
// distingue é o `basePlanId`, e ele não vem no `Purchase`. Então o servidor
// PRECISA perguntar ao Google. Aceitar plano e data do corpo da requisição é o
// furo "comprei o mensal de R$ 9,90, me dá o anual de 5 chaves".
//
// ------------------------------------------------------------
// SEM DEPENDÊNCIA NOVA
// ------------------------------------------------------------
// Autenticação feita à mão com a `jose` (já no projeto, usada em `auth.ts`):
// assina um JWT com a chave da conta de serviço e troca por um access token.
// É o fluxo `urn:ietf:params:oauth:grant-type:jwt-bearer`.
// Alternativa seria o pacote `googleapis`, que traz dezenas de MB para usar
// UM endpoint.
//
// ------------------------------------------------------------
// VARIÁVEL DE AMBIENTE (Vercel — NUNCA no git; este repo é PÚBLICO)
// ------------------------------------------------------------
//   GOOGLE_SERVICE_ACCOUNT_JSON = o JSON inteiro da chave da conta de serviço
//
// ⚠️ Ao colar numa variável de ambiente, o `private_key` costuma chegar com
// "\n" literal em vez de quebra de linha real. O código trata os dois casos —
// é o erro nº 1 de quem monta isso pela primeira vez, e a mensagem de erro do
// Google ("invalid_grant") não ajuda em nada a descobrir.
// ============================================================

import { SignJWT, importPKCS8 } from "jose";
import { APARELHOS_DO_NIVEL } from "@/app/lib/precos";

const PACKAGE_NAME = "com.henrique.macroforge";
const ESCOPO = "https://www.googleapis.com/auth/androidpublisher";
const URL_TOKEN = "https://oauth2.googleapis.com/token";
const BASE_API = "https://androidpublisher.googleapis.com/androidpublisher/v3";

/** O único produto de assinatura. Ver `key_facts.md` → PLAY CONSOLE. */
export const PRODUTO_ASSINATURA = "macroforge_assinatura";

// ------------------------------------------------------------
// Autenticação
// ------------------------------------------------------------

interface ContaServico {
  client_email: string;
  private_key: string;
}

function lerContaServico(): ContaServico {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    // Falha barulhenta: melhor erro claro no log do que "invalid_grant" do Google.
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON não configurado no ambiente");
  }
  let json: ContaServico;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON não é um JSON válido");
  }
  if (!json.client_email || !json.private_key) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON sem client_email ou private_key");
  }
  return json;
}

/**
 * Cache do token em escopo de módulo. Numa função serverless isso vale enquanto
 * a instância estiver quente — o suficiente para não pedir token novo em cada
 * requisição, e inofensivo quando a instância morre.
 */
let tokenCache: { token: string; expiraEm: number } | null = null;

async function getAccessToken(): Promise<string> {
  const agora = Math.floor(Date.now() / 1000);
  // 60s de folga: token que expira no meio do voo dá 401 difícil de diagnosticar.
  if (tokenCache && tokenCache.expiraEm > agora + 60) return tokenCache.token;

  const conta = lerContaServico();

  // A quebra de linha some quando o JSON passa por variável de ambiente.
  const pem = conta.private_key.includes("\\n")
    ? conta.private_key.replace(/\\n/g, "\n")
    : conta.private_key;

  const chave = await importPKCS8(pem, "RS256");

  const assertion = await new SignJWT({ scope: ESCOPO })
    .setProtectedHeader({ alg: "RS256" })
    .setIssuer(conta.client_email)
    .setAudience(URL_TOKEN)
    .setIssuedAt(agora)
    .setExpirationTime(agora + 3600)
    .sign(chave);

  const res = await fetch(URL_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  const corpo = await res.json().catch(() => ({}));
  if (!res.ok || !corpo.access_token) {
    // O Google responde "invalid_grant" para várias causas diferentes. As três
    // mais comuns, em ordem: (1) private_key com "\n" literal — tratado acima;
    // (2) a conta de serviço não recebeu permissão no PLAY CONSOLE (criar no
    // Google Cloud não basta, tem que conceder acesso do lado do Play);
    // (3) relógio do servidor fora de hora, que aqui não se aplica.
    throw new Error(
      `Falha ao obter access token do Google: ${res.status} ${JSON.stringify(corpo)}`
    );
  }

  tokenCache = {
    token: corpo.access_token,
    expiraEm: agora + (typeof corpo.expires_in === "number" ? corpo.expires_in : 3600),
  };
  return tokenCache.token;
}

// ------------------------------------------------------------
// Consulta da assinatura
// ------------------------------------------------------------

/** Nosso `status` de licença — o mesmo vocabulário do `sql/05`. */
export type StatusLicenca = "ativa" | "suspensa" | "cancelada";

export interface AssinaturaPlay {
  /** Estado bruto do Google, para log e auditoria. */
  subscriptionState: string;
  /** Traduzido para o vocabulário do banco. `null` = não mexer no status. */
  status: StatusLicenca | null;
  /** Quem identifica o que foi comprado. Ex.: "pro-mensal-1". */
  basePlanId: string;
  /** `null` quando o cliente entrou sem promoção. */
  offerId: string | null;
  /** Até quando vale, em ISO. É o que vai para `p_data_expiracao`. */
  expiryTime: string;
  autoRenewing: boolean;
  /** Presente quando esta compra SUBSTITUIU outra (upgrade/downgrade). */
  linkedPurchaseToken: string | null;
  jaConfirmada: boolean;
  /** `true` quando a compra veio de um testador de licença (não cobra dinheiro). */
  ehTeste: boolean;
  /** Só para o caso PENDING (boleto/lotérica): não conceder nada ainda. */
  pendente: boolean;
  /**
   * Preço RECORRENTE do plano base, em reais (ex.: 14.90). `null` se o Google
   * não informar (plano pré-pago, ou compra pendente sem preço definido).
   *
   * ⚠️ É o preço do PLANO BASE, não o da promoção. Quem entra pela oferta de
   * lançamento paga R$ 9,90 e este campo diz 14,90. Ver a nota em
   * `play-purchase-verify` — o `offerId` é o que registra a promoção.
   */
  precoRecorrente: number | null;
  moeda: string | null;
}

/**
 * Traduz o estado do Google para o nosso `status`.
 *
 * ⚠️ A decisão 3 do `sql/05` vive aqui: **CANCELED não corta acesso.** No
 * Google, "cancelado" significa só "não renove" — a data continua de pé e o
 * cliente usa até lá. Então devolvemos 'ativa' e deixamos `auto_renews=false`
 * fazer o registro. Quem corta na hora é reembolso (que não passa por aqui —
 * vem pela lista de compras anuladas).
 *
 * ⚠️ Estado desconhecido devolve `null` = NÃO MEXER no status. O Google já
 * acrescentou estados novos antes e vai acrescentar de novo; um `else` que
 * cancelasse cortaria cliente pagante no dia em que aparecesse um estado novo.
 *
 * ⚠️ A página de referência do `subscriptionsv2.get` que eu consultei em
 * 2026-08-03 **não enumera** os valores deste enum (mostra só
 * `SUBSCRIPTION_STATE_ACTIVE` como exemplo). Os nomes abaixo vêm da referência
 * de `SubscriptionState`. Se algum estiver escrito errado, o efeito é cair no
 * `default` — conservador de propósito, mas vale conferir no primeiro teste
 * real, lendo o `subscriptionState` bruto que esta função devolve.
 */
function traduzirEstado(estado: string): { status: StatusLicenca | null; pendente: boolean } {
  switch (estado) {
    case "SUBSCRIPTION_STATE_ACTIVE":
      return { status: "ativa", pendente: false };

    // Pagamento falhou e o Google está TENTANDO DE NOVO. O cliente mantém
    // acesso durante a carência — por isso 'ativa', não 'suspensa'.
    case "SUBSCRIPTION_STATE_IN_GRACE_PERIOD":
      return { status: "ativa", pendente: false };

    // "Não renove". A data continua valendo. NÃO é corte.
    case "SUBSCRIPTION_STATE_CANCELED":
      return { status: "ativa", pendente: false };

    // Sem acesso, mas pode voltar.
    case "SUBSCRIPTION_STATE_ON_HOLD":
    case "SUBSCRIPTION_STATE_PAUSED":
      return { status: "suspensa", pendente: false };

    // Acabou de verdade.
    case "SUBSCRIPTION_STATE_EXPIRED":
      return { status: "cancelada", pendente: false };

    // Boleto/lotérica: o Google confirma dias depois. Não conceder.
    case "SUBSCRIPTION_STATE_PENDING":
    case "SUBSCRIPTION_STATE_PENDING_PURCHASE_CANCELED":
      return { status: null, pendente: true };

    default:
      return { status: null, pendente: false };
  }
}

/**
 * Pergunta ao Google o que é esta compra.
 *
 * @returns `null` quando o Google diz que o token não existe (404) — comprovante
 *          forjado ou de outro app.
 * @throws  em falha de rede/permissão. O chamador deve responder 5xx para o app
 *          tentar de novo, e NUNCA conceder.
 */
export async function consultarAssinatura(
  purchaseToken: string
): Promise<AssinaturaPlay | null> {
  const token = await getAccessToken();
  const url =
    `${BASE_API}/applications/${PACKAGE_NAME}` +
    `/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    // Sem cache: estamos perguntando o estado ATUAL de uma cobrança.
    cache: "no-store",
  });

  if (res.status === 404 || res.status === 410) return null;

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`subscriptionsv2.get falhou: ${res.status} ${txt.slice(0, 300)}`);
  }

  const d = await res.json();

  // A assinatura pode ter mais de um item em bundle. Não usamos bundle — se
  // vier mais de um, é sinal de que a configuração mudou sem ninguém saber.
  const itens = Array.isArray(d.lineItems) ? d.lineItems : [];
  if (itens.length === 0) {
    throw new Error("subscriptionsv2.get devolveu assinatura sem lineItems");
  }
  const item = itens[0];

  const basePlanId = item?.offerDetails?.basePlanId;
  const expiryTime = item?.expiryTime;

  const { status, pendente } = traduzirEstado(String(d.subscriptionState ?? ""));

  // Numa compra pendente o Google ainda não emite validade — e é justamente por
  // isso que não se concede nada. Barrar aqui evita que o endpoint chame a
  // função do banco com data nula e receba um erro que parece bug.
  if (!pendente && (!basePlanId || !expiryTime)) {
    throw new Error(
      `resposta do Google sem basePlanId ou expiryTime (estado=${d.subscriptionState})`
    );
  }

  // O Google manda dinheiro como `units` (parte inteira, string) + `nanos`
  // (bilionésimos). R$ 14,90 = units "14", nanos 900000000. Nunca é float na
  // resposta — de propósito, pra não perder centavo em arredondamento.
  const rp = item?.autoRenewingPlan?.recurringPrice;
  let precoRecorrente: number | null = null;
  if (rp && (rp.units != null || rp.nanos != null)) {
    const total = Number(rp.units ?? 0) + Number(rp.nanos ?? 0) / 1_000_000_000;
    precoRecorrente = Number.isFinite(total) && total > 0 ? total : null;
  }

  return {
    subscriptionState: String(d.subscriptionState ?? ""),
    status,
    basePlanId: basePlanId ?? "",
    offerId: item?.offerDetails?.offerId ?? null,
    expiryTime: expiryTime ?? "",
    autoRenewing: Boolean(item?.autoRenewingPlan?.autoRenewEnabled),
    linkedPurchaseToken: d.linkedPurchaseToken ?? null,
    jaConfirmada: d.acknowledgementState === "ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED",
    ehTeste: Boolean(d.testPurchase),
    pendente,
    precoRecorrente,
    moeda: rp?.currencyCode ?? null,
  };
}

// ------------------------------------------------------------
// Do plano base para (tier, plano, quantidade)
// ------------------------------------------------------------

export type Tier = "pro" | "mega" | "ultra";

/** ADR-021: aparelhos AO MESMO TEMPO de cada nível. Fonte única com a tela (app/lib/precos.ts) e o CASE do sql/10. */
export const APARELHOS_DO_TIER: Record<Tier, number> = APARELHOS_DO_NIVEL;

export interface PlanoDecomposto {
  tier: Tier;
  plano: "mensal" | "semestral" | "anual";
  /** Planos NOVOS: aparelhos simultâneos (3/6/10). Planos ANTIGOS: quantidade de chaves. */
  qtdChaves: number;
  /** true = plano base novo `{tier}-{duracao}` (1 assinatura com N aparelhos); false = antigo `{tier}-{duracao}-{qtd}`. */
  novo: boolean;
}

/**
 * Decompõe o plano base do Google:
 *   NOVO   (ADR-021, 2026-10-11): `pro-mensal` → `{tier:'pro', plano:'mensal', qtdChaves:3, novo:true}`
 *   ANTIGO (assinaturas que já existem): `pro-mensal-1` → `{tier:'pro', plano:'mensal', qtdChaves:1, novo:false}`
 *
 * ⚠️ O formato não é convenção decorativa: a trava `play_subs_plano_coerente`
 * (sql/10) aceita exatamente esses dois formatos — no novo, a quantidade tem de
 * ser a do nível (3/6/10). Se o Console tiver um plano base fora do padrão, esta
 * função devolve `null` e o endpoint RECUSA a compra — de propósito. Conceder um
 * plano que o banco não reconhece é pior do que recusar: recusar dá erro visível
 * e reembolso automático em 3 dias; conceder errado é silencioso.
 *
 * O conserto, se isso acontecer, é renomear o plano base no Console (ou criar
 * um novo seguindo o padrão), **não** afrouxar esta função.
 */
export function decomporBasePlanId(basePlanId: string): PlanoDecomposto | null {
  const novo = /^(pro|mega|ultra)-(mensal|semestral|anual)$/.exec(basePlanId);
  if (novo) {
    const tier = novo[1] as Tier;
    return { tier, plano: novo[2] as PlanoDecomposto["plano"], qtdChaves: APARELHOS_DO_TIER[tier], novo: true };
  }
  const m = /^(pro|ultra)-(mensal|semestral|anual)-(10|[1-9])$/.exec(basePlanId);
  if (!m) return null;
  const qtd = Number(m[3]);
  // O mesmo teto da CHECK da tabela (BETWEEN 1 AND 10).
  if (!Number.isInteger(qtd) || qtd < 1 || qtd > 10) return null;
  return {
    tier: m[1] as Tier,
    plano: m[2] as PlanoDecomposto["plano"],
    qtdChaves: qtd,
    novo: false,
  };
}

// ------------------------------------------------------------
// Compra AVULSA (produto de compra única) — Macros Forjados, uma DG por produto (ADR-MF-XCROSS-020)
// ------------------------------------------------------------

export interface CompraAvulsa {
  /** 0 = comprada · 1 = cancelada · 2 = pendente (boleto/lotérica). */
  estado: number;
  orderId: string | null;
  /** Já confirmada pelo app (acknowledge)? */
  confirmada: boolean;
  /** Hash da conta MacroForge que o app mandou na compra (setObfuscatedAccountId). */
  contaOfuscada: string | null;
  ehTeste: boolean;
}

/**
 * Pergunta ao Google o que é esta compra avulsa (`purchases.products.get`).
 *
 * @returns `null` quando o Google diz que o token não existe para este produto (404/410).
 * @throws  em falha de rede/permissão — o chamador responde 5xx e NUNCA concede.
 */
export async function consultarCompraAvulsa(productId: string, purchaseToken: string): Promise<CompraAvulsa | null> {
  const token = await getAccessToken();
  const url =
    `${BASE_API}/applications/${PACKAGE_NAME}/purchases/products/` +
    `${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  // 400 = token malformado ou de outro produto (o Google responde "Invalid Value"): comprovante que não existe, não
  // falha do servidor.
  if (res.status === 400 || res.status === 404 || res.status === 410) return null;
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`products.get falhou: ${res.status} ${txt.slice(0, 300)}`);
  }
  const d = await res.json();
  // Defesa extra: o Google já recusa token de outro produto (400), mas se a resposta disser outro produto, não vale.
  if (typeof d.productId === "string" && d.productId !== productId) return null;
  return {
    estado: Number(d.purchaseState ?? -1),
    orderId: typeof d.orderId === "string" ? d.orderId : null,
    confirmada: Number(d.acknowledgementState ?? 0) === 1,
    contaOfuscada: typeof d.obfuscatedExternalAccountId === "string" ? d.obfuscatedExternalAccountId : null,
    ehTeste: Number(d.purchaseType ?? -1) === 0,
  };
}

// ------------------------------------------------------------
// Compras anuladas (reembolso / chargeback)
// ------------------------------------------------------------

/** 0..8 conforme a referência REST do VoidedPurchase. Conferido na doc em 2026-08-10. */
export const MOTIVO_ANULACAO: Record<number, string> = {
  0: "outro",
  1: "arrependimento",
  2: "nao recebido",
  3: "defeito",
  4: "compra acidental",
  5: "fraude",
  6: "fraude amigavel",
  7: "chargeback",
  8: "compra nao confirmada",
};

/** 0 = usuário pediu · 1 = você (Play Console) · 2 = Google decidiu. */
export const ORIGEM_ANULACAO: Record<number, string> = {
  0: "usuario",
  1: "desenvolvedor",
  2: "google",
};

export interface CompraAnulada {
  /** ⚠️ NÃO é único: renovações de assinatura repetem o mesmo token (doc oficial). */
  purchaseToken: string;
  /** Único por transação. É este que serve de chave de dedupe, não o token. */
  orderId: string;
  /** Ver MOTIVO_ANULACAO. */
  motivo: number;
  motivoTexto: string;
  /** Ver ORIGEM_ANULACAO. */
  origem: number;
  /**
   * Presente SÓ em reembolso parcial por quantidade. `undefined` = anulação TOTAL.
   *
   * Na prática não deve aparecer aqui: (a) essas linhas só vêm se a chamada pedir
   * `includeQuantityBasedPartialRefund=true`, o que não fazemos; e (b) os planos de 3 e 5
   * chaves do MacroForge são planos base SEPARADOS, não compra de quantidade 3. Fica tratado
   * mesmo assim — campo que "não deve aparecer" é o que aparece em produção.
   */
  quantidadeAnulada?: number;
  anuladaEm: string;
}

/**
 * Lista reembolsos e chargebacks.
 *
 * <p>É o substituto do Pub/Sub para o único caso em que a ausência dele
 * realmente machuca: reembolso. Sem isto, quem pega o dinheiro de volta
 * continua usando até a data vencer — até um ANO no plano anual, porque a
 * compra reembolsada desaparece da lista do app e ele para de reenviá-la.
 *
 * <p>Pensado para rodar uma vez por dia (ISSUE-MF-129 / cron da Vercel).
 * Assim o pior caso cai de "um ano" para "24 horas".
 *
 * 🔴 CORRIGIDO EM 2026-08-10. O mapeamento anterior era:
 *
 *     refundType: Number(v.voidedReason ?? 1)   // comentado como "1 = total · 2 = parcial"
 *
 * **`voidedReason` é o MOTIVO, não o tipo.** Os valores reais são 0..8 (arrependimento,
 * fraude, chargeback...). Quem fosse cortar acesso só quando `refundType === 1` cortaria
 * apenas em **arrependimento** e deixaria passar **fraude, chargeback, defeito e compra
 * acidental** — os casos que mais doem. O buraco continuaria aberto com aparência de fechado.
 *
 * O que de fato distingue parcial de total é `voidedQuantity`, e essas linhas só vêm se a
 * chamada pedir `includeQuantityBasedPartialRefund=true` — o que NÃO fazemos. Portanto tudo
 * que esta função devolve já é anulação TOTAL, e o chamador deve cortar em todas.
 *
 * @param desde momento a partir do qual buscar. O Google guarda 30 dias.
 */
export async function listarComprasAnuladas(desde: Date): Promise<CompraAnulada[]> {
  const token = await getAccessToken();
  const lista: Record<string, unknown>[] = [];
  // Paginado: o Google devolve até 1000 por página e um `nextPageToken` quando há mais (antes só a 1ª página era lida).
  let pagina: string | null = null;
  for (let i = 0; i < 20; i++) {
    const url: string =
      `${BASE_API}/applications/${PACKAGE_NAME}/purchases/voidedpurchases` +
      `?startTime=${desde.getTime()}&type=1&maxResults=1000` + // type=1 inclui assinaturas
      (pagina ? `&token=${encodeURIComponent(pagina)}` : "");

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`voidedpurchases.list falhou: ${res.status} ${txt.slice(0, 300)}`);
    }
    const d = await res.json();
    if (Array.isArray(d.voidedPurchases)) lista.push(...d.voidedPurchases);
    pagina = typeof d.tokenPagination?.nextPageToken === "string" ? d.tokenPagination.nextPageToken : null;
    if (!pagina) break;
  }

  return lista.map((v: Record<string, unknown>) => {
    const motivo = Number(v.voidedReason ?? 0);
    // `voidedQuantity` ausente = anulação total. Só converte quando o campo existe de fato —
    // `Number(undefined)` daria NaN e um NaN aqui viraria "parcial" por acidente.
    const q = v.voidedQuantity === undefined || v.voidedQuantity === null
      ? undefined
      : Number(v.voidedQuantity);

    return {
      purchaseToken: String(v.purchaseToken ?? ""),
      orderId: String(v.orderId ?? ""),
      motivo,
      motivoTexto: MOTIVO_ANULACAO[motivo] ?? `desconhecido(${motivo})`,
      origem: Number(v.voidedSource ?? 0),
      quantidadeAnulada: q,
      anuladaEm: new Date(Number(v.voidedTimeMillis ?? 0)).toISOString(),
    };
  });
}
