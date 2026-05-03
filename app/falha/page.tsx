import Link from "next/link";

export default function Falha() {
  return (
    <main className="min-h-screen bg-[#0D1117] text-white flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">&#10007;</div>
        <h1 className="text-3xl font-bold mb-4 text-red-400">
          Pagamento nao aprovado
        </h1>
        <p className="text-gray-400 mb-8">
          Houve um problema com o pagamento. Tente novamente ou use outro metodo.
        </p>
        <Link
          href="/#planos"
          className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-8 py-3 rounded-xl transition-colors"
        >
          Tentar novamente
        </Link>
      </div>
    </main>
  );
}
