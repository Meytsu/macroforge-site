// FONTE ÚNICA DE PREÇO DO SITE — espelha o Google Play.
//
// ADR-MF-XCROSS-022 (2026-11-22): SÓ MENSAL, e tudo incluído em qualquer plano (todas as DGs + TG + Coleção + Loja de
// DP, no app e no PC). O plano só muda a quantidade de aparelhos do app; todo plano inclui também 1 PC.
//
//     Pro    3 aparelhos + 1 PC   R$ 29,90/mês
//     Mega   6 aparelhos + 1 PC   R$ 39,90/mês
//     Ultra 10 aparelhos + 1 PC   R$ 49,90/mês
//
// Preço cheio, SEM promoção de lançamento por cima (os 14,90/22,90/29,90 da XCROSS-021 deixaram de valer).
//
// HISTÓRICO (o que saiu daqui em 2026-11-22, para não voltar por engano)
//   - A tabela de CHAVES por quantidade (1/3/5 × mensal/semestral/anual) do modelo antigo. Ela existia para o
//     /api/checkout antigo, que vendia N chaves `MF-XXXX` por e-mail. O app e o PC usam o PLANO DA CONTA
//     (`licencas.nivel` + `max_dispositivos`), então o site vende o plano.
//   - Semestral e anual (ADR-022: só mensal).
//   - O interruptor PROMO_LANCAMENTO_ATIVA (não há mais promoção nesta tabela).
//   Em agosto o site chegou a ter DUAS tabelas (tela e cobrança) que divergiam em 6 de 9 combinações. Por isso a tela
//   (/planos, landing) e a cobrança (/api/checkout e a conferência do /api/webhook) leem a MESMA função `precoNivel`.
//
// ⚠️ AO MUDAR PREÇO: mude no Play Console (planos base `{nivel}-mensal`) E aqui.

/**
 * Interruptor da VENDA PELO SITE (Mercado Pago). `false` = o site não cobra ninguém.
 *
 * 🔴 DESLIGADO desde 2026-08-10. Checado nos DOIS lugares — a tela /planos e a rota /api/checkout — porque esconder
 * o botão não basta: um POST direto na rota criaria preferência no Mercado Pago.
 *
 * 2026-11-22 (ISSUE-MF-156): o checkout e o webhook foram reescritos para vender Pro/Mega/Ultra (uma concessão
 * atômica e idempotente no banco, `mf_conceder_mercado_pago` do sql/15; erro de gravação → 500 para o Mercado Pago
 * reenviar). ANTES de trocar para `true`:
 *   1. aplicar o sql/15 no Supabase (aprovação do Henrique);
 *   2. testar com usuários de teste do Mercado Pago (sem dinheiro), inclusive PIX, mesmo plano (soma 30 dias) e
 *      plano diferente (fila);
 *   3. uma compra real de ponta a ponta (Pro mensal) — e conferir a licença e o e-mail.
 */
export const VENDA_PELO_SITE_ATIVA = false;

/** Ficha do app na Play Store — pra onde mandar quem chega em /planos com a venda desligada. */
export const URL_PLAY_STORE =
  "https://play.google.com/store/apps/details?id=com.henrique.macroforge";

export type NivelId = "pro" | "mega" | "ultra";

export const NIVEIS: readonly NivelId[] = ["pro", "mega", "ultra"];

/** Aparelhos do app usando AO MESMO TEMPO. O mesmo CASE do sql/10 e do sql/15. Todo plano tem também 1 PC. */
export const APARELHOS_DO_NIVEL: Record<NivelId, number> = { pro: 3, mega: 6, ultra: 10 };

/** Computadores com o MacroForge PC (1 por vez) — igual em todos os planos. */
export const PCS_POR_PLANO = 1;

/** Dias que uma compra pelo site concede (o mesmo intervalo do sql/15). */
export const DIAS_DO_PLANO = 30;

export const NOME_NIVEL: Record<NivelId | "trial", string> = {
  pro: "Pro", mega: "Mega", ultra: "Ultra", trial: "Teste grátis",
};

/** Preço mensal, em reais. Tabela, não conta. */
const PRECO_MENSAL: Record<NivelId, number> = { pro: 29.9, mega: 39.9, ultra: 49.9 };

/** Preço vigente do plano mensal. É o número que a tela mostra, o checkout cobra e o webhook confere. */
export function precoNivel(nivel: NivelId): number {
  return PRECO_MENSAL[nivel];
}

export function ehNivelValido(v: unknown): v is NivelId {
  return v === "pro" || v === "mega" || v === "ultra";
}

/** "29,90" — formato de exibição em reais (sem o "R$"). */
export function formatarPreco(v: number): string {
  return v.toFixed(2).replace(".", ",");
}
