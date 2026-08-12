"use client";

import { SafeLink as Link } from "@/components/SafeLink";
import { useEffect, useState } from "react";

type Product = { id: string; name: string; price: number; checkoutUrl: string };

export default function UpsellPage() {
  const [product, setProduct] = useState<Product | null>(null);
  useEffect(() => {
    fetch("/api/data?mode=catalog")
      .then(response => response.json() as Promise<{ products: Product[] }>)
      .then(value => setProduct((value.products || []).find((item: Product) => item.id === "desafio") || null))
      .catch(() => {});
  }, []);
  const href = product?.checkoutUrl || "/entrar?produto=desafio";

  return <main className="upsell-shell">
    <Link href="/" className="brand brand-light"><span className="brand-mark">V</span><span>Volta Pra <em>Você</em></span></Link>
    <section>
      <span className="eyebrow light">Sua próxima etapa, sem mudar tudo de uma vez</span>
      <h1>Você já ganhou clareza. Agora proteja sete dias para testar um caminho.</h1>
      <p className="upsell-lead">Uma ação pequena por dia reduz o peso de “preciso mudar minha vida” e transforma intenção em progresso visível.</p>
      <div className="challenge-days">
        {["Reconhecer", "Recuperar seu tempo", "Reduzir", "Retomar prazer", "Criar limite", "Ouvir um desejo", "Assumir compromisso"].map((day, index) => <div key={day}><span>{index + 1}</span><p>{day}</p></div>)}
      </div>
      <div className="upsell-offer">
        <div>
          <small>{product?.name || "Desafio 7 Dias Sem Me Abandonar"}</small>
          <h2>Sete dias para provar a si mesma que uma rotina possível pode começar pequena.</h2>
          <p>Missões adaptadas ao diagnóstico, check-ins, recompensas visuais e registro do seu avanço dentro da mesma conta. Sem promessa de perfeição: você acompanha evidências reais do que conseguiu fazer.</p>
          <ul><li>Compromisso curto e claro</li><li>Progresso visível no celular</li><li>Mesmo login dos outros produtos</li></ul>
        </div>
        <div className="upsell-price">
          <span>acesso individual por</span>
          <strong>R$ {(product?.price || 47).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
          <small>uma etapa por vez</small>
        </div>
      </div>
      <a className="button button-light" href={href}>{product?.checkoutUrl ? "Quero viver meus 7 dias" : "Entrar para solicitar acesso"}</a>
      <Link href="/app" className="decline-link">Agora não. Quero continuar com meus acessos atuais</Link>
    </section>
    <p className="safety-copy">Conteúdo educativo de organização e reflexão. Não substitui acompanhamento profissional.</p>
  </main>;
}
