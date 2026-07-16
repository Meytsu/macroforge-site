import { NextResponse } from "next/server";

// Versão mais recente do app MacroForge (MF-114). O app consulta isto pra:
//  - mostrar o changelog na tela "Sobre";
//  - avisar "Atualização disponível" quando versionCode do servidor > o do app.
//
// COMO ATUALIZAR A CADA RELEASE: bump versionCode/versionName, escreva o changelog
// da versão nova e (se mudou) o apkUrl. O versionCode tem que casar com o do
// app/build.gradle.kts. apkUrl = release pública no repo do site (GitHub Releases).
const APP_VERSION = {
  versionCode: 5,           // <-- bater com app/app/build.gradle.kts (defaultConfig.versionCode)
  versionName: "1.0.2",
  // Distribuição agora é via Google Play (closed beta). Se instalado pela Play, o app abre a
  // página da Play (market://details). Este apkUrl é só FALLBACK (ex.: emulador sem Play) →
  // aponta pra página do app na Play.
  apkUrl:
    "https://play.google.com/store/apps/details?id=com.henrique.macroforge",
  // Mudanças da versão atual (mostradas na tela Sobre / no aviso de atualização).
  changelog: [
    "Overlay recolhível: toque em Ocultar e a barra vira uma bolha na borda; toque pra reabrir.",
    "Novo botão Fechar (com confirmação) quando não há macro em execução.",
    "Correção: overlay bugava ao trocar de tela em celulares dobráveis.",
    "Correção: o efeito de toque no botão Ocultar não aparecia.",
    "Correção: o app não sugere mais 'iniciar outro overlay' quando já está recolhido.",
    "Macros de exemplo reorganizados em 2 pastas (Celular e Emulador).",
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
