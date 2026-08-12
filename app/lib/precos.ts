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

/** Preços do Play, em reais, por (plano, quantidade de chaves). Conferido em 2026-08-09. */
const TABELA: Record<PlanoId, Record<number, { regular: number; lancamento: number }>> = {
  mensal: {
    1: { regular: 14.9, lancamento: 9.9 },
    3: { regular: 39.9, lancamento: 26.9 },
    5: { regular: 59.9, lancamento: 41.9 },
  },
  semestral: {
    1: { regular: 72.9, lancamento: 47.9 },
    3: { regular: 196.9, lancamento: 128.9 },
    5: { regular: 291.9, lancamento: 203.9 },
  },
  anual: {
    1: { regular: 119.9, lancamento: 79.9 },
    3: { regular: 323.9, lancamento: 215.9 },
    5: { regular: 479.9, lancamento: 339.9 },
  },
};

/**
 * Quantidades acima de 5 são EXCLUSIVAS DO SITE — o Play só vende 1, 3 e 5.
 *
 * Não dá pra copiar do Play o que não existe lá, então aqui vale a escada do
 * ADR-MF-XCROSS-012 (3 fixos + campo livre, teto de 30%), aplicada sobre o preço de UMA chave.
 * Abaixo de 10, o preço por chave vem da faixa da tabela imediatamente inferior — assim 1, 3 e
 * 5 batem no centavo com o Play, e o resto cresce sem degrau invertido.
 */
const EXTRA_VOLUME: Array<{ min: number; desconto: number }> = [
  { min: 20, desconto: 0.3 },
  { min: 10, desconto: 0.25 },
];

/** Teto de chaves numa compra pelo site. */
export const MAX_CHAVES = 25;

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
 * Preço TOTAL da compra, em reais. É o número que o cliente vê e o número que ele paga —
 * a tela e o checkout chamam esta mesma função.
 */
export function precoTotal(plano: PlanoId, qtd: number): number {
  const q = Math.max(1, Math.min(MAX_CHAVES, Math.floor(qtd) || 1));

  // 1, 3 e 5: valor EXATO do Play. Sem conta, sem arredondamento, sem divergência.
  if (q === 1 || q === 3 || q === 5) return valorTabela(plano, q);

  const extra = EXTRA_VOLUME.find(f => q >= f.min);
  if (extra) {
    // 10+ e 20+: escada do site, sobre o preço de uma chave.
    return centavos(valorTabela(plano, 1) * q * (1 - extra.desconto));
  }

  // 2, 4, 6..9: usa o preço POR CHAVE da faixa imediatamente inferior. Garante que comprar
  // uma chave a mais nunca fique mais barato que a faixa cheia logo abaixo.
  const faixa: 1 | 3 | 5 = q >= 6 ? 5 : q >= 4 ? 3 : 1;
  return centavos((valorTabela(plano, faixa) / faixa) * q);
}

/** Preço por chave, só para exibição. Nunca use isto para cobrar — cobre `precoTotal`. */
export function precoPorChave(plano: PlanoId, qtd: number): number {
  const q = Math.max(1, Math.min(MAX_CHAVES, Math.floor(qtd) || 1));
  return centavos(precoTotal(plano, q) / q);
}

/** Quanto o cliente economiza no volume: N chaves avulsas menos o preço real da compra. */
export function economiaVolume(plano: PlanoId, qtd: number): number {
  const q = Math.max(1, Math.min(MAX_CHAVES, Math.floor(qtd) || 1));
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
  const q = Math.max(1, Math.min(MAX_CHAVES, Math.floor(qtd) || 1));
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
