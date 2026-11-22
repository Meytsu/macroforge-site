/**
 * MacroForge PC (Windows) — o instalador fica no GitHub Releases DESTE repo (público), como o APK já ficou
 * (Henrique, 2026-11-20). O download é aberto: sem login e plano ativo o programa não roda, e os moldes das DGs só
 * vêm do servidor, cifrados, para quem tem licença.
 *
 * COMO ATUALIZAR A CADA VERSÃO: compilar (pc/instalador/compilar.ps1 no repo privado), criar a release
 * `pc-v<versão>` aqui com o arquivo `MacroForge-PC-Setup-<versão>.exe` e trocar PC_VERSAO abaixo.
 */
export const PC_VERSAO = "0.1.4";

export const URL_INSTALADOR_PC =
  `https://github.com/Meytsu/macroforge-site/releases/download/pc-v${PC_VERSAO}/MacroForge-PC-Setup-${PC_VERSAO}.exe`;
