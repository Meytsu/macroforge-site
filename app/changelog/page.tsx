export const metadata = {
  title: "Changelog — MacroForge",
  description: "Histórico de versões do MacroForge — o que mudou em cada release.",
};

type Release = {
  versao: string;
  data: string;
  destaque?: string;
  novidades?: string[];
  correcoes?: string[];
};

// Mais recente em CIMA. Adicionar nova versão = novo objeto no topo do array.
const releases: Release[] = [
  {
    versao: "v1.0",
    data: "Lançamento — junho de 2026",
    destaque: "🚀 Primeiro lançamento na Play Store",
    novidades: [
      "Editor visual de macros com crosshair (mira) e lupa de pixel",
      "Toque, Toque longo, Arrastar, Segurar + Arrastar e Espera",
      "Localizar Imagem e Localizar Pixel na tela (com OpenCV)",
      "Blocos SE (IF) e Repetir (LOOP) com sub-ações aninhadas",
      "Lista de Execução pra rodar múltiplos macros em sequência",
      "5 macros prontos pra Cabal Mobile (DG Cabal, B1F, Ovo Chocado, Selo da Escuridão, Tropa dos Soldados, Parte do Mapa)",
      "Configurações de padrões pra novas ações (delay, semelhança, tolerância, etc.)",
      "Tema claro e escuro com toggle no menu",
      "Pausa automática quando aparece notificação",
      "Auto-save dos macros enquanto edita",
      "Renomear macros e listas direto na home",
      "Exportar/importar macros via arquivo .mf",
      "Suporte ao Razr dobrado (interna ↔ externa) com fallback automático",
    ],
  },
];

export default function Changelog() {
  return (
    <main className="min-h-screen bg-[#0D1117] text-white pt-20 px-6 pb-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Changelog</h1>
        <p className="text-gray-500 text-sm mb-10">
          Histórico de versões do MacroForge.
        </p>

        <div className="space-y-8">
          {releases.map((rel) => (
            <article
              key={rel.versao}
              className="bg-[#161B22] border border-[#30363D] rounded-xl p-6"
            >
              <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                <h2 className="text-2xl font-bold text-[#D4A017]">{rel.versao}</h2>
                <span className="text-gray-500 text-sm">•</span>
                <span className="text-gray-400 text-sm">{rel.data}</span>
              </div>

              {rel.destaque && (
                <p className="text-white text-base font-bold mb-4">{rel.destaque}</p>
              )}

              {rel.novidades && rel.novidades.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                    ✨ Novidades
                  </h3>
                  <ul className="list-disc pl-6 space-y-1 text-gray-300 text-sm leading-relaxed">
                    {rel.novidades.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </div>
              )}

              {rel.correcoes && rel.correcoes.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                    🐛 Correções
                  </h3>
                  <ul className="list-disc pl-6 space-y-1 text-gray-300 text-sm leading-relaxed">
                    {rel.correcoes.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          ))}
        </div>

        <div className="mt-12 text-center text-gray-500 text-sm">
          Encontrou um bug ou tem uma ideia?{" "}
          <a href="/suporte" className="text-[#D4A017] hover:underline">
            Fale com o suporte
          </a>
          .
        </div>
      </div>
    </main>
  );
}
