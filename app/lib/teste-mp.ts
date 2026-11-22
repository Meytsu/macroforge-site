// Teste controlado do Mercado Pago (ISSUE-MF-156, 2026-11-22) — SÓ no servidor (lê process.env).
//
// Com a venda desligada, só os e-mails da variável MP_TESTE_EMAILS (painel da Vercel; nunca no código — o repo é
// público) podem comprar, e por PRECO_TESTE em vez do preço do plano (Henrique: "diminuir o valor para 1 real só para
// eu não perder muito na taxa"). O /api/checkout cobra este preço e o /api/webhook aceita este valor — para os OUTROS
// e-mails nada muda. Depois do teste: apagar MP_TESTE_EMAILS na Vercel (sem ela, tudo isto desliga sozinho).

export const PRECO_TESTE = 1.0;

export function emailsTeste(): string[] {
  return (process.env.MP_TESTE_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function ehEmailTeste(email: string | null | undefined): boolean {
  return !!email && emailsTeste().includes(email.trim().toLowerCase());
}
