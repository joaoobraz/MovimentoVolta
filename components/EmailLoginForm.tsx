"use client";

import { FormEvent, useState } from "react";

export function EmailLoginForm({ defaultEmail = "" }: { defaultEmail?: string }) {
  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Não foi possível enviar o link agora.");
      setSent(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível enviar o link agora.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) return <div className="email-link-sent" role="status">
    <strong>Confira seu e-mail.</strong>
    <p>Se este e-mail estiver vinculado a uma compra ou conta ativa, o link de acesso chegará em alguns minutos.</p>
    <button className="forgot-link" type="button" onClick={() => setSent(false)}>Usar outro e-mail</button>
  </div>;

  return <form className="buyer-login-preview" onSubmit={submit}>
    <label>E-mail usado na compra
      <input name="email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="seuemail@exemplo.com"/>
    </label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="auth-submit-button" type="submit" disabled={loading}>{loading ? "Enviando…" : "Enviar link de acesso"}</button>
  </form>;
}
