"use client";

import { useState, useEffect, useMemo, useSyncExternalStore } from "react";
import { NOME_NIVEL, URL_PLAY_STORE } from "@/app/lib/precos";
import { URL_INSTALADOR_PC } from "@/app/lib/pc";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

// ADR-MF-XCROSS-022 (2026-11-22): o painel mostra o PLANO da conta (nível, aparelhos + 1 PC, validade, origem), não
// chaves. A `chave` ainda vem do /api/painel porque o /api/reset-device das licenças antigas a usa, mas NÃO é exibida
// (nas licenças novas ela é um identificador interno). Os campos de plano são opcionais: a sessão gravada por um
// login antigo no sessionStorage pode não tê-los até o GET /api/painel responder.
interface Licenca {
  chave: string;
  plano: string;
  valor: number;
  status: string;
  device_id: string | null;
  data_inicio: string | null;
  data_expiracao: string;
  nivel?: string | null;
  origem?: string | null;
  max_dispositivos?: number | null;
  auto_renews?: boolean | null;
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
  token?: string; // crachá (JWT) emitido no login — enviado nas chamadas autenticadas
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

function formatarDiaMes(data: string): string {
  return new Date(data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

/** Licença paga que ainda não começou: plano diferente comprado no site espera o atual acabar (sql/15). */
function estaNaFila(l: Licenca): boolean {
  return !!l.data_inicio && new Date(l.data_inicio).getTime() > new Date().getTime();
}

function vigente(l: Licenca): boolean {
  return l.status === "ativa" && diasRestantes(l.data_expiracao) > 0;
}

function nomeDoPlano(l: Licenca): string {
  const n = l.nivel ?? (l.plano === "trial" ? "trial" : null);
  if (n && n in NOME_NIVEL) return NOME_NIVEL[n as keyof typeof NOME_NIVEL];
  return l.plano ? l.plano.charAt(0).toUpperCase() + l.plano.slice(1) : "Plano";
}

function textoAparelhos(l: Licenca): string {
  const n = l.max_dispositivos ?? 1;
  const trial = l.nivel === "trial" || l.plano === "trial";
  const app = n === 1 ? (trial ? "1 celular" : "1 aparelho") : `${n} aparelhos`;
  return `${app} ao mesmo tempo + 1 PC`;
}

const ORIGENS: Record<string, string> = {
  play_billing: "Google Play",
  mercado_pago: "Site (Mercado Pago)",
  admin: "Liberado pelo suporte",
  trial: "Teste grátis",
};

function textoOrigem(l: Licenca): string | null {
  return l.origem ? ORIGENS[l.origem] ?? l.origem : null;
}

function StatusBadge({ licenca }: { licenca: Licenca }) {
  let texto: string;
  let cor: string;
  if (vigente(licenca)) {
    if (estaNaFila(licenca)) {
      texto = `Na fila — começa em ${formatarDiaMes(licenca.data_inicio!)}`;
      cor = "bg-sky-500/20 text-sky-400 border-sky-500/30";
    } else {
      texto = "Ativo";
      cor = "bg-green-500/20 text-green-400 border-green-500/30";
    }
  } else if (licenca.status === "ativa" || licenca.status === "expirada") {
    texto = "Expirado";
    cor = "bg-red-500/20 text-red-400 border-red-500/30";
  } else if (licenca.status === "suspensa") {
    texto = "Suspenso";
    cor = "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  } else {
    texto = licenca.status === "cancelada" ? "Cancelado" : licenca.status;
    cor = "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }

  return <span className={`px-3 py-1 rounded-full text-xs font-bold border ${cor}`}>{texto}</span>;
}

// O sessionStorage não avisa mudanças da própria aba: quem grava aqui (logout, renomear, trial…) também chama
// setSession, então a página não precisa assinar nada.
const semAssinatura = () => () => {};
const lerSessaoGuardada = () => sessionStorage.getItem("macroforge_session");

export default function PainelPage() {
  // A sessão gravada no login, lida do sessionStorage pelo useSyncExternalStore (2026-11-20: o setState síncrono
  // dentro do useEffect renderizava duas vezes — regra react-hooks/set-state-in-effect). No servidor não existe
  // sessionStorage: undefined = ainda carregando; null = sem sessão (vai para o login).
  const guardada = useSyncExternalStore(semAssinatura, lerSessaoGuardada, () => undefined);
  const cache = useMemo<SessionData | null>(() => (guardada ? JSON.parse(guardada) : null), [guardada]);
  const [atualizada, setSession] = useState<SessionData | null>(null);
  const session = atualizada ?? cache;
  const loading = guardada === undefined;
  const router = useRouter();

  useEffect(() => {
    if (guardada === undefined) return;
    if (guardada === null) {
      router.push("/login");
      return;
    }

    // Rebusca do servidor ao abrir/atualizar — o sessionStorage e um retrato
    // do momento do login e fica velho (ex.: trial ativado no app DEPOIS do login
    // nao aparecia ate deslogar/logar). GET /api/painel devolve cliente + licencas atuais.
    // /api/painel agora exige o crachá (Authorization: Bearer). Sem token (sessão
    // antiga), pula o refresh e mantém o retrato do login.
    const token = cache?.token;
    if (!token) return;
    fetch(`/api/painel`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => (res.ok ? res.json() : null))
      .then((fresh: { cliente: Cliente; licencas: Licenca[] } | null) => {
        if (fresh && fresh.cliente && Array.isArray(fresh.licencas)) {
          // o /api/painel não devolve token — preserva o crachá ao regravar a sessão.
          const merged: SessionData = { ...fresh, token };
          setSession(merged);
          sessionStorage.setItem("macroforge_session", JSON.stringify(merged));
        }
      })
      .catch(() => { /* sem rede: mantem o que tinha no cache */ });
  }, [guardada, cache, router]);

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
  const naFila = licencas
    .filter(l => vigente(l) && estaNaFila(l))
    .sort((x, y) => new Date(x.data_inicio!).getTime() - new Date(y.data_inicio!).getTime());
  const ativos = licencas.filter(l => vigente(l) && !estaNaFila(l));
  const historico = licencas.filter(l => !vigente(l));

  // Reset do aparelho de uma licença ANTIGA (por chave, 1 aparelho): o servidor já confirmou (data.ok); aqui só se
  // grava a mudança localmente. 🔴 2026-08-09: aqui havia um POST no /api/login com a senha "_skip_" que contava como
  // tentativa de invasão e bloqueava a conta no quinto reset — não volta. Para rebuscar do servidor de verdade, o
  // caminho é o GET /api/painel com o crachá, como na abertura da tela.
  function aparelhoLiberado(lic: Licenca) {
    if (!session) return;
    const newLicencas = licencas.map(l => (l.chave === lic.chave ? { ...l, device_id: null } : l));
    const newSession = { ...session, licencas: newLicencas };
    setSession(newSession);
    sessionStorage.setItem("macroforge_session", JSON.stringify(newSession));
  }

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

        {/* Seu plano (ADR-MF-XCROSS-022): o que vale agora + o que está na fila */}
        {(ativos.length > 0 || naFila.length > 0) && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4">Seu plano</h2>
            <div className="space-y-4">
              {[...ativos, ...naFila].map(lic => (
                <PlanoCard key={lic.chave} licenca={lic} email={cliente.email} onReset={() => aparelhoLiberado(lic)} />
              ))}
            </div>
            {ativos.length === 0 && (
              <p className="text-gray-400 text-sm mt-3">
                Nenhum plano valendo agora — o da fila começa sozinho na data indicada.
              </p>
            )}
          </div>
        )}

        {/* Sem plano valendo */}
        {ativos.length === 0 && naFila.length === 0 && (
          <div className="mb-8 bg-[#161B22] border border-gray-800 rounded-xl p-8 text-center">
            <p className="text-gray-400 mb-4">
              {licencas.length === 0 ? "Voce ainda nao tem nenhum plano." : "Voce nao tem nenhum plano ativo agora."}
            </p>
            <Link
              href="/planos"
              className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-6 py-3 rounded-xl transition-colors"
            >
              Ver planos
            </Link>
          </div>
        )}

        {/* Aparelhos usando a conta agora (vagas) — o mesmo "Meu plano" do app (/api/aparelhos) */}
        {session.token && <AparelhosConectados token={session.token} />}

        {/* Planos que já acabaram */}
        {historico.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4 text-gray-400">Historico</h2>
            <div className="space-y-4">
              {historico.map(lic => (
                <PlanoCard key={lic.chave} licenca={lic} email={cliente.email} onReset={() => aparelhoLiberado(lic)} />
              ))}
            </div>
          </div>
        )}

        {/* Baixar o app (2026-10-12): o MacroForge está publicado na Google Play — saiu o passo a passo do teste
            fechado (grupo de testadores + "Tornar-se testador"). Selo oficial do Google em /public. */}
        <div className="mb-8 bg-[#161B22] border border-gray-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h3 className="font-bold mb-1">Baixe o MacroForge</h3>
            <p className="text-gray-400 text-sm">
              Instale pela Google Play e ative <span className="text-amber-500 font-semibold">3 dias grátis</span> no app.
            </p>
          </div>
          <a href={URL_PLAY_STORE} target="_blank" rel="noopener noreferrer" className="shrink-0">
            <Image
              src="/google-play-badge.png"
              alt="Disponível no Google Play"
              width={646}
              height={250}
              className="h-14 w-auto"
            />
          </a>
        </div>

        {/* Baixar o MacroForge PC (2026-11-20): o instalador do Windows, no GitHub Releases do site (app/lib/pc.ts) */}
        <div className="mb-8 bg-[#161B22] border border-gray-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h3 className="font-bold mb-1">MacroForge PC (Windows)</h3>
            <p className="text-gray-400 text-sm">
              Windows 10 ou 11 (64 bits) com o MSI App Player, o BlueStacks 5, o LDPlayer 9 ou o MuMu Player (com o ADB ligado). Entre no programa com esta mesma conta.
            </p>
          </div>
          <a
            href={URL_INSTALADOR_PC}
            className="shrink-0 bg-amber-500 hover:bg-amber-600 text-black font-bold px-6 py-3 rounded-xl transition-colors text-center"
          >
            Baixar para Windows
          </a>
        </div>

        {/* Botão comprar mais */}
        {(ativos.length > 0 || naFila.length > 0) && (
          <div className="text-center">
            <Link
              href="/planos"
              className="inline-block bg-amber-500 hover:bg-amber-600 text-black font-bold px-6 py-3 rounded-xl transition-colors"
            >
              Renovar ou trocar de plano
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

function PlanoCard({ licenca, email, onReset }: { licenca: Licenca; email: string; onReset: () => void }) {
  const [resetando, setResetando] = useState(false);
  const [pedindoSenha, setPedindoSenha] = useState(false);
  const [senhaReset, setSenhaReset] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const dias = diasRestantes(licenca.data_expiracao);
  const fila = vigente(licenca) && estaNaFila(licenca);
  const origem = textoOrigem(licenca);

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
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-3">
          <span className="text-base font-bold text-amber-500">{nomeDoPlano(licenca)}</span>
          <StatusBadge licenca={licenca} />
        </div>
        {origem && <span className="text-xs text-gray-500">{origem}</span>}
      </div>

      <p className="text-sm text-gray-300 mb-3">{textoAparelhos(licenca)}</p>

      {/* Detalhes */}
      <div className="grid grid-cols-3 gap-4 text-xs text-gray-400">
        <div>
          <p className="text-gray-600">{fila ? "Começa em" : "Inicio"}</p>
          <p>{licenca.data_inicio ? formatarData(licenca.data_inicio) : "—"}</p>
        </div>
        <div>
          <p className="text-gray-600">Válido até</p>
          <p>{formatarData(licenca.data_expiracao)}</p>
        </div>
        <div>
          <p className="text-gray-600">Restante</p>
          {fila ? (
            <p className="text-sky-400">Na fila</p>
          ) : (
            <p className={dias > 7 ? "text-green-400" : dias > 0 ? "text-yellow-400" : "text-red-400"}>
              {dias > 0 ? `${dias} dias` : "Expirado"}
            </p>
          )}
        </div>
      </div>

      {vigente(licenca) && licenca.origem === "play_billing" && (
        <p className="mt-3 text-xs text-gray-500">
          {licenca.auto_renews
            ? "Assinatura da Google Play: renova sozinha. Para cancelar, use Assinaturas na Play Store."
            : "Assinatura da Google Play: não vai renovar."}
        </p>
      )}
      {vigente(licenca) && licenca.origem === "mercado_pago" && (
        <p className="mt-3 text-xs text-gray-500">Compra pelo site: 30 dias, sem renovação automática.</p>
      )}

      {/* Licença ANTIGA (1 aparelho preso à licença): mantém o "Trocar dispositivo" de antes. Os planos novos
          mostram os aparelhos em "Aparelhos conectados". */}
      {licenca.device_id && vigente(licenca) && (
        <div className="mt-3 pt-3 border-t border-gray-800 space-y-2">
          <DeviceRow deviceId={licenca.device_id} chave={licenca.chave} onReset={handleReset} />
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
      )}
    </div>
  );
}

interface Aparelho {
  device_id: string;
  apelido: string | null;
  iniciada_em: string | null;
  renovada_em: string | null;
  expira_em: string | null;
}

/**
 * Aparelhos usando a conta agora (cada um ocupa uma vaga do plano). Mesmos dados do "Meu plano" do app:
 * GET /api/aparelhos e POST /api/aparelhos/desconectar (libera a vaga na hora; o aparelho derrubado para no
 * próximo sinal, até 5 min).
 */
function AparelhosConectados({ token }: { token: string }) {
  const [aparelhos, setAparelhos] = useState<Aparelho[] | null>(null);
  const [limite, setLimite] = useState<number | null>(null);
  const [erro, setErro] = useState("");
  const [desconectando, setDesconectando] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    fetch("/api/aparelhos", { headers: { Authorization: `Bearer ${token}` } })
      .then(res => (res.ok ? res.json() : null))
      .then((d: { plano?: { ok?: boolean; limite?: number }; aparelhos?: Aparelho[] } | null) => {
        if (cancelado) return;
        if (!d || !Array.isArray(d.aparelhos)) {
          setErro("Nao foi possivel carregar os aparelhos agora.");
          return;
        }
        setAparelhos(d.aparelhos);
        setLimite(d.plano?.ok && typeof d.plano.limite === "number" ? d.plano.limite : null);
      })
      .catch(() => { if (!cancelado) setErro("Nao foi possivel carregar os aparelhos agora."); });
    return () => { cancelado = true; };
  }, [token]);

  async function desconectar(deviceId: string) {
    setDesconectando(deviceId);
    setErro("");
    try {
      const res = await fetch("/api/aparelhos/desconectar", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ device_id: deviceId }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setAparelhos(lista => (lista ?? []).filter(a => a.device_id !== deviceId));
      } else {
        setErro(data.erro || "Nao foi possivel desconectar.");
      }
    } catch {
      setErro("Erro de conexao");
    }
    setDesconectando(null);
  }

  if (aparelhos === null && !erro) return null;

  return (
    <div className="mb-8">
      <h2 className="text-lg font-bold mb-1">Aparelhos conectados</h2>
      <p className="text-gray-500 text-xs mb-4">
        {limite !== null && aparelhos !== null
          ? `${aparelhos.length} de ${limite} vagas em uso. `
          : ""}
        Trocou de celular? Desconecte o antigo para liberar a vaga.
      </p>
      <div className="bg-[#161B22] border border-gray-800 rounded-xl p-5 space-y-3">
        {aparelhos !== null && aparelhos.length === 0 && (
          <p className="text-gray-400 text-sm">Nenhum aparelho usando a conta agora.</p>
        )}
        {(aparelhos ?? []).map(a => (
          <div key={a.device_id} className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></span>
              {a.apelido ? (
                <span className="text-white font-medium truncate">{a.apelido}</span>
              ) : (
                <span className="font-mono text-white bg-[#0D1117] px-2 py-0.5 rounded truncate">{a.device_id}</span>
              )}
            </div>
            <button
              onClick={() => desconectar(a.device_id)}
              disabled={desconectando === a.device_id}
              className="text-amber-500 hover:underline flex-shrink-0"
            >
              {desconectando === a.device_id ? "..." : "Desconectar"}
            </button>
          </div>
        ))}
        {erro && <p className="text-red-400 text-xs">{erro}</p>}
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
      // /api/atualizar-dados agora exige o crachá; o cliente é derivado dele no servidor.
      const stored = sessionStorage.getItem("macroforge_session");
      const token = stored ? (JSON.parse(stored).token as string | undefined) : undefined;
      const res = await fetch("/api/atualizar-dados", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ nome, whatsapp, pais, estado, cidade }),
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
