"use client";
/* eslint-disable react-hooks/set-state-in-effect, no-empty, jsx-a11y/label-has-associated-control */

import { SafeLink as Link } from "@/components/SafeLink";
import { useEffect, useMemo, useState } from "react";
import { ProfileKey, profileContent } from "@/lib/content";

type StoredResult = { name: string; email?: string; profile: ProfileKey; score: number; areas: Record<string, number>; weight: string; desired: string; leadId?: string };
type Product = { id: string; name: string; price: number; access: string; checkoutUrl: string };
const fallback: StoredResult = { name: "Maria", profile: "sobrecarregada", score: 76, weight: "Trabalho", desired: "Tempo para mim", areas: { "Tempo pessoal": 82, "Energia": 74, "Limites": 88, "Projetos": 61, "Vida social": 55, "Organização": 72, "Descanso": 79, "Autocuidado": 67 } };

function checkoutHref(product: Product | undefined, data: StoredResult, bump: boolean) {
  if (!product?.checkoutUrl) return `/entrar?produto=mapa&lead=${encodeURIComponent(data.leadId || "")}`;
  try {
    const url = new URL(product.checkoutUrl, location.origin);
    if (data.leadId) url.searchParams.set("lead_id", data.leadId);
    if (data.email) url.searchParams.set("email", data.email);
    if (bump) url.searchParams.set("bump", "sos");
    return url.toString();
  } catch { return product.checkoutUrl; }
}

export function ResultPage() {
  const [data, setData] = useState<StoredResult>(fallback), [bump, setBump] = useState(false), [products, setProducts] = useState<Product[]>([]);
  useEffect(() => { const raw = localStorage.getItem("volta-result"); if (raw) try { setData(JSON.parse(raw)); } catch {} fetch("/api/data?mode=catalog").then(response => response.json() as Promise<{ products: Product[] }>).then(value => setProducts(value.products || [])).catch(() => {}); }, []);
  const profile = profileContent[data.profile] ?? profileContent.sobrecarregada;
  const weakest = useMemo(() => Object.entries(data.areas ?? {}).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Tempo pessoal", [data]);
  const strongest = useMemo(() => Object.entries(data.areas ?? {}).sort((a, b) => a[1] - b[1])[0]?.[0] ?? "Projetos", [data]);
  const mapa = products.find(product => product.id === "mapa"), sos = products.find(product => product.id === "sos");
  const total = (mapa?.price || 17) + (bump ? sos?.price || 27 : 0);
  return <main className="result-shell">
    <header className="result-header"><Link href="/" className="brand"><span className="brand-mark">V</span><span>Volta Pra <em>Você</em></span></Link><span className="private-pill">Diagnóstico privado</span></header>
    <section className="result-hero"><div><span className="eyebrow">Seu diagnóstico</span><h1>{data.name}, seu perfil é<br/><em>{profile.name}.</em></h1><p>{profile.message}</p></div><div className="score-ring" style={{ "--score": `${data.score * 3.6}deg` } as React.CSSProperties}><div><strong>{data.score}</strong><span>de 100</span></div></div></section>
    <section className="result-grid"><article className="result-summary"><span className="eyebrow">O que seu resultado mostra</span><h2>{profile.description}</h2><div className="pattern-list"><p><span>Área mais afetada</span><strong>{weakest}</strong></p><p><span>O que mais pesa hoje</span><strong>{data.weight}</strong></p><p><span>Maior potencial de avanço</span><strong>{data.desired || strongest}</strong></p></div></article><article className="area-chart"><div className="chart-head"><div><span className="eyebrow">Seu mapa atual</span><h2>O espaço que cada área pede</h2></div><span>mais atenção →</span></div>{Object.entries(data.areas ?? fallback.areas).map(([name, value]) => <div className="chart-row" key={name}><span>{name}</span><div><i style={{ width: `${Math.max(8, value)}%` }}/></div><strong>{value}</strong></div>)}<small>Este gráfico organiza suas respostas. Não é um diagnóstico médico ou psicológico.</small></article></section>
    <section className="first-plan"><div><span className="eyebrow light">Seu primeiro plano</span><h2>Três passos para começar sem mudar tudo.</h2></div><ol><li><span>1</span><div><strong>Nomeie o que pesa</strong><p>Anote as três responsabilidades que mais ocupam sua cabeça.</p></div></li><li><span>2</span><div><strong>Proteja o tempo possível</strong><p>Use o tempo informado no diagnóstico para criar um espaço com começo e fim.</p></div></li><li><span>3</span><div><strong>Reduza uma etapa</strong><p>Simplifique uma tarefa que você repete por hábito.</p></div></li></ol></section>
    <section className="offer-section"><div className="offer-copy"><span className="offer-tag">Recomendado pelo seu resultado</span><span className="eyebrow">{mapa?.name || "Mapa da Volta"}</span><h2>O diagnóstico mostrou o padrão. Agora dê forma ao primeiro passo.</h2><p>Em vez de tentar mudar tudo, você recebe um plano de 7 dias associado à sua conta e ajustado ao perfil, à área escolhida e ao tempo que cabe na sua rotina.</p><div className="choice-reason"><strong>Por que começar agora?</strong><span>Quando o resultado ainda está fresco, fica mais fácil escolher uma ação específica e não deixar a descoberta virar apenas mais uma intenção.</span></div><ul><li>Mapa completo das 8 áreas</li><li>Plano personalizado de 7 dias</li><li>Uma missão curta por dia</li><li>Checklist e diário guiado</li><li>Relatório individual no celular</li><li>Tudo no mesmo login</li></ul></div><div className="checkout-card"><span className="test-badge">Próximo passo mais simples</span><p>{mapa?.name || "Mapa da Volta"}</p><div className="price"><small>R$</small><strong>{Math.floor(mapa?.price || 17)}</strong><small>,00</small></div><p className="price-context">Um plano curto para sair da análise e começar com uma ação possível.</p><label className="order-bump"><input type="checkbox" checked={bump} onChange={event => setBump(event.target.checked)}/><span><b>Quero preparar meu plano B com o {sos?.name || "Kit SOS"}</b><small>Não dependa só de força de vontade nos dias difíceis: tenha respostas práticas por R$ {(sos?.price || 27).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}.</small></span></label>{bump && mapa?.checkoutUrl && <p className="checkout-hint">Confirme a inclusão do Kit SOS também no checkout da Wiapy.</p>}<div className="total"><span>{bump ? "Total com Kit SOS" : "Total"}</span><strong>R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong></div><a className="button" href={checkoutHref(mapa, data, bump)}>{mapa?.checkoutUrl ? "Quero começar meu plano" : "Entrar para continuar"}</a><p className="secure-note">✓ Mesmo login para todos os produtos<br/>✓ Acesso após a confirmação do pagamento<br/>✓ Compra online protegida pelo direito de arrependimento aplicável</p></div></section>
    <footer className="result-footer"><Link href="/legal#privacidade">Privacidade</Link><span>•</span><Link href="/legal#saude">Aviso de cuidado</Link><span>•</span><Link href="/quiz">Refazer diagnóstico</Link></footer>
  </main>;
}
