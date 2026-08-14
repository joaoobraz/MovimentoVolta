"use client";
/* eslint-disable react-hooks/set-state-in-effect, no-empty */

import { SafeLink as Link } from "@/components/SafeLink";
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { ProfileKey, profileContent } from "@/lib/content";
import { trackFunnel } from "@/lib/funnel-client";
import { personalizedOfferReason, personalizedPlan, profileExperience } from "@/lib/personalization";
import { appendAttribution } from "@/lib/attribution";

type StoredResult = { name: string; email?: string; profile: ProfileKey; score: number; areas: Record<string, number>; weight: string; desired: string; availableMinutes?: number; leadId?: string };
type Product = { id: string; name: string; price: number; access: string; checkoutUrl: string; bundleCheckoutUrl?: string; downsellCheckoutUrl?: string };
const fallback: StoredResult = { name: "Você", profile: "sobrecarregada", score: 76, weight: "Rotina", desired: "Tempo para mim", availableMinutes: 15, areas: { "Tempo pessoal": 82, "Energia": 74, "Limites": 88, "Projetos": 61, "Vida social": 55, "Organização": 72, "Descanso": 79, "Autocuidado": 67 } };

function checkoutHref(selectedCheckout: string | undefined, data: StoredResult, productId: string) {
  if (!selectedCheckout) return `/entrar?produto=${encodeURIComponent(productId)}&lead=${encodeURIComponent(data.leadId || "")}`;
  if (typeof window === "undefined") return selectedCheckout;
  try {
    const url = new URL(selectedCheckout, window.location.origin);
    if (data.leadId) url.searchParams.set("lead_id", data.leadId);
    if (data.email) url.searchParams.set("email", data.email);
    return appendAttribution(url).toString();
  } catch { return selectedCheckout; }
}

export function ResultPage() {
  const [data, setData] = useState<StoredResult>(fallback), [products, setProducts] = useState<Product[]>([]), [exitOfferOpen, setExitOfferOpen] = useState(false);
  const allowExit = useRef(false);
  const offerRef = useRef<HTMLElement | null>(null);
  const offerTracked = useRef(false);
  useEffect(() => { const raw = localStorage.getItem("volta-result"); if (raw) try { const parsed = JSON.parse(raw) as StoredResult; setData(parsed); void trackFunnel("result_viewed", { leadId: parsed.leadId, email: parsed.email, profileKey: parsed.profile }); } catch {} else window.location.replace("/quiz"); fetch("/api/data?mode=catalog").then(response => response.json() as Promise<{ products: Product[] }>).then(value => setProducts(value.products || [])).catch(() => {}); }, []);
  const profile = profileContent[data.profile] ?? profileContent.sobrecarregada;
  const weakest = useMemo(() => Object.entries(data.areas ?? {}).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Tempo pessoal", [data]);
  const strongest = useMemo(() => Object.entries(data.areas ?? {}).sort((a, b) => a[1] - b[1])[0]?.[0] ?? "Projetos", [data]);
  const mapa = products.find(product => product.id === "mapa"), completo = products.find(product => product.id === "completo");
  const experience = profileExperience[data.profile] ?? profileExperience.sobrecarregada;
  const plan = personalizedPlan(data.profile, data.desired, data.weight, data.availableMinutes || 15);
  useEffect(() => {
    const element = offerRef.current;
    if (!element || !data.leadId || offerTracked.current) return;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting) || offerTracked.current) return;
      offerTracked.current = true;
      void trackFunnel("offer_viewed", { leadId: data.leadId, email: data.email, profileKey: data.profile, source: "result_offer" });
      observer.disconnect();
    }, { threshold: 0.15 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [data.email, data.leadId, data.profile]);
  const exitStorageKey = `volta-exit-offer:${data.leadId || data.email || "visit"}`;
  function openExitOffer(source: string) {
    if (!completo?.downsellCheckoutUrl || allowExit.current) return false;
    try { if (sessionStorage.getItem(exitStorageKey)) return false; sessionStorage.setItem(exitStorageKey, "shown"); } catch {}
    setExitOfferOpen(true);
    void trackFunnel("exit_offer_viewed", { leadId: data.leadId, email: data.email, profileKey: data.profile, productId: "completo", source });
    return true;
  }
  useEffect(() => {
    if (!completo?.downsellCheckoutUrl) return;
    const onMouseOut = (event: globalThis.MouseEvent) => { if (event.clientY <= 8 && !event.relatedTarget) openExitOffer("desktop_exit"); };
    const onBack = () => { if (!allowExit.current) { window.history.pushState({ voltaOffer: true }, "", window.location.href); openExitOffer("back_button"); } };
    window.history.pushState({ voltaOffer: true }, "", window.location.href);
    document.addEventListener("mouseout", onMouseOut);
    window.addEventListener("popstate", onBack);
    return () => { document.removeEventListener("mouseout", onMouseOut); window.removeEventListener("popstate", onBack); };
  // A oferta só é registrada quando o checkout de recuperação existe.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completo?.downsellCheckoutUrl]);
  function checkout(productId: string, offer: string) { void trackFunnel("checkout_clicked", { leadId: data.leadId, email: data.email, profileKey: data.profile, productId, source: offer }); }
  function interceptExit(event: MouseEvent<HTMLAnchorElement>) { if (openExitOffer("exit_link")) event.preventDefault(); }
  function leaveResult() { allowExit.current = true; setExitOfferOpen(false); window.location.href = "/"; }
  return <main className="result-shell">
    <header className="result-header"><Link href="/" className="brand" onClick={interceptExit}><span className="brand-mark">V</span><span>Volta Pra <em>Você</em></span></Link><span className="private-pill">Diagnóstico privado</span></header>
    <section className="result-hero"><div><span className="eyebrow">Seu diagnóstico</span><h1>{data.name}, seu perfil é<br/><em>{profile.name}.</em></h1><p>{profile.message}</p><a className="result-hero-cta" href="#oferta">Ver meu próximo passo personalizado ↓</a></div><div className="score-ring" style={{ "--score": `${data.score * 3.6}deg` } as React.CSSProperties}><div><strong>{data.score}</strong><span>de 100</span></div></div></section>
    <section className="result-grid"><article className="result-summary"><span className="eyebrow">O que seu resultado mostra</span><h2>{profile.description}</h2><div className="pattern-list"><p><span>Área mais afetada</span><strong>{weakest}</strong></p><p><span>O que mais pesa hoje</span><strong>{data.weight}</strong></p><p><span>Maior potencial de avanço</span><strong>{data.desired || strongest}</strong></p></div></article><article className="area-chart"><div className="chart-head"><div><span className="eyebrow">Seu mapa atual</span><h2>O espaço que cada área pede</h2></div><span>mais atenção →</span></div>{Object.entries(data.areas ?? fallback.areas).map(([name, value]) => <div className="chart-row" key={name}><span>{name}</span><div><i style={{ width: `${Math.max(8, value)}%` }}/></div><strong>{value}</strong></div>)}<small>Este gráfico organiza suas respostas. Não é um diagnóstico médico ou psicológico.</small></article></section>
    <section className="first-plan"><div><span className="eyebrow light">Seu primeiro plano</span><h2>Para {experience.promise}.</h2><p>{experience.reassurance}</p></div><ol>{plan.map((step, index) => <li key={step}><span>{index + 1}</span><div><strong>{["Perceba o padrão", "Proteja o possível", "Crie uma evidência"][index]}</strong><p>{step}</p></div></li>)}</ol></section>
    <section className="offer-section offer-choice" id="oferta" ref={offerRef}><div className="offer-intro"><span className="offer-tag">Recomendação para o perfil {profile.name}</span><span className="eyebrow">Transforme clareza em movimento</span><h2>Não deixe este diagnóstico virar mais uma coisa que você entendeu, mas adiou.</h2><p>Seu resultado já mostrou onde você está. Agora escolha entre receber apenas o mapa para começar ou ter também apoio nos dias difíceis e uma sequência guiada de sete dias.</p><div className="offer-trust-row"><span>Pagamento único</span><span>Pix ou cartão</span><span>Acesso individual</span><span>Sem assinatura</span></div><div className="choice-reason"><strong>Por que esta é a próxima etapa para você?</strong><span>{personalizedOfferReason(data.profile)}</span></div></div><div className="offer-cards"><article className="checkout-card essential-card"><span className="test-badge">Para começar com clareza</span><p>{mapa?.name || "Mapa da Volta"}</p><div className="price"><small>R$</small><strong>{Math.floor(mapa?.price || 17)}</strong><small>,00</small></div><p className="price-context">Uma direção personalizada para sair da confusão e dar o primeiro passo possível.</p><ul><li>Mapa completo das 8 áreas</li><li>Plano personalizado de 7 dias</li><li>Missões curtas e diário guiado</li><li>Relatório individual no celular</li></ul><a className="button button-secondary" href={checkoutHref(mapa?.checkoutUrl, data, "mapa")} onClick={() => checkout("mapa", "essential")}>Quero meu plano personalizado</a><p className="secure-note">Você poderá avançar depois usando a mesma conta.</p></article><article className="checkout-card complete-card"><span className="recommended-ribbon">Recomendado para não parar no plano</span><p>{completo?.name || "Plano VOLTA Completo"}</p><div className="value-anchor"><span>Valor dos conteúdos separados</span><del>R$ 91,00</del></div><div className="price"><small>R$</small><strong>{Math.floor(completo?.price || 47)}</strong><small>,00</small></div><p className="price-context">Clareza, apoio nos dias difíceis e continuidade para transformar intenção em prática.</p><ul><li>Tudo do Mapa da Volta</li><li>Kit SOS Para Dias Difíceis</li><li>Desafio 7 Dias Sem Me Abandonar</li><li>Check-ins e conquistas visuais</li><li>Diário privado e relatório de progresso</li><li>Experiência adaptada ao seu perfil</li></ul><a className="button" href={checkoutHref(completo?.checkoutUrl, data, "completo")} onClick={() => checkout("completo", "complete_47")}>Quero começar meus 7 dias agora</a><p className="secure-note">Pagamento único. Acesso individual liberado após a confirmação da Wiapy.</p></article></div><div className="offer-assurance"><strong>Uma só conta para toda a sua jornada.</strong><span>O e-mail usado na compra libera exatamente os produtos adquiridos e preserva seu perfil, plano e progresso.</span></div></section>
    {exitOfferOpen && <div className="exit-offer-backdrop" role="dialog" aria-modal="true" aria-labelledby="exit-offer-title"><article className="exit-offer-modal"><button className="exit-offer-close" onClick={leaveResult} aria-label="Fechar e sair">×</button><span className="eyebrow">Condição de lançamento para a primeira turma</span><h2 id="exit-offer-title">Leve a experiência completa pelo valor do Mapa.</h2><p>Antes de sair, você pode receber o Mapa da Volta, o Kit SOS e o Desafio de 7 Dias por <strong>R$ 17,00</strong>, em pagamento único.</p><div className="exit-offer-list"><span>✓ Plano ligado ao seu diagnóstico</span><span>✓ Kit SOS completo</span><span>✓ Sete dias de missões e check-ins</span><span>✓ Mesmo login e acesso individual</span></div><a className="button" href={checkoutHref(completo?.downsellCheckoutUrl, data, "completo")} onClick={() => { allowExit.current = true; void trackFunnel("exit_offer_clicked", { leadId: data.leadId, email: data.email, profileKey: data.profile, productId: "completo", source: "launch_17" }); }}>Sim, quero a condição de R$ 17</a><button className="text-button" onClick={leaveResult}>Não, quero sair</button><small>Esta condição é apresentada somente nesta etapa de lançamento. Sem cobrança recorrente.</small></article></div>}
    <footer className="result-footer"><Link href="/legal#privacidade">Privacidade</Link><span>•</span><Link href="/legal#saude">Aviso de cuidado</Link><span>•</span><Link href="/quiz" onClick={interceptExit}>Refazer diagnóstico</Link></footer>
  </main>;
}
