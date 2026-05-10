export default function Privacidade() {
  return (
    <main className="min-h-screen bg-[#0D1117] text-white pt-20 px-6 pb-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Politica de Privacidade</h1>
        <p className="text-gray-500 text-sm mb-8">Ultima atualizacao: 08 de maio de 2026</p>

        <div className="space-y-6 text-gray-300 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. Introducao</h2>
            <p>
              O MacroForge (&quot;nos&quot;, &quot;nosso&quot;) e uma ferramenta de automacao para dispositivos Android
              desenvolvida por Henrique Alves de Oliveira. Esta politica descreve como coletamos,
              usamos e protegemos suas informacoes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">2. Dados que coletamos</h2>
            <p>Coletamos apenas os dados necessarios para o funcionamento do servico:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Dados de cadastro:</strong> nome, e-mail e senha (criptografada com bcrypt)</li>
              <li><strong>Dados opcionais:</strong> WhatsApp, pais, estado, cidade</li>
              <li><strong>Dados de licenca:</strong> chave de ativacao, identificador do dispositivo (ANDROID_ID), plano contratado</li>
              <li><strong>Dados de pagamento:</strong> processados pelo Mercado Pago — nao armazenamos dados de cartao</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. Como usamos seus dados</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Autenticar seu acesso ao app e ao painel do cliente</li>
              <li>Vincular sua licenca ao seu dispositivo</li>
              <li>Enviar sua chave de ativacao por e-mail</li>
              <li>Enviar codigos de recuperacao de senha</li>
              <li>Processar pagamentos via Mercado Pago</li>
              <li>Comunicar atualizacoes e suporte</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">4. O que o app Android faz</h2>
            <p>O MacroForge utiliza as seguintes permissoes do Android:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Servico de Acessibilidade:</strong> utilizado exclusivamente para simular toques e gestos na tela, permitindo a automacao de tarefas repetitivas programadas pelo usuario</li>
              <li><strong>Overlay (desenhar sobre outros apps):</strong> exibe o painel flutuante de controle do macro</li>
              <li><strong>Captura de tela:</strong> utilizada para reconhecimento de imagem (template matching) e deteccao de cor de pixel</li>
              <li><strong>Internet:</strong> validacao de licenca e comunicacao com o servidor</li>
            </ul>
            <p className="mt-2">
              O app <strong>NAO</strong> coleta, le ou transmite conteudo de mensagens, senhas, dados bancarios
              ou qualquer informacao pessoal exibida na tela. A captura de tela e processada localmente
              no dispositivo e nunca e enviada para servidores externos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">5. Armazenamento e seguranca</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Senhas sao criptografadas com bcrypt (irreversivel)</li>
              <li>Comunicacao via HTTPS (criptografia em transito)</li>
              <li>Banco de dados protegido com Row Level Security (RLS)</li>
              <li>Rate limiting contra tentativas de forca bruta</li>
              <li>Chaves de API protegidas em variaveis de ambiente</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">6. Compartilhamento de dados</h2>
            <p>
              Nao vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros,
              exceto quando necessario para:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Processar pagamentos (Mercado Pago)</li>
              <li>Enviar e-mails transacionais (Resend)</li>
              <li>Hospedar o site (Vercel)</li>
              <li>Armazenar dados (Supabase)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">7. Seus direitos</h2>
            <p>Voce tem direito a:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Acessar seus dados pessoais (via painel do cliente)</li>
              <li>Corrigir seus dados (alterar dados no painel)</li>
              <li>Solicitar exclusao da sua conta e dados</li>
              <li>Revogar consentimento a qualquer momento</li>
            </ul>
            <p className="mt-2">
              Para exercer esses direitos, entre em contato pelo e-mail abaixo ou via WhatsApp.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">8. Idade minima</h2>
            <p>
              O MacroForge e destinado a usuarios com 13 anos ou mais. Nao coletamos
              intencionalmente dados de menores de 13 anos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">9. Alteracoes</h2>
            <p>
              Podemos atualizar esta politica periodicamente. Alteracoes significativas serao
              comunicadas por e-mail ou notificacao no app.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">10. Contato</h2>
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
