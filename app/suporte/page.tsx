export const metadata = {
  title: "Suporte — MacroForge",
  description: "Canais de suporte do MacroForge: email, WhatsApp e formulário de contato.",
};

export default function Suporte() {
  // O número do WhatsApp já é o do Henrique (presente em outros lugares do app).
  const whatsappLink = "https://wa.me/5581973197753";
  const emailSuporte = "suporte@macroforge.com.br";

  return (
    <main className="min-h-screen bg-[#0D1117] text-white pt-20 px-6 pb-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Suporte</h1>
        <p className="text-gray-500 text-sm mb-8">
          Precisa de ajuda? Escolha o canal que preferir.
        </p>

        <div className="space-y-4">
          {/* Email */}
          <a
            href={`mailto:${emailSuporte}`}
            className="block bg-[#161B22] border border-[#30363D] rounded-xl p-5 hover:border-[#D4A017] transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl">📧</div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-white mb-1">Email</h2>
                <p className="text-gray-400 text-sm mb-1">
                  Resposta em até 24h úteis
                </p>
                <p className="text-[#D4A017] text-sm font-mono">{emailSuporte}</p>
              </div>
            </div>
          </a>

          {/* WhatsApp */}
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-[#161B22] border border-[#30363D] rounded-xl p-5 hover:border-[#D4A017] transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl">💬</div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-white mb-1">WhatsApp</h2>
                <p className="text-gray-400 text-sm mb-1">
                  Atendimento direto. Resposta no horário comercial.
                </p>
                <p className="text-[#D4A017] text-sm">Toque para abrir o chat</p>
              </div>
            </div>
          </a>

          {/* Formulário simples (mailto fallback) — depois trocamos pra Formspree/Resend */}
          <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-3xl">📝</div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-white mb-1">Formulário</h2>
                <p className="text-gray-400 text-sm">
                  Prefere escrever sem usar seu email pessoal? Use este formulário.
                </p>
              </div>
            </div>

            <form
              action={`mailto:${emailSuporte}`}
              method="POST"
              encType="text/plain"
              className="space-y-3"
            >
              <input
                type="text"
                name="nome"
                placeholder="Seu nome (opcional)"
                className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg p-3 text-white placeholder-gray-500 focus:border-[#D4A017] focus:outline-none"
              />
              <input
                type="email"
                name="email"
                placeholder="Seu email (para resposta)"
                required
                className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg p-3 text-white placeholder-gray-500 focus:border-[#D4A017] focus:outline-none"
              />
              <textarea
                name="mensagem"
                placeholder="Sua mensagem"
                required
                rows={5}
                className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg p-3 text-white placeholder-gray-500 focus:border-[#D4A017] focus:outline-none resize-none"
              />
              <button
                type="submit"
                className="w-full bg-[#D4A017] text-black font-bold rounded-lg p-3 hover:bg-[#E5B12E] transition-colors"
              >
                Enviar mensagem
              </button>
            </form>
          </div>
        </div>

        {/* Aviso pequeno embaixo */}
        <div className="mt-8 text-gray-500 text-xs text-center space-y-1">
          <p>Antes de pedir ajuda, dê uma olhada no <a href="/faq" className="text-[#D4A017] hover:underline">FAQ</a>.</p>
          <p>Pra ver o que mudou nas versões, consulte o <a href="/changelog" className="text-[#D4A017] hover:underline">changelog</a>.</p>
        </div>
      </div>
    </main>
  );
}
