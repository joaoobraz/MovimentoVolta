"use client";

import { FormEvent, useState } from "react";

export function PasswordSetupForm({ token }: { token: string }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name, password, confirmation }),
      });
      const payload = await response.json().catch(() => ({})) as { error?: string; redirect?: string };
      if (!response.ok) throw new Error(payload.error || "Não foi possível salvar sua senha.");
      window.location.assign(payload.redirect || "/app");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível salvar sua senha.");
    } finally {
      setLoading(false);
    }
  }

  return <form className="buyer-login-preview" onSubmit={submit}>
    <label>Como você quer ser chamada? <small>Opcional</small>
      <input name="name" autoComplete="name" value={name} onChange={event => setName(event.target.value)} placeholder="Seu primeiro nome" maxLength={100}/>
    </label>
    <label>Crie sua senha
      <input name="password" type="password" autoComplete="new-password" required value={password} onChange={event => setPassword(event.target.value)} placeholder="Crie uma senha segura" minLength={10} maxLength={128}/>
    </label>
    <label>Confirme sua senha
      <input name="confirmation" type="password" autoComplete="new-password" required value={confirmation} onChange={event => setConfirmation(event.target.value)} placeholder="Digite a mesma senha" minLength={10} maxLength={128}/>
    </label>
    <div className="password-requirements">Use no mínimo 10 caracteres, com letra maiúscula, letra minúscula e número.</div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="auth-submit-button" type="submit" disabled={loading}>{loading ? "Protegendo sua conta…" : "Criar senha e entrar"}</button>
  </form>;
}
