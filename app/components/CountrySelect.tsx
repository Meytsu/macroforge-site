"use client";

import { useState, useRef, useEffect } from "react";

export interface PaisInfo {
  codigo: string;
  pais: string;
  iso: string;
}

const PAISES: PaisInfo[] = [
  { codigo: "+55", pais: "Brasil", iso: "br" },
  { codigo: "+351", pais: "Portugal", iso: "pt" },
  { codigo: "+1", pais: "Estados Unidos", iso: "us" },
  { codigo: "+54", pais: "Argentina", iso: "ar" },
  { codigo: "+598", pais: "Uruguai", iso: "uy" },
  { codigo: "+595", pais: "Paraguai", iso: "py" },
  { codigo: "+56", pais: "Chile", iso: "cl" },
  { codigo: "+57", pais: "Colombia", iso: "co" },
  { codigo: "+51", pais: "Peru", iso: "pe" },
  { codigo: "+34", pais: "Espanha", iso: "es" },
  { codigo: "+39", pais: "Italia", iso: "it" },
  { codigo: "+44", pais: "Reino Unido", iso: "gb" },
  { codigo: "+49", pais: "Alemanha", iso: "de" },
  { codigo: "+33", pais: "Franca", iso: "fr" },
  { codigo: "+81", pais: "Japao", iso: "jp" },
  { codigo: "+82", pais: "Coreia do Sul", iso: "kr" },
  { codigo: "+244", pais: "Angola", iso: "ao" },
  { codigo: "+258", pais: "Mocambique", iso: "mz" },
];

export { PAISES };

function Flag({ iso, size = 20 }: { iso: string; size?: number }) {
  return (
    <img
      src={`https://flagcdn.com/w${size}/${iso}.png`}
      srcSet={`https://flagcdn.com/w${size * 2}/${iso}.png 2x`}
      width={size}
      height={Math.round(size * 0.75)}
      alt=""
      className="inline-block rounded-sm flex-shrink-0"
    />
  );
}

export function PhoneCodeSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (codigo: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const selected = PAISES.find(p => p.codigo === value) || PAISES[0];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = search
    ? PAISES.filter(p =>
        p.pais.toLowerCase().includes(search.toLowerCase()) ||
        p.codigo.includes(search)
      )
    : PAISES;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => { setOpen(!open); setSearch(""); }}
        className="flex items-center gap-2 px-3 py-3 rounded-lg bg-[#0D1117] border border-gray-700 text-white text-sm hover:border-amber-500 focus:border-amber-500 focus:outline-none w-36"
      >
        <Flag iso={selected.iso} />
        <span>{selected.codigo}</span>
        <span className="ml-auto text-gray-400 text-xs">&#9662;</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-[#161B22] border border-gray-700 rounded-lg shadow-xl z-50 max-h-64 overflow-hidden">
          <div className="p-2">
            <input
              type="text"
              placeholder="Buscar pais..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
              className="w-full px-3 py-2 rounded bg-[#0D1117] border border-gray-700 text-white text-sm focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.map(p => (
              <button
                key={p.codigo}
                type="button"
                onClick={() => { onChange(p.codigo); setOpen(false); }}
                className={`flex items-center gap-3 w-full px-3 py-2 text-sm hover:bg-amber-500/10 transition-colors ${
                  p.codigo === value ? "bg-amber-500/20 text-amber-400" : "text-white"
                }`}
              >
                <Flag iso={p.iso} />
                <span className="font-mono">{p.codigo}</span>
                <span className="text-gray-400">{p.pais}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function CountrySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (pais: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const selected = PAISES.find(p => p.pais === value) || PAISES[0];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = search
    ? PAISES.filter(p => p.pais.toLowerCase().includes(search.toLowerCase()))
    : PAISES;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => { setOpen(!open); setSearch(""); }}
        className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-[#0D1117] border border-gray-700 text-white text-sm hover:border-amber-500 focus:border-amber-500 focus:outline-none"
      >
        <Flag iso={selected.iso} />
        <span>{selected.pais}</span>
        <span className="ml-auto text-gray-400 text-xs">&#9662;</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#161B22] border border-gray-700 rounded-lg shadow-xl z-50 max-h-64 overflow-hidden">
          <div className="p-2">
            <input
              type="text"
              placeholder="Buscar pais..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
              className="w-full px-3 py-2 rounded bg-[#0D1117] border border-gray-700 text-white text-sm focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.map(p => (
              <button
                key={p.pais}
                type="button"
                onClick={() => { onChange(p.pais); setOpen(false); }}
                className={`flex items-center gap-3 w-full px-3 py-2 text-sm hover:bg-amber-500/10 transition-colors ${
                  p.pais === value ? "bg-amber-500/20 text-amber-400" : "text-white"
                }`}
              >
                <Flag iso={p.iso} />
                <span>{p.pais}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
