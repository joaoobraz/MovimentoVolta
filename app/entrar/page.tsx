import { chatGPTSignInPath, getChatGPTUser } from "@/app/chatgpt-auth";
import { SafeLink as Link } from "@/components/SafeLink";

export const dynamic = "force-dynamic";

export default async function LoginPage(){
  const user = await getChatGPTUser();
  return <main className="auth-shell">
    <section className="auth-brand-panel">
      <Link href="/" className="brand brand-light"><span className="brand-mark">V</span><span>Volta Pra <em>Você</em></span></Link>
      <div><span className="eyebrow light">Seu espaço individual</span><h1>Voltar para si também pode começar por aqui.</h1><p>Seu diagnóstico, produtos, missões, check-ins e registros reunidos em uma conta protegida.</p></div>
      <blockquote>“Hoje você não precisa mudar tudo. Precisa apenas não se abandonar.”</blockquote>
    </section>
    <section className="auth-form-panel"><div className="auth-box">
      <Link href="/" className="mobile-auth-brand">← Voltar ao início</Link>
      {user ? <>
        <span className="eyebrow">Conta reconhecida</span>
        <h2>Que bom ter você de volta.</h2>
        <p>Você está conectada como <strong>{user.displayName}</strong>. Seus dados e acessos são carregados somente para esta conta.</p>
        <Link href="/app" className="button">Continuar para meu espaço</Link>
        <a href="/signout-with-chatgpt?return_to=%2F" className="forgot-link">Sair desta conta</a>
      </> : <>
        <span className="eyebrow">Entrada segura</span>
        <h2>Acesse o seu espaço.</h2>
        <p>Use sua conta ChatGPT para manter diagnóstico, compras e progresso separados dos dados de outras clientes.</p>
        <a href={chatGPTSignInPath("/app")} className="chatgpt-button">Continuar com ChatGPT</a>
        <div className="secure-note">✓ Nenhuma senha é armazenada pela plataforma<br/>✓ Cada cliente possui dados e acessos individuais</div>
      </>}
      <p className="safety-copy">Ao continuar, você concorda com os <Link href="/legal#termos">Termos de Uso</Link> e a <Link href="/legal#privacidade">Política de Privacidade</Link>.</p>
    </div></section>
  </main>;
}
