"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

interface Licenca {
  chave: string;
  plano: string;
  valor: number;
  status: string;
  device_id: string | null;
  data_inicio: string;
  data_expiracao: string;
}

interface Cliente {
  id: string;
  nome: string;
  email: string;
  whatsapp: string | null;
  pais: string | null;
  estado: string | null;
  cidade: string | null;
}

interface SessionData {
  cliente: Cliente;
  licencas: Licenca[];
}

function diasRestantes(dataExp: string): number {
  const exp = new Date(dataExp);
  const agora = new Date();
  const diff = exp.getTime() - agora.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatarData(data: string): string {
  return new Date(data).toLocaleDateString("pt-BR");
}

function StatusBadge({ status, dataExp }: { status: string; dataExp: string }) {
  const expirada = diasRestantes(dataExp) === 0 && status === "ativa";
  const statusFinal = expirada ? "expirada" : status;

  const cores: Record<string, string> = {
    ativa: "bg-green-500/20 text-green-400 border-green-500/30",
    expirada: "bg-red-500/20 text-red-400 border-red-500/30",
    cancelada: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    suspensa: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${cores[statusFinal] || cores.cancelada}`}>
      {statusFinal.charAt(0).toUpperCase() + statusFinal.slice(1)}
    </span>
  );
}

export default function PainelPage() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = sessionStorage.getItem("macroforge_session");
    if (!stored) {
      router.push("/login");
      return;
    }
    const cached: SessionData = JSON.parse(stored);
    setSession(cached);
    setLoading(false);

    // Rebusca do servidor ao abrir/atualizar — o sessionStorage e um retrato
    // do momento do login e fica velho (ex.: trial ativado no app DEPOIS do login
    // nao aparecia ate deslogar/logar). GET /api/painel devolve cliente + licencas atuais.
    const email = cached?.cliente?.email;
    if (!email) return;
    fetch(`/api/painel?email=${encodeURIComponent(email)}`)
      .then(res => (res.ok ? res.json() : null))
      .then((fresh: SessionData | null) => {
        if (fresh && fresh.cliente && Array.isArray(fresh.licencas)) {
          setSession(fresh);
          sessionStorage.setItem("macroforge_session", JSON.stringify(fresh));
        }
      })
      .catch(() => { /* sem rede: mantem o que tinha no cache */ });
  }, [router]);

  function handleLogout() {
    sessionStorage.removeItem("macroforge_session");
    router.push("/");
  }

  if (loading || !session) {
    return (
      <main className="min-h-screen bg-[#0D1117] text-white flex items-center justify-center">
        <p className="text-gray-400">Carregando...</p>
      </main>
    );
  }

  const { cliente, licencas } = session;
  const ativas = licencas.filter(l => l.status === "ativa" && diasRestantes(l.data_expiracao) > 0);
  const outras = licencas.filter(l => l.status !== "ativa" || diasRestantes(l.data_expiracao) === 0);

  return (
    <main className="min-h-screen bg-[#0D1117] text-white pt-20 px-4 pb-12">
      <div className="max-w-2xl mx-auto">

        {/* Header do painel */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">
              Ola, <span className="text-amber-500">{cliente.nome.split(" ")[0]}</span>!
            </h1>
            <p className="text-gray-400 text-sm">{cliente.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-500 hover:text-red-400 text-sm transition-colors"
          >
            Sair
          </button>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-[#161B22] border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-amber-500">{ativas.length}</p>
            <p className="text-gray-400 text-sm">Licencas ativas</p>
          </div>
          <div className="bg-[#161B22] border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold">{licencas.length}</p>
            <p className="text-gray-400 text-sm">Total de licencas</p>
          </div>
        </div>

        {/* Licenças ativas */}
        {ativas.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4">Licencas ativas</h2>
            <div className="space-y-4">
              {ativas.map(lic => (
                <LicencaCard key={lic.chave} licenca={lic} email={cliente.email} onReset={() => {
                  // Recarrega dados do servidor
                  fetch("/api/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: cliente.email, senha: "_skip_" }),
                  });
                  // Atualiza localmente
                  const updated = { ...lic, device_id: null };
                  const newLicencas = licencas.map(l => l.chave === lic.chave ? updated : l);
                  const newSession = { ...session, licencas: newLicencas };
                  setSession(newSession);
                  sessionStorage.setItem("macroforge_session", JSON.stringify(newSession));
                }} />
              ))}
            </div>
          </div>
        )}

        {/* Licenças expiradas/canceladas */}
        {outras.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4 text-gray-400">Historico</h2>
            <div className="space-y-4">
              {outras.map(lic => (
                <LicencaCard key={lic.chave} licenca={lic} email={cliente.email} onReset={() => {
                  // Recarrega dados do servidor
                  fetch("/api/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: cliente.email, senha: "_skip_" }),
                  });
                  // Atualiza localmente
                  const updated = { ...lic, device_id: null };
                  const newLicencas = licencas.map(l => l.chave === lic.chave ? updated : l);
                  const newSession = { ...session, licencas: newLicencas };
                  setSession(newSession);
                  sessionStorage.setItem("macroforge_session", JSON.stringify(newSession));
                }} />
              ))}
            </div>
          </div>
        )}

        {/* Sem licenças */}
        {licencas.length === 0 && (
          <div className="bg-[#161B22] border border-gray-800 rounded-xl p-8 text-center">
            <p className="text-gray-400 mb-4">Voce ainda nao tem nenhuma licenca.</p>
            <Link
              href="/planos"
              className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-6 py-3 rounded-xl transition-colors"
            >
              Comprar agora
            </Link>
          </div>
        )}

        {/* Download do app */}
        {ativas.length > 0 && (
          <div className="mb-8 bg-[#161B22] border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold mb-1">Baixar MacroForge</h3>
                <p className="text-gray-400 text-xs">Android 8.0+ | v1.0.0 | Funciona no celular e BlueStacks</p>
              </div>
              <a
                href="https://github.com/Meytsu/macroforge-site/releases/download/v1.0.0/MacroForge_v1.0.0.apk"
                className="bg-green-600 hover:bg-green-700 text-white font-bold px-5 py-3 rounded-xl transition-colors text-sm flex-shrink-0"
                download
              >
                Baixar APK
              </a>
            </div>
          </div>
        )}

        {/* Botão comprar mais */}
        {licencas.length > 0 && (
          <div className="text-center">
            <Link
              href="/planos"
              className="inline-block bg-amber-500 hover:bg-amber-600 text-black font-bold px-6 py-3 rounded-xl transition-colors"
            >
              Comprar nova licenca
            </Link>
          </div>
        )}

        {/* Dados pessoais */}
        <div className="mt-12 bg-[#161B22] border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Seus dados</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <p className="text-gray-500">Nome</p>
              <p>{cliente.nome}</p>
            </div>
            <div>
              <p className="text-gray-500">E-mail</p>
              <p>{cliente.email} <span className="text-gray-600 text-xs">(fixo)</span></p>
            </div>
            <div>
              <p className="text-gray-500">WhatsApp</p>
              <p>{cliente.whatsapp || "—"}</p>
            </div>
            <div>
              <p className="text-gray-500">Local</p>
              <p>
                {[cliente.cidade, cliente.estado, cliente.pais]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </p>
            </div>
          </div>
          <div className="flex gap-3 pt-3 border-t border-gray-800">
            <EditarDadosButton cliente={cliente} onUpdate={(c) => {
              const newSession = { ...session, cliente: { ...cliente, ...c } };
              setSession(newSession);
              sessionStorage.setItem("macroforge_session", JSON.stringify(newSession));
            }} />
            <AlterarSenhaButton email={cliente.email} />
          </div>
        </div>

        {/* Suporte */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            Precisa de ajuda?{" "}
            <a
              href="https://wa.me/5581973197753"
              target="_blank"
              className="text-amber-500 hover:underline"
            >
              Fale conosco no WhatsApp
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}

function LicencaCard({ licenca, email, onReset }: { licenca: Licenca; email: string; onReset: () => void }) {
  const [mostrarChave, setMostrarChave] = useState(false);
  const [resetando, setResetando] = useState(false);
  const [pedindoSenha, setPedindoSenha] = useState(false);
  const [senhaReset, setSenhaReset] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const dias = diasRestantes(licenca.data_expiracao);

  async function handleReset() {
    if (!pedindoSenha) {
      setPedindoSenha(true);
      return;
    }
    if (!senhaReset) {
      setResetMsg("Digite sua senha pra confirmar");
      return;
    }
    setResetando(true);
    setResetMsg("");
    try {
      const res = await fetch("/api/reset-device", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha: senhaReset, chave: licenca.chave }),
      });
      const data = await res.json();
      if (data.ok) {
        setResetMsg("Dispositivo liberado!");
        setPedindoSenha(false);
        setSenhaReset("");
        onReset();
      } else {
        setResetMsg(data.error || "Erro ao resetar");
      }
    } catch {
      setResetMsg("Erro de conexao");
    }
    setResetando(false);
  }

  return (
    <div className="bg-[#161B22] border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <StatusBadge status={licenca.status} dataExp={licenca.data_expiracao} />
          <span className="text-sm text-gray-400 capitalize">{licenca.plano}</span>
        </div>
        <span className="text-sm font-bold">R$ {Number(licenca.valor).toFixed(2).replace(".", ",")}</span>
      </div>

      {/* Chave */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-gray-500">Chave:</span>
        <code className="bg-[#0D1117] px-3 py-1 rounded text-sm font-mono">
          {mostrarChave ? licenca.chave : "MF-****-****-****"}
        </code>
        <button
          onClick={() => setMostrarChave(!mostrarChave)}
          className="text-amber-500 text-xs hover:underline"
        >
          {mostrarChave ? "Ocultar" : "Mostrar"}
        </button>
        {mostrarChave && (
          <button
            onClick={() => navigator.clipboard.writeText(licenca.chave)}
            className="text-gray-400 text-xs hover:text-white"
          >
            Copiar
          </button>
        )}
      </div>

      {/* Detalhes */}
      <div className="grid grid-cols-3 gap-4 text-xs text-gray-400">
        <div>
          <p className="text-gray-600">Inicio</p>
          <p>{formatarData(licenca.data_inicio)}</p>
        </div>
        <div>
          <p className="text-gray-600">Expira</p>
          <p>{formatarData(licenca.data_expiracao)}</p>
        </div>
        <div>
          <p className="text-gray-600">Restante</p>
          <p className={dias > 7 ? "text-green-400" : dias > 0 ? "text-yellow-400" : "text-red-400"}>
            {dias > 0 ? `${dias} dias` : "Expirada"}
          </p>
        </div>
      </div>

      {/* Dispositivo */}
      <div className="mt-3 pt-3 border-t border-gray-800">
        {licenca.device_id ? (
          <div className="space-y-2">
            <DeviceRow deviceId={licenca.device_id!} chave={licenca.chave} onReset={handleReset} />
            {pedindoSenha && (
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={senhaReset}
                  onChange={e => setSenhaReset(e.target.value)}
                  placeholder="Sua senha pra confirmar"
                  className="flex-1 px-3 py-1.5 rounded bg-[#0D1117] border border-gray-700 text-white text-xs focus:border-amber-500 focus:outline-none"
                />
                <button
                  onClick={handleReset}
                  disabled={resetando}
                  className="bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold px-3 py-1.5 rounded transition-colors"
                >
                  {resetando ? "..." : "Confirmar"}
                </button>
                <button
                  onClick={() => { setPedindoSenha(false); setSenhaReset(""); setResetMsg(""); }}
                  className="text-gray-500 text-xs hover:text-white"
                >
                  Cancelar
                </button>
              </div>
            )}
            {resetMsg && (
              <p className={`text-xs ${resetMsg.includes("liberado") ? "text-green-400" : "text-red-400"}`}>{resetMsg}</p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            <span className="text-yellow-400">Nenhum dispositivo cadastrado — ative no app MacroForge</span>
          </div>
        )}
      </div>
    </div>
  );
}

function EditarDadosButton({ cliente, onUpdate }: { cliente: Cliente; onUpdate: (c: Partial<Cliente>) => void }) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState(cliente.nome);
  const [whatsapp, setWhatsapp] = useState(cliente.whatsapp || "");
  const [pais, setPais] = useState(cliente.pais || "");
  const [estado, setEstado] = useState(cliente.estado || "");
  const [cidade, setCidade] = useState(cliente.cidade || "");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function salvar() {
    if (!nome.trim()) { setMsg("Nome obrigatorio"); return; }
    setLoading(true);
    setMsg("");

    try {
      const res = await fetch("/api/atualizar-dados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cliente.email, nome, whatsapp, pais, estado, cidade }),
      });
      const data = await res.json();
      if (data.ok) {
        setMsg("Dados atualizados!");
        onUpdate({ nome, whatsapp, pais, estado, cidade });
        setTimeout(() => setOpen(false), 1000);
      } else {
        setMsg(data.error || "Erro ao atualizar");
      }
    } catch {
      setMsg("Erro de conexao");
    }
    setLoading(false);
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-amber-500 text-sm hover:underline">
        Alterar dados
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="bg-[#161B22] border border-gray-700 rounded-xl p-6 w-full max-w-md space-y-4">
        <h3 className="text-lg font-bold">Alterar dados</h3>
        <p className="text-gray-500 text-xs">O e-mail nao pode ser alterado.</p>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Nome completo</label>
          <input value={nome} onChange={e => setNome(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#0D1117] border border-gray-700 text-white text-sm focus:border-amber-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">WhatsApp</label>
          <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#0D1117] border border-gray-700 text-white text-sm focus:border-amber-500 focus:outline-none" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Pais</label>
            <input value={pais} onChange={e => setPais(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0D1117] border border-gray-700 text-white text-sm focus:border-amber-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Estado</label>
            <input value={estado} onChange={e => setEstado(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0D1117] border border-gray-700 text-white text-sm focus:border-amber-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Cidade</label>
            <input value={cidade} onChange={e => setCidade(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#0D1117] border border-gray-700 text-white text-sm focus:border-amber-500 focus:outline-none" />
          </div>
        </div>

        {msg && <p className={`text-sm text-center ${msg.includes("atualizado") ? "text-green-400" : "text-red-400"}`}>{msg}</p>}

        <div className="flex gap-3">
          <button onClick={salvar} disabled={loading}
            className="flex-1 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-bold text-sm transition-colors">
            {loading ? "Salvando..." : "Salvar"}
          </button>
          <button onClick={() => setOpen(false)}
            className="flex-1 py-2 rounded-lg border border-gray-600 text-gray-400 hover:text-white text-sm transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function AlterarSenhaButton({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [showSenhas, setShowSenhas] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const valida = {
    tamanho: novaSenha.length >= 8,
    maiuscula: /[A-Z]/.test(novaSenha),
    minuscula: /[a-z]/.test(novaSenha),
    especial: /[!@#$%&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(novaSenha),
    igual: novaSenha === confirmar && confirmar.length > 0,
  };
  const senhaOk = valida.tamanho && valida.maiuscula && valida.minuscula && valida.especial && valida.igual;

  async function alterar() {
    if (!senhaAtual) { setMsg("Digite a senha atual"); return; }
    if (!senhaOk) { setMsg("Nova senha nao atende os requisitos"); return; }

    setLoading(true);
    setMsg("");

    try {
      const res = await fetch("/api/alterar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senhaAtual, novaSenha }),
      });
      const data = await res.json();
      if (data.ok) {
        setMsg("Senha alterada com sucesso!");
        setTimeout(() => { setOpen(false); setSenhaAtual(""); setNovaSenha(""); setConfirmar(""); }, 1500);
      } else {
        setMsg(data.error || "Erro ao alterar");
      }
    } catch {
      setMsg("Erro de conexao");
    }
    setLoading(false);
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-gray-400 text-sm hover:underline">
        Alterar senha
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
      <div className="bg-[#161B22] border border-gray-700 rounded-xl p-6 w-full max-w-md space-y-4">
        <h3 className="text-lg font-bold">Alterar senha</h3>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Senha atual</label>
          <input type={showSenhas ? "text" : "password"} value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#0D1117] border border-gray-700 text-white text-sm focus:border-amber-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Nova senha</label>
          <input type={showSenhas ? "text" : "password"} value={novaSenha} onChange={e => setNovaSenha(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#0D1117] border border-gray-700 text-white text-sm focus:border-amber-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Confirmar nova senha</label>
          <input type={showSenhas ? "text" : "password"} value={confirmar} onChange={e => setConfirmar(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#0D1117] border border-gray-700 text-white text-sm focus:border-amber-500 focus:outline-none" />
        </div>

        <button onClick={() => setShowSenhas(!showSenhas)} className="text-xs text-gray-500 hover:text-amber-500">
          {showSenhas ? "Ocultar senhas" : "Mostrar senhas"}
        </button>

        {novaSenha.length > 0 && (
          <div className="grid grid-cols-2 gap-1 text-xs">
            <span className={valida.tamanho ? "text-green-400" : "text-gray-500"}>{valida.tamanho ? "\u2713" : "\u2717"} 8+ caracteres</span>
            <span className={valida.maiuscula ? "text-green-400" : "text-gray-500"}>{valida.maiuscula ? "\u2713" : "\u2717"} Maiuscula</span>
            <span className={valida.minuscula ? "text-green-400" : "text-gray-500"}>{valida.minuscula ? "\u2713" : "\u2717"} Minuscula</span>
            <span className={valida.especial ? "text-green-400" : "text-gray-500"}>{valida.especial ? "\u2713" : "\u2717"} Especial</span>
            <span className={valida.igual ? "text-green-400" : "text-gray-500"}>{valida.igual ? "\u2713" : "\u2717"} Senhas iguais</span>
          </div>
        )}

        {msg && <p className={`text-sm text-center ${msg.includes("sucesso") ? "text-green-400" : "text-red-400"}`}>{msg}</p>}

        <div className="flex gap-3">
          <button onClick={alterar} disabled={loading || !senhaOk}
            className={`flex-1 py-2 rounded-lg font-bold text-sm transition-colors ${
              senhaOk ? "bg-amber-500 hover:bg-amber-600 text-black" : "bg-gray-700 text-gray-500 cursor-not-allowed"
            }`}>
            {loading ? "Alterando..." : "Alterar senha"}
          </button>
          <button onClick={() => setOpen(false)}
            className="flex-1 py-2 rounded-lg border border-gray-600 text-gray-400 hover:text-white text-sm transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function DeviceRow({ deviceId, chave, onReset }: { deviceId: string; chave: string; onReset: () => void }) {
  const storageKey = `device_name_${chave}`;
  const [nomeDevice, setNomeDevice] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(storageKey) || "";
    }
    return "";
  });
  const [editando, setEditando] = useState(false);
  const [novoNome, setNovoNome] = useState(nomeDevice);

  function salvarNome() {
    setNomeDevice(novoNome);
    localStorage.setItem(storageKey, novoNome);
    setEditando(false);
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-xs flex-wrap">
        <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></span>
        <span className="text-gray-400">Dispositivo:</span>
        {nomeDevice ? (
          <span className="text-white font-medium">{nomeDevice}</span>
        ) : (
          <span className="font-mono text-white bg-[#0D1117] px-2 py-0.5 rounded">{deviceId}</span>
        )}
        {editando ? (
          <span className="flex items-center gap-1">
            <input
              type="text"
              value={novoNome}
              onChange={e => setNovoNome(e.target.value)}
              placeholder="Ex: Meu Celular"
              className="px-2 py-0.5 rounded bg-[#0D1117] border border-gray-700 text-white text-xs w-28 focus:border-amber-500 focus:outline-none"
              autoFocus
            />
            <button onClick={salvarNome} className="text-green-400 text-xs hover:underline">OK</button>
            <button onClick={() => setEditando(false)} className="text-gray-500 text-xs hover:underline">X</button>
          </span>
        ) : (
          <button onClick={() => { setEditando(true); setNovoNome(nomeDevice); }} className="text-gray-500 text-xs hover:text-amber-500">
            {nomeDevice ? "editar" : "nomear"}
          </button>
        )}
      </div>
      <button onClick={onReset} className="text-amber-500 text-xs hover:underline flex-shrink-0">
        Trocar dispositivo
      </button>
    </div>
  );
}
