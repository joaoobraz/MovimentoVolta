import Image from "next/image";
import { SafeLink as Link } from "@/components/SafeLink";
import { CookieSettingsButton, PublicAccessibilityTools, PublicNavigation, SpeakIntroduction } from "@/components/LandingInteractions";
import { phases } from "@/lib/content";

const pains = ["Você resolve tudo para todos.", "Suas prioridades ficam sempre para depois.", "Sente culpa quando descansa.", "Começa projetos pessoais e abandona.", "Não lembra da última vez em que fez algo apenas por você.", "Os dias passam, mas sua vida pessoal não avança."];
const benefits = ["Recuperar espaço na rotina", "Retomar projetos pessoais", "Identificar excessos", "Organizar prioridades", "Criar pequenos hábitos", "Registrar conquistas", "Desenvolver limites cotidianos", "Sair gradualmente do piloto automático", "Fazer algo por si todos os dias"];
const journeyStages = [
  { tag: "Descoberta", title: "Entenda seu momento", text: "Responda ao diagnóstico e veja quais áreas da sua vida estão pedindo mais espaço." },
  { tag: "Primeiro movimento", title: "Receba uma direção", text: "Seu perfil transforma as respostas em um ponto de partida curto e possível." },
  { tag: "Continuidade", title: "Avance no seu ritmo", text: "Novas etapas aparecem dentro da mesma conta, preservando seu progresso e seus registros." },
  { tag: "Consolidação", title: "Proteja o que mudou", text: "Quando fizer sentido, aprofunde a experiência com acompanhamento e comunidade." },
];
const faqs = [
  ["O diagnóstico é gratuito?", "Sim. Você pode responder ao diagnóstico e receber seu perfil resumido sem pagar."],
  ["Quanto tempo demora?", "Menos de três minutos, em média. As perguntas aparecem uma por vez."],
  ["Preciso assistir a aulas?", "Não. A experiência é feita de textos curtos, perguntas e ações práticas."],
  ["Preciso instalar um aplicativo?", "Não. A plataforma funciona direto no navegador e pode ser adicionada à tela inicial."],
  ["A plataforma funciona pelo celular?", "Sim. Toda a experiência foi desenhada primeiro para telas de celular."],
  ["O conteúdo substitui terapia?", "Não. A plataforma oferece organização, reflexão e ações cotidianas; não substitui cuidado médico ou psicológico."],
  ["Meus dados e respostas são privados?", "Sim. O diário é privado e nunca é publicado na comunidade. Você controla consentimentos e pode solicitar exclusão."],
  ["Posso fazer no meu ritmo?", "Sim. Missões anteriores permanecem acessíveis e a liberação pode ser diária ou livre."],
];
export function LandingPage() {
  return <div className="public-shell">
    <a className="skip-link" href="#conteudo">Pular para o conteúdo</a>
    <header className="site-header">
      <Link href="/" className="brand" aria-label="Movimento Volta Pra Você, início"><span className="brand-mark">V</span><span>Volta Pra <em>Você</em></span></Link>
      <PublicNavigation />
    </header>

    <main id="conteudo">
      <section className="hero section-pad">
        <div className="hero-copy reveal">
          <span className="eyebrow">Movimento Volta Pra Você</span>
          <h1>Em que momento da vida você começou a se deixar para depois?</h1>
          <p className="lead">Faça o diagnóstico gratuito e descubra quanto espaço você ainda ocupa na sua própria vida.</p>
          <div className="hero-actions"><Link href="/quiz" className="button">Fazer meu diagnóstico gratuito</Link><SpeakIntroduction /></div>
          <p className="microcopy"><span>✓</span> Leva menos de 3 minutos. <span>✓</span> Sem aulas longas.</p>
        </div>
        <div className="hero-visual reveal delay-1">
          <div className="hero-image-wrap"><Image src="/hero-v1.webp" alt="Mulher adulta em um momento cotidiano, escrevendo em um caderno perto da janela" fill priority sizes="(max-width: 800px) 100vw, 48vw" /></div>
          <div className="floating-note"><span>15</span> minutos<br/>só seus</div>
        </div>
      </section>

      <section className="pain-section section-pad">
        <div className="section-heading"><span className="eyebrow">Talvez isso pareça familiar</span><h2>Talvez você não tenha desistido de si. Talvez apenas tenha se colocado por último durante tempo demais.</h2></div>
        <div className="pain-grid">{pains.map((pain,i)=><div className="pain-item" key={pain}><span>{String(i+1).padStart(2,"0")}</span><p>{pain}</p></div>)}</div>
        <div className="center"><Link href="/quiz" className="button button-secondary">Descobrir meu perfil</Link></div>
      </section>

      <section className="movement-section section-pad" id="movimento">
        <div className="movement-copy"><span className="eyebrow light">Não é mais um curso</span><h2>Um movimento para mulheres que decidiram não se abandonar mais.</h2><p>Você não precisa assistir a aulas longas, mudar toda a sua rotina ou esperar o momento perfeito. O Movimento foi criado para recuperar pequenos espaços na própria vida por meio de ações práticas de poucos minutos por dia.</p></div>
        <div className="pillar-grid">{[["01","Uma pequena ação por dia"],["02","Uma rotina que cabe na vida real"],["03","Uma comunidade de mulheres em retomada"]].map(([n,t])=><article className="pillar" key={n}><span>{n}</span><h3>{t}</h3></article>)}</div>
      </section>

      <section className="steps-section section-pad"><div className="section-heading compact"><span className="eyebrow">Como funciona</span><h2>Da descoberta ao primeiro movimento.</h2></div><div className="steps-row">{["Faça o diagnóstico","Descubra seu perfil","Receba seu primeiro plano","Comece sua jornada"].map((s,i)=><div className="step" key={s}><span>{i+1}</span><p>{s}</p>{i<3&&<i aria-hidden>→</i>}</div>)}</div><div className="trust-strip"><span>Experiência individual por perfil</span><span>Acesso pelo e-mail da compra</span><span>Diário privado por padrão</span><span>7 dias para arrependimento online</span></div></section>

      <section className="benefits-section section-pad"><div className="benefit-intro"><span className="eyebrow">Espaço possível</span><h2>Pequenos movimentos que devolvem presença à sua rotina.</h2><p>Sem prometer transformar tudo de uma vez. O foco é perceber, escolher e agir com constância.</p></div><div className="benefit-list">{benefits.map((b,i)=><div key={b}><span>0{i+1}</span>{b}</div>)}</div></section>

      <section className="method-section section-pad" id="metodo"><div className="section-heading"><span className="eyebrow light">Método VOLTA</span><h2>Cinco movimentos para voltar a ocupar espaço na própria vida.</h2></div><div className="method-track">{phases.map((p)=><article key={p.letter}><span className="method-letter">{p.letter}</span><div><h3>{p.name}</h3><p>{p.description}</p></div></article>)}</div></section>

      <section className="product-ladder section-pad" id="produtos"><div className="section-heading"><span className="eyebrow">Uma experiência, uma só conta</span><h2>Primeiro você se reconhece. Depois escolhe como deseja avançar.</h2><p>A página inicial não decide por você. As opções, entregáveis e valores aparecem somente depois do diagnóstico, quando já existe contexto para uma recomendação individual.</p></div><div className="ladder-grid">{journeyStages.map((stage, index) => <article key={stage.tag}><em>{stage.tag}</em><span>{String(index + 1).padStart(2, "0")}</span><h3>{stage.title}</h3><p>{stage.text}</p></article>)}</div><div className="ladder-cta"><Link href="/quiz" className="button">Descobrir meu próximo passo</Link><small>Diagnóstico gratuito, privado e com menos de três minutos.</small></div><div className="evidence-card"><div><span className="eyebrow light">Confiança antes da pressa</span><h3>Sem depoimentos inventados, contadores falsos ou promessas impossíveis.</h3></div><p>A recomendação nasce das respostas do quiz. Preços, entregáveis e acesso são mostrados com clareza antes da compra.</p></div></section>

      <section className="quiz-cta section-pad"><span className="eyebrow light">Seu primeiro passo</span><h2>Antes de mudar sua rotina, descubra onde você se deixou para depois.</h2><Link href="/quiz" className="button button-light">Começar diagnóstico gratuito</Link><p>Gratuito · privado · menos de 3 minutos</p></section>

      <section className="faq-section section-pad" id="duvidas"><div className="section-heading compact"><span className="eyebrow">Perguntas frequentes</span><h2>O que você talvez queira saber.</h2></div><div className="faq-list">{faqs.map(([q,a])=><details key={q}><summary>{q}<span>+</span></summary><p>{a}</p></details>)}</div></section>
    </main>

    <footer className="site-footer"><div className="footer-brand"><div className="brand"><span className="brand-mark">V</span><span>Volta Pra <em>Você</em></span></div><p>“Eu não me abandono mais.”</p></div><div><h3>Movimento</h3><Link href="/quiz">Diagnóstico gratuito</Link><Link href="/entrar">Entrar na conta</Link><a href="#metodo">Método VOLTA</a></div><div><h3>Informações</h3><Link href="/legal#termos">Termos de uso</Link><Link href="/legal#privacidade">Privacidade e LGPD</Link><Link href="/legal#cookies">Política de cookies</Link><CookieSettingsButton /><Link href="/legal#contato">Contato</Link></div><div className="footer-warning"><h3>Um aviso importante</h3><p>Esta plataforma oferece apoio de organização e reflexão. Não substitui acompanhamento médico ou psicológico.</p></div><small className="copyright">© {new Date().getFullYear()} Movimento Volta Pra Você. Todos os direitos reservados.</small></footer>

    <PublicAccessibilityTools />
  </div>;
}
