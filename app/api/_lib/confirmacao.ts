// Confirmação de e-mail no cadastro (ISSUE-MF-133).
//
// POR QUE ISTO EXISTE
// O firewall da Vercel barra quem insiste, mas não apaga nada: o que entrar, fica. Limite
// por IP é contornável com proxy rotativo. A única defesa que ataca a raiz é a linha não
// PERSISTIR — conta sem e-mail confirmado é apagada em 48 h (`mf_faxina_nao_confirmados`).
//
// Vive aqui, e não dentro do /api/registro, porque o reenvio de código precisa exatamente
// do mesmo trabalho. Duas cópias divergiriam no primeiro ajuste de prazo ou de texto.
import { Resend } from "resend";
import { randomInt, randomBytes } from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://macroforge.com.br";

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

// Mesmo alfabeto do código de recuperação: 32 caracteres, sem I/O/0/1 pra ninguém errar
// lendo da tela. 8 posições ≈ 1,1 trilhão de combinações.
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// TEM QUE BATER com o prazo da faxina (`mf_faxina_nao_confirmados`, hoje 120 h). Os dois
// prazos são a mesma promessa vista de dois lados: "você tem X pra confirmar".
//
// 🔴 Já divergiu uma vez, em 2026-08-09: aqui estava 48 h e a faxina subiu pra 120 h por
// causa do boleto (ISSUE-MF-140). Resultado: entre o 3º e o 5º dia a pessoa teria conta
// VIVA com código MORTO. Achado pelo primeiro teste real — o `expira_em` gravado no banco
// não batia com o prazo prometido na tela. Se um dia mudar um, mude o outro.
// 🔴 Subiu de 120 h para 240 h em 2026-08-09 (achado nº 4 da auditoria). O motivo NÃO é
// generosidade: o relógio da faxina começa em `data_cadastro`, e eu modelei só o trecho
// DEPOIS da compra ("cadastra sexta à noite, paga, cai na quarta" = 102 h). Faltou contar o
// vencimento do BOLETO (3 dias) que roda ANTES disso, e ele queima relógio junto:
//
//   qui 21:00  cadastra, e-mail cai em spam
//   qui 21:30  paga anual x5 (R$ 339,60) por boleto
//   dom        vencimento — domingo
//   seg        FERIADO, compensação parada
//   ter        paga
//   qua 03:00  faxina: 126 h > 120 h  ->  APAGA o cliente antes do dinheiro cair
//
// A trava 3 (não apagar quem tem licença) não salva: a licença só nasce quando o webhook
// aprova. 240 h cobre vencimento + fim de semana emendado com feriado + compensação.
export const HORAS_VALIDADE = 240;

/** Só pra escrever "10 dias" no e-mail em vez de "240 horas". */
const DIAS_VALIDADE = Math.round(HORAS_VALIDADE / 24);

export type Confirmacao = {
  /** Identificador OPACO da espera. Vai pra aba que cadastrou; NUNCA confirma nada sozinho. */
  pendencia: string;
  /** false = conta criada mas o e-mail não saiu. A tela precisa oferecer "reenviar". */
  emailEnviado: boolean;
};

/**
 * Gera o convite, grava e manda o e-mail. Devolve a pendência pra aba ficar esperando.
 *
 * O `codigo` NUNCA sai desta função — nem pro chamador, nem pra resposta HTTP. Ele existe
 * só dentro do e-mail. É o que torna a confirmação uma prova de que a pessoa ABRE aquela
 * caixa; devolver na resposta transformaria tudo em teatro.
 */
export async function criarConfirmacao(
  clienteId: string,
  email: string,
  nome: string
): Promise<Confirmacao> {
  const codigo = Array.from({ length: 8 }, () => ALFABETO[randomInt(ALFABETO.length)]).join("");
  const pendencia = randomBytes(24).toString("base64url");
  const expira = new Date(Date.now() + HORAS_VALIDADE * 60 * 60 * 1000).toISOString();

  // Apaga convites anteriores não usados deste cliente antes de criar o novo.
  // Sem isto, cada "reenviar" deixaria uma linha órfã pra sempre — e acumular linha é
  // exatamente o ataque que esta issue combate. Seria irônico a defesa alimentá-lo.
  await fetch(
    `${SUPABASE_URL}/rest/v1/confirmacoes_email?cliente_id=eq.${clienteId}&usado_em=is.null`,
    { method: "DELETE", headers }
  );

  const res = await fetch(`${SUPABASE_URL}/rest/v1/confirmacoes_email`, {
    method: "POST",
    headers,
    body: JSON.stringify({ codigo, pendencia, cliente_id: clienteId, expira_em: expira }),
  });

  if (!res.ok) {
    // Aqui é erro de verdade: sem linha gravada não há como confirmar, e a conta seria
    // apagada em 48 h sem o dono ter chance. Estoura pro chamador decidir.
    throw new Error(`confirmacoes_email: ${await res.text()}`);
  }

  const link = `${SITE}/confirmar?c=${codigo}`;
  const primeiroNome = (nome || "").split(" ")[0] || "Cliente";

  try {
    // 🔴 O RETORNO TEM QUE SER LIDO. Achado nº 1 da auditoria de 2026-08-09.
    //
    // O SDK do Resend **não lança exceção** quando a API recusa o envio — ele RETORNA
    // `{ data: null, error: {...} }`. Verificado no pacote instalado (resend 6.12.2,
    // `node_modules/resend/dist/index.mjs:1071-1101`): o `if (!response.ok)` faz `return`, e
    // até o catch interno (1115-1124) retorna em vez de lançar. Nem falha de rede sobe.
    //
    // Eu escrevia `await ...send(...)` descartando o retorno e devolvia `emailEnviado: true`
    // sempre. O `catch` abaixo era CÓDIGO MORTO pra toda falha de envio. Consequência real:
    // Resend recusa (cota estourada, endereço em supressão por bounce antigo) -> a tela manda
    // a pessoa olhar uma caixa onde nunca chega nada -> o convite JÁ ESTÁ GRAVADO, então a
    // trava 4 da faxina está armada -> em ~6 dias a conta é APAGADA, com senha e cadastro.
    //
    // E a ironia que fechava o caso: `emailEnviado: false` só era alcançável quando
    // `criarConfirmacao` LANÇAVA — ou seja, quando falhava em gravar o convite, que é
    // justamente o caso em que a conta NÃO corria risco. O sinal só era honesto quando era
    // inútil.
    const { error: erroResend } = await resend.emails.send({
      from: "MacroForge <noreply@macroforge.com.br>",
      to: email,
      subject: "Confirme seu e-mail — MacroForge",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; background: #0D1117; color: #fff; padding: 32px; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #D4A017; margin: 0;">MacroForge</h1>
          </div>
          <p style="color: #8B949E; text-align: center;">Ola, ${primeiroNome}!</p>
          <p style="color: #8B949E; text-align: center; font-size: 14px;">Confirme seu e-mail para liberar sua conta:</p>

          <div style="text-align: center; margin: 24px 0;">
            <a href="${link}" style="display: inline-block; background: #D4A017; color: #0D1117; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-size: 15px;">Confirmar meu e-mail</a>
          </div>

          <p style="color: #8B949E; text-align: center; font-size: 13px; margin-bottom: 8px;">Se o botao nao funcionar, digite este codigo no site:</p>
          <div style="background: #161B22; border: 2px solid #D4A017; border-radius: 12px; padding: 20px; text-align: center; margin: 8px 0 20px 0;">
            <span style="font-family: monospace; font-size: 30px; font-weight: bold; color: #D4A017; letter-spacing: 4px;">${codigo}</span>
          </div>

          <p style="color: #8B949E; text-align: center; font-size: 12px;">Valido por ${DIAS_VALIDADE} dias. Contas nao confirmadas sao removidas depois desse prazo.</p>
          <p style="color: #8B949E; text-align: center; font-size: 12px;">Se nao foi voce, ignore este e-mail.</p>
          <p style="color: #30363D; text-align: center; font-size: 11px; margin-top: 24px;">MacroForge &copy; 2026</p>
        </div>
      `,
    });

    if (erroResend) {
      console.error("Falha ao enviar e-mail de confirmacao (Resend recusou):", erroResend);
      return { pendencia, emailEnviado: false };
    }

    return { pendencia, emailEnviado: true };
  } catch (e) {
    // Continua aqui como cinto e suspensório — hoje o SDK não lança, mas isso é
    // comportamento de uma versão, não promessa de contrato.
    // E-mail que não sai NÃO derruba o cadastro: a conta já existe e o convite já está
    // gravado, então o "reenviar" da tela resolve. Mas o chamador precisa SABER, senão a
    // tela manda o cara olhar uma caixa onde nunca vai chegar nada.
    console.error("Falha ao enviar e-mail de confirmacao:", e);
    return { pendencia, emailEnviado: false };
  }
}
