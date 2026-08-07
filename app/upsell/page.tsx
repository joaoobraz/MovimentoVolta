"use client";

import { SafeLink as Link } from "@/components/SafeLink";
import { useEffect, useState } from "react";

type Product = { id: string; name: string; price: number; checkoutUrl: string };

export default function UpsellPage() {
  const [product, setProduct] = useState<Product | null>(null);
  useEffect(() => { fetch("/api/data?mode=catalog").then(response => response.json() as Promise<{ products: Product[] }>).then(value => setProduct((value.products || []).find((item: Product) => item.id === "desafio") || null)).catch(() => {}); }, []);
  const href = product?.checkoutUrl || "/entrar?produto=desafio";
  return <main className="upsell-shell"><Link href="/" className="brand brand-light"><span className="brand-mark">V</span><span>Volta Pra <em>Você</em></span></Link><section><span className="eyebrow light">Próxima etapa recomendada</span><h1>Seu diagnóstico mostrou onde você se deixou para depois.</h1><p className="upsell-lead">Agora transforme essa descoberta em sete dias de ação.</p><div className="challenge-days">{["Reconhecer", "Recuperar seu tempo", "Reduzir", "Retomar prazer", "Criar limite", "Ouvir um desejo", "Assumir compromisso"].map((day, index) => <div key={day}><span>{index + 1}</span><p>{day}</p></div>)}</div><div className="upsell-offer"><div><small>{product?.name || "Desafio 7 Dias Sem Me Abandonar"}</small><h2>Uma pequena ação por você, todos os dias.</h2><p>Missões adaptadas ao diagnóstico, check-ins, frases compartilháveis e recompensas visuais dentro da mesma conta.</p></div><div className="upsell-price"><span>por</span><strong>R$ {(product?.price || 47).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong><small>acesso individual</small></div></div><a className="button button-light" href={href}>{product?.checkoutUrl ? "Continuar para o pagamento" : "Entrar para solicitar acesso"}</a><Link href="/app" className="decline-link">Não, quero continuar apenas com meus acessos atuais</Link></section><p className="safety-copy">Conteúdo educativo de organização e reflexão. Não substitui acompanhamento profissional.</p></main>;
}
