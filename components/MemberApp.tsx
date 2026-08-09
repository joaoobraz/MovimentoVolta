"use client";
/* eslint-disable jsx-a11y/no-autofocus, jsx-a11y/label-has-associated-control, react-hooks/set-state-in-effect */

import { SafeLink as Link } from "@/components/SafeLink";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { missions, phases, profileContent, sosItems } from "@/lib/content";
import { personalizeMission, personalizedOfferReason, personalizedPlan, profileExperience } from "@/lib/personalization";

type Tab = "today" | "journey" | "sos" | "journal" | "community" | "profile";
type Row = Record<string, unknown>;
type Product = { id: string; name: string; price: number; access: string; checkoutUrl: string; externalId?: string; status: string; position: number };
type Personalization = { profileKey: keyof typeof profileContent; score: number; result: Row; desiredArea: string; weightArea: string; availableMinutes: number };
type Preferences = { reminders_enabled: number; marketing_enabled: number; theme: string; text_size: string };
type Snapshot = {
  user: { id: string; name: string; email: string };
  isTester: boolean;
  missions: Row[];
  checkins: Row[];
  journal: Row[];
  points: number;
  access: Row[];
  personalization: Personalization | null;
  preferences: Preferences;
  products: Product[];
  posts: Row[];
  likedPostIds: string[];
};

const empty: Snapshot = {
  user: { id: "", name: "", email: "" }, isTester: false, missions: [], checkins: [], journal: [], points: 0, access: [], personalization: null,
  preferences: { reminders_enabled: 1, marketing_enabled: 0, theme: "light", text_size: "normal" }, products: [], posts: [], likedPostIds: [],
};
const nav: [Tab, string, string][] = [["today", "Hoje", "◉"], ["journey", "Jornada", "↗"], ["sos", "SOS", "+"], ["journal", "Diário", "□"], ["community", "Grupo", "◎"], ["profile", "Perfil", "○"]];
const journalPrompts = ["O que eu aceitei hoje, mas gostaria de ter recusado?", "O que eu fiz por mim?", "O que consumiu minha energia?", "O que posso simplificar amanhã?", "Qual pequena vitória quero registrar?", "O que estou adiando?", "O que eu gostaria de retomar?", "Qual limite preciso criar?"];
const productJourney: Record<string, { label: string; promise: string; reason: string; cta: string }> = {
  mapa: { label: "Comece com clareza", promise: "Transforme o diagnóstico em um plano curto e possível para os próximos 7 dias.", reason: "Clareza vira movimento quando o próximo passo é pequeno e específico.", cta: "Quero meu plano de 7 dias" },
  sos: { label: "Proteja os dias difíceis", promise: "Tenha respostas práticas prontas para quando a sobrecarga apertar.", reason: "É mais fácil manter o compromisso quando seu plano B já está preparado.", cta: "Quero meu plano B" },
  desafio: { label: "Crie continuidade", promise: "Veja 7 dias de pequenas ações, check-ins e progresso dentro da mesma conta.", reason: "Acompanhar o próprio avanço ajuda a intenção a virar consistência.", cta: "Quero viver os 7 dias" },
  jornada: { label: "Consolide a mudança", promise: "Aprofunde o que funcionou com 30 dias, relatórios, diário e comunidade.", reason: "Uma jornada mais longa ajuda a proteger o espaço conquistado antes que a rotina antiga volte.", cta: "Quero avançar por 30 dias" },
};

function hasAny(access: Set<string>, ids: string[]) { return ids.some(id => access.has(id)); }
function canOpen(tab: Tab, access: Set<string>) {
  if (tab === "today" || tab === "profile") return true;
  if (tab === "journey") return hasAny(access, ["mapa", "desafio", "jornada"]);
  if (tab === "sos") return hasAny(access, ["sos", "jornada"]);
  if (tab === "journal") return hasAny(access, ["mapa", "jornada"]);
  return access.has("jornada");
}
function firstName(name: string) { return name.trim().split(/\s+/)[0] || "você"; }
function offerHref(product: Product) { return product.checkoutUrl || `/entrar?produto=${encodeURIComponent(product.id)}`; }
function nextProduct(products: Product[], access: Set<string>) { return products.find(product => !access.has(product.id)); }

export function MemberApp() {
  const [tab, setTab] = useState<Tab>("today"), [data, setData] = useState<Snapshot>(empty), [loading, setLoading] = useState(true), [toast, setToast] = useState("");
  const [dark, setDark] = useState(false), [large, setLarge] = useState(false);
  const access = useMemo(() => new Set(data.access.filter(row => row.status === "active").map(row => String(row.product_id))), [data.access]);
  const completedIds = useMemo(() => new Set(data.missions.filter(m => m.status === "completed").map(m => String(m.mission_id))), [data.missions]);
  const maxDays = access.has("jornada") ? 30 : hasAny(access, ["mapa", "desafio"]) ? 7 : 0;
  const currentDay = Math.max(1, Math.min(maxDays || 1, completedIds.size + 1));
  const baseMission = missions[currentDay - 1];
  const focus = data.personalization?.desiredArea || data.personalization?.weightArea || "tempo para você";
  const weight = data.personalization?.weightArea || "a rotina";
  const profileKey = data.personalization?.profileKey || "retomada";
  const availableMinutes = Number(data.personalization?.availableMinutes || 15);
  const todayMission = personalizeMission(baseMission, profileKey, focus, weight, availableMinutes);
  const points = data.points || completedIds.size * 10;
  const streak = Math.min(completedIds.size, 7);
  const progress = maxDays ? Math.round(completedIds.size / maxDays * 100) : 0;
  const visibleNav = nav.filter(([id]) => canOpen(id, access));

  async function refresh() {
    try {
      const response = await fetch("/api/data?mode=app", { cache: "no-store" });
      if (response.status === 401) { location.href = "/entrar"; return; }
      if (!response.ok) throw new Error();
      const next = await response.json() as Snapshot;
      setData(next);
      setDark(next.preferences?.theme === "dark");
      setLarge(next.preferences?.text_size === "large");
    } catch { setToast("Não foi possível carregar seu espaço. Tente novamente."); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, []);
  useEffect(() => { document.documentElement.dataset.theme = dark ? "dark" : "light"; document.documentElement.dataset.text = large ? "large" : "normal"; }, [dark, large]);
  function say(message: string) { setToast(message); window.setTimeout(() => setToast(""), 3200); }
  async function post(body: Row) {
    const response = await fetch("/api/data", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json() as { error?: string };
    if (response.status === 401) { location.href = "/entrar"; throw new Error("Entre novamente."); }
    if (!response.ok) throw new Error(result.error || "Não foi possível salvar.");
    return result;
  }
  async function toggleTextSize() {
    const next = !large;
    setLarge(next);
    try {
      await post({ action: "preferences.update", reminders: Boolean(data.preferences.reminders_enabled), marketing: Boolean(data.preferences.marketing_enabled), theme: dark ? "dark" : "light", textSize: next ? "large" : "normal" });
    } catch { say("O tamanho foi alterado nesta tela, mas não foi possível salvar a preferência."); }
  }
  async function completeMission(id: string, response = "") { try { await post({ action: "mission", missionId: id, response }); say("Missão concluída. +10 pontos para o seu movimento."); await refresh(); } catch (error) { say(error instanceof Error ? error.message : "Não foi possível concluir."); } }
  function select(next: Tab) { if (!canOpen(next, access)) { say("Este espaço ainda não faz parte dos seus acessos."); return; } setTab(next); window.scrollTo({ top: 0, behavior: "smooth" }); }

  return <div className="app-shell">
    <aside className="app-sidebar">
      <Link href="/" className="brand"><span className="brand-mark">V</span><span>Volta Pra <em>Você</em></span></Link>
      <nav>{visibleNav.map(([id, label, icon]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => select(id)}><span>{icon}</span>{label}</button>)}</nav>
      <div className="sidebar-progress"><div className="mini-ring" style={{ "--score": `${progress * 3.6}deg` } as React.CSSProperties}><strong>{progress}%</strong></div><div><b>Sua jornada</b><small>{maxDays ? `${completedIds.size} de ${maxDays} dias` : "Escolha seu próximo passo"}</small></div></div>
      <form className="logout-form" action="/api/logout" method="post"><button type="submit" className="logout-link">← Sair da conta</button></form>
    </aside>
    <main className="app-main"><header className="app-topbar"><div><span className="mobile-brand">V</span><p>{tab === "today" ? "Seu espaço de hoje" : nav.find(item => item[0] === tab)?.[1]}</p></div><div className="top-stats"><span><b>{streak}</b> dias</span><span><b>{points}</b> pontos</span><button className={large ? "active" : ""} onClick={toggleTextSize} aria-label={large ? "Voltar ao texto padrão" : "Aumentar texto"} title={large ? "Texto ampliado" : "Aumentar texto"}>{large ? "A−" : "A+"}</button><button onClick={() => setDark(!dark)} aria-label="Alternar modo escuro">◐</button></div></header>
      {data.isTester && <div className="tester-banner"><strong>Conta de teste</strong><span>Todos os produtos estão liberados para você conferir a experiência completa.</span></div>}
      {loading ? <div className="app-loading"><i/><p>Preparando seu espaço…</p></div> : <>
        {tab === "today" && (maxDays ? <Today data={data} mission={todayMission} day={currentDay} maxDays={maxDays} streak={streak} points={points} completed={completedIds.has(todayMission.id)} access={access} onComplete={completeMission} post={post} refresh={refresh} say={say} onNavigate={select}/> : <MemberWelcome data={data}/>) }
        {tab === "journey" && <Journey completedIds={completedIds} currentDay={currentDay} maxDays={maxDays} points={points} focus={focus} weight={weight} profileKey={profileKey} availableMinutes={availableMinutes} onComplete={completeMission}/>}
        {tab === "sos" && <Sos profileKey={data.personalization?.profileKey} post={post} say={say}/>}
        {tab === "journal" && <Journal entries={data.journal} post={post} refresh={refresh} say={say}/>}
        {tab === "community" && <Community data={data} post={post} refresh={refresh} say={say}/>}
        {tab === "profile" && <Profile data={data} completed={completedIds.size} points={points} access={access} dark={dark} setDark={setDark} large={large} setLarge={setLarge} post={post} say={say}/>}
      </>}
    </main>
    <nav className="bottom-nav" aria-label="Navegação do aplicativo">{visibleNav.map(([id, label, icon]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => select(id)}><span>{icon}</span><small>{label}</small></button>)}</nav>
    {toast && <div className="toast" role="status">✓ {toast}</div>}
  </div>;
}

function MemberWelcome({ data }: { data: Snapshot }) {
  const profile = data.personalization?.profileKey ? profileContent[data.personalization.profileKey] : null;
  const profileKey = data.personalization?.profileKey || "retomada";
  const plan = personalizedPlan(profileKey, data.personalization?.desiredArea || "tempo para você", data.personalization?.weightArea || "a rotina", data.personalization?.availableMinutes || 15);
  const access = new Set(data.access.filter(row => row.status === "active").map(row => String(row.product_id)));
  const recommended = nextProduct(data.products, access);
  return <div className="app-view"><section className="welcome-row"><div><span className="eyebrow">Seu espaço individual</span><h1>Olá, {firstName(data.user.name)}.</h1><p>{profile ? `Seu diagnóstico indica o perfil ${profile.name}. Agora escolha o próximo passo que deseja liberar.` : "Faça o diagnóstico para receber uma recomendação alinhada à sua rotina."}</p></div></section>
    {profile && <section className="first-plan"><div><span className="eyebrow light">Seu ponto de partida</span><h2>{profileExperience[profileKey].reassurance}</h2><p>{profile.description}</p></div><ol>{plan.map((step, index) => <li key={step}><span>{index + 1}</span><div><strong>{["Observar", "Proteger", "Comprovar"][index]}</strong><p>{step}</p></div></li>)}</ol></section>}
    <section className="access-section journey-store"><div><span className="eyebrow">Ordem recomendada</span><h2>Uma etapa por vez, dentro da sua realidade.</h2><p>Você mantém tudo na mesma conta e escolhe quando deseja avançar.</p></div><div>{data.products.map((product, index) => { const copy = productJourney[product.id]; const acquired = access.has(product.id); const isRecommended = recommended?.id === product.id; return <article key={product.id} className={`${acquired ? "active" : ""} ${isRecommended ? "recommended" : ""}`}>
      <em>{acquired ? "Etapa liberada" : isRecommended ? "Seu próximo passo" : `Etapa ${index + 1}`}</em><span>{index + 1}. {product.name}</span><small>{copy?.promise || product.access}</small><p>{isRecommended ? personalizedOfferReason(profileKey) : copy?.reason}</p><b>{acquired ? "Acesso ativo" : `R$ ${product.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}</b>{!acquired && <a className="button button-small" href={offerHref(product)}>{copy?.cta || "Quero este produto"}</a>}
    </article>; })}</div></section>
  </div>;
}

function NextStepOffer({ data, access }: { data: Snapshot; access: Set<string> }) {
  if (data.isTester) return null;
  const product = nextProduct(data.products, access);
  if (!product) return null;
  const copy = productJourney[product.id];
  return <section className="next-step-offer"><div><span className="eyebrow light">Recomendado para sua etapa</span><h2>{copy?.label || "Seu próximo passo"}</h2><p>{copy?.promise || product.access}</p><small>{personalizedOfferReason(data.personalization?.profileKey)}</small></div><div><strong>R$ {product.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong><a className="button button-light" href={offerHref(product)}>{copy?.cta || "Conhecer próxima etapa"}</a><span>Mesmo login · acesso individual</span></div></section>;
}

function Today({ data, mission, day, maxDays, streak, points, completed, access, onComplete, post, refresh, say, onNavigate }: { data: Snapshot; mission: typeof missions[number]; day: number; maxDays: number; streak: number; points: number; completed: boolean; access: Set<string>; onComplete: (id: string, response?: string) => Promise<void>; post: (body: Row) => Promise<unknown>; refresh: () => Promise<void>; say: (message: string) => void; onNavigate: (tab: Tab) => void }) {
  const [missionOpen, setMissionOpen] = useState(false), [response, setResponse] = useState(""), [checkin, setCheckin] = useState(false);
  const latest = data.checkins[0], weekly = data.checkins.slice(0, 7), mood = Number(latest?.mood || 3), energy = Number(latest?.energy || 3);
  const profile = data.personalization?.profileKey ? profileContent[data.personalization.profileKey] : null;
  const checkinAllowed = hasAny(access, ["desafio", "jornada"]);
  return <div className="app-view"><section className="welcome-row"><div><span className="eyebrow">Dia {day} · {profile?.name || `Fase ${mission.phase}`}</span><h1>Olá, {firstName(data.user.name)}.</h1><p>Seu foco atual é <strong>{data.personalization?.desiredArea || "recuperar espaço na rotina"}</strong>. A missão foi ajustada ao tempo que você informou no diagnóstico.</p></div><div className="date-card"><span>{new Date().toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}</span><strong>{new Date().getDate()}</strong><small>{new Date().toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</small></div></section>
    <section className="today-grid"><article className="daily-mission"><div className="mission-top"><span>Missão personalizada</span><span>{mission.minutes} min · {mission.difficulty}</span></div><h2>{mission.title}</h2><p>{mission.letter}</p><div className="mission-action"><span>Seu movimento</span><strong>{mission.action}</strong></div><button className="button" onClick={() => setMissionOpen(true)}>{completed ? "Refazer missão" : "Começar missão"}</button></article><div className="today-side"><article className="stat-card"><div><span>Sequência atual</span><strong>{streak} <small>dias</small></strong></div><div className="streak-dots">{Array.from({ length: 7 }, (_, index) => <i key={index} className={index < streak ? "done" : ""}>{index < streak ? "✓" : index + 1}</i>)}</div></article><article className="stat-pair"><div><span>Pontos</span><strong>{points}</strong><small>Próxima conquista: {Math.max(0, 100 - points)} pts</small></div><div><span>Progresso</span><strong>{Math.round((day - 1) / maxDays * 100)}%</strong><small>{day - 1} de {maxDays} missões</small></div></article></div></section>
    {checkinAllowed && <section className="checkin-section"><div><span className="eyebrow">Check-in diário</span><h2>Como você chega até aqui hoje?</h2><p>Um minuto para perceber seu humor e sua energia, sem julgamento.</p><button className="button button-secondary" onClick={() => setCheckin(true)}>{latest ? "Atualizar check-in" : "Fazer meu check-in"}</button></div><div className="checkin-visual"><div><span>Humor</span><strong>{["Muito baixo", "Baixo", "Estável", "Bem", "Muito bem"][mood - 1]}</strong><div className="meter"><i style={{ width: `${mood * 20}%` }}/></div></div><div><span>Energia</span><strong>{energy} de 5</strong><div className="meter energy"><i style={{ width: `${energy * 20}%` }}/></div></div>{weekly.length > 0 && <small>{weekly.length} registro(s) nos últimos dias</small>}</div></section>}
    <section className="quick-links">{canOpen("journal", access) && <button onClick={() => onNavigate("journal")}><span>□</span><div><strong>Registrar no diário</strong><small>Seu espaço é privado</small></div><i>→</i></button>}{canOpen("sos", access) && <button onClick={() => onNavigate("sos")}><span>+</span><div><strong>Preciso de uma sugestão SOS</strong><small>Uma ação de 5 minutos</small></div><i>→</i></button>}{canOpen("community", access) && <button onClick={() => onNavigate("community")}><span>◎</span><div><strong>Compartilhar uma pequena vitória</strong><small>Com a comunidade</small></div><i>→</i></button>}</section>
    <NextStepOffer data={data} access={access}/>
    {missionOpen && <div className="modal-backdrop" role="dialog" aria-modal="true"><div className="modal"><button className="modal-close" onClick={() => setMissionOpen(false)}>×</button><span className="eyebrow">Dia {mission.day} · {mission.minutes} minutos</span><h2>{mission.title}</h2><p>{mission.letter}</p><div className="mission-action"><span>Missão prática</span><strong>{mission.action}</strong></div><label>O que você escolheu fazer?<textarea value={response} onChange={event => setResponse(event.target.value)} placeholder="Registre uma frase para você…"/></label><button className="button" onClick={async () => { await onComplete(mission.id, response); setMissionOpen(false); }}>Concluir e registrar +10</button><button className="text-button" onClick={() => speechSynthesis.speak(new SpeechSynthesisUtterance(`${mission.title}. ${mission.letter}. ${mission.action}`))}>◉ Ler conteúdo em voz alta</button></div></div>}
    {checkin && <CheckinModal latest={latest} onClose={() => setCheckin(false)} onSave={async values => { try { await post({ action: "checkin", ...values, date: new Date().toISOString().slice(0, 10) }); await refresh(); setCheckin(false); say("Check-in salvo no seu histórico."); } catch (error) { say(error instanceof Error ? error.message : "Não foi possível salvar."); } }}/>}
  </div>;
}

function CheckinModal({ latest, onClose, onSave }: { latest?: Row; onClose: () => void; onSave: (value: Row) => Promise<void> }) {
  const [mood, setMood] = useState(Number(latest?.mood || 3)), [energy, setEnergy] = useState(Number(latest?.energy || 3)), [didSomething, setDidSomething] = useState(Boolean(latest?.did_something_for_self)), [victory, setVictory] = useState(String(latest?.victory || "")), [difficulty, setDifficulty] = useState(String(latest?.difficulty || "")), [wantsSos, setWantsSos] = useState(false);
  return <div className="modal-backdrop" role="dialog" aria-modal="true"><form className="modal" onSubmit={async event => { event.preventDefault(); await onSave({ mood, energy, didSomething, victory, difficulty, wantsSos }); }}><button type="button" className="modal-close" onClick={onClose}>×</button><span className="eyebrow">Seu check-in</span><h2>Como foi estar com você hoje?</h2><fieldset><legend>Humor</legend><div className="scale-picker">{[1, 2, 3, 4, 5].map(number => <button type="button" key={number} className={mood === number ? "active" : ""} onClick={() => setMood(number)} aria-label={`Humor ${number} de 5`}>{["◔", "◑", "●", "◕", "✦"][number - 1]}<small>{number}</small></button>)}</div></fieldset><fieldset><legend>Energia</legend><div className="scale-picker energy-picker">{[1, 2, 3, 4, 5].map(number => <button type="button" key={number} className={energy === number ? "active" : ""} onClick={() => setEnergy(number)}>{number}</button>)}</div></fieldset><label className="check-row"><input type="checkbox" checked={didSomething} onChange={event => setDidSomething(event.target.checked)}/><span>Fiz algo por mim hoje.</span></label><label>Qual foi sua pequena vitória?<input value={victory} onChange={event => setVictory(event.target.value)} placeholder="Mesmo que pareça pequena…"/></label><label>O que mais dificultou seu dia?<input value={difficulty} onChange={event => setDifficulty(event.target.value)} placeholder="Uma frase é suficiente"/></label><label className="check-row"><input type="checkbox" checked={wantsSos} onChange={event => setWantsSos(event.target.checked)}/><span>Quero uma sugestão SOS.</span></label><button className="button">Salvar check-in +{victory ? 6 : 3} pontos</button></form></div>;
}

function Journey({ completedIds, currentDay, maxDays, points, focus, weight, profileKey, availableMinutes, onComplete }: { completedIds: Set<string>; currentDay: number; maxDays: number; points: number; focus: string; weight: string; profileKey: keyof typeof profileContent; availableMinutes: number; onComplete: (id: string, response?: string) => Promise<void> }) {
  const availableMissions = missions.slice(0, maxDays).map(mission => personalizeMission(mission, profileKey, focus, weight, availableMinutes));
  const [selectedId, setSelectedId] = useState(availableMissions[Math.min(currentDay - 1, availableMissions.length - 1)]?.id || "dia-1");
  const selected = availableMissions.find(item => item.id === selectedId) || availableMissions[0];
  return <div className="app-view"><section className="view-heading"><div><span className="eyebrow">Método VOLTA</span><h1>{maxDays === 30 ? "Sua jornada de 30 dias." : "Seu plano de 7 dias."}</h1><p>Conteúdo ajustado ao seu diagnóstico. As missões anteriores continuam disponíveis.</p></div><div className="journey-score"><strong>{Math.round(completedIds.size / maxDays * 100)}%</strong><span>{completedIds.size} de {maxDays} concluídas</span></div></section>{maxDays === 30 && <div className="phase-strip">{phases.map((phase, index) => <div key={phase.name} className={currentDay > index * 6 ? "active" : ""}><span>{phase.letter}</span><div><strong>{phase.name}</strong><small>Dias {phase.days}</small></div></div>)}</div>}<section className="journey-layout"><div className="mission-list">{availableMissions.map(mission => { const done = completedIds.has(mission.id), locked = mission.day > currentDay + 1; return <button key={mission.id} className={`${selected.id === mission.id ? "selected" : ""} ${done ? "done" : ""}`} disabled={locked} onClick={() => setSelectedId(mission.id)}><span>{done ? "✓" : locked ? "·" : mission.day}</span><div><strong>Dia {mission.day} · {mission.title}</strong><small>{mission.phase} · {Math.min(mission.minutes, availableMinutes)} min</small></div><i>{locked ? "Bloqueado" : "→"}</i></button>; })}</div><article className="mission-detail"><span className="eyebrow">Dia {selected.day} · {selected.phase}</span><h2>{selected.title}</h2><p>{selected.letter}</p><div className="mission-action"><span>Seu movimento personalizado</span><strong>{selected.action}</strong></div><div className="mission-meta"><span>{selected.minutes} min</span><span>{selected.difficulty}</span><span>+{selected.points} pts</span></div><button className="button" onClick={() => onComplete(selected.id)}>{completedIds.has(selected.id) ? "Refazer e registrar" : "Concluir missão"}</button></article></section><Achievements count={completedIds.size} points={points} maxDays={maxDays}/></div>;
}

function Achievements({ count, points, maxDays }: { count: number; points: number; maxDays: number }) { const items = [[1, "Primeiro passo"], [3, "Três dias me escolhendo"], [7, "Sete dias sem me abandonar"], ...(maxDays === 30 ? [[15, "Quinze dias em movimento"], [30, "Jornada concluída"]] : [])] as [number, string][]; return <section className="achievements"><div><span className="eyebrow">Conquistas</span><h2>Marcos que registram seu movimento.</h2></div><div>{items.map(([need, name]) => <article key={name} className={count >= need ? "unlocked" : ""}><span>{count >= need ? "✦" : "○"}</span><strong>{name}</strong><small>{count >= need ? "Conquistada" : `${need} dias para liberar`}</small></article>)}</div><p>{points} pontos acumulados · sem ranking competitivo</p></section>; }

function Sos({ profileKey, post, say }: { profileKey?: keyof typeof profileContent; post: (body: Row) => Promise<unknown>; say: (message: string) => void }) {
  const priority: Record<string, string> = { sobrecarregada: "sobrecarregada", automatico: "automatico", adiada: "tempo", invisivel: "nao", retomada: "energia" };
  const ordered = [...sosItems].sort((a, b) => a.id === priority[profileKey || ""] ? -1 : b.id === priority[profileKey || ""] ? 1 : 0);
  const [selected, setSelected] = useState<typeof sosItems[number] | null>(null), [choice, setChoice] = useState("");
  return <div className="app-view"><section className="view-heading"><div><span className="eyebrow">Área SOS personalizada</span><h1>O que você precisa atravessar agora?</h1><p>A primeira sugestão considera o seu perfil. Escolha como está se sentindo para receber uma ação de cinco minutos.</p></div></section>{!selected ? <div className="sos-grid">{ordered.map((item, index) => <button key={item.id} onClick={() => setSelected(item)}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.label}</strong><i>→</i></button>)}</div> : <article className="sos-detail"><button className="text-button" onClick={() => { setSelected(null); setChoice(""); }}>← Ver outras situações</button><span className="eyebrow">Apoio rápido</span><h2>{selected.label}</h2><p className="sos-message">{selected.message}</p><h3>{selected.question}</h3><div className="choice-chips">{selected.options.map(option => <button className={choice === option ? "active" : ""} key={option} onClick={() => setChoice(option)}>{option}</button>)}</div><div className="mission-action"><span>Sua ação de cinco minutos</span><strong>{selected.action}</strong></div><button className="button" disabled={!choice} onClick={async () => { try { await post({ action: "sos", categoryId: selected.id, choice }); say("Ação SOS registrada."); setSelected(null); setChoice(""); } catch (error) { say(error instanceof Error ? error.message : "Não foi possível registrar."); } }}>Fiz minha ação +3 pontos</button></article>}<p className="safety-box">Esta ferramenta oferece apoio de organização e reflexão. Em situações de sofrimento intenso, procure apoio profissional.</p></div>;
}

function Journal({ entries, post, refresh, say }: { entries: Row[]; post: (body: Row) => Promise<unknown>; refresh: () => Promise<void>; say: (message: string) => void }) {
  const [writing, setWriting] = useState(false), [text, setText] = useState(""), [prompt, setPrompt] = useState(journalPrompts[new Date().getDay() % journalPrompts.length]), [search, setSearch] = useState(""), [favorite, setFavorite] = useState(false);
  const filtered = entries.filter(entry => String(entry.body).toLowerCase().includes(search.toLowerCase()));
  async function save(event: FormEvent) { event.preventDefault(); try { await post({ action: "journal.save", text, prompt, tags: ["reflexão"], mood: 3, energy: 3, favorite, date: new Date().toISOString().slice(0, 10) }); setText(""); setWriting(false); await refresh(); say("Registro salvo no seu diário privado."); } catch (error) { say(error instanceof Error ? error.message : "Não foi possível salvar."); } }
  return <div className="app-view"><section className="view-heading"><div><span className="eyebrow">Seu diário privado</span><h1>Um espaço que pertence só a você.</h1><p>Seus registros não aparecem na comunidade e não são exibidos no painel administrativo.</p></div><button className="button" onClick={() => setWriting(true)}>+ Novo registro</button></section><div className="journal-toolbar"><label>Buscar no diário<input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar por palavra…"/></label><span>{filtered.length} registro(s)</span></div>{writing && <form className="journal-editor" onSubmit={save}><button type="button" className="modal-close" onClick={() => setWriting(false)}>×</button><span className="eyebrow">Pergunta do dia</span><select value={prompt} onChange={event => setPrompt(event.target.value)}>{journalPrompts.map(item => <option key={item}>{item}</option>)}</select><textarea autoFocus required value={text} onChange={event => setText(event.target.value)} placeholder="Escreva sem precisar organizar tudo…"/><div><label className="check-row"><input type="checkbox" checked={favorite} onChange={event => setFavorite(event.target.checked)}/><span>Marcar como favorito</span></label><button className="button">Salvar no diário</button></div></form>}<div className="journal-list">{filtered.length ? filtered.map(entry => <article key={String(entry.id)}><div><span>{new Date(String(entry.entry_date) + "T12:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}</span>{Boolean(entry.favorite) && <b>★ Favorito</b>}</div><h3>{String(entry.prompt || "Registro livre")}</h3><p>{String(entry.body)}</p><div><small>Humor {String(entry.mood || "—")}/5 · Energia {String(entry.energy || "—")}/5</small><button onClick={async () => { if (confirm("Excluir este registro privado?")) { await post({ action: "journal.delete", id: entry.id }); await refresh(); say("Registro excluído."); } }}>Excluir</button></div></article>) : <div className="empty-state"><span>□</span><h3>Seu diário começa com uma frase.</h3><p>Registre o que quer proteger, simplificar ou retomar.</p><button className="button button-secondary" onClick={() => setWriting(true)}>Fazer primeiro registro</button></div>}</div></div>;
}

function Community({ data, post, refresh, say }: { data: Snapshot; post: (body: Row) => Promise<unknown>; refresh: () => Promise<void>; say: (message: string) => void }) {
  const [text, setText] = useState(""), [category, setCategory] = useState("Pequenas vitórias"), [anonymous, setAnonymous] = useState(false), [saved, setSaved] = useState<Set<string>>(new Set());
  async function publish(event: FormEvent) { event.preventDefault(); try { await post({ action: "post.create", text, category, anonymous }); setText(""); await refresh(); say("Publicação compartilhada com respeito e cuidado."); } catch (error) { say(error instanceof Error ? error.message : "Não foi possível publicar."); } }
  return <div className="app-view"><section className="view-heading"><div><span className="eyebrow">Comunidade da Jornada</span><h1>Mulheres em movimento, sem comparação.</h1><p>Compartilhe pequenas vitórias e ofereça apoio. O diário continua sempre privado.</p></div><button className="rules-button" onClick={() => alert("Respeito, privacidade e acolhimento. Não são permitidos diagnósticos, orientação médica, assédio, ódio, spam, exposição de dados ou incentivo a riscos.")}>Regras da comunidade</button></section><form className="post-composer" onSubmit={publish}><div className="avatar">{firstName(data.user.name).charAt(0)}</div><div><textarea required value={text} onChange={event => setText(event.target.value)} placeholder="O que você quer compartilhar com o movimento?" maxLength={1500}/><div><select value={category} onChange={event => setCategory(event.target.value)}>{["Pequenas vitórias", "Minha missão de hoje", "Recomeços", "Projetos retomados", "Limites", "Rotina possível", "Apoio", "Desafios"].map(item => <option key={item}>{item}</option>)}</select><label className="check-row"><input type="checkbox" checked={anonymous} onChange={event => setAnonymous(event.target.checked)}/><span>Ocultar meu nome</span></label><button className="button button-small">Publicar</button></div></div></form><div className="community-feed">{data.posts.map(postItem => { const id = String(postItem.id), liked = data.likedPostIds.includes(id); return <article key={id}><div className="post-head"><div className="avatar">{postItem.anonymous ? "·" : String(postItem.name || "M").charAt(0)}</div><div><strong>{postItem.anonymous ? "Participante anônima" : String(postItem.name || "Participante")}</strong><small>{String(postItem.category)} · {new Date(String(postItem.created_at)).toLocaleDateString("pt-BR")}</small></div>{postItem.pinned ? <span className="pinned">Fixado</span> : null}</div><p>{String(postItem.body)}</p><div className="post-actions"><button className={liked ? "active" : ""} onClick={async () => { await post({ action: "post.like", postId: id }); await refresh(); }}>♡ {String(postItem.likes || 0)} Apoiar</button><button onClick={() => { setSaved(new Set(saved).add(id)); say("Publicação salva."); }}>{saved.has(id) ? "✓ Salvo" : "□ Salvar"}</button><button onClick={async () => { await post({ action: "post.report", postId: id, reason: "Revisão solicitada pela participante" }); say("Denúncia enviada para moderação."); }}>⋯ Denunciar</button></div></article>; })}</div></div>;
}

function Profile({ data, completed, points, access, dark, setDark, large, setLarge, post, say }: { data: Snapshot; completed: number; points: number; access: Set<string>; dark: boolean; setDark: (value: boolean) => void; large: boolean; setLarge: (value: boolean) => void; post: (body: Row) => Promise<unknown>; say: (message: string) => void }) {
  const [reminders, setReminders] = useState(Boolean(data.preferences.reminders_enabled)), [marketing, setMarketing] = useState(Boolean(data.preferences.marketing_enabled));
  const moodAvg = data.checkins.length ? data.checkins.reduce((sum, item) => sum + Number(item.mood), 0) / data.checkins.length : 0, energyAvg = data.checkins.length ? data.checkins.reduce((sum, item) => sum + Number(item.energy), 0) / data.checkins.length : 0;
  const profile = data.personalization?.profileKey ? profileContent[data.personalization.profileKey] : null;
  const weeklyPlan = personalizedPlan(data.personalization?.profileKey || "retomada", data.personalization?.desiredArea || "tempo para você", data.personalization?.weightArea || "a rotina", data.personalization?.availableMinutes || 15);
  function exportData() { const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "meus-dados-volta.json"; anchor.click(); URL.revokeObjectURL(url); }
  function shareCard() { const canvas = document.createElement("canvas"); canvas.width = 1080; canvas.height = 1080; const context = canvas.getContext("2d")!; context.fillStyle = "#f5eee7"; context.fillRect(0, 0, 1080, 1080); context.fillStyle = "#6f1833"; context.font = "bold 72px Georgia"; context.fillText("Hoje eu fiz", 100, 370); context.fillText("algo por mim.", 100, 460); context.font = "32px Arial"; context.fillStyle = "#744e4b"; context.fillText(`Dia ${Math.max(1, completed)} sem me abandonar.`, 100, 570); context.fillStyle = "#b55f48"; context.fillRect(100, 700, 180, 8); context.font = "26px Arial"; context.fillText("Movimento Volta Pra Você", 100, 790); const anchor = document.createElement("a"); anchor.download = "meu-movimento.png"; anchor.href = canvas.toDataURL("image/png"); anchor.click(); }
  async function savePreferences(next: { reminders?: boolean; marketing?: boolean; dark?: boolean; large?: boolean }) { const values = { reminders: next.reminders ?? reminders, marketing: next.marketing ?? marketing, dark: next.dark ?? dark, large: next.large ?? large }; setReminders(values.reminders); setMarketing(values.marketing); setDark(values.dark); setLarge(values.large); try { await post({ action: "preferences.update", reminders: values.reminders, marketing: values.marketing, theme: values.dark ? "dark" : "light", textSize: values.large ? "large" : "normal" }); say("Preferências salvas."); } catch (error) { say(error instanceof Error ? error.message : "Não foi possível salvar."); } }
  return <div className="app-view"><section className="profile-hero"><div className="profile-avatar">{firstName(data.user.name).charAt(0)}</div><div><span className="eyebrow light">Meu perfil</span><h1>{data.user.name}</h1><p>{data.user.email}</p><span className="profile-badge">{profile?.name || "Diagnóstico ainda não vinculado"}</span></div><div className="profile-numbers"><div><strong>{completed}</strong><span>dias concluídos</span></div><div><strong>{points}</strong><span>pontos</span></div><div><strong>{Math.min(completed, 7)}</strong><span>dias em sequência</span></div></div></section><section className="report-section"><div className="section-title-row"><div><span className="eyebrow">Relatório personalizado</span><h2>Seu movimento em dados reais.</h2></div><button className="button button-secondary" onClick={() => window.print()}>Imprimir relatório</button></div><div className="report-grid"><article><span>Humor médio</span><strong>{moodAvg ? moodAvg.toFixed(1) : "—"}<small>/5</small></strong></article><article><span>Energia média</span><strong>{energyAvg ? energyAvg.toFixed(1) : "—"}<small>/5</small></strong></article><article><span>Missões</span><strong>{completed}</strong></article><article><span>Registros privados</span><strong>{data.journal.length}</strong></article></div><div className="weekly-plan"><h3>Plano para os próximos sete dias</h3><ol>{weeklyPlan.map(item => <li key={item}>{item}</li>)}</ol><p>Este relatório não apresenta diagnóstico psicológico.</p></div></section><section className="access-section"><div><span className="eyebrow">Meus acessos</span><h2>Um aplicativo, com os produtos liberados para você.</h2></div><div>{data.products.map(product => <article key={product.id} className={access.has(product.id) ? "active" : ""}><span>{product.name}</span><small>{product.access}</small><b>{access.has(product.id) ? "Acesso ativo" : "Não adquirido"}</b>{!access.has(product.id) && <a className="button button-small" href={offerHref(product)}>{product.checkoutUrl ? "Conhecer oferta" : "Solicitar acesso"}</a>}</article>)}</div></section><section className="share-section"><div><span className="eyebrow light">Cartão compartilhável</span><h2>“Hoje eu fiz algo por mim.”</h2><p>Seu nome fica oculto. O número do dia aparece apenas no cartão gerado.</p></div><button className="button button-light" onClick={shareCard}>Baixar como imagem</button></section><section className="settings-section"><div><span className="eyebrow">Preferências</span><h2>Seu espaço, do seu jeito.</h2></div><div className="settings-list"><label><span><strong>Modo escuro</strong><small>Reduzir brilho da interface</small></span><input type="checkbox" checked={dark} onChange={event => savePreferences({ dark: event.target.checked })}/></label><label><span><strong>Texto ampliado</strong><small>Aumentar tamanho de leitura</small></span><input type="checkbox" checked={large} onChange={event => savePreferences({ large: event.target.checked })}/></label><label><span><strong>Lembretes de missão</strong><small>Somente com sua autorização</small></span><input type="checkbox" checked={reminders} onChange={event => savePreferences({ reminders: event.target.checked })}/></label><label><span><strong>Conteúdos e ofertas</strong><small>Consentimento de marketing</small></span><input type="checkbox" checked={marketing} onChange={event => savePreferences({ marketing: event.target.checked })}/></label></div><div className="privacy-actions"><button onClick={exportData}>Exportar meus dados</button><button onClick={() => say("Seu acesso usa um link temporário enviado ao e-mail da compra. O link expira e não deve ser compartilhado.")}>Segurança da conta</button><form action="/api/logout" method="post"><button type="submit">Sair da conta</button></form><button className="danger" onClick={async () => { if (confirm("Excluir sua conta e seus registros privados?")) { await post({ action: "account.delete" }); await fetch("/api/logout", { method: "POST" }); location.href = "/entrar"; } }}>Excluir minha conta</button></div></section></div>;
}
