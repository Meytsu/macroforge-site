// FONTE ÚNICA DE PREÇO DO SITE — espelha o Google Play (2026-08-09).
//
// POR QUE ESTE ARQUIVO EXISTE
// Até hoje o site tinha DUAS tabelas independentes: uma em `/planos/page.tsx` (o que a pessoa
// vê) e outra em `/api/checkout/route.ts` (o que ela paga). Nenhuma das duas era o Play. As
// três divergiam em 6 das 9 combinações — e em duas delas **o site cobrava MAIS CARO que o
// app pelo mesmo produto**:
//
//     mensal 5      Play 41,90   site cobrava 42,10   (+0,20)
//     semestral 3   Play 128,90  site cobrava 129,33  (+0,43)
//
// A causa não era erro de digitação: o site CALCULAVA `preço de 1 chave × qtd × (1−desconto)`
// com escada de 10%/15%, e o Play tem valores redondos definidos um a um. Duas formas de
// chegar num número nunca chegam no mesmo número.
//
// Agora é tabela, não conta. Preço virou DADO, copiado do Play, e a tela e a cobrança leem a
// mesma função — divergência entre o que se vê e o que se paga deixa de ser possível.
//
// ⚠️ AO MUDAR PREÇO: mude no Play Console E aqui. Os dois canais são independentes; o site
// não consulta a API do Google. Confira com:
//   node verificar-ofertas-play.js <caminho-da-chave.json>

export type PlanoId = "mensal" | "semestral" | "anual";

export const MESES: Record<PlanoId, number> = { mensal: 1, semestral: 6, anual: 12 };
export const DIAS: Record<PlanoId, number> = { mensal: 30, semestral: 180, anual: 365 };

export const NOME_PLANO: Record<PlanoId, string> = {
  mensal: "MacroForge — Mensal",
  semestral: "MacroForge — Semestral",
  anual: "MacroForge — Anual",
};

/**
 * Interruptor da promoção de lançamento.
 *
 * No Play a promoção é uma OFERTA com prazo (3 ciclos no mensal, 1 ciclo no semestral e no
 * anual) e o Google a encerra sozinho. O site não tem esse mecanismo — quem encerra é você,
 * trocando isto para `false`.
 *
 * 🔴 Enquanto isso não for feito no mesmo dia em que a oferta expirar no Play, os dois canais
 * cobram valores diferentes pelo mesmo produto. Era exatamente o que ia acontecer antes desta
 * refatoração, com o agravante de que ninguém perceberia: o site não tinha nem o conceito de
 * preço regular.
 */
export const PROMO_LANCAMENTO_ATIVA = true;

/**
 * Interruptor da VENDA PELO SITE (Mercado Pago). `false` = o site não cobra ninguém.
 *
 * 🔴 DESLIGADO EM 2026-08-10, decisão dele, na abertura do teste aberto.
 *
 * O motivo é que os dois canais de pagamento são **independentes** e estão em estados muito
 * diferentes:
 *
 * ```
 * app   -> Google Play Billing -> /api/play-purchase-verify   testado, 1ª compra funcionou
 * site  -> Mercado Pago        -> /api/webhook                 0 vendas na história, 2 defeitos
 * ```
 *
 * Os dois defeitos abertos do webhook (um pagamento virando N licenças, e cliente pagando sem
 * receber chave porque a rota responde 200 e o Mercado Pago para de reenviar) nunca foram
 * exercitados por dinheiro real. Deixar o botão de comprar exposto no site seria **risco sem
 * upside**: o app dá conta da venda, e o site não precisa cobrar ninguém agora.
 *
 * ⚠️ NÃO basta esconder o link de `/planos`. A URL continuaria viva e um POST direto no
 * `/api/checkout` continuaria criando preferência no Mercado Pago. Por isso o interruptor é
 * checado nos DOIS lugares — a tela e a rota.
 *
 * Religar quando os dois defeitos do webhook estiverem corrigidos E houver uma compra real de
 * ponta a ponta feita com sucesso.
 *
 * 🔴 ADR-021 (2026-10-11): o fluxo do Mercado Pago ainda vende CHAVES por quantidade (modelo antigo). Antes de
 * religar, ele precisa vender Pro/Mega/Ultra (uma assinatura com `nivel` e `max_dispositivos`), senão o site volta
 * a vender um produto que o app novo não usa.
 */
export const VENDA_PELO_SITE_ATIVA = false;

/** Ficha do app na Play Store — pra onde mandar quem chega em /planos com a venda desligada. */
export const URL_PLAY_STORE =
  "https://play.google.com/store/apps/details?id=com.henrique.macroforge";

/**
 * Preços do Play, em reais, por (plano, quantidade de chaves).
 *
 * Conferido direto na API em **2026-08-10** com `scratchpad/auditar-precos-play.js`.
 *
 * 🔴 Os três valores de 5 chaves MUDARAM nesse dia (41,90 → 39,90 · 203,90 → 191,90 ·
 * 339,90 → 319,90). Motivo: a escada de volume discordava entre os dois momentos —
 * **15% na promoção contra 20% no regular** —, então o desconto mudava de forma no dia em que
 * a oferta expirasse. Pior: a promoção era menos generosa justamente com quem compra mais
 * (desconto total de 29,2% no anual de 5 chaves contra 33,4% no de 1).
 *
 * Decisão do Henrique: **10% em 3 chaves, 20% em 5**, nos dois momentos. Depois do ajuste as
 * 6 escadas ficaram coerentes e o desconto total do lançamento ficou uniforme em ~33%.
 */
const TABELA: Record<PlanoId, Record<number, { regular: number; lancamento: number }>> = {
  mensal: {
    1: { regular: 14.9, lancamento: 9.9 },
    3: { regular: 39.9, lancamento: 26.9 },
    5: { regular: 59.9, lancamento: 39.9 },
  },
  semestral: {
    1: { regular: 72.9, lancamento: 47.9 },
    3: { regular: 196.9, lancamento: 128.9 },
    5: { regular: 291.9, lancamento: 191.9 },
  },
  anual: {
    1: { regular: 119.9, lancamento: 79.9 },
    3: { regular: 323.9, lancamento: 215.9 },
    5: { regular: 479.9, lancamento: 319.9 },
  },
};

/**
 * As ÚNICAS quantidades vendáveis — as mesmas três do app.
 *
 * 🔴 ESPELHAMENTO DECIDIDO EM 2026-08-10, e isto **revoga o campo livre do
 * ADR-MF-XCROSS-012** ("3 fixos + campo livre, teto 30%").
 *
 * Antes o site vendia de 1 a 25, com escada própria (25% em 10+, 30% em 20+) e faixas
 * intermediárias herdando o preço por chave da faixa de baixo. O app vende só 1, 3 e 5.
 *
 * O que isso resolvia e o que custava:
 *
 * ```
 * 19 chaves no anual   R$ 1.138,57
 * 20 chaves no anual   R$ 1.118,59   <- MENOS por MAIS chaves
 * ```
 *
 * Medido: o degrau invertido acontecia em **exatamente uma quantidade**, a 19 — matemática, não
 * coincidência: com 25% até 19 e 30% a partir de 20, a inversão só existe acima de 18,67 chaves.
 * O salto de 5 pontos valia R$ 79,90 no anual e a 20ª chave custava R$ 59,93.
 *
 * Dava pra remendar com uma trava de teto. Ele preferiu **espelhar o app**, e isso resolve mais
 * do que o degrau: acabam os preços CALCULADOS. Sobram só os 9 valores da tabela do Play, e
 * divergência entre canais deixa de ser possível porque não existe mais conta nenhuma.
 *
 * ⚠️ O que se perdeu: venda de 10 ou 20 chaves numa transação. Quem quiser 10 compra o pacote
 * de 5 duas vezes (20% em cada, contra 25% numa só). Efeito colateral que ninguém havia notado:
 * o campo livre já era uma vantagem que existia no site e NÃO existia no app.
 */
export const QUANTIDADES = [1, 3, 5] as const;
export type Quantidade = (typeof QUANTIDADES)[number];

export function ehQuantidadeValida(v: unknown): v is Quantidade {
  return v === 1 || v === 3 || v === 5;
}

/** Maior quantidade vendável. Mantido pelo nome antigo pra não quebrar quem importa. */
export const MAX_CHAVES = 5;

function valorTabela(plano: PlanoId, faixa: 1 | 3 | 5): number {
  const p = TABELA[plano][faixa];
  return PROMO_LANCAMENTO_ATIVA ? p.lancamento : p.regular;
}

/** Arredonda para centavos UMA única vez, no fim. Duas arredondadas em série é como o site
 *  chegava a 42,10 onde o Play cobra 41,90. */
function centavos(v: number): number {
  return Math.round(v * 100) / 100;
}

/**
 * Normaliza a quantidade para uma das três vendáveis.
 *
 * Cai para a MENOR faixa quando vem lixo, nunca para a maior: se um valor inesperado chegar,
 * o pior caso é vender uma chave em vez de cinco — erro de menos, não de mais. O `/api/checkout`
 * não depende disto: lá a quantidade inválida é **recusada**, não normalizada.
 */
function faixa(qtd: number): Quantidade {
  const q = Math.floor(qtd);
  return q >= 5 ? 5 : q >= 3 ? 3 : 1;
}

/**
 * Preço TOTAL da compra, em reais. É o número que o cliente vê e o número que ele paga —
 * a tela e o checkout chamam esta mesma função.
 *
 * Depois do espelhamento não há mais CONTA aqui: é consulta na tabela do Play. Foi assim que
 * "o preço da tela difere do cobrado" deixou de ser um risco a administrar.
 */
export function precoTotal(plano: PlanoId, qtd: number): number {
  return valorTabela(plano, faixa(qtd));
}

/** Preço por chave, só para exibição. Nunca use isto para cobrar — cobre `precoTotal`. */
export function precoPorChave(plano: PlanoId, qtd: number): number {
  const q = faixa(qtd);
  return centavos(precoTotal(plano, q) / q);
}

/** Quanto o cliente economiza no volume: N chaves avulsas menos o preço real da compra. */
export function economiaVolume(plano: PlanoId, qtd: number): number {
  const q = faixa(qtd);
  return centavos(valorTabela(plano, 1) * q - precoTotal(plano, q));
}

/**
 * Desconto de volume REAL, em %, derivado dos preços — não uma constante escrita à mão.
 *
 * A escada antiga dizia "15%" para 5 chaves, mas o Play pratica 15,4% no lançamento e 19,6%
 * no regular. Um número escrito à mão numa tela envelhece calado; derivado do preço, não.
 * FLOOR de propósito: nunca anunciar desconto maior que o real (CDC art. 37).
 */
export function descontoVolumePct(plano: PlanoId, qtd: number): number {
  const q = faixa(qtd);
  const cheio = valorTabela(plano, 1) * q;
  if (cheio <= 0) return 0;
  return Math.floor((1 - precoTotal(plano, q) / cheio) * 100);
}

/**
 * Preço de referência para o valor riscado: o que custaria pagando MENSAL avulso pelo mesmo
 * período e a mesma quantidade.
 *
 * ⚠️ Usa o preço mensal VIGENTE (promocional se a promo estiver ativa, regular se não). É a
 * mesma escolha feita no app, e ela é conservadora: com a promo ativa a âncora fica menor, e
 * o desconto anunciado sai MENOR que o real — nunca maior. Ver ISSUE-MF-139.
 */
export function equivalenteMensal(plano: PlanoId, qtd: number): number {
  return centavos(precoTotal("mensal", qtd) * MESES[plano]);
}

/** Economia da assinatura longa vs pagar mensal. FLOOR pelo mesmo motivo do CDC. */
export function economiaPeriodoPct(plano: PlanoId, qtd: number): number {
  if (plano === "mensal") return 0;
  const ref = equivalenteMensal(plano, qtd);
  if (ref <= 0) return 0;
  return Math.max(0, Math.floor((1 - precoTotal(plano, qtd) / ref) * 100));
}

export function ehPlanoValido(v: unknown): v is PlanoId {
  return v === "mensal" || v === "semestral" || v === "anual";
}

// =====================================================================================================================
// PLANOS POR APARELHOS SIMULTÂNEOS (ADR-MF-XCROSS-021, preço = cenário B, decidido em 2026-10-10)
// =====================================================================================================================
// O plano é da CONTA: Pro/Mega/Ultra = 3/6/10 aparelhos usando AO MESMO TEMPO. Vendido só pelo app (Google Play);
// o site só MOSTRA. A tabela acima (por quantidade de chaves) fica para o /api/checkout antigo, que está desligado.
//
// Regra que gerou os números (a mesma de agosto): semestral = mensal×6 −18,5%; anual = mensal×12 −33% (,90 mais
// próximo); lançamento = regular×2/3 (,90 para baixo).
//
// ⚠️ AO MUDAR PREÇO: mude no Play Console (planos base `{nivel}-{duracao}`) E aqui.

export type NivelId = "pro" | "mega" | "ultra";

export const NIVEIS: readonly NivelId[] = ["pro", "mega", "ultra"];

export const APARELHOS_DO_NIVEL: Record<NivelId, number> = { pro: 3, mega: 6, ultra: 10 };

export const NOME_NIVEL: Record<NivelId | "trial", string> = {
  pro: "Pro", mega: "Mega", ultra: "Ultra", trial: "Teste grátis",
};

const TABELA_NIVEIS: Record<NivelId, Record<PlanoId, { regular: number; lancamento: number }>> = {
  pro: {
    mensal:    { regular: 22.9,  lancamento: 14.9 },
    semestral: { regular: 111.9, lancamento: 73.9 },
    anual:     { regular: 183.9, lancamento: 121.9 },
  },
  mega: {
    mensal:    { regular: 34.9,  lancamento: 22.9 },
    semestral: { regular: 170.9, lancamento: 113.9 },
    anual:     { regular: 280.9, lancamento: 186.9 },
  },
  ultra: {
    mensal:    { regular: 44.9,  lancamento: 29.9 },
    semestral: { regular: 219.9, lancamento: 145.9 },
    anual:     { regular: 360.9, lancamento: 239.9 },
  },
};

/** Preço vigente do plano (o de lançamento enquanto PROMO_LANCAMENTO_ATIVA). */
export function precoNivel(nivel: NivelId, duracao: PlanoId): number {
  const p = TABELA_NIVEIS[nivel][duracao];
  return PROMO_LANCAMENTO_ATIVA ? p.lancamento : p.regular;
}

/** Preço regular (o riscado). Igual ao vigente quando a promoção acaba. */
export function precoNivelRegular(nivel: NivelId, duracao: PlanoId): number {
  return TABELA_NIVEIS[nivel][duracao].regular;
}

export function ehNivelValido(v: unknown): v is NivelId {
  return v === "pro" || v === "mega" || v === "ultra";
}
