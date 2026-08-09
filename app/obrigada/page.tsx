"use client";

import { SafeLink as Link } from "@/components/SafeLink";
import { trackFunnel } from "@/lib/funnel-client";
import { useEffect } from "react";

type Result = { name?: string; email?: string; leadId?: string; profile?: string };

export default function ThankYouPage() {
  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem("volta-result") || "{}") as Result;
      void trackFunnel("thank_you_viewed", { leadId: parsed.leadId, email: parsed.email, profileKey: parsed.profile });
    } catch { /* A página continua útil sem dados locais. */ }
  }, []);
  return <main className="thank-you-shell"><header><Link href="/" className="brand"><span className="brand-mark">V</span><span>Volta Pra <em>Você</em></span></Link><span className="private-pill">Compra protegida</span></header><section className="thank-you-card"><span className="purchase-check">✓</span><span className="eyebrow">Próxima etapa</span><h1>Recebemos seu pedido.</h1><p>Assim que a Wiapy confirmar o pagamento, o produto será liberado automaticamente para o e-mail usado na compra.</p><ol><li><span>1</span><div><strong>Aguarde a confirmação</strong><p>Pix costuma ser confirmado rapidamente. Cartão depende da aprovação da operadora.</p></div></li><li><span>2</span><div><strong>Abra o e-mail de acesso</strong><p>Você receberá uma mensagem do Movimento com o botão para entrar.</p></div></li><li><span>3</span><div><strong>Use sempre o e-mail da compra</strong><p>Todos os produtos ficam reunidos na mesma conta, sem senha para memorizar.</p></div></li></ol><Link className="button" href="/entrar">Acessar minha conta</Link><small>Não encontrou o e-mail? Verifique spam e promoções ou fale com o atendimento informado no checkout.</small></section><section className="thank-you-trust"><strong>Seu diagnóstico continua vinculado à experiência.</strong><p>Ao entrar, as missões, recomendações e próximos passos consideram o perfil criado no quiz.</p></section></main>;
}
