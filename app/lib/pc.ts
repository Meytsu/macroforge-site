/**
 * MacroForge PC (Windows) — o instalador fica no GitHub Releases DESTE repo (público), como o APK já ficou
 * (Henrique, 2026-11-20). O download é aberto: sem login e plano ativo o programa não roda, e os moldes das DGs só
 * vêm do servidor, cifrados, para quem tem licença.
 *
 * COMO ATUALIZAR A CADA VERSÃO: compilar (pc/instalador/compilar.ps1 no repo privado), criar a release
 * `pc-v<versão>` aqui com o arquivo `MacroForge-PC-Setup-<versão>.exe` e trocar PC_VERSAO abaixo.
 */
export const PC_VERSAO = "0.1.10";

export const URL_INSTALADOR_PC =
  `https://github.com/Meytsu/macroforge-site/releases/download/pc-v${PC_VERSAO}/MacroForge-PC-Setup-${PC_VERSAO}.exe`;

/**
 * Atualização automática do programa (2026-11-23; rota /api/pc/versao). O programa compilado consulta a rota ao abrir
 * e, se PC_VERSAO for mais nova que a dele, baixa SÓ os arquivos que mudaram, um asset por conteúdo:
 * `${PC_URL_ARQUIVOS}/pc-v<origem>/<sha256>` (a lista vem de pc-manifesto.json, gerado no repo privado por
 * pc/ferramentas/gerar_manifesto_pc.py). A CADA VERSÃO: trocar PC_VERSAO, escrever PC_CHANGELOG e substituir o
 * pc-manifesto.json pelo gerado — a rota só responde se a versão do manifesto for igual a PC_VERSAO.
 *
 * ⚠️ O CHANGELOG É LIDO PELO CLIENTE na janela da atualização. Não anunciar o que não funciona.
 */
export const PC_CHANGELOG: string[] = [
  "Nova aba Início: a sua conta, o tempo que falta do plano, os planos para assinar ou renovar e as novidades de cada versão. Pagou? O programa avisa assim que o plano entra.",
  "Tema claro e escuro, com as cores do app (Configurações → Aparência).",
  "Tela de login nova, com \"Esqueceu a senha?\" e \"Criar conta\".",
  "A tela dos Androids ficou nítida nos Monitores, na tela ampliada e na tela cheia.",
  "Depois de atualizar, o programa abre de novo sozinho.",
  "Coleção/Alquimia, Loja de DP e Configurações mais organizadas.",
  "Os Tokens de Prata e de Ouro são reconhecidos com mais precisão.",
];

export const PC_URL_ARQUIVOS = "https://github.com/Meytsu/macroforge-site/releases/download";
