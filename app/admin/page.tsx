import { requireSessionUser } from "@/app/session-auth";
import { AdminDashboard } from "@/components/AdminDashboard";
import { SafeLink as Link } from "@/components/SafeLink";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireSessionUser("/admin");
  const allowed = new Set((process.env.ADMIN_EMAILS || "admin@demo.volta").split(",").map(value => value.trim().toLowerCase()).filter(Boolean));
  if (!allowed.has(user.email.toLowerCase())) return <main className="admin-login"><Link href="/" className="brand"><span className="brand-mark">V</span><span>Volta Pra <em>Você</em></span></Link><section><span className="eyebrow">Acesso administrativo</span><h1>Esta conta não está autorizada.</h1><p>O painel protege dados de clientes, produtos e integrações por uma lista segura de administradores.</p><Link href="/app" className="button">Voltar ao meu espaço</Link></section></main>;
  return <AdminDashboard/>;
}
