"use client";

import { FormEvent, useState } from "react";

type LoginPayload = { error?: string; redirect?: string; activationRequired?: boolean };

export function PasswordLoginForm({
  defaultEmail = "",
  defaultPassword = "",
  endpoint = "/api/auth/login",
  allowRecovery = true,
  redirectTo = "",
}: {
  defaultEmail?: string;
  defaultPassword?: string;
  endpoint?: string;
  allowRecovery?: boolean;
  redirectTo?: string;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState(defaultPassword);
  const [loading, setLoading] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json().catch(() => ({})) as LoginPayload;
      if (!response.ok) throw new Error(payload.error || "Não foi possível entrar agora.");
      window.location.assign(redirectTo || payload.redirect || "/app");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível entrar agora.");
    } finally {
      setLoading(false);
    }
  }

  async function requestAccess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = await response.json().catch(() => ({})) as LoginPayload;
      if (!response.ok) throw new Error(payload.error || "Não foi possível enviar o e-mail agora.");
      setSent(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível enviar o e-mail agora.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) return <div className="email-link-sent" role="status">
    <strong>Solicitação recebida.</strong>
    <p>Se este e-mail estiver ligado a uma compra aprovada, enviaremos o link em poucos minutos. Confira também as pastas Spam e Promoções.</p>
    <p>O remetente será <strong>acesso@movimentovolta.com.br</strong>.</p>
    <button className="forgot-link" type="button" onClick={() => { setSent(false); setRecovering(false); }}>Voltar ao login</button>
  </div>;

  if (recovering) return <form className="buyer-login-preview" onSubmit={requestAccess}>
    <div className="auth-recovery-explanation">
      <strong>Primeiro acesso ou senha esquecida</strong>
      <p>Digite exatamente o e-mail informado no checkout. Enviaremos um link seguro para criar ou redefinir sua senha.</p>
    </div>
    <label>E-mail usado na compra
      <input name="email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="seuemail@exemplo.com"/>
    </label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="auth-submit-button" type="submit" disabled={loading}>{loading ? "Enviando…" : "Enviar link para criar ou recuperar senha"}</button>
    <button className="forgot-link auth-back-link" type="button" onClick={() => { setRecovering(false); setError(""); }}>Voltar ao login</button>
  </form>;

  return <form className="buyer-login-preview" onSubmit={login}>
    <label>E-mail usado na compra
      <input name="email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="seuemail@exemplo.com"/>
    </label>
    <label>Senha
      <input name="password" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} placeholder="Digite sua senha"/>
    </label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="auth-submit-button" type="submit" disabled={loading}>{loading ? "Entrando…" : "Entrar com segurança"}</button>
    {allowRecovery && <button className="forgot-link auth-recovery-link" type="button" onClick={() => { setRecovering(true); setError(""); }}>Primeiro acesso ou esqueci minha senha</button>}
  </form>;
}
