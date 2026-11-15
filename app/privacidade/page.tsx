export const metadata = {
  title: "Política de Privacidade — MacroForge",
  description:
    "Como o MacroForge coleta, usa, protege e exclui seus dados pessoais.",
};

export default function Privacidade() {
  return (
    <main className="min-h-screen bg-[#0D1117] text-white pt-20 px-6 pb-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Política de Privacidade</h1>
        <p className="text-gray-500 text-sm mb-8">Última atualização: 15 de novembro de 2026</p>

        <div className="space-y-6 text-gray-300 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. Introdução</h2>
            <p>
              1.1. O MacroForge (&quot;MacroForge&quot;, &quot;nós&quot;, &quot;nosso&quot;) é uma ferramenta de
              automação para dispositivos Android, composta por um aplicativo e por um site de
              gerenciamento de conta e licenças.
            </p>
            <p className="mt-2">
              1.2. <strong>Controlador dos dados:</strong> Henrique Alves de Oliveira, desenvolvedor
              individual, localizado em Recife/PE, Brasil. Contato para assuntos de privacidade:
              e-mail <a href="mailto:henrique_alves98@outlook.com" className="text-amber-500 hover:underline">henrique_alves98@outlook.com</a>{" "}
              ou WhatsApp <a href="https://wa.me/5581973197753" className="text-amber-500 hover:underline">+55 81 97319-7753</a>.
            </p>
            <p className="mt-2">
              1.3. Esta política descreve como tratamos seus dados pessoais, em conformidade com a
              Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">2. Dados que coletamos</h2>
            <p>2.1. Coletamos apenas os dados necessários para o funcionamento do serviço:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Dados de cadastro:</strong> nome, e-mail e senha (armazenada de forma criptografada com bcrypt).</li>
              <li><strong>Dados opcionais de perfil:</strong> WhatsApp, código do país (DDI), país, estado e cidade.</li>
              <li><strong>Dados de licença:</strong> chave de ativação, identificador do dispositivo (ANDROID_ID), plano contratado, status e datas de validade.</li>
              <li><strong>Dados de pagamento:</strong> processados pelo Mercado Pago — não armazenamos dados de cartão; guardamos apenas a referência da transação.</li>
              <li><strong>Dados de segurança:</strong> registro de tentativas de login por e-mail (data/hora e contagem), usados para proteger sua conta contra acesso não autorizado (proteção contra força bruta).</li>
              <li><strong>Dados de uso do site:</strong> métricas anônimas de navegação (páginas visitadas), por meio do Vercel Analytics, para entender o uso e melhorar o site.</li>
            </ul>
            <p className="mt-2">
              2.2. Os <strong>macros</strong> que você cria ficam armazenados <strong>somente no seu
              aparelho</strong> e não são enviados para nossos servidores.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. Como usamos seus dados</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Autenticar seu acesso ao app e ao painel do cliente;</li>
              <li>Vincular sua licença ao seu dispositivo;</li>
              <li>Enviar sua chave de ativação por e-mail;</li>
              <li>Enviar códigos de recuperação de senha;</li>
              <li>Processar pagamentos via Mercado Pago;</li>
              <li>Proteger sua conta contra tentativas de acesso não autorizado;</li>
              <li>Comunicar atualizações e prestar suporte.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">4. O que o app Android faz e quais permissões usa</h2>
            <p>4.1. O MacroForge utiliza as seguintes permissões do Android:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Serviço de Acessibilidade:</strong> utilizado exclusivamente para reproduzir os toques e gestos que <em>você</em> configura nos seus macros (automação determinística). O serviço <strong>não lê o conteúdo das suas telas</strong>.</li>
              <li><strong>Sobreposição a outros apps (overlay):</strong> exibe a barra flutuante de controle por cima de outros aplicativos.</li>
              <li><strong>Captura de tela:</strong> utilizada para reconhecimento de imagem e detecção de cor de pixel — analisada <strong>localmente, em tempo real</strong>, no próprio aparelho.</li>
              <li><strong>Notificações:</strong> para avisar sobre o status do app e atualizações.</li>
              <li><strong>Serviço em primeiro plano (foreground service):</strong> mantém a automação ativa enquanto você usa outros apps.</li>
              <li><strong>Internet e estado da rede:</strong> validação de licença e comunicação com o servidor.</li>
            </ul>
            <p className="mt-2">
              4.2. O app <strong>NÃO</strong> coleta, lê ou transmite conteúdo de mensagens, senhas,
              dados bancários ou qualquer informação pessoal exibida na tela. A captura de tela é
              processada localmente e <strong>nunca é gravada nem enviada</strong> para servidores externos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">5. Armazenamento e segurança</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Senhas são criptografadas com bcrypt (irreversível);</li>
              <li>Comunicação via HTTPS (criptografia em trânsito);</li>
              <li>O acesso ao banco de dados é feito exclusivamente pelo nosso servidor, com uma chave de serviço que <strong>nunca é exposta ao aplicativo nem ao navegador do usuário</strong>;</li>
              <li>Proteção contra tentativas de força bruta (limite de tentativas de login);</li>
              <li>Chaves de API mantidas em variáveis de ambiente, fora do código.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">6. Compartilhamento de dados</h2>
            <p>
              6.1. Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros,
              exceto com os provedores que operam como nossos processadores, estritamente para
              prestar o serviço:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Mercado Pago</strong> — processamento de pagamentos;</li>
              <li><strong>Resend</strong> — envio de e-mails transacionais;</li>
              <li><strong>Vercel</strong> — hospedagem do site e métricas anônimas de uso (Vercel Analytics);</li>
              <li><strong>Supabase</strong> — banco de dados.</li>
            </ul>
            <p className="mt-2">
              6.2. <strong>Transferência internacional:</strong> alguns desses provedores podem
              armazenar dados em servidores fora do Brasil. Ao usar o serviço, você está ciente de
              que esses provedores adotam medidas de segurança para proteger seus dados.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">7. Seus direitos (LGPD)</h2>
            <p>7.1. Você tem direito a:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Acessar seus dados pessoais (via painel do cliente);</li>
              <li>Corrigir seus dados (alterar dados no painel);</li>
              <li>Solicitar a exclusão da sua conta e dos seus dados (ver seção 8);</li>
              <li>Solicitar a portabilidade dos seus dados;</li>
              <li>Revogar o consentimento a qualquer momento;</li>
              <li>Obter informações sobre o compartilhamento dos seus dados.</li>
            </ul>
            <p className="mt-2">
              7.2. Para exercer esses direitos, use o canal de contato da seção 12. Você também
              pode apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">8. Retenção e exclusão de dados</h2>
            <p>
              8.1. Mantemos seus dados pessoais enquanto sua conta existir e pelo tempo necessário
              às finalidades desta política.
            </p>
            <p className="mt-2">
              8.2. <strong>Exclusão da conta:</strong> você pode solicitar a exclusão permanente da
              sua conta e dos dados pessoais associados a qualquer momento, em{" "}
              <a href="https://www.macroforge.com.br/excluir-conta" className="text-amber-500 hover:underline">macroforge.com.br/excluir-conta</a>.
              A exclusão é concluída em até 30 dias.
            </p>
            <p className="mt-2">
              8.3. <strong>Dados retidos:</strong> por obrigação legal e fiscal, registros de
              transações de pagamento podem ser mantidos de forma anonimizada (sem vínculo com sua
              identidade) pelo prazo exigido pela legislação. Os macros ficam no seu aparelho —
              para apagá-los, desinstale o app ou limpe os dados do aplicativo nas configurações do Android.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">9. Idade mínima</h2>
            <p>
              9.1. O MacroForge é destinado a usuários com 18 anos ou mais. Ao utilizar o serviço,
              você declara ter pelo menos 18 anos de idade.
            </p>
            <p className="mt-2">
              9.2. Não coletamos intencionalmente dados de menores de 18 anos. Caso identifiquemos
              esse tipo de coleta, os dados serão excluídos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">10. Alterações</h2>
            <p>
              10.1. Podemos atualizar esta política periodicamente. Alterações significativas serão
              comunicadas por e-mail ou notificação no app, e a data de &quot;Última atualização&quot;
              no topo será revisada.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">11. MacroForge PC (programa para Windows)</h2>
            <p>
              11.1. O MacroForge PC, programa para Windows que automatiza aplicativos Android em
              emuladores no seu computador, trata os dados abaixo, além dos já descritos nesta política:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>E-mail da conta:</strong> para identificar o login e a licença (é a mesma conta do site e do app);</li>
              <li><strong>Identificador do computador:</strong> um código (hash SHA-256) calculado a partir do identificador de instalação do Windows (MachineGuid). Não revela o valor original e não contém nome ou arquivos, mas, por identificar o computador, é tratado como dado pessoal. Serve para garantir 1 computador por vez e o limite do teste grátis;</li>
              <li><strong>Nome do computador:</strong> um apelido (por padrão, o nome do computador no Windows, que você pode editar), mostrado a você para saber qual computador está conectado;</li>
              <li><strong>Versão do programa:</strong> para exigir atualizações e dar suporte;</li>
              <li><strong>Endereço IP:</strong> usado apenas para limitar pedidos em excesso e proteger contra abuso.</li>
            </ul>
            <p className="mt-2">
              11.2. O programa <strong>não</strong> lê seus arquivos pessoais, senhas ou conteúdo do seu
              computador. Ele atua sobre os emuladores Android que você usa com ele. Os macros e
              configurações ficam no seu computador.
            </p>
            <p className="mt-2">
              11.3. <strong>Finalidades:</strong> autenticar o acesso, aplicar a licença (1 computador por
              vez e teste grátis), entregar de forma protegida o conteúdo das automações, exigir versão
              mínima e prevenir fraude e abuso. A base legal é a execução do contrato e o legítimo
              interesse na segurança e no combate à fraude (LGPD, art. 7º, V e IX).
            </p>
            <p className="mt-2">
              11.4. <strong>Retenção:</strong> as sessões de computador vencidas são apagadas após 7 dias.
              O identificador do computador usado no teste grátis (o hash, nunca o MachineGuid em si) é
              mantido para impedir a repetição do teste; se a conta for excluída, ele deixa de ficar ligado
              a ela e permanece só como marca antifraude de que aquele computador já usou o teste
              (legítimo interesse, art. 7º, IX). O mesmo vale para o identificador do celular usado no teste grátis do app.
            </p>
            <p className="mt-2">
              11.5. <strong>Não vendemos</strong> esses dados nem os usamos para publicidade. Eles ficam
              no mesmo banco de dados (Supabase) e são tratados como descrito na seção 6.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">12. Contato</h2>
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
