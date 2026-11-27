/**
 * MacroForge PC (Windows) — o instalador fica no GitHub Releases DESTE repo (público), como o APK já ficou
 * (Henrique, 2026-11-20). O download é aberto: sem login e plano ativo o programa não roda, e os moldes das DGs só
 * vêm do servidor, cifrados, para quem tem licença.
 *
 * COMO ATUALIZAR A CADA VERSÃO: compilar (pc/instalador/compilar.ps1 no repo privado), criar a release
 * `pc-v<versão>` aqui com o arquivo `MacroForge-PC-Setup-<versão>.exe` e trocar PC_VERSAO abaixo.
 */
export const PC_VERSAO = "0.1.13";

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
  "Compra no Vendedor Unon: se o jogo levar o personagem a outro NPC (vendedor de armas, armazém…), o programa fecha na hora, teleporta pelo mapa e volta ao Unon sozinho.",
  "Atualização: não é mais preciso abrir o programa duas vezes para atualizar, e ele reabre sozinho no fim.",
  "Com o programa aberto, uma janela avisa quando sai uma versão nova; em \"Depois\", um ícone no canto de cima lembra a atualização.",
  "Correção: a Compra em Massa no Vendedor Unon cancelava algumas quantidades (como 10 de uma vez). Agora compra qualquer quantidade de 1 a 50.",
  "Compra no Vendedor Unon mais firme em computadores mais simples: o robô espera a tela assentar antes de tocar e não abre mais a loja do vizinho no lugar da do Unon.",
  "Inventário ampliado: as abas extras liberadas (V a VIII) também entram na procura do item.",
  "Conta Premium: o robô liga o AUTO do Calabouço (o de cima, ao lado da missão).",
  "Limpar o inventário não apaga mais as Dragonas 2SS.",
];

export const PC_URL_ARQUIVOS = "https://github.com/Meytsu/macroforge-site/releases/download";
