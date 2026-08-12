import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";

// 🔴 A TABELA DE PREÇOS SAIU DAQUI em 2026-08-09. Agora vem de `app/lib/precos.ts`, que
// espelha o Google Play — e a página /planos lê a MESMA função.
//
// O que havia aqui era uma segunda tabela, independente da tela e independente do Play:
// `price` (9,90 / 47,90 / 79,90) mais uma escada de 10%/15%. Resultado medido: divergência em
// 6 das 9 combinações, e em duas delas o site cobrava MAIS CARO que o app pelo mesmo produto
// (mensal x5: Play 41,90, site 42,10 · semestral x3: Play 128,90, site 129,33).
//
// Não adicione preço aqui de novo. Preço é dado, e mora num lugar só.
import { precoTotal, NOME_PLANO, MAX_CHAVES, ehPlanoValido } from "@/app/lib/precos";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

export async function POST(req: NextRequest) {
  try {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json({ error: "Token do MP nao configurado" }, { status: 500 });
    }

    const body = await req.json();
    const { plano, email, nome, whatsapp, pais, estado, cidade, codigo_pais } = body;
    const quantidade = Math.max(1, Math.min(MAX_CHAVES, parseInt(body.quantidade, 10) || 1));

    if (!ehPlanoValido(plano)) {
      return NextResponse.json({ error: "Plano invalido" }, { status: 400 });
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "E-mail invalido" }, { status: 400 });
    }

    // O MESMO número que a tela /planos mostrou. Uma função, dois consumidores — é isto que
    // torna "o preço da tela difere do cobrado" impossível, em vez de improvável.
    const total = precoTotal(plano, quantidade);

    // ============================================================
    // SÓ COMPRA QUEM JÁ TEM CONTA (decisão do Henrique, 2026-08-09 — ISSUE-MF-140)
    // ============================================================
    // Esta rota NÃO cobra nada: ela só monta a tela de pagamento do Mercado Pago. Mas
    // gravava cliente no banco antes disso, sem login e sem pagamento — uma segunda porta
    // de criação de contas em massa, que a regra de firewall (presa em `/api/registro`)
    // não cobre.
    //
    // Agora ela EXIGE conta existente. Fecha a porta na origem, em vez de tentar filtrar
    // quem passa por ela.
    //
    // Por que o custo é quase zero: a tela de planos já obrigava login
    // (`planos/page.tsx` → `if (!logado) router.push("/login")`) e **nunca enviava `nome`**,
    // então o bloco antigo de criação era inalcançável pelo site. Só abria por chamada
    // direta à API — isto é, só pra quem estava abusando.
    //
    // ⚠️ A checagem tem que ser AQUI, no servidor. A do front é conveniência: qualquer um
    // chama a rota direto e pula o `router.push`.
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      // Sem banco não dá pra provar que a conta existe. Recusa em vez de deixar passar —
      // um portão que "libera quando não consegue checar" não é um portão.
      console.error("checkout: Supabase nao configurado; recusando por seguranca");
      return NextResponse.json({ error: "Servico indisponivel" }, { status: 503 });
    }

    {
      const headers = {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      };

      const checkRes = await fetch(
        `${SUPABASE_URL}/rest/v1/clientes?email=eq.${encodeURIComponent(email)}`,
        { headers }
      );
      const existing = await checkRes.json();

      if (!Array.isArray(existing) || existing.length === 0) {
        return NextResponse.json(
          {
            error: "Crie sua conta antes de comprar.",
            precisaCadastro: true,
          },
          { status: 403 }
        );
      }

      // NOTA: não exigimos `email_confirmado` aqui, de propósito. Confirmar é portão só
      // do TRIAL (o que tem valor pra quem abusa). Quem está com o cartão na mão não
      // esbarra em burocracia — e pagar já confirma, pelo /api/webhook.

      // A conta existe. Atualiza os dados opcionais que vieram no corpo, se vieram.
      //
      // ⚠️ `email_confirmado` NÃO entra neste PATCH, e é deliberado (ISSUE-MF-133): aqui
      // ainda não houve pagamento nenhum. Marcar `true` daria confirmação de graça a quem
      // só CHAMA a rota. Quem marca é o /api/webhook, no `approved`.
      //
      // ⚠️ E NÃO existe mais ramo de criação. Se você veio "consertar" um erro de conta
      // inexistente adicionando um POST aqui, pare: era exatamente o buraco da
      // ISSUE-MF-140. O caminho certo é o usuário se cadastrar.
      if (nome) {
        const clienteData = {
          nome,
          email,
          whatsapp: whatsapp || null,
          pais: pais || null,
          estado: estado || null,
          cidade: cidade || null,
          codigo_pais: codigo_pais || null,
        };

        await fetch(
          `${SUPABASE_URL}/rest/v1/clientes?email=eq.${encodeURIComponent(email)}`,
          { method: "PATCH", headers, body: JSON.stringify(clienteData) }
        );
      }
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const titleSuffix = quantidade > 1 ? ` (${quantidade} chaves)` : "";

    const result = await preference.create({
      body: {
        items: [
          {
            id: `${plano}_x${quantidade}`,
            title: `${NOME_PLANO[plano]}${titleSuffix}`,
            quantity: 1,
            unit_price: total,
            currency_id: "BRL",
          },
        ],
        payer: {
          email: email,
          name: nome || undefined,
        },
        ...(siteUrl.includes("localhost") ? {} : {
          back_urls: {
            success: `${siteUrl}/sucesso`,
            failure: `${siteUrl}/falha`,
            pending: `${siteUrl}/pendente`,
          },
          auto_return: "approved" as const,
        }),
        notification_url: siteUrl.includes("localhost")
          ? undefined
          : `${siteUrl}/api/webhook`,
        metadata: {
          plano: plano,
          email: email,
          nome: nome || "",
          quantidade: quantidade,
        },
      },
    });

    return NextResponse.json({
      checkout_url: result.init_point,
      sandbox_url: result.sandbox_init_point,
    });
  } catch (error) {
    console.error("Erro ao criar checkout:", error);
    const message = error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null
        ? JSON.stringify(error)
        : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
