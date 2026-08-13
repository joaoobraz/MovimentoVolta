import { requireSessionUser } from "@/app/session-auth";
import { AdminDashboard } from "@/components/AdminDashboard";
import { SafeLink as Link } from "@/components/SafeLink";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireSessionUser("/admin");
  const allowed = new Set([
    ...(process.env.ADMIN_EMAILS || "admin@demo.volta").split(","),
    ...(process.env.DEMO_MODE === "true" ? [process.env.DEMO_ADMIN_EMAIL || "admin@demo.volta"] : []),
  ].map(value => value.trim().toLowerCase()).filter(Boolean));
  if (!allowed.has(user.email.toLowerCase())) {
    const adminEmail = [...allowed][0] || "";
    const returnTo = `/entrar?email=${encodeURIComponent(adminEmail)}&retorno=${encodeURIComponent("/admin")}`;
    return <main className="admin-login"><Link href="/" className="brand"><span className="brand-mark">V</span><span>Volta Pra <em>Você</em></span></Link><section><span className="eyebrow">Acesso administrativo</span><h1>Você entrou com outra conta.</h1><p>Esta sessão está conectada como <strong>{user.email}</strong>. Para proteger os dados das clientes, somente a conta administrativa pode abrir este painel.</p><form action={`/api/logout?return_to=${encodeURIComponent(returnTo)}`} method="post"><button className="button" type="submit">Sair e entrar como administradora</button></form><Link href="/app" className="admin-secondary-link">Continuar nesta conta</Link></section></main>;
  }
  return <AdminDashboard/>;
}
