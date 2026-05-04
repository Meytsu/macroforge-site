import Image from "next/image";
import CheckoutButton from "./components/CheckoutButton";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0D1117] text-white">
      {/* HERO */}
      <section className="flex flex-col items-center justify-center px-6 pt-28 pb-16">
        <Image
          src="/icon.png"
          alt="MacroForge"
          width={140}
          height={140}
          className="mb-6"
        />
        <h1 className="text-4xl md:text-6xl font-bold text-center mb-4">
          Macro<span className="text-amber-500">Forge</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-400 text-center max-w-2xl mb-8">
          Automatize qualquer tarefa no celular ou emulador.
          Clicks, swipes, reconhecimento de imagem e mais.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="#planos"
            className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-8 py-4 rounded-xl text-lg transition-colors text-center"
          >
            Assinar agora
          </a>
          <a
            href="#como-funciona"
            className="border border-gray-600 hover:border-gray-400 text-gray-300 font-semibold px-8 py-4 rounded-xl text-lg transition-colors text-center"
          >
            Como funciona
          </a>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">
          O que o MacroForge faz
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            title="Click Automatico"
            description="Programe toques em qualquer ponto da tela com precisao de pixel."
          />
          <FeatureCard
            title="Reconhecimento de Imagem"
            description="Encontra botoes e elementos na tela usando template matching com OpenCV."
          />
          <FeatureCard
            title="Swipe Programavel"
            description="Crie gestos de arrastar com direcao, distancia e velocidade customizaveis."
          />
          <FeatureCard
            title="Logica Condicional"
            description="IF imagem apareceu, faca X. Senao, faca Y. Macros inteligentes."
          />
          <FeatureCard
            title="Celular e BlueStacks"
            description="Funciona em qualquer Android 8+ e emuladores como BlueStacks e LDPlayer."
          />
          <FeatureCard
            title="Salvar e Carregar"
            description="Salve seus macros e carregue com um toque. Compartilhe presets."
          />
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="px-6 py-16 bg-[#161B22]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Como funciona
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <Step number="1" title="Assine" description="Escolha seu plano e pague via PIX" />
            <Step number="2" title="Receba a chave" description="Sua chave chega por e-mail na hora" />
            <Step number="3" title="Ative no app" description="Baixe o APK e digite sua chave" />
            <Step number="4" title="Automatize" description="Crie macros e deixe o app trabalhar" />
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section id="planos" className="px-6 py-16 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">Planos</h2>
        <p className="text-gray-400 text-center mb-12">
          Cancele quando quiser. Sem fidelidade.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PlanCard
            name="Mensal"
            price="14,90"
            period="/mes"
            plano="mensal"
            features={[
              "Todas as funcionalidades",
              "1 dispositivo",
              "Suporte via WhatsApp",
              "Atualizacoes incluidas",
            ]}
            highlight={false}
          />
          <PlanCard
            name="Trimestral"
            price="34,90"
            period="/3 meses"
            plano="trimestral"
            features={[
              "Todas as funcionalidades",
              "1 dispositivo",
              "Suporte via WhatsApp",
              "Atualizacoes incluidas",
              "Economia de 22%",
            ]}
            highlight={true}
          />
          <PlanCard
            name="Semestral"
            price="59,90"
            period="/6 meses"
            plano="semestral"
            features={[
              "Todas as funcionalidades",
              "1 dispositivo",
              "Suporte prioritario",
              "Atualizacoes incluidas",
              "Economia de 33%",
            ]}
            highlight={false}
          />
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16 bg-[#161B22]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Perguntas frequentes
          </h2>
          <div className="space-y-4">
            <FaqItem
              question="Funciona em qual celular?"
              answer="Qualquer Android 8.0 ou superior. Tambem funciona em emuladores como BlueStacks, LDPlayer e Nox."
            />
            <FaqItem
              question="Posso usar no BlueStacks?"
              answer="Sim! O MacroForge funciona perfeitamente em emuladores. Ele conta como 1 dispositivo na sua licenca."
            />
            <FaqItem
              question="Leva ban no jogo?"
              answer="O MacroForge usa o servico de acessibilidade do Android, nao modifica arquivos do jogo. O risco e minimo, mas cada jogo tem suas regras."
            />
            <FaqItem
              question="Como cancelo?"
              answer="Basta nao renovar. Sua licenca expira na data final e o app para de funcionar. Sem cobranca automatica."
            />
            <FaqItem
              question="Posso trocar de celular?"
              answer="Sim! Entre em contato pelo WhatsApp que liberamos a chave para o novo dispositivo."
            />
            <FaqItem
              question="Tem reembolso?"
              answer="Sim, garantia de 7 dias. Se nao gostar, devolvemos o valor integral via PIX."
            />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-6 py-8 text-center text-gray-500 text-sm border-t border-gray-800">
        <p>MacroForge &copy; 2026 — Todos os direitos reservados</p>
        <p className="mt-2">
          Suporte:{" "}
          <a
            href="https://wa.me/5581973197753"
            className="text-amber-500 hover:underline"
            target="_blank"
          >
            WhatsApp
          </a>
        </p>
      </footer>
    </main>
  );
}

/* COMPONENTES */

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-[#161B22] border border-gray-800 rounded-xl p-6 hover:border-amber-500/50 transition-colors">
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-amber-500 text-black font-bold rounded-full flex items-center justify-center text-xl mx-auto mb-4">
        {number}
      </div>
      <h3 className="font-bold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}

function PlanCard({
  name, price, period, features, highlight, plano,
}: {
  name: string; price: string; period: string; features: string[]; highlight: boolean; plano: string;
}) {
  return (
    <div
      className={`rounded-xl p-6 border ${
        highlight
          ? "border-amber-500 bg-[#161B22] ring-2 ring-amber-500/30"
          : "border-gray-800 bg-[#161B22]"
      }`}
    >
      {highlight && (
        <div className="text-amber-500 text-xs font-bold uppercase tracking-wider mb-4">
          Mais popular
        </div>
      )}
      <h3 className="text-xl font-bold mb-2">{name}</h3>
      <div className="flex items-baseline gap-1 mb-6">
        <span className="text-sm text-gray-400">R$</span>
        <span className="text-4xl font-bold">{price}</span>
        <span className="text-gray-400 text-sm">{period}</span>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
            <span className="text-amber-500">&#10003;</span>
            {f}
          </li>
        ))}
      </ul>
      <CheckoutButton plano={plano} highlight={highlight} />
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group border border-gray-800 rounded-xl">
      <summary className="cursor-pointer px-6 py-4 font-semibold flex items-center justify-between">
        {question}
        <span className="text-amber-500 group-open:rotate-45 transition-transform text-xl">+</span>
      </summary>
      <p className="px-6 pb-4 text-gray-400 text-sm">{answer}</p>
    </details>
  );
}
