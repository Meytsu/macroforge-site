import Link from "next/link";

export default function Pendente() {
  return (
    <main className="min-h-screen bg-[#0D1117] text-white flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">&#9203;</div>
        <h1 className="text-3xl font-bold mb-4 text-amber-400">
          Pagamento pendente
        </h1>
        <p className="text-gray-400 mb-8">
          Estamos aguardando a confirmacao do pagamento. Assim que confirmado,
          sua chave sera enviada por e-mail.
        </p>
        <Link
          href="/"
          className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-8 py-3 rounded-xl transition-colors"
        >
          Voltar ao inicio
        </Link>
      </div>
    </main>
  );
}
