"use client";

import { useRouter } from "next/navigation";

export default function CheckoutButton({
  plano,
  highlight,
}: {
  plano: string;
  highlight: boolean;
}) {
  const router = useRouter();

  function handleClick() {
    router.push(`/cadastro?plano=${plano}`);
  }

  return (
    <button
      onClick={handleClick}
      className={`block w-full text-center py-3 rounded-lg font-bold transition-colors ${
        highlight
          ? "bg-amber-500 hover:bg-amber-600 text-black"
          : "border border-gray-600 hover:border-amber-500 text-gray-300"
      }`}
    >
      Assinar
    </button>
  );
}
