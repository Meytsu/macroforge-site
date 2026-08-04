import { NextResponse } from "next/server";

// Versão mais recente do app MacroForge (MF-114). O app consulta isto pra:
//  - mostrar o changelog na tela "Sobre";
//  - avisar "Atualização disponível" quando versionCode do servidor > o do app.
//
// COMO ATUALIZAR A CADA RELEASE: bump versionCode/versionName, escreva o changelog
// da versão nova e (se mudou) o apkUrl. O versionCode tem que casar com o do
// app/build.gradle.kts. apkUrl = release pública no repo do site (GitHub Releases).
const APP_VERSION = {
  versionCode: 7,           // <-- bater com app/app/build.gradle.kts (defaultConfig.versionCode)
  versionName: "1.0.4",
  // Distribuição agora é via Google Play (closed beta). Se instalado pela Play, o app abre a
  // página da Play (market://details). Este apkUrl é só FALLBACK (ex.: emulador sem Play) →
  // aponta pra página do app na Play.
  apkUrl:
    "https://play.google.com/store/apps/details?id=com.henrique.macroforge",
  // Mudanças da versão atual (mostradas na tela Sobre / no aviso de atualização).
  //
  // ⚠️ ESTE TEXTO É LIDO PELO CLIENTE. Não anunciar o que não funciona.
  // A v1.0.4 tem o Play Billing integrado no código, mas os 9 planos base estão em
  // RASCUNHO no Play Console — logo o Google não devolve preço e o botão ASSINAR fica
  // desabilitado. Escrever "assine pela Play" aqui seria mentir para quem vai encontrar
  // um botão cinza. Quando os planos forem ativados, trocar a 2ª linha.
  changelog: [
    "Compatível com Android 16.",
    "Preparação para assinatura pela Google Play — a compra ainda não está liberada.",
    "Correção: o app podia fechar sozinho ao trocar de aba durante o login ou uma compra.",
    "A tela de Planos passa a mostrar o preço vindo da Google Play, e avisa quando o valor muda depois do período promocional.",
  ],
  // true = update importante (o app pode insistir mais). Por padrão false (não força).
  obrigatorio: false,
};

export async function GET() {
  return NextResponse.json(APP_VERSION, {
    // Cache curto na borda: o app não precisa de tempo-real, mas pega updates rápido.
    headers: { "Cache-Control": "public, max-age=300" },
  });
}
