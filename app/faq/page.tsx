export const metadata = {
  title: "FAQ — MacroForge",
  description: "Perguntas frequentes sobre o MacroForge — instalação, permissões, macros, licença.",
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
            <em>você mesmo</em> configurou nos macros (ex: um botão de "atacar" no jogo).
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
    titulo: "Pagamento e licença",
    items: [
      {
        q: "Quanto custa?",
        a: (
          <>
            O app tem um período de teste gratuito ao instalar. Após isso, a licença é
            paga e renovada manualmente — ver{" "}
            <a href="/planos" className="text-[#D4A017] hover:underline">
              planos
            </a>
            .
          </>
        ),
      },
      {
        q: "A licença renova sozinha?",
        a: (
          <>
            <strong>Não</strong> — sem cobrança automática. Quando expira, você decide se
            renova.
          </>
        ),
      },
      {
        q: "Posso usar minha chave em mais de um celular?",
        a: (
          <>
            Cada chave funciona em <strong>1 dispositivo por vez</strong>. Pra trocar de
            aparelho, vá em <strong>Chaves e Ativação</strong> no menu e desative no
            anterior antes de ativar no novo.
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
              <li>A resolução do celular bate com a do macro original? (visto na ficha do macro em "Meus Macros")</li>
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
