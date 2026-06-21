import { NextResponse } from "next/server";

// Versão mais recente do app MacroForge (MF-114). O app consulta isto pra:
//  - mostrar o changelog na tela "Sobre";
//  - avisar "Atualização disponível" quando versionCode do servidor > o do app.
//
// COMO ATUALIZAR A CADA RELEASE: bump versionCode/versionName, escreva o changelog
// da versão nova e (se mudou) o apkUrl. O versionCode tem que casar com o do
// app/build.gradle.kts. apkUrl = release pública no repo do site (GitHub Releases).
const APP_VERSION = {
  versionCode: 2,           // [TESTE TEMPORÁRIO MF-114] simula versão nova pra ver o card de update; REVERTER pra 1
  versionName: "1.0.1",
  apkUrl:
    "https://github.com/Meytsu/macroforge-site/releases/download/v1.0.0/MacroForge_v1.0.0.apk",
  // Mudanças da versão atual (mostradas na tela Sobre / no aviso de atualização).
  changelog: [
    "Condicionais aninhados: menu de edição completo (editar imagem/pixel, verificar, testar).",
    "Planos reorganizados (Mensal / Semestral / Anual).",
    "Melhorias de segurança e estabilidade da licença.",
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
