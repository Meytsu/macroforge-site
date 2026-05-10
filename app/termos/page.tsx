export default function Termos() {
  return (
    <main className="min-h-screen bg-[#0D1117] text-white pt-20 px-6 pb-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Termos de Uso</h1>
        <p className="text-gray-500 text-sm mb-8">Ultima atualizacao: 08 de maio de 2026</p>

        <div className="space-y-6 text-gray-300 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. Aceitacao dos termos</h2>
            <p>
              Ao utilizar o MacroForge (app, site ou servicos), voce concorda com estes
              Termos de Uso. Se nao concordar, nao utilize o servico.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">2. Descricao do servico</h2>
            <p>
              O MacroForge e uma ferramenta de automacao para Android que permite ao usuario
              programar sequencias de toques, gestos e condicoes para automatizar tarefas
              repetitivas no dispositivo. O servico inclui:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Aplicativo Android com overlay flutuante</li>
              <li>Site para gerenciamento de conta e licencas</li>
              <li>Sistema de chaves de ativacao</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. Licenca de uso</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>A licenca e pessoal e intransferivel</li>
              <li>Cada chave pode ser ativada em <strong>1 dispositivo</strong> por vez</li>
              <li>A licenca e valida pelo periodo contratado (mensal, trimestral ou semestral)</li>
              <li>Apos o vencimento, o app deixa de funcionar ate a renovacao</li>
              <li>Nao ha cobranca automatica — o usuario renova manualmente</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">4. Uso permitido</h2>
            <p>O MacroForge pode ser utilizado para:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Automatizar tarefas repetitivas em aplicativos e jogos</li>
              <li>Criar macros de produtividade pessoal</li>
              <li>Testes de interface e automacao de fluxos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">5. Uso proibido</h2>
            <p>E expressamente proibido usar o MacroForge para:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Atividades ilegais ou fraudulentas</li>
              <li>Violar termos de servico de outros aplicativos</li>
              <li>Coletar dados pessoais de terceiros sem consentimento</li>
              <li>Distribuir spam ou mensagens nao solicitadas</li>
              <li>Engenharia reversa, descompilacao ou modificacao do app</li>
              <li>Compartilhar, revender ou transferir sua chave de licenca</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">6. Responsabilidade</h2>
            <p>
              O MacroForge e fornecido &quot;como esta&quot; (as is). Nao nos responsabilizamos por:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Banimentos em jogos ou aplicativos decorrentes do uso de automacao</li>
              <li>Perda de dados ou danos ao dispositivo</li>
              <li>Indisponibilidade temporaria do servico</li>
              <li>Resultados obtidos com o uso do app</li>
            </ul>
            <p className="mt-2">
              O usuario e integralmente responsavel pelo uso que faz da ferramenta e deve
              respeitar os termos de servico dos aplicativos que automatiza.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">7. Pagamento e reembolso</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Pagamentos sao processados pelo Mercado Pago</li>
              <li>Aceitamos PIX, cartao de credito e boleto</li>
              <li><strong>Garantia de 7 dias:</strong> se nao estiver satisfeito, devolvemos o valor integral via PIX</li>
              <li>Apos 7 dias, nao ha reembolso</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">8. Cancelamento</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Nao ha fidelidade — basta nao renovar</li>
              <li>A licenca permanece ativa ate a data de expiracao</li>
              <li>Podemos cancelar licencas em caso de violacao destes termos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">9. Propriedade intelectual</h2>
            <p>
              O MacroForge, incluindo codigo, design, marca e conteudo, e propriedade de
              Henrique Alves de Oliveira. E proibida a reproducao, distribuicao ou modificacao
              sem autorizacao previa.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">10. Alteracoes</h2>
            <p>
              Reservamo-nos o direito de alterar estes termos a qualquer momento.
              Alteracoes significativas serao comunicadas por e-mail ou notificacao no app.
              O uso continuado do servico apos alteracoes constitui aceitacao dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">11. Legislacao aplicavel</h2>
            <p>
              Estes termos sao regidos pelas leis da Republica Federativa do Brasil.
              Fica eleito o foro da comarca de Recife/PE para dirimir quaisquer controversias.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">12. Contato</h2>
            <p>
              Henrique Alves de Oliveira<br />
              E-mail: henrique_alves98@outlook.com<br />
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
