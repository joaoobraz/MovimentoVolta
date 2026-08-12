import { getSessionUser } from "@/app/session-auth";
import { PasswordLoginForm } from "@/components/PasswordLoginForm";
import { SafeLink as Link } from "@/components/SafeLink";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ email?: string; erro?: string; perfil?: string }> }) {
  const user = await getSessionUser();
  const params = await searchParams;
  const requestedEmail = String(params.email || "").slice(0, 160);
  const demo = process.env.DEMO_MODE === "true";
  const demoEmail = process.env.DEMO_EMAIL || "maria@demonstracao.com";
  const demoPassword = process.env.DEMO_PASSWORD || "Maria@Volta2026";
  const adminEmail = process.env.DEMO_ADMIN_EMAIL || "admin@demo.volta";
  const adminPassword = process.env.DEMO_ADMIN_PASSWORD || "Admin@Volta2026";
  const adminView = demo && params.perfil === "admin";
  const currentIsAdmin = Boolean(user && user.email.toLowerCase() === adminEmail.toLowerCase());
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
        <Link href={currentIsAdmin ? "/admin" : "/app"} className="button">{currentIsAdmin ? "Continuar para o painel" : "Continuar para meu espaço"}</Link>
        <form action="/api/logout" method="post"><button className="forgot-link auth-logout" type="submit">Sair desta conta</button></form>
        {demo && !currentIsAdmin && <form action="/api/logout?return_to=%2Fentrar%3Fperfil%3Dadmin" method="post"><button className="forgot-link auth-logout" type="submit">Trocar para a conta administrativa</button></form>}
      </> : <>
        <span className="eyebrow">{adminView ? "Administração local" : demo ? "Demonstração para clientes" : "Entrada segura"}</span>
        <h2>{adminView ? "Acesse o painel." : "Acesse o seu espaço."}</h2>
        {params.erro === "link_antigo" && <p className="form-error" role="alert">Este link antigo não é mais usado. Entre com sua senha ou solicite um novo e-mail de segurança.</p>}
        {demo ? <>
          <p>{adminView ? "Use esta conta somente para configurar produtos, acompanhar vendas e administrar acessos." : "Esta conta mostra a experiência completa de uma compradora, agora protegida por e-mail e senha."}</p>
          <PasswordLoginForm defaultEmail={adminView ? adminEmail : demoEmail} defaultPassword={adminView ? adminPassword : demoPassword} endpoint="/api/demo-auth" allowRecovery={false}/>
          <div className="demo-credentials"><strong>{adminView ? "Conta da administradora" : "Conta de demonstração da Maria"}</strong><span>E-mail: {adminView ? adminEmail : demoEmail}</span><span>Senha: {adminView ? adminPassword : demoPassword}</span></div>
          <div className="secure-note">{adminView ? <>✓ Painel separado da experiência das clientes<br/>✓ Configurações protegidas por conta autorizada</> : <>✓ Todos os produtos estão liberados para teste<br/>✓ Sair da conta encerra esta sessão</>}</div>
          <Link className="demo-account-switch" href={adminView ? "/entrar" : "/entrar?perfil=admin"}>{adminView ? "Entrar como Maria" : "Acessar como administradora"}</Link>
        </> : <>
          <p>Entre com o mesmo e-mail usado na compra e com a senha criada no primeiro acesso.</p>
          <PasswordLoginForm defaultEmail={requestedEmail}/>
          <div className="secure-note">✓ Sua senha não é enviada nem armazenada em texto legível<br/>✓ Cada cliente vê somente os produtos comprados</div>
        </>}
      </>}
      <p className="safety-copy">Ao continuar, você concorda com os <Link href="/legal#termos">Termos de Uso</Link> e a <Link href="/legal#privacidade">Política de Privacidade</Link>.</p>
    </div></section>
  </main>;
}
