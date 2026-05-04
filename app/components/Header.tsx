"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

export default function Header() {
  const [nome, setNome] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const session = sessionStorage.getItem("macroforge_session");
    if (session) {
      try {
        const data = JSON.parse(session);
        setNome(data.cliente?.nome?.split(" ")[0] || null);
      } catch {
        setNome(null);
      }
    } else {
      setNome(null);
    }
  }, [pathname]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleLogout() {
    sessionStorage.removeItem("macroforge_session");
    setNome(null);
    setMenuOpen(false);
    window.location.href = "/";
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0D1117]/90 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/icon.png" alt="MacroForge" width={32} height={32} />
          <span className="font-bold text-white">
            Macro<span className="text-amber-500">Forge</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          {nome ? (
            <div
              className="relative"
              ref={menuRef}
              onMouseEnter={() => setMenuOpen(true)}
              onMouseLeave={() => setMenuOpen(false)}
            >
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 text-white text-sm hover:text-amber-500 transition-colors"
              >
                Ola, <span className="text-amber-500 font-bold">{nome}</span>
                <span className={`text-gray-400 text-lg transition-transform ${menuOpen ? "rotate-180" : ""}`}>&#9662;</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#161B22] border border-gray-700 rounded-xl shadow-xl overflow-hidden">
                  <Link
                    href="/painel"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-sm text-white hover:bg-amber-500/10 transition-colors"
                  >
                    Meu painel
                  </Link>
                  <Link
                    href="/painel#dados"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-sm text-gray-400 hover:bg-amber-500/10 hover:text-white transition-colors"
                  >
                    Alterar dados
                  </Link>
                  <Link
                    href="/painel#senha"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-sm text-gray-400 hover:bg-amber-500/10 hover:text-white transition-colors"
                  >
                    Alterar senha
                  </Link>
                  <div className="border-t border-gray-700"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </header>
  );
}
