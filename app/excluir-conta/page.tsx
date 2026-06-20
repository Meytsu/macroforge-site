export const metadata = {
  title: "Excluir conta — MacroForge",
  description:
    "Como solicitar a exclusao da sua conta MacroForge e quais dados sao removidos.",
};

export default function ExcluirConta() {
  return (
    <main className="min-h-screen bg-[#0D1117] text-white pt-20 px-6 pb-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Excluir minha conta</h1>
        <p className="text-gray-500 text-sm mb-8">Ultima atualizacao: 20 de junho de 2026</p>

        <div className="space-y-6 text-gray-300 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. Visao geral</h2>
            <p>
              Esta pagina explica como solicitar a exclusao permanente da sua conta MacroForge
              (aplicativo Android <strong>com.henrique.macroforge</strong>) e de todos os dados
              pessoais associados a ela. A exclusao e gratuita e pode ser solicitada a qualquer momento.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">2. Como solicitar</h2>
            <p>
              Envie um pedido de exclusao por um dos canais abaixo, usando o
              {" "}<strong>mesmo e-mail cadastrado na sua conta</strong>, com o assunto
              {" "}<strong>&quot;Excluir conta&quot;</strong>:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>
                E-mail:{" "}
                <a
                  href="mailto:henrique_alves98@outlook.com?subject=Excluir%20conta"
                  className="text-amber-500 hover:underline"
                >
                  henrique_alves98@outlook.com
                </a>
              </li>
              <li>
                WhatsApp:{" "}
                <a href="https://wa.me/5581973197753" className="text-amber-500 hover:underline">
                  +55 81 97319-7753
                </a>
              </li>
            </ul>
            <p className="mt-2">
              Para sua seguranca, confirmamos a identidade pelo e-mail de cadastro antes de
              processar a exclusao. Nao e necessario informar senha.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. Dados que sao excluidos</h2>
            <p>Ao processar o pedido, removemos permanentemente:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Dados de cadastro: nome, e-mail e senha</li>
              <li>Dados opcionais de perfil: WhatsApp, pais, estado e cidade</li>
              <li>Chaves de ativacao e vinculo com o dispositivo (ANDROID_ID)</li>
              <li>Historico de licencas associado a conta</li>
            </ul>
            <p className="mt-2">
              Os macros que voce cria ficam armazenados <strong>somente no seu aparelho</strong> e
              nunca sao enviados para nossos servidores. Para apaga-los, desinstale o aplicativo ou
              limpe os dados do app nas configuracoes do Android.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">4. Dados retidos (e por quanto tempo)</h2>
            <p>
              Por obrigacao legal e fiscal, registros de transacoes de pagamento podem ser mantidos
              de forma <strong>anonimizada</strong> (sem vincular a sua identidade) pelo prazo exigido
              pela legislacao aplicavel. Os pagamentos sao processados pelo Mercado Pago e seguem a
              politica de retencao do proprio provedor — nao armazenamos dados de cartao.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">5. Prazo</h2>
            <p>
              Sua conta e os dados pessoais associados sao excluidos em ate
              {" "}<strong>30 dias</strong> apos a confirmacao do pedido. Em geral o processo e
              concluido em poucos dias uteis. Voce recebe uma confirmacao por e-mail quando a
              exclusao for concluida.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">6. Antes de excluir</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>A exclusao e <strong>permanente e irreversivel</strong>.</li>
              <li>
                Licencas e assinaturas ativas sao encerradas — uma licenca ja consumida nao e
                reembolsada pela exclusao da conta.
              </li>
              <li>
                Se voce assinou pela Google Play, cancele a renovacao automatica tambem em
                {" "}<strong>Play Store &gt; Assinaturas</strong> para evitar cobrancas futuras.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">7. Contato</h2>
            <p>
              Henrique Alves de Oliveira<br />
              E-mail:{" "}
              <a
                href="mailto:henrique_alves98@outlook.com"
                className="text-amber-500 hover:underline"
              >
                henrique_alves98@outlook.com
              </a>
              <br />
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
