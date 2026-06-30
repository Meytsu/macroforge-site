import { NextResponse } from "next/server";

// Versão mais recente do app MacroForge (MF-114). O app consulta isto pra:
//  - mostrar o changelog na tela "Sobre";
//  - avisar "Atualização disponível" quando versionCode do servidor > o do app.
//
// COMO ATUALIZAR A CADA RELEASE: bump versionCode/versionName, escreva o changelog
// da versão nova e (se mudou) o apkUrl. O versionCode tem que casar com o do
// app/build.gradle.kts. apkUrl = release pública no repo do site (GitHub Releases).
const APP_VERSION = {
  versionCode: 4,           // <-- bater com app/app/build.gradle.kts (defaultConfig.versionCode)
  versionName: "1.0.1",
  // Distribuição agora é via Google Play (closed beta). Se instalado pela Play, o app abre a
  // página da Play (market://details). Este apkUrl é só FALLBACK (ex.: emulador sem Play) →
  // aponta pra página do app na Play.
  apkUrl:
    "https://play.google.com/store/apps/details?id=com.henrique.macroforge",
  // Mudanças da versão atual (mostradas na tela Sobre / no aviso de atualização).
  changelog: [
    "Correção de uso alto de memória ao usar 'Verificar imagem'.",
    "Padrões das Configurações agora valem ao criar Localizar Imagem/Pixel.",
    "Editar a imagem de um Repetir não zera mais o tempo configurado.",
    "Licença aparece corretamente no menu lateral após ativar.",
    "Ativação de licença agora é confirmada por você (não automática).",
    "Telas de permissão rolam corretamente no celular deitado.",
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
