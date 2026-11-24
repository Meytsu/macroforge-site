import {
  APARELHOS_DO_NIVEL,
  DIAS_DO_PLANO,
  NIVEIS,
  NOME_NIVEL,
  PCS_POR_PLANO,
  formatarPreco,
  precoNivel,
} from "@/app/lib/precos";

// ADR-MF-XCROSS-022 (2026-11-22): plano da conta (sem chaves), só mensal, tudo incluído. Preços de lib/precos.ts.
export const metadata = {
  title: "FAQ — MacroForge",
  description: "Perguntas frequentes sobre o MacroForge — instalação, permissões, macros, planos e conta.",
};

type QA = { q: string; a: React.ReactNode };

const sections: { titulo: string; items: QA[] }[] = [
  {
    titulo: "Sobre o app",
    items: [
      {
        q: "O que é o MacroForge?",
        a: (
          <>
            É um app Android pra <strong>automatizar toques, arrastes e cliques</strong>{" "}
            que você programa visualmente. Útil pra jogos, tarefas repetitivas e testes
            de fluxos. O macro fica salvo no seu aparelho e roda sob sua supervisão.
          </>
        ),
      },
      {
        q: "Funciona em qualquer Android?",
        a: (
          <>
            Requer Android <strong>11 ou superior</strong> (API 30+). Testado e usado em
            Motorola Razr 50 Ultra, mas funciona em qualquer aparelho moderno —
            celulares, tablets, foldables.
          </>
        ),
      },
      {
        q: "Funciona em iPhone?",
        a: <>Não. Apenas Android. iOS não permite o tipo de automação que o app usa.</>,
      },
    ],
  },
  {
    titulo: "Permissões",
    items: [
      {
        q: "Por que o app pede 3 permissões?",
        a: (
          <>
            Cada uma serve pra uma coisa específica:
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                <strong>Sobreposição</strong> — mostrar a barra flutuante de controle por
                cima de outros apps.
              </li>
              <li>
                <strong>Acessibilidade</strong> — executar automaticamente os toques e gestos
                que você configurou.
              </li>
              <li>
                <strong>Captura de tela</strong> — encontrar imagens/pixels na tela pra disparar
                ações condicionais.
              </li>
            </ul>
            Nada é coletado ou enviado pra fora do seu aparelho.
          </>
        ),
      },
      {
        q: "O app lê o conteúdo da minha tela ou minhas mensagens?",
        a: (
          <>
            <strong>Não.</strong> A captura de tela é usada apenas para procurar imagens que{" "}
            <em>você mesmo</em> configurou nos macros (ex: um botão de &quot;atacar&quot; no jogo).
            Nada é gravado, enviado pra servidor nem analisado por nós.
          </>
        ),
      },
      {
        q: "É seguro? Vai bugar meu celular?",
        a: (
          <>
            Sim, é seguro. O app só faz toques na tela <em>como se você estivesse fazendo</em>{" "}
            — não modifica nenhum sistema do Android. Pode ser desinstalado normalmente a
            qualquer momento. Todos os macros e configurações são armazenados localmente.
          </>
        ),
      },
    ],
  },
  {
    titulo: "Macros",
    items: [
      {
        q: "Como crio meu primeiro macro?",
        a: (
          <>
            1. Toque em <strong>Iniciar Overlay</strong> na home — abre a barra flutuante.
            <br />
            2. Toque no <strong>+</strong> da barra → escolha a ação (Toque, Arrastar,
            Localizar imagem, etc).
            <br />
            3. Configure os parâmetros (duração, repetições, etc).
            <br />
            4. Toque em <strong>▶ Play</strong> pra rodar.
            <br />
            5. Salve com nome no gerenciador (☰ na barra) pra usar de novo.
          </>
        ),
      },
      {
        q: "O macro precisa estar com o app aberto pra rodar?",
        a: (
          <>
            Sim. O serviço do MacroForge precisa estar ativo (foreground service). Você
            pode <strong>esconder a barra</strong> sem parar o macro — toque no <strong>✕</strong>{" "}
            e ela vira invisível, mas continua rodando.
          </>
        ),
      },
      {
        q: "Os macros funcionam quando a tela apaga?",
        a: (
          <>
            <strong>Não.</strong> Quando a tela apaga, o Android pausa quase tudo. Mantenha
            a tela ligada (você pode aumentar o timeout dela em Configurações do Android).
          </>
        ),
      },
      {
        q: "Posso compartilhar um macro com outra pessoa?",
        a: (
          <>
            Sim. Em <strong>Meus Macros</strong>, toque no ícone de Exportar do macro que
            quer compartilhar — ele vira um arquivo <code>.mf</code> que você manda por
            WhatsApp/Drive/etc. Quem receber é só abrir o arquivo no MacroForge.
          </>
        ),
      },
      {
        q: "Meus macros somem se eu desinstalar?",
        a: (
          <>
            Sim. Sempre <strong>exporte os que importam</strong> antes de desinstalar (ver
            pergunta acima). Estamos estudando sincronização em nuvem pra uma versão futura.
          </>
        ),
      },
    ],
  },
  {
    titulo: "Planos e pagamento",
    items: [
      {
        q: "Quanto custa?",
        a: (
          <>
            Os planos são <strong>mensais</strong> e todos incluem tudo — o que muda é quantos aparelhos usam o
            app ao mesmo tempo:
            <ul className="list-disc pl-6 mt-2 space-y-1">
              {NIVEIS.map((n) => (
                <li key={n}>
                  <strong>{NOME_NIVEL[n]}</strong> — {APARELHOS_DO_NIVEL[n]} aparelhos + {PCS_POR_PLANO} PC — R${" "}
                  {formatarPreco(precoNivel(n))}/mês
                </li>
              ))}
            </ul>
            <span className="block mt-2">
              Veja os detalhes em{" "}
              <a href="/planos" className="text-[#D4A017] hover:underline">
                planos
              </a>
              .
            </span>
          </>
        ),
      },
      {
        q: "O que vem incluído no plano?",
        a: (
          <>
            <strong>Tudo, em qualquer plano:</strong> todas as DGs dos Macros Forjados e a TG, no app e no MacroForge
            PC; a Coleção e a Loja de DP no MacroForge PC (no app, em breve). O plano só muda a quantidade de aparelhos.
          </>
        ),
      },
      {
        q: "Tem teste grátis?",
        a: (
          <>
            Sim. São <strong>3 dias grátis com tudo liberado</strong> (1 celular + 1 PC). Basta criar sua conta e
            ativar o teste no app.
          </>
        ),
      },
      {
        q: "Como eu compro?",
        a: (
          <>
            De dois jeitos, sempre com a mesma conta:
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                <strong>No app</strong>, pela Google Play (assinatura mensal).
              </li>
              <li>
                <strong>No site</strong>, em{" "}
                <a href="/planos" className="text-[#D4A017] hover:underline">
                  planos
                </a>
                , pelo Mercado Pago — <strong>PIX ou cartão</strong>. Cada compra vale {DIAS_DO_PLANO} dias.
              </li>
            </ul>
          </>
        ),
      },
      {
        q: "E se eu comprar de novo ou quiser trocar de plano?",
        a: (
          <>
            Comprando o <strong>mesmo plano</strong>, os {DIAS_DO_PLANO} dias são somados ao que você já tem.
            Comprando um <strong>plano diferente</strong>, ele entra na <strong>fila</strong> e começa sozinho
            quando o atual acabar — no{" "}
            <a href="/painel" className="text-[#D4A017] hover:underline">
              painel
            </a>{" "}
            ele aparece como &quot;Na fila&quot;, com a data em que começa.
          </>
        ),
      },
      {
        q: "O plano renova sozinho? Como cancelo?",
        a: (
          <>
            Depende de onde você comprou:
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                <strong>Google Play (no app):</strong> é uma assinatura e renova todo mês. Para cancelar, abra a
                Play Store → <strong>Pagamentos e assinaturas</strong> → <strong>Assinaturas</strong>. O plano
                continua valendo até o fim do mês já pago.
              </li>
              <li>
                <strong>Site (Mercado Pago):</strong> <strong>não renova sozinho</strong> — é uma compra única de{" "}
                {DIAS_DO_PLANO} dias. Não há nada para cancelar: se não comprar de novo, o plano simplesmente acaba.
              </li>
            </ul>
          </>
        ),
      },
      {
        q: "Posso usar os Macros Forjados sem plano?",
        a: (
          <>
            <strong>Não.</strong> Os Macros Forjados funcionam só com um plano ativo (ou o teste grátis de 3 dias).
            Com o plano, todas as DGs ficam liberadas para baixar e usar.
          </>
        ),
      },
    ],
  },
  {
    titulo: "Conta e aparelhos",
    items: [
      {
        q: "Preciso digitar alguma chave para ativar?",
        a: (
          <>
            <strong>Não.</strong> O plano fica na sua conta: é só entrar no app e no MacroForge PC com o mesmo
            e-mail e senha do site.
          </>
        ),
      },
      {
        q: "Posso usar em mais de um celular?",
        a: (
          <>
            Sim. Cada plano libera um número de aparelhos usando o app <strong>ao mesmo tempo</strong> (Pro{" "}
            {APARELHOS_DO_NIVEL.pro}, Mega {APARELHOS_DO_NIVEL.mega}, Ultra {APARELHOS_DO_NIVEL.ultra}), todos
            entrando com a mesma conta. Além deles, todo plano inclui {PCS_POR_PLANO} PC.
          </>
        ),
      },
      {
        q: "Troquei de celular. Como libero o antigo?",
        a: (
          <>
            Desconecte o aparelho antigo em <strong>Meu plano</strong>, no app de outro aparelho da conta, ou em{" "}
            <strong>Aparelhos conectados</strong>, no{" "}
            <a href="/painel" className="text-[#D4A017] hover:underline">
              painel
            </a>{" "}
            do site. A vaga é liberada na hora. Se o aparelho antigo simplesmente parar de usar o app, a vaga
            também se libera sozinha depois de alguns minutos.
          </>
        ),
      },
      {
        q: "O que é o MacroForge PC?",
        a: (
          <>
            É o programa para <strong>Windows</strong> que roda os macros em emuladores Android no computador.
            Requer Windows 10 ou 11 (64 bits) com o MSI App Player, o BlueStacks 5, o LDPlayer 9 ou o MuMu Player (com o ADB
            ligado). Todo plano inclui <strong>{PCS_POR_PLANO} PC por vez</strong>, com quantos emuladores você
            quiser nele. Baixe o instalador no{" "}
            <a href="/painel" className="text-[#D4A017] hover:underline">
              painel
            </a>{" "}
            e entre com a mesma conta.
          </>
        ),
      },
    ],
  },
  {
    titulo: "Problemas comuns",
    items: [
      {
        q: "O macro não está clicando — o que fazer?",
        a: (
          <>
            Confira:
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>A permissão de <strong>Acessibilidade</strong> está ligada nos Ajustes do Android?</li>
              <li>O macro foi criado na mesma orientação da tela (retrato/paisagem)?</li>
              <li>A resolução do celular bate com a do macro original? (visto na ficha do macro em &quot;Meus Macros&quot;)</li>
            </ul>
          </>
        ),
      },
      {
        q: "A captura de imagem não está achando o que pedi",
        a: (
          <>
            Tente:
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                Diminuir a <strong>Semelhança</strong> (Match %) — de 80% pra 70% ou menos.
              </li>
              <li>
                Capturar uma área <strong>menor e mais distintiva</strong> (ícones sólidos
                funcionam melhor que regiões grandes com gradientes).
              </li>
              <li>Aumentar o <strong>Tempo de busca</strong> nos Padrões das Configurações.</li>
            </ul>
          </>
        ),
      },
      {
        q: "O Razr dobrou e o macro parou",
        a: (
          <>
            Limitação do Android: dobrar o Razr mata o sistema de captura de tela. O
            macro entra em modo de fallback (mais lento, ~1 frame/seg). Pra captura
            rápida de volta, abra o app e re-conceda a captura de tela.
          </>
        ),
      },
      {
        q: "Não acho uma resposta aqui",
        a: (
          <>
            Manda mensagem no{" "}
            <a href="/suporte" className="text-[#D4A017] hover:underline">
              Suporte
            </a>{" "}
            que respondo direto.
          </>
        ),
      },
    ],
  },
];

export default function FAQ() {
  return (
    <main className="min-h-screen bg-[#0D1117] text-white pt-20 px-6 pb-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Perguntas Frequentes</h1>
        <p className="text-gray-500 text-sm mb-8">
          Dúvidas comuns sobre o MacroForge.
        </p>

        <div className="space-y-10">
          {sections.map((sec) => (
            <section key={sec.titulo}>
              <h2 className="text-xl font-bold text-[#D4A017] mb-4">{sec.titulo}</h2>
              <div className="space-y-4">
                {sec.items.map((it) => (
                  <details
                    key={it.q}
                    className="bg-[#161B22] border border-[#30363D] rounded-xl p-4 group"
                  >
                    <summary className="cursor-pointer font-bold text-white text-base flex items-start gap-2 list-none">
                      <span className="text-[#D4A017] transition-transform group-open:rotate-90">▸</span>
                      <span className="flex-1">{it.q}</span>
                    </summary>
                    <div className="mt-3 ml-5 text-gray-300 text-sm leading-relaxed">
                      {it.a}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-12 text-center text-gray-500 text-sm">
          Não achou o que procurava?{" "}
          <a href="/suporte" className="text-[#D4A017] hover:underline">
            Fale com o suporte
          </a>
          .
        </div>
      </div>
    </main>
  );
}
