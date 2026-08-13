"use client";
/* eslint-disable react-hooks/set-state-in-effect, jsx-a11y/label-has-associated-control */

import { SafeLink as Link } from "@/components/SafeLink";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { quizQuestions } from "@/lib/content";

type Section = "dashboard" | "quiz" | "activation" | "leads" | "content" | "community" | "access" | "automation";
type Row = Record<string, unknown>;
type Product = { id: string; name: string; price: number; access: string; checkoutUrl: string; bundleCheckoutUrl: string; downsellCheckoutUrl: string; externalId: string; status: string; position: number };
type Automation = { kind: string; enabled: number | boolean; requires_consent: number | boolean; template_json: string };
type Readiness = { productionMode: boolean; emailConfigured: boolean; wiapyConfigured: boolean; catalogConfigured: boolean; bundleConfigured: boolean; legalConfigured: boolean; supportConfigured: boolean; ready: boolean };
type QuizFunnel = {
  periodDays: number;
  startedAt: string | null;
  stages: { visitors: number; started: number; leadFormViewed: number; leadFormStarted: number; completed: number; resultViewed: number; checkoutClicked: number; purchases: number };
  questions: { questionIndex: number; questionId: string; viewed: number; answered: number; abandoned: number }[];
  sources: { source: string; total: number }[];
};
type AdminData = { viewer: { name: string; email: string }; metrics: Record<string, number>; profiles: Row[]; leads: Row[]; reports: Row[]; products: Product[]; automations: Automation[]; integration: { gateway?: string; supportEmail?: string; whatsapp?: string }; readiness: Readiness; quizFunnel: QuizFunnel };

const sections: [Section, string][] = [["dashboard", "Visão geral"], ["quiz", "Funil do quiz"], ["activation", "Pronto para vender"], ["leads", "Gestão de leads"], ["content", "Conteúdo e produtos"], ["community", "Moderação"], ["access", "Acessos"], ["automation", "Automações"]];
const automationNames: Record<string, string> = { quiz_abandoned: "Abandono do quiz", diagnosis_complete: "Conclusão do diagnóstico", result_message: "Mensagem com resultado", welcome: "Boas-vindas", mission_reminder: "Lembrete de missão", streak: "Aviso de sequência", day_seven: "Marco de sete dias", journey_invite: "Convite à Jornada", checkout_recovery: "Recuperação de checkout", community_invite: "Convite à comunidade", weekly_report: "Relatório semanal" };

async function send(body: Row) {
  const response = await fetch("/api/data", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const result = await response.json() as { error?: string };
  if (!response.ok) throw new Error(result.error || "Não foi possível salvar.");
  return result;
}

export function AdminDashboard() {
  const [section, setSection] = useState<Section>("dashboard"), [data, setData] = useState<AdminData | null>(null), [notice, setNotice] = useState(""), [error, setError] = useState("");
  async function load() { const response = await fetch("/api/data?mode=admin", { cache: "no-store" }); if (!response.ok) { setError("Esta conta não tem acesso ao painel."); return; } setData(await response.json()); }
  useEffect(() => { load(); }, []);
  function say(message: string) { setNotice(message); window.setTimeout(() => setNotice(""), 2800); }
  return <div className="admin-shell"><aside className="admin-sidebar"><Link href="/" className="brand brand-light"><span className="brand-mark">V</span><span>Volta Pra <em>Você</em></span></Link><span className="admin-label">Administração protegida</span><nav>{sections.map(([id, label]) => <button key={id} className={section === id ? "active" : ""} onClick={() => setSection(id)}>{label}</button>)}</nav><Link href="/app">Ver área da cliente →</Link><form action="/api/logout" method="post"><button className="admin-exit" type="submit">Sair</button></form></aside><main className="admin-main"><header><div><span className="eyebrow">Painel administrativo</span><h1>{sections.find(item => item[0] === section)?.[1]}</h1></div>{data && <div className="admin-user"><span>{data.viewer.name.charAt(0)}</span><div><strong>{data.viewer.name}</strong><small>{data.viewer.email}</small></div></div>}</header>{notice && <p className="success-note">{notice}</p>}{error && <p className="form-error">{error}</p>}{!data ? <div className="app-loading"><i/><p>Carregando indicadores…</p></div> : <>{section === "dashboard" && <Dashboard data={data}/>} {section === "quiz" && <QuizAnalytics data={data}/>} {section === "activation" && <Activation data={data}/>} {section === "leads" && <Leads data={data}/>} {section === "content" && <Products data={data} setData={setData} say={say}/>} {section === "community" && <Moderation data={data} reload={load} say={say}/>} {section === "access" && <Access products={data.products} say={say}/>} {section === "automation" && <Automations data={data} setData={setData} say={say}/>}</>}</main></div>;
}

function Dashboard({ data }: { data: AdminData }) {
  const metrics = [["Leads", data.metrics.leads], ["Clientes", data.metrics.users], ["Diagnósticos", data.metrics.quizCompleted], ["Vendas", data.metrics.purchases], ["Receita", `R$ ${Number(data.metrics.revenue).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`], ["Ativas em 7 dias", data.metrics.activeUsers]];
  const funnel = [["Quiz iniciado", data.metrics.quizStarted], ["Quiz concluído", data.metrics.quizCompleted], ["Resultado visualizado", data.metrics.resultViewed], ["Checkout acessado", data.metrics.checkoutClicked], ["Compra aprovada", data.metrics.purchases]];
  const maximum = Math.max(1, ...funnel.map(([, value]) => Number(value)));
  return <div className="admin-view"><div className={`readiness-banner ${data.readiness.ready ? "ready" : "pending"}`}><div><strong>{data.readiness.ready ? "Operação pronta para receber vendas" : "A demonstração está pronta; faltam configurações para vender"}</strong><p>{data.readiness.ready ? "Checkout, acesso e comunicação estão conectados." : "Abra “Pronto para vender” e conclua os itens pendentes."}</p></div><button onClick={() => document.querySelector<HTMLButtonElement>('.admin-sidebar button:nth-child(2)')?.click()}>Ver checklist</button></div><div className="metric-grid">{metrics.map(([label, value]) => <article key={String(label)}><span>{label}</span><strong>{value}</strong><small>dados persistentes</small></article>)}</div><div className="admin-charts"><article><div className="section-title-row"><div><span className="eyebrow">Funil</span><h2>Do diagnóstico ao acesso</h2></div><span>Dados reais</span></div>{funnel.map(([label, value]) => <div className="funnel-row" key={String(label)}><span>{label}</span><div><i style={{ width: `${Math.max(5, Number(value) / maximum * 100)}%` }}/></div><strong>{value}</strong></div>)}</article><article><span className="eyebrow">Perfis mais comuns</span><h2>Diagnósticos concluídos</h2>{data.profiles.length ? data.profiles.map((profile, index) => <div className="profile-stat" key={String(profile.profile_key)}><span>{index + 1}</span><p>{String(profile.profile_key || "Sem perfil")}</p><strong>{String(profile.total)}</strong></div>) : <div className="empty-state compact"><p>Os perfis aparecerão após os primeiros diagnósticos.</p></div>}</article></div><div className="admin-note"><strong>Privacidade por padrão</strong><p>O painel não exibe textos do diário privado. Administradores veem apenas métricas e dados operacionais necessários.</p></div></div>;
}

function friendlySource(value: string) {
  const source = value.toLowerCase();
  if (source === "meta") return "Meta (Facebook/Instagram)";
  if (source.includes("facebook") || source.includes("l.facebook") || source === "fb") return "Facebook";
  if (source.includes("instagram") || source === "ig") return "Instagram";
  if (source.includes("google")) return "Google";
  if (source.includes("direct")) return "Acesso direto";
  return value.replace(/^https?:\/\//, "").replace(/\/$/, "").slice(0, 42) || "Acesso direto";
}

function QuizAnalytics({ data }: { data: AdminData }) {
  const funnel = data.quizFunnel;
  const visitors = funnel.stages.visitors;
  const details = new Map(funnel.questions.map(item => [item.questionIndex, item]));
  const questions = quizQuestions.map((question, index) => ({ question, index: index + 1, ...(details.get(index + 1) || { viewed: 0, answered: 0, abandoned: 0 }) }));
  const stages = [
    ["Abriram /quiz", funnel.stages.visitors, "Sessões únicas no navegador"],
    ["Começaram", funnel.stages.started, "Responderam a primeira pergunta"],
    ["Chegaram ao cadastro", funnel.stages.leadFormViewed, "Passaram pelas 24 perguntas"],
    ["Iniciaram o cadastro", funnel.stages.leadFormStarted, "Clicaram em algum campo"],
    ["Concluíram", funnel.stages.completed, "Enviaram os dados e o diagnóstico"],
    ["Viram a oferta", funnel.stages.resultViewed, "Abriram o resultado"],
    ["Foram ao checkout", funnel.stages.checkoutClicked, "Clicaram para comprar"],
    ["Pagamentos aprovados", funnel.stages.purchases, "Desde o reinício da medição"],
  ] as const;
  const route = [
    { label: "Entrada do quiz", value: visitors },
    ...questions.map(item => ({ label: `Pergunta ${item.index}`, value: item.answered })),
    { label: "Cadastro", value: funnel.stages.leadFormViewed },
    { label: "Diagnóstico concluído", value: funnel.stages.completed },
  ];
  let biggestDrop: { from: string; to: string; amount: number; rate: number } | null = null;
  for (let index = 1; index < route.length; index += 1) {
    const previous = route[index - 1], current = route[index];
    if (previous.value <= 0) break;
    const amount = Math.max(0, previous.value - current.value);
    const rate = Math.round(amount / previous.value * 100);
    if (!biggestDrop || rate > biggestDrop.rate) biggestDrop = { from: previous.label, to: current.label, amount, rate };
  }
  const maximumSource = Math.max(1, ...funnel.sources.map(item => item.total));
  return <div className="admin-view quiz-analytics-view">
    <div className="quiz-analytics-intro"><div><span className="eyebrow">Medição detalhada</span><h2>Onde as visitantes param</h2><p>O painel conta etapas e sessões, mas não mostra as respostas pessoais dadas no diagnóstico.</p></div><div><strong>{funnel.startedAt ? new Date(funnel.startedAt).toLocaleString("pt-BR") : "Aguardando a primeira visita"}</strong><span>início desta medição</span></div></div>
    <div className="quiz-stage-grid">{stages.map(([label, value, note]) => <article key={label}><span>{label}</span><strong>{value}</strong><small>{visitors && label !== "Pagamentos aprovados" ? `${Math.round(Number(value) / visitors * 100)}% das entradas` : note}</small><p>{note}</p></article>)}</div>
    {biggestDrop && visitors > 0 ? <div className="dropoff-alert"><span aria-hidden="true">!</span><div><strong>Maior ponto de saída: {biggestDrop.from} → {biggestDrop.to}</strong><p>{biggestDrop.amount} visitante{biggestDrop.amount === 1 ? "" : "s"} não {biggestDrop.amount === 1 ? "avançou" : "avançaram"} nessa passagem ({biggestDrop.rate}%).</p></div></div> : <div className="dropoff-alert neutral"><span aria-hidden="true">i</span><div><strong>A medição detalhada começou agora</strong><p>Assim que novas pessoas entrarem no anúncio, esta área apontará automaticamente a maior queda.</p></div></div>}
    <div className="quiz-analytics-layout"><article className="question-funnel-card"><div className="section-title-row"><div><span className="eyebrow">24 perguntas</span><h2>Avanço pergunta por pergunta</h2></div><span>Novo ciclo</span></div><div className="question-funnel-list">{questions.map(item => { const rate = visitors ? Math.round(item.answered / visitors * 100) : 0; return <div className="question-funnel-row" key={item.question.id}><span>{String(item.index).padStart(2, "0")}</span><div><strong>{item.question.text}</strong><small>{item.viewed} visualizaram · {item.answered} responderam · {item.abandoned} saíram nesta etapa</small><i><b style={{ width: `${Math.min(100, rate)}%` }}/></i></div><em>{rate}%</em></div>; })}</div></article><aside className="source-funnel-card"><span className="eyebrow">Origem</span><h2>De onde chegaram</h2>{funnel.sources.length ? funnel.sources.map(item => <div className="source-funnel-row" key={item.source}><div><strong>{friendlySource(item.source)}</strong><span>{item.total}</span></div><i><b style={{ width: `${item.total / maximumSource * 100}%` }}/></i></div>) : <div className="empty-state compact"><p>As origens aparecerão nas próximas visitas.</p></div>}<div className="historical-funnel-note"><strong>Novo ciclo de medição</strong><p>Todos os indicadores deste painel consideram somente ações ocorridas depois do reinício mostrado acima.</p></div></aside></div>
    <div className="admin-note"><strong>Como usar</strong><p>Se a queda acontecer nas primeiras perguntas, ajuste anúncio e abertura. Se ocorrer perto do cadastro, reduza fricção do formulário. Se as clientes chegarem ao resultado e não clicarem, teste oferta, preço e prova.</p></div>
  </div>;
}

function Activation({ data }: { data: AdminData }) {
  const [copied, setCopied] = useState(false);
  const webhook = typeof window === "undefined" ? "/api/webhooks/wiapy" : `${window.location.origin}/api/webhooks/wiapy`;
  const items = [
    [data.readiness.productionMode, "Modo de produção", "Desative DEMO_MODE somente depois de validar os demais itens."],
    [data.readiness.emailConfigured, "E-mail de ativação", "Configure Resend, remetente verificado e segredo da sessão."],
    [data.readiness.wiapyConfigured, "Webhook Wiapy", "Cadastre o token protegido e use a URL abaixo na Wiapy."],
    [data.readiness.catalogConfigured, "Produtos conectados", "Preencha o link de checkout e o ID Wiapy de todos os produtos ativos."],
    [data.readiness.bundleConfigured, "Oferta completa e recuperação", "Preencha os checkouts de R$ 47 e de recuperação por R$ 17 no Plano VOLTA Completo."],
    [data.readiness.legalConfigured, "Dados legais", "Cadastre razão social, CPF/CNPJ e endereço do fornecedor."],
    [data.readiness.supportConfigured, "Atendimento", "Defina e-mail ou WhatsApp de suporte na seção Automações."],
  ] as const;
  const done = items.filter(item => item[0]).length;
  async function copyWebhook() { await navigator.clipboard.writeText(webhook); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
  return <div className="admin-view activation-view"><div className="activation-score"><div><span className="eyebrow">Preparação comercial</span><h2>{done} de {items.length} itens concluídos</h2><p>A plataforma mostra exatamente o que está pronto e impede que a operação dependa de suposições.</p></div><strong>{Math.round(done / items.length * 100)}%</strong></div><div className="activation-list">{items.map(([ok, title, description]) => <article className={ok ? "done" : "todo"} key={title}><span aria-hidden="true">{ok ? "✓" : "!"}</span><div><strong>{title}</strong><p>{description}</p></div><em>{ok ? "Concluído" : "Pendente"}</em></article>)}</div><div className="webhook-card"><div><span className="eyebrow">URL do webhook</span><strong>{webhook}</strong><p>Na Wiapy, envie eventos de pagamento aprovado, reembolso e chargeback com o cabeçalho Authorization.</p></div><button className="button button-secondary" onClick={copyWebhook}>{copied ? "Copiado" : "Copiar URL"}</button></div><div className="admin-note"><strong>Fluxo comercial seguro</strong><p>Pagamento aprovado → produto liberado → e-mail de acesso → login individual → experiência personalizada pelo perfil do quiz.</p></div></div>;
}

function Leads({ data }: { data: AdminData }) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => data.leads.filter(lead => `${lead.name} ${lead.email} ${lead.profile_id}`.toLowerCase().includes(search.toLowerCase())), [data.leads, search]);
  function csv() { const rows = [["Nome", "E-mail", "WhatsApp", "Perfil", "Pontuação", "Consentimento", "Data"], ...filtered.map(lead => [lead.name, lead.email, lead.phone, lead.profile_id, lead.score, lead.marketing_consent ? "sim" : "não", lead.created_at])]; const blob = new Blob([rows.map(row => row.map(value => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\n")], { type: "text/csv;charset=utf-8" }); const anchor = document.createElement("a"); anchor.href = URL.createObjectURL(blob); anchor.download = "leads-volta.csv"; anchor.click(); }
  return <div className="admin-view"><div className="table-tools"><label>Buscar lead<input value={search} onChange={event => setSearch(event.target.value)} placeholder="Nome, e-mail ou perfil"/></label><button className="button button-secondary" onClick={csv}>Exportar CSV</button></div><div className="data-table"><table><thead><tr><th>Nome</th><th>Contato</th><th>Perfil</th><th>Pontuação</th><th>Marketing</th><th>Data</th></tr></thead><tbody>{filtered.map(lead => <tr key={String(lead.id)}><td><strong>{String(lead.name)}</strong></td><td>{String(lead.email)}<small>{String(lead.phone)}</small></td><td>{String(lead.profile_id)}</td><td>{String(lead.score)}/100</td><td>{lead.marketing_consent ? "Consentiu" : "Não consentiu"}</td><td>{new Date(String(lead.created_at)).toLocaleDateString("pt-BR")}</td></tr>)}</tbody></table>{!filtered.length && <div className="empty-state compact"><p>Nenhum lead encontrado.</p></div>}</div></div>;
}

function Products({ data, setData, say }: { data: AdminData; setData: (value: AdminData) => void; say: (message: string) => void }) {
  const [items, setItems] = useState(data.products), [saving, setSaving] = useState(false);
  async function save() { setSaving(true); try { await send({ action: "admin.products", items }); setData({ ...data, products: items }); say("Catálogo, preços e links salvos para todas as clientes."); } catch (error) { say(error instanceof Error ? error.message : "Não foi possível salvar."); } finally { setSaving(false); } }
  function change(id: string, values: Partial<Product>) { setItems(items.map(item => item.id === id ? { ...item, ...values } : item)); }
  return <div className="admin-view">
    <div className="section-title-row"><div><span className="eyebrow">Produtos e ofertas</span><h2>Ordem, preços e pagamentos</h2></div><button className="button" onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar alterações"}</button></div>
    <div className="product-editor">{items.map((product, index) => <article key={product.id}>
      <span>{index + 1}. {product.id}</span>
      <label>Nome<input value={product.name} onChange={event => change(product.id, { name: event.target.value })}/></label>
      <label>Preço<input type="number" min="0" step="0.01" value={product.price} onChange={event => change(product.id, { price: Number(event.target.value) })}/></label>
      <label>Entregáveis<textarea value={product.access} onChange={event => change(product.id, { access: event.target.value })}/></label>
      {product.id !== "completo" && <label>Link do checkout Wiapy<input type="url" value={product.checkoutUrl} onChange={event => change(product.id, { checkoutUrl: event.target.value })} placeholder="https://wiapy.com/checkout/…"/></label>}
      {product.id === "completo" && <><label>Checkout da oferta completa por R$ 47<input type="url" value={product.checkoutUrl} onChange={event => change(product.id, { checkoutUrl: event.target.value })} placeholder="https://wiapy.com/checkout/…"/><small>Este é o botão principal da oferta com Mapa, Kit SOS e Desafio.</small></label><label>Checkout de recuperação por R$ 17<input type="url" value={product.downsellCheckoutUrl || ""} onChange={event => change(product.id, { downsellCheckoutUrl: event.target.value })} placeholder="https://wiapy.com/checkout/…"/><small>Condição de primeira turma exibida somente quando a visitante tenta sair.</small></label></>}
      <label>ID do produto na Wiapy<input value={product.externalId || ""} onChange={event => change(product.id, { externalId: event.target.value })} placeholder="Ex.: 66df9e14dbebe565ee587fc3"/><small>Usado para liberar o acesso certo após Pix ou cartão aprovado.</small></label>
      <label className="check-row"><input type="checkbox" checked={product.status === "active"} onChange={event => change(product.id, { status: event.target.checked ? "active" : "inactive" })}/><span>Produto ativo</span></label>
    </article>)}</div>
    <div className="admin-note"><strong>Ordem recomendada</strong><p>Diagnóstico gratuito, escolha entre Mapa ou Plano Completo, Kit SOS, Desafio de 7 dias e Jornada de 30 dias. Cada compra usa a mesma conta e preserva o perfil criado no quiz.</p></div>
  </div>;
}

function Access({ products, say }: { products: Product[]; say: (message: string) => void }) {
  const [email, setEmail] = useState(""), [user, setUser] = useState<Row | null>(null), [granted, setGranted] = useState<Set<string>>(new Set()), [loading, setLoading] = useState(false);
  async function search(event: FormEvent) { event.preventDefault(); setLoading(true); const response = await fetch(`/api/data?mode=access&email=${encodeURIComponent(email)}`, { cache: "no-store" }); const result = await response.json() as { user: Row | null; access: Row[] }; setUser(result.user); setGranted(new Set((result.access || []).filter((item: Row) => item.status === "active").map((item: Row) => String(item.product_id)))); setLoading(false); if (!result.user) say("Cliente ainda não criou uma conta."); }
  async function save() { try { await send({ action: "admin.access", email, products: [...granted] }); say("Permissões atualizadas."); } catch (error) { say(error instanceof Error ? error.message : "Não foi possível salvar."); } }
  return <div className="admin-view"><form className="access-search" onSubmit={search}><span className="eyebrow">Localizar cliente</span><label>E-mail<input type="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="cliente@exemplo.com"/></label><button className="button button-secondary" disabled={loading}>{loading ? "Buscando…" : "Buscar"}</button></form>{user && <div className="access-admin-card"><div className="admin-user-large"><span>{String(user.name).charAt(0)}</span><div><strong>{String(user.name)}</strong><small>{String(user.email)}</small><p>Conta individual ativa</p></div></div><div>{products.map(product => <label key={product.id}><span><strong>{product.name}</strong><small>R$ {product.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</small></span><input type="checkbox" checked={granted.has(product.id)} onChange={event => { const next = new Set(granted); if (event.target.checked) next.add(product.id); else next.delete(product.id); setGranted(next); }}/></label>)}</div><div className="access-actions"><button className="button button-secondary" onClick={() => setGranted(new Set(products.map(product => product.id)))}>Liberar todos para teste</button><button className="button" onClick={save}>Atualizar permissões</button></div></div>}</div>;
}

function Moderation({ data, reload, say }: { data: AdminData; reload: () => Promise<void>; say: (message: string) => void }) {
  async function decide(id: unknown, status: string) { await send({ action: "admin.report", id, status }); await reload(); say("Decisão de moderação salva."); }
  return <div className="admin-view"><div className="moderation-cards"><article><strong>{data.reports.filter(report => report.status === "open").length}</strong><span>denúncias abertas</span></article><article><strong>{data.reports.length}</strong><span>registros na fila</span></article></div><div className="moderation-list"><h2>Fila de revisão</h2>{data.reports.length ? data.reports.map(report => <article key={String(report.id)}><div><span className="status-pill">{String(report.status)}</span><small>{new Date(String(report.created_at)).toLocaleDateString("pt-BR")}</small></div><p>“{String(report.body || "Publicação removida") }”</p><strong>Motivo: {String(report.reason)}</strong><div><button onClick={() => decide(report.id, "resolved")}>Manter conteúdo</button><button className="danger" onClick={() => decide(report.id, "removed")}>Remover conteúdo</button></div></article>) : <div className="empty-state compact"><p>Nenhuma denúncia aguardando revisão.</p></div>}</div></div>;
}

function Automations({ data, setData, say }: { data: AdminData; setData: (value: AdminData) => void; say: (message: string) => void }) {
  const [items, setItems] = useState(data.automations.map(item => ({ ...item, enabled: Boolean(item.enabled), requiresConsent: Boolean(item.requires_consent), template: (() => { try { return JSON.parse(item.template_json || "{}"); } catch { return {}; } })() }))), [integration, setIntegration] = useState({ gateway: data.integration.gateway || "", supportEmail: data.integration.supportEmail || "", whatsapp: data.integration.whatsapp || "" });
  async function save() { try { await send({ action: "admin.automations", items }); await send({ action: "admin.integration", ...integration }); setData({ ...data, integration, automations: items }); say("Automações e integrações salvas."); } catch (error) { say(error instanceof Error ? error.message : "Não foi possível salvar."); } }
  return <div className="admin-view"><div className="admin-note"><strong>Consentimento obrigatório</strong><p>Mensagens entram na fila somente quando a automação está ativa e a cliente autorizou o canal correspondente.</p></div><div className="integration-card"><label>Gateway de pagamento<select value={integration.gateway} onChange={event => setIntegration({ ...integration, gateway: event.target.value })}><option value="">Selecionar</option><option value="wiapy">Wiapy</option><option value="stripe">Stripe</option><option value="hotmart">Hotmart</option><option value="kiwify">Kiwify</option><option value="mercadopago">Mercado Pago</option></select></label><label>E-mail de suporte<input type="email" value={integration.supportEmail} onChange={event => setIntegration({ ...integration, supportEmail: event.target.value })}/></label><label>WhatsApp de suporte<input value={integration.whatsapp} onChange={event => setIntegration({ ...integration, whatsapp: event.target.value })}/></label></div>{integration.gateway === "wiapy" && <p className="safety-box">Na Wiapy, use o endpoint <strong>/api/webhooks/wiapy</strong>, cadastre um token de autenticação e preencha o ID Wiapy de cada produto na seção Produtos. O mesmo fluxo libera compras por Pix e cartão.</p>}<div className="automation-list">{items.map(item => <label key={item.kind}><span><strong>{automationNames[item.kind] || item.kind}</strong><small>{item.enabled ? "Ativa e respeitando consentimento" : "Desativada"}</small></span><input type="checkbox" checked={Boolean(item.enabled)} onChange={event => setItems(items.map(current => current.kind === item.kind ? { ...current, enabled: event.target.checked } : current))}/></label>)}</div><button className="button" onClick={save}>Salvar configurações</button><p className="safety-box">Chaves secretas de pagamento, e-mail e WhatsApp são configuradas no ambiente protegido de publicação e nunca ficam visíveis nesta tela.</p></div>;
}
