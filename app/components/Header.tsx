"use client";

import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0D1117]/90 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/icon.png" alt="MacroForge" width={32} height={32} />
          <span className="font-bold text-white">
            Macro<span className="text-amber-500">Forge</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            Entrar
          </Link>
          <Link
            href="/cadastro?plano=mensal"
            className="bg-amber-500 hover:bg-amber-600 text-black text-sm font-bold px-4 py-2 rounded-lg transition-colors"
          >
            Criar conta
          </Link>
        </div>
      </div>
    </header>
  );
}
