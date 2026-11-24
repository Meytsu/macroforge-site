// GET /api/pc/versao — a atualização automática do MacroForge PC (2026-11-23; no repo privado:
// pc/macroforge_pc/atualizacao.py). Sem login: só diz qual é a versão atual e quais arquivos ela tem — o instalador já
// é público no GitHub Releases, e sem licença o programa não roda.
//
// Resposta (200):
//   { versao, changelog: string[], url_base, instalador,
//     arquivos: { "<caminho relativo>": { sha256, tamanho, origem? } } }
// O programa baixa cada arquivo que mudou de `${url_base}/pc-v${origem}/${sha256}` (um asset por conteúdo na release
// da versão que o publicou). Arquivo sem `origem` = só pelo instalador completo.
//
// 503 { erro: "manifesto_desatualizado" } se pc-manifesto.json não for da versão PC_VERSAO (esqueceram de trocar um
// dos dois): o programa trata como "sem atualização" e abre normal — nunca atualiza para uma mistura.
//
// COMO ATUALIZAR A CADA VERSÃO: app/lib/pc.ts (PC_VERSAO + PC_CHANGELOG) e app/lib/pc-manifesto.json (gerado).
import { NextResponse } from "next/server";
import { PC_CHANGELOG, PC_URL_ARQUIVOS, PC_VERSAO, URL_INSTALADOR_PC } from "@/app/lib/pc";
import manifesto from "@/app/lib/pc-manifesto.json";

export async function GET() {
  if (manifesto.versao !== PC_VERSAO || Object.keys(manifesto.arquivos).length === 0) {
    return NextResponse.json(
      { erro: "manifesto_desatualizado" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  return NextResponse.json(
    {
      versao: PC_VERSAO,
      changelog: PC_CHANGELOG,
      url_base: PC_URL_ARQUIVOS,
      instalador: URL_INSTALADOR_PC,
      arquivos: manifesto.arquivos,
    },
    // Cache curto na borda (como o /api/app-version): a versão nova chega em até 5 min.
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
}
