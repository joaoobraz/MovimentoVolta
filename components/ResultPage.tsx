"use client";
/* eslint-disable react-hooks/set-state-in-effect, no-empty, jsx-a11y/label-has-associated-control */

import { SafeLink as Link } from "@/components/SafeLink";
import { useEffect, useMemo, useState } from "react";
import { ProfileKey, profileContent } from "@/lib/content";
import { trackFunnel } from "@/lib/funnel-client";
import { personalizedOfferReason, personalizedPlan, profileExperience } from "@/lib/personalization";

type StoredResult = { name: string; email?: string; profile: ProfileKey; score: number; areas: Record<string, number>; weight: string; desired: string; availableMinutes?: number; leadId?: string };
type Product = { id: string; name: string; price: number; access: string; checkoutUrl: string; bundleCheckoutUrl?: string };
const fallback: StoredResult = { name: "Você", profile: "sobrecarregada", score: 76, weight: "Rotina", desired: "Tempo para mim", availableMinutes: 15, areas: { "Tempo pessoal": 82, "Energia": 74, "Limites": 88, "Projetos": 61, "Vida social": 55, "Organização": 72, "Descanso": 79, "Autocuidado": 67 } };

function checkoutHref(product: Product | undefined, data: StoredResult, bump: boolean) {
  const selectedCheckout = bump && product?.bundleCheckoutUrl ? product.bundleCheckoutUrl : product?.checkoutUrl;
  if (!selectedCheckout) return `/entrar?produto=mapa&lead=${encodeURIComponent(data.leadId || "")}`;
  try {
    const url = new URL(selectedCheckout, location.origin);
    if (data.leadId) url.searchParams.set("lead_id", data.leadId);
    if (data.email) url.searchParams.set("email", data.email);
    return url.toString();
  } catch { return selectedCheckout; }
}

export function ResultPage() {
  const [data, setData] = useState<StoredResult>(fallback), [bump, setBump] = useState(false), [products, setProducts] = useState<Product[]>([]);
  useEffect(() => { const raw = localStorage.getItem("volta-result"); if (raw) try { const parsed = JSON.parse(raw) as StoredResult; setData(parsed); void trackFunnel("result_viewed", { leadId: parsed.leadId, email: parsed.email, profileKey: parsed.profile }); } catch {} else window.location.replace("/quiz"); fetch("/api/data?mode=catalog").then(response => response.json() as Promise<{ products: Product[] }>).then(value => setProducts(value.products || [])).catch(() => {}); }, []);
  const profile = profileContent[data.profile] ?? profileContent.sobrecarregada;
  const weakest = useMemo(() => Object.entries(data.areas ?? {}).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Tempo pessoal", [data]);
  const strongest = useMemo(() => Object.entries(data.areas ?? {}).sort((a, b) => a[1] - b[1])[0]?.[0] ?? "Projetos", [data]);
  const mapa = products.find(product => product.id === "mapa"), sos = products.find(product => product.id === "sos");
  const experience = profileExperience[data.profile] ?? profileExperience.sobrecarregada;
  const plan = personalizedPlan(data.profile, data.desired, data.weight, data.availableMinutes || 15);
  const canBundle = Boolean(mapa?.bundleCheckoutUrl && sos);
  const total = (mapa?.price || 17) + (bump ? sos?.price || 27 : 0);
  function checkout() { void trackFunnel("checkout_clicked", { leadId: data.leadId, email: data.email, profileKey: data.profile, productId: bump ? "mapa+sos" : "mapa" }); }
  return <main className="result-shell">
    <header className="result-header"><Link href="/" className="brand"><span className="brand-mark">V</span><span>Volta Pra <em>Você</em></span></Link><span className="private-pill">Diagnóstico privado</span></header>
    <section className="result-hero"><div><span className="eyebrow">Seu diagnóstico</span><h1>{data.name}, seu perfil é<br/><em>{profile.name}.</em></h1><p>{profile.message}</p></div><div className="score-ring" style={{ "--score": `${data.score * 3.6}deg` } as React.CSSProperties}><div><strong>{data.score}</strong><span>de 100</span></div></div></section>
    <section className="result-grid"><article className="result-summary"><span className="eyebrow">O que seu resultado mostra</span><h2>{profile.description}</h2><div className="pattern-list"><p><span>Área mais afetada</span><strong>{weakest}</strong></p><p><span>O que mais pesa hoje</span><strong>{data.weight}</strong></p><p><span>Maior potencial de avanço</span><strong>{data.desired || strongest}</strong></p></div></article><article className="area-chart"><div className="chart-head"><div><span className="eyebrow">Seu mapa atual</span><h2>O espaço que cada área pede</h2></div><span>mais atenção →</span></div>{Object.entries(data.areas ?? fallback.areas).map(([name, value]) => <div className="chart-row" key={name}><span>{name}</span><div><i style={{ width: `${Math.max(8, value)}%` }}/></div><strong>{value}</strong></div>)}<small>Este gráfico organiza suas respostas. Não é um diagnóstico médico ou psicológico.</small></article></section>
    <section className="first-plan"><div><span className="eyebrow light">Seu primeiro plano</span><h2>Para {experience.promise}.</h2><p>{experience.reassurance}</p></div><ol>{plan.map((step, index) => <li key={step}><span>{index + 1}</span><div><strong>{["Perceba o padrão", "Proteja o possível", "Crie uma evidência"][index]}</strong><p>{step}</p></div></li>)}</ol></section>
    <section className="offer-section"><div className="offer-copy"><span className="offer-tag">Escolhido para o perfil {profile.name}</span><span className="eyebrow">{mapa?.name || "Mapa da Volta"}</span><h2>O diagnóstico mostrou o padrão. Agora dê forma ao primeiro passo.</h2><p>Você recebe um plano de 7 dias associado à sua conta e ajustado ao seu perfil, a {data.desired?.toLowerCase()} e aos {data.availableMinutes || 15} minutos que cabem na sua rotina.</p><div className="choice-reason"><strong>Por que esta é a próxima etapa?</strong><span>{personalizedOfferReason(data.profile)}</span></div><ul><li>Mapa completo das 8 áreas</li><li>Plano personalizado de 7 dias</li><li>Uma missão curta por dia</li><li>Checklist e diário guiado</li><li>Relatório individual no celular</li><li>Tudo no mesmo login</li></ul></div><div className="checkout-card"><span className="test-badge">Próximo passo mais simples</span><p>{mapa?.name || "Mapa da Volta"}</p><div className="price"><small>R$</small><strong>{Math.floor(mapa?.price || 17)}</strong><small>,00</small></div><p className="price-context">Um plano curto para sair da análise e começar com uma ação possível.</p>{canBundle && <label className="order-bump"><input type="checkbox" checked={bump} onChange={event => setBump(event.target.checked)}/><span><b>Quero preparar meu plano B com o {sos?.name || "Kit SOS"}</b><small>Tenha respostas práticas para dias difíceis por R$ {(sos?.price || 27).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.</small></span></label>}<div className="total"><span>{bump ? "Total com Kit SOS" : "Total"}</span><strong>R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></div><a className="button" href={checkoutHref(mapa, data, bump)} onClick={checkout}>{mapa?.checkoutUrl ? "Quero começar meu plano" : "Entrar para continuar"}</a><p className="secure-note">✓ Mesmo login para todos os produtos<br/>✓ Acesso após a confirmação do pagamento<br/>✓ 7 dias para solicitar arrependimento em compras online</p></div></section>
    <footer className="result-footer"><Link href="/legal#privacidade">Privacidade</Link><span>•</span><Link href="/legal#saude">Aviso de cuidado</Link><span>•</span><Link href="/quiz">Refazer diagnóstico</Link></footer>
  </main>;
}
