export const metadata = {
  title: "Termos de Uso — MacroForge",
  description: "Termos e condições de uso do MacroForge (app, programa para PC e site).",
};

export default function Termos() {
  return (
    <main className="min-h-screen bg-[#0D1117] text-white pt-20 px-6 pb-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Termos de Uso</h1>
        <p className="text-gray-500 text-sm mb-8">Última atualização: 15 de novembro de 2026</p>

        <div className="space-y-6 text-gray-300 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. Aceitação dos termos</h2>
            <p>
              1.1. Ao utilizar o MacroForge (app, site ou serviços), você concorda com estes Termos
              de Uso. Se não concordar, não utilize o serviço.
            </p>
            <p className="mt-2">
              1.2. O serviço é fornecido por Henrique Alves de Oliveira, desenvolvedor individual,
              localizado em Recife/PE, Brasil (&quot;nós&quot;).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">2. Descrição do serviço</h2>
            <p>
              2.1. O MacroForge é uma ferramenta de automação para Android que permite ao usuário
              programar sequências de toques, gestos e condições para automatizar tarefas
              repetitivas no dispositivo. O serviço inclui:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>2.1.1. Aplicativo Android com barra flutuante (overlay);</li>
              <li>2.1.2. Site para gerenciamento de conta e licenças;</li>
              <li>2.1.3. Sistema de chaves de ativação.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. Licença de uso</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>3.1. A licença é pessoal e intransferível;</li>
              <li>3.2. Cada chave pode ser ativada em <strong>1 dispositivo</strong> por vez;</li>
              <li>3.3. A licença é válida pelo período contratado (mensal, semestral ou anual);</li>
              <li>3.4. Após o vencimento, o app deixa de funcionar até a renovação.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">4. Uso permitido</h2>
            <p>4.1. O MacroForge pode ser utilizado para:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>4.1.1. Automatizar tarefas repetitivas em aplicativos e jogos;</li>
              <li>4.1.2. Criar macros de produtividade pessoal;</li>
              <li>4.1.3. Testes de interface e automação de fluxos.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">5. Uso proibido</h2>
            <p>5.1. É expressamente proibido usar o MacroForge para:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>5.1.1. Atividades ilegais ou fraudulentas;</li>
              <li>5.1.2. Violar termos de serviço de outros aplicativos;</li>
              <li>5.1.3. Coletar dados pessoais de terceiros sem consentimento;</li>
              <li>5.1.4. Distribuir spam ou mensagens não solicitadas;</li>
              <li>5.1.5. Engenharia reversa, descompilação ou modificação do app;</li>
              <li>5.1.6. Compartilhar, revender ou transferir sua chave de licença.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">6. Responsabilidade</h2>
            <p>
              6.1. O MacroForge é fornecido no estado em que se encontra. Empregamos esforços
              razoáveis para mantê-lo funcionando corretamente, mas, na máxima extensão permitida
              pela legislação aplicável, não nos responsabilizamos por:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>6.1.1. Banimentos em jogos ou aplicativos decorrentes do uso de automação;</li>
              <li>6.1.2. Indisponibilidade temporária do serviço;</li>
              <li>6.1.3. Resultados específicos obtidos com o uso do app.</li>
            </ul>
            <p className="mt-2">
              6.2. Nada nestes termos exclui ou limita responsabilidades que não possam ser
              afastadas pela legislação consumerista. O usuário é responsável pelo uso que faz da
              ferramenta e deve respeitar os termos de serviço dos aplicativos que automatiza.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">7. Pagamento, arrependimento e reembolso</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>7.1. Os pagamentos são processados pelo Mercado Pago (PIX, cartão de crédito e boleto) e/ou pelo Google Play, conforme o canal de compra;</li>
              <li>7.2. <strong>Direito de arrependimento (CDC, art. 49):</strong> por se tratar de contratação à distância, você pode desistir da compra em até 7 (sete) dias corridos a contar da contratação, com devolução integral do valor pago;</li>
              <li>7.3. <strong>Garantia de satisfação:</strong> independentemente do arrependimento, oferecemos reembolso integral em até 7 dias caso você não esteja satisfeito;</li>
              <li>7.4. Compras realizadas pela Google Play seguem também as políticas de reembolso da própria Google.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">8. Cancelamento</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>8.1. Não há fidelidade;</li>
              <li>8.2. A licença permanece ativa até a data de expiração;</li>
              <li>8.3. Podemos cancelar licenças em caso de violação destes termos;</li>
              <li>8.4. Você pode excluir sua conta a qualquer momento em <a href="https://www.macroforge.com.br/excluir-conta" className="text-amber-500 hover:underline">macroforge.com.br/excluir-conta</a>.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">9. Idade mínima</h2>
            <p>
              9.1. O serviço é destinado a usuários com 18 anos ou mais. Ao utilizá-lo, você declara
              ter pelo menos 18 anos de idade.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">10. Propriedade intelectual</h2>
            <p>
              10.1. O MacroForge, incluindo código, design, marca e conteúdo, é propriedade de
              Henrique Alves de Oliveira. É proibida a reprodução, distribuição ou modificação sem
              autorização prévia.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">11. Privacidade</h2>
            <p>
              11.1. O tratamento dos seus dados pessoais é descrito na nossa{" "}
              <a href="https://www.macroforge.com.br/privacidade" className="text-amber-500 hover:underline">Política de Privacidade</a>,
              parte integrante destes termos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">12. Alterações</h2>
            <p>
              12.1. Reservamo-nos o direito de alterar estes termos a qualquer momento. Alterações
              significativas serão comunicadas por e-mail ou notificação no app. O uso continuado do
              serviço após alterações constitui aceitação dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">13. Legislação aplicável e foro</h2>
            <p>
              13.1. Estes termos são regidos pelas leis da República Federativa do Brasil.
            </p>
            <p className="mt-2">
              13.2. Fica eleito o foro da comarca de Recife/PE para dirimir controvérsias, ressalvado,
              nas relações de consumo, o direito do consumidor de ajuizar a ação no foro do seu próprio
              domicílio (CDC, art. 101, I).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">14. MacroForge PC (programa para Windows)</h2>
            <p>
              14.1. O MacroForge PC é um programa para Windows, oferecido junto com os planos do
              MacroForge, que automatiza aplicativos Android executados em emuladores no seu computador.
              Esta seção vale para ele e complementa as demais; havendo conflito, vale a mais específica.
            </p>

            <h3 className="font-semibold text-white mt-4 mb-1">Licença de uso</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>14.2. O programa é <strong>licenciado, não vendido</strong>. Você recebe um direito de uso limitado, não exclusivo, pessoal e intransferível, pelo período do seu plano;</li>
              <li>14.3. Todo plano ativo (Pro, Mega ou Ultra) inclui <strong>1 (um) computador</strong>, além dos aparelhos do app previstos no plano. O plano contratado define o seu direito de uso;</li>
              <li>14.4. O acesso é feito com o login da sua conta do site. A conta pode ficar conectada em <strong>1 computador por vez</strong>: ao abrir o programa em outro computador, será perguntado se você deseja desconectar o anterior, que deixa de funcionar;</li>
              <li>14.5. Não há limite de emuladores ou aparelhos Android controlados a partir do computador conectado;</li>
              <li>14.6. Ao fim do plano, o programa deixa de funcionar até a renovação.</li>
            </ul>

            <h3 className="font-semibold text-white mt-4 mb-1">Teste grátis</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>14.7. Há um teste grátis de <strong>3 (três) dias</strong>, que pode ser usado no app ou no PC;</li>
              <li>14.8. O teste é limitado a <strong>1 por conta</strong>, <strong>1 por computador</strong> e <strong>1 por celular</strong>;</li>
              <li>14.9. Podemos negar ou cancelar o teste em caso de abuso, como a criação de várias contas para obter testes repetidos.</li>
            </ul>

            <h3 className="font-semibold text-white mt-4 mb-1">Requisitos</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>14.10. É necessário computador com Windows, emulador Android compatível e conexão com a internet;</li>
              <li>14.11. O programa se comunica com nossos servidores a cada 5 minutos para validar a licença. Se a conexão cair, ele tolera até <strong>30 minutos</strong> sem internet; depois disso, termina a rodada em andamento e para;</li>
              <li>14.12. Para proteger o conteúdo do programa, moldes e dados das automações são baixados de forma cifrada, a cada sessão, e só funcionam com a licença ativa;</li>
              <li>14.13. Podemos exigir uma <strong>versão mínima</strong> do programa. Versões antigas podem deixar de funcionar até a atualização, que é gratuita para planos ativos.</li>
            </ul>

            <h3 className="font-semibold text-white mt-4 mb-1">Proibições</h3>
            <p className="mt-1">14.14. Além do item 5, é expressamente proibido:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>14.14.1. Fazer engenharia reversa, descompilar, desmontar ou tentar obter o código-fonte ou a lógica do programa, exceto nas hipóteses em que a lei permita expressamente;</li>
              <li>14.14.2. Extrair, copiar, decifrar ou reproduzir os moldes, pacotes de dados ou a lógica das automações, ou tentar capturar as chaves usadas para abri-los;</li>
              <li>14.14.3. Burlar, desativar ou contornar a verificação de licença, o limite de 1 computador por vez ou o limite do teste grátis, inclusive alterando identificadores do computador;</li>
              <li>14.14.4. Compartilhar, emprestar, vender ou ceder sua conta, login ou acesso;</li>
              <li>14.14.5. Redistribuir, sublicenciar, alugar ou disponibilizar o programa, ou partes dele, a terceiros.</li>
            </ul>

            <h3 className="font-semibold text-white mt-4 mb-1">Consequências</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>14.15. Em caso de violação desta seção, podemos suspender ou cancelar a licença, sem reembolso do período restante, sem prejuízo de outras medidas legais cabíveis;</li>
              <li>14.16. Isso não afeta direitos que a lei assegure ao consumidor. O direito de arrependimento e o reembolso seguem as regras do item 7 e se aplicam normalmente a quem não tiver violado estes termos.</li>
            </ul>

            <h3 className="font-semibold text-white mt-4 mb-1">Propriedade intelectual</h3>
            <p className="mt-1">
              14.17. O programa, seu código, os moldes, os pacotes de dados e a lógica das automações são
              propriedade de Henrique Alves de Oliveira e protegidos pela legislação de direitos autorais.
              Nada neste termo transfere a você qualquer direito sobre eles, além do uso licenciado.
            </p>

            <h3 className="font-semibold text-white mt-4 mb-1">Isenções</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>14.18. O programa automatiza o jogo Cabal Mobile e outros aplicativos por meio de emuladores. O jogo pode ser atualizado a qualquer momento, e isso pode fazer a automação falhar ou parar de funcionar, temporária ou definitivamente. Trabalharemos para corrigir, mas não garantimos prazo;</li>
              <li>14.19. O uso de automação pode ser proibido pelos termos do jogo ou do emulador. O <strong>risco de advertência, suspensão ou banimento é do usuário</strong>, que deve conhecer e respeitar as regras desses terceiros;</li>
              <li>14.20. Não garantimos resultado específico (itens, progresso ou ganhos no jogo). Nada aqui afasta responsabilidades que a lei não permita excluir.</li>
            </ul>

            <h3 className="font-semibold text-white mt-4 mb-1">Componentes de terceiros e privacidade</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>14.21. O programa usa componentes de terceiros, cada um sob sua própria licença. A lista e as licenças estão no arquivo <strong>AVISOS-TERCEIROS</strong>, incluído no instalador;</li>
              <li>14.22. Os dados tratados pelo programa estão descritos na seção 11 da <a href="https://www.macroforge.com.br/privacidade" className="text-amber-500 hover:underline">Política de Privacidade</a>.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">15. Contato</h2>
            <p>
              Henrique Alves de Oliveira — Recife/PE, Brasil<br />
              E-mail: <a href="mailto:henrique_alves98@outlook.com" className="text-amber-500 hover:underline">henrique_alves98@outlook.com</a><br />
              WhatsApp:{" "}
              <a href="https://wa.me/5581973197753" className="text-amber-500 hover:underline">
                +55 81 97319-7753
              </a>
            </p>
          </section>

        </div>
      </div>
    </main>
  );
}
