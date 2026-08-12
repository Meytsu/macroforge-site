// Reenvia o e-mail de confirmação (ISSUE-MF-133).
//
// Existe porque o e-mail pode não chegar — falha do Resend, erro de digitação percebido
// tarde, ou a pessoa simplesmente apagou. Sem reenvio, a única saída seria esperar 5 dias
// a conta ser apagada pela faxina e cadastrar de novo.
import { NextRequest, NextResponse } from "next/server";
import { criarConfirmacao } from "@/app/api/_lib/confirmacao";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

/** Intervalo mínimo entre dois reenvios pro mesmo cliente. */
const SEGUNDOS_ENTRE_REENVIOS = 60;

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !String(email).includes("@")) {
      return NextResponse.json({ error: "E-mail invalido" }, { status: 400 });
    }

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/clientes?email=eq.${encodeURIComponent(email)}&select=id,nome,email_confirmado`,
      { headers }
    );
    const clientes = await res.json();

    // Resposta IDÊNTICA pra "não existe" e pra "já confirmado".
    //
    // Se eu respondesse "conta não encontrada", esta rota viraria um detector de contas:
    // manda uma lista de e-mails, vê quais dão erro diferente, descobre quem tem conta no
    // MacroForge. É o mesmo cuidado que o GET do /api/confirmar-email toma.
    if (!Array.isArray(clientes) || clientes.length === 0 || clientes[0].email_confirmado !== false) {
      return NextResponse.json({ ok: true });
    }

    const cliente = clientes[0];

    // Freio de spam: sem isto, alguém chamaria esta rota em série e encheria a caixa de
    // entrada de um terceiro usando o SEU domínio como remetente — o caminho mais rápido
    // pra queimar a reputação de envio que o teste de hoje mostrou estar boa.
    const conv = await fetch(
      `${SUPABASE_URL}/rest/v1/confirmacoes_email?cliente_id=eq.${cliente.id}` +
        `&order=criado_em.desc&limit=1&select=criado_em`,
      { headers }
    );
    const convites = await conv.json();

    if (Array.isArray(convites) && convites.length > 0) {
      const idadeSegundos = (Date.now() - new Date(convites[0].criado_em).getTime()) / 1000;
      if (idadeSegundos < SEGUNDOS_ENTRE_REENVIOS) {
        return NextResponse.json(
          {
            error: `Aguarde ${Math.ceil(SEGUNDOS_ENTRE_REENVIOS - idadeSegundos)} segundos para reenviar.`,
            aguarde: true,
          },
          { status: 429 }
        );
      }
    }

    const c = await criarConfirmacao(cliente.id, email, cliente.nome || "");

    return NextResponse.json({ ok: true, pendencia: c.pendencia, emailEnviado: c.emailEnviado });
  } catch (error) {
    console.error("Erro em reenviar-confirmacao:", error);
    return NextResponse.json({ error: "Erro no servidor" }, { status: 500 });
  }
}
