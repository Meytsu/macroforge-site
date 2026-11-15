// POST /api/pc/entrar — login do programa do PC (e-mail + senha da conta do site e do app).
// Corpo: { email, senha, versao_programa }   (sem crachá)
// Resposta (200): { ok:true, cracha, plano, pc_incluido }
//   { ok:false, codigo:"credenciais_invalidas", erro }               e-mail errado, senha errada OU conta sem senha (mesma resposta: não revela contas)
//   { ok:false, codigo:"atualize_o_programa", baixar }               programa velho
//   400 { codigo:"email_invalido" | "senha_vazia" | "versao_invalida" } · 429 { codigo:"muitos_pedidos", segundos? | minutos? } · 500
// Freio: o MESMO contador por e-mail do /api/login (_lib/login.ts) + 20 por hora por IP (mf_registrar_tentativa, tipo login-pc).
import { NextRequest } from "next/server";
import { emitirCracha } from "@/app/api/_lib/auth";
import { conferirLogin } from "@/app/api/_lib/login";
import { conferirVersao, falha, ipDoPedido, jsonPc, rpc } from "@/app/api/_lib/pc";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const corpo = body && typeof body === "object" ? (body as Record<string, unknown>) : {};

    const erroVersao = conferirVersao(corpo.versao_programa);
    if (erroVersao) return erroVersao;

    // Freio por IP: conta TODA tentativa (certa ou errada). Se o limitador falhar, segue só com o freio por e-mail.
    try {
      const lim = await rpc("mf_registrar_tentativa", {
        p_chave: `ip:${ipDoPedido(req.headers)}`,
        p_tipo: "login-pc",
        p_max: 20,
        p_janela_min: 60,
        p_bloqueio_min: 60,
      });
      const l = Array.isArray(lim) ? lim[0] : lim;
      if (l?.bloqueado) {
        return jsonPc(
          {
            ok: false,
            codigo: "muitos_pedidos",
            erro: "Muitas tentativas. Tente de novo mais tarde.",
            segundos: Number(l.segundos_restantes) || 3600,
          },
          429
        );
      }
    } catch (e) {
      console.error("[pc/entrar] limite por IP indisponível, seguindo só com o freio por e-mail:", e);
    }

    const r = await conferirLogin(corpo.email, corpo.senha);
    if (!r.ok) {
      if (r.motivo === "email_invalido" || r.motivo === "senha_vazia") {
        return jsonPc({ ok: false, erro: r.error, codigo: r.motivo }, 400);
      }
      if (r.motivo === "bloqueado") {
        return jsonPc({ ok: false, erro: r.error, codigo: "muitos_pedidos", minutos: r.minutos }, 429);
      }
      // E-mail inexistente, senha errada e conta sem senha têm a MESMA resposta e o MESMO status (não revela quais
      // e-mails existem, nem quantas tentativas restam). O freio por e-mail continua valendo em conferirLogin.
      return jsonPc({
        ok: false,
        erro: "E-mail ou senha incorretos.",
        codigo: "credenciais_invalidas",
      });
    }

    // Sem segredo configurado, emitirCracha LANÇA (500): no PC o crachá é o ponto, não há "login sem token".
    const cracha = await emitirCracha(r.cliente.id, r.cliente.email);
    const estado = await rpc("mf_pc_estado", { p_cliente_id: r.cliente.id });
    return jsonPc({ ok: true, cracha, plano: estado?.plano ?? null, pc_incluido: estado?.pc_incluido === true });
  } catch (e) {
    return falha("pc/entrar", e);
  }
}
