import { PasswordSetupForm } from "@/components/PasswordSetupForm";
import { SafeLink as Link } from "@/components/SafeLink";

export const dynamic = "force-dynamic";

export default async function ActivatePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = String((await searchParams).token || "").slice(0, 220);
  return <main className="auth-shell">
    <section className="auth-brand-panel">
      <Link href="/" className="brand brand-light"><span className="brand-mark">V</span><span>Volta Pra <em>Você</em></span></Link>
      <div><span className="eyebrow light">Conta protegida</span><h1>Seu espaço começa com uma senha só sua.</h1><p>Depois da ativação, todos os produtos comprados com o mesmo e-mail ficam reunidos nesta conta.</p></div>
      <blockquote>“Cuidar do seu acesso também é cuidar da sua história.”</blockquote>
    </section>
    <section className="auth-form-panel"><div className="auth-box">
      <Link href="/entrar" className="mobile-auth-brand">← Voltar ao login</Link>
      <span className="eyebrow">Primeiro acesso</span>
      <h2>Crie sua senha.</h2>
      {token ? <>
        <p>Use uma combinação que só você conheça. O link recebido por e-mail funciona uma única vez.</p>
        <PasswordSetupForm token={token}/>
        <div className="secure-note">✓ Senha protegida com criptografia forte<br/>✓ Cada cliente acessa somente os produtos comprados</div>
      </> : <>
        <p className="form-error">Este link de ativação está incompleto. Solicite um novo e-mail de segurança.</p>
        <Link href="/entrar" className="button">Ir para o login</Link>
      </>}
      <p className="safety-copy">Ao continuar, você concorda com os <Link href="/legal#termos">Termos de Uso</Link> e a <Link href="/legal#privacidade">Política de Privacidade</Link>.</p>
    </div></section>
  </main>;
}
