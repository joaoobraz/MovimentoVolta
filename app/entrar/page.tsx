import { getSessionUser } from "@/app/session-auth";
import { EmailLoginForm } from "@/components/EmailLoginForm";
import { SafeLink as Link } from "@/components/SafeLink";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ email?: string }> }){
  const user = await getSessionUser();
  const requestedEmail = String((await searchParams).email || "").slice(0, 160);
  const demo = process.env.DEMO_MODE === "true";
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
        <p>Você está conectada como <strong>{user.name}</strong>. Seus dados e acessos são carregados somente para esta conta.</p>
        <Link href="/app" className="button">Continuar para meu espaço</Link>
        <form action="/api/logout" method="post"><button className="forgot-link auth-logout" type="submit">Sair desta conta</button></form>
      </> : <>
        <span className="eyebrow">{demo ? "Prévia do acesso das compradoras" : "Entrada segura por e-mail"}</span>
        <h2>Acesse o seu espaço.</h2>
        {demo ? <>
          <p>Use o mesmo e-mail informado na compra. Nesta prévia local, ele abre diretamente a conta de teste.</p>
          <form className="buyer-login-preview" action="/api/demo-auth" method="post"><label>E-mail usado na compra<input name="email" type="email" required defaultValue={process.env.DEMO_EMAIL || "teste@volta.local"}/></label><button className="auth-submit-button" type="submit">Entrar na conta de teste</button></form>
          <div className="secure-note">✓ Todos os produtos estão liberados para teste<br/>✓ Sair da conta encerra esta sessão local</div>
        </> : <>
          <p>Digite o mesmo e-mail usado na compra. Você receberá um link seguro, sem precisar criar ou lembrar uma senha.</p>
          <EmailLoginForm defaultEmail={requestedEmail}/>
          <div className="secure-note">✓ Nenhuma senha é armazenada pela plataforma<br/>✓ Cada cliente vê somente os produtos comprados</div>
        </>}
      </>}
      <p className="safety-copy">Ao continuar, você concorda com os <Link href="/legal#termos">Termos de Uso</Link> e a <Link href="/legal#privacidade">Política de Privacidade</Link>.</p>
    </div></section>
  </main>;
}
