import { NextResponse } from "next/server";

// Versão mais recente do app MacroForge (MF-114). O app consulta isto pra:
//  - mostrar o changelog na tela "Sobre" (e, desde a 1.3.1, o histórico de versões);
//  - avisar "Atualização disponível" quando versionCode do servidor > o do app.
//
// COMO ATUALIZAR A CADA RELEASE (só DEPOIS que o Google aprovar a versão — antes disso o aviso manda o
// cliente para a Play sem atualização lá): bump versionCode/versionName, escreva o changelog da versão
// nova e acrescente a versão no TOPO do `historico`. O versionCode tem que casar com o do
// app/build.gradle.kts.
//
// ⚠️ ESTE TEXTO É LIDO PELO CLIENTE. Não anunciar o que não funciona.

type Versao = { versionCode: number; versionName: string; changelog: string[] };

// Todas as versões publicadas, da mais nova para a mais antiga (a 1.0.3 não tem registro).
const HISTORICO: Versao[] = [
  {
    versionCode: 11,
    versionName: "1.3.0",
    changelog: [
      "Teste grátis de 3 dias vale para 1 celular + 1 PC.",
      "Macros Forjados: digitação automática da Sub-Senha e coleta da recompensa diária.",
      "Macros Forjados: a TG (Missão de Guerra) pode ser feita automaticamente quando abrir.",
      "Aviso claro quando o plano não tem vaga para mais um celular.",
    ],
  },
  {
    versionCode: 10,
    versionName: "1.2.0",
    changelog: ["Novo motor dos Macros Forjados: mais rápido e mais preciso para achar as telas e os itens."],
  },
  {
    versionCode: 9,
    versionName: "1.1.0",
    changelog: ["Planos por quantidade de aparelhos.", "Loja dos Macros Forjados: DGs prontas para baixar."],
  },
  {
    versionCode: 8,
    versionName: "1.0.5",
    changelog: [
      "Correção: contas com mais de uma licença passam a usar a licença livre em vez de dizer \"já ativada em outro dispositivo\".",
    ],
  },
  {
    versionCode: 7,
    versionName: "1.0.4",
    changelog: [
      "Compatível com Android 16.",
      "Preparação para assinatura pela Google Play — a compra ainda não está liberada.",
      "Correção: o app podia fechar sozinho ao trocar de aba durante o login ou uma compra.",
      "A tela de Planos passa a mostrar o preço vindo da Google Play, e avisa quando o valor muda depois do período promocional.",
    ],
  },
  {
    versionCode: 5,
    versionName: "1.0.2",
    changelog: [
      "Overlay recolhível: toque em Ocultar e a barra vira uma bolha na borda; toque pra reabrir.",
      "Novo botão Fechar (com confirmação) quando não há macro em execução.",
      "Correção: overlay bugava ao trocar de tela em celulares dobráveis.",
      "Correção: o efeito de toque no botão Ocultar não aparecia.",
      "Correção: o app não sugere mais 'iniciar outro overlay' quando já está recolhido.",
      "Macros de exemplo reorganizados em 2 pastas (Celular e Emulador).",
    ],
  },
  {
    versionCode: 4,
    versionName: "1.0.1",
    changelog: [
      "Correção de uso alto de memória ao usar 'Verificar imagem'.",
      "Padrões das Configurações agora valem ao criar Localizar Imagem/Pixel.",
      "Editar a imagem de um Repetir não zera mais o tempo configurado.",
      "Licença aparece corretamente no menu lateral após ativar.",
      "Ativação de licença agora é confirmada por você (não automática).",
      "Telas de permissão rolam corretamente no celular deitado.",
    ],
  },
];

const ATUAL = HISTORICO[0];

const APP_VERSION = {
  versionCode: ATUAL.versionCode, // <-- bater com app/app/build.gradle.kts (defaultConfig.versionCode)
  versionName: ATUAL.versionName,
  // Distribuição via Google Play: instalado pela Play, o app abre a página da Play (market://details).
  // Este apkUrl é só FALLBACK (ex.: emulador sem Play) → aponta pra página do app na Play.
  apkUrl: "https://play.google.com/store/apps/details?id=com.henrique.macroforge",
  // Mudanças da versão atual (os apps até a 1.3.0 só leem este campo).
  changelog: ATUAL.changelog,
  // Todas as versões, da mais nova para a mais antiga (a tela Sobre da 1.3.1+ mostra as anteriores).
  historico: HISTORICO,
  // true = update importante (o app pode insistir mais). Por padrão false (não força).
  obrigatorio: false,
};

export async function GET() {
  return NextResponse.json(APP_VERSION, {
    // Cache curto na borda: o app não precisa de tempo-real, mas pega updates rápido.
    headers: { "Cache-Control": "public, max-age=300" },
  });
}
