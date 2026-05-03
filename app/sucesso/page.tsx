import Link from "next/link";

export default function Sucesso() {
  return (
    <main className="min-h-screen bg-[#0D1117] text-white flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">&#10003;</div>
        <h1 className="text-3xl font-bold mb-4 text-green-400">
          Pagamento aprovado!
        </h1>
        <p className="text-gray-400 mb-2">
          Sua chave de licenca foi gerada e sera enviada para o seu e-mail em instantes.
        </p>
        <p className="text-gray-500 text-sm mb-8">
          Verifique tambem a caixa de spam.
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
