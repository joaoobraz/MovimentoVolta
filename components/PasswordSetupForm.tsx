"use client";

import { FormEvent, useState } from "react";

export function PasswordSetupForm({ token }: { token: string }) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
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
      <span className="password-field">
        <input name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" required value={password} onChange={event => setPassword(event.target.value)} placeholder="Crie uma senha segura" minLength={8} maxLength={128}/>
        <button className="password-visibility" type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} aria-pressed={showPassword}>
          <EyeIcon hidden={showPassword}/>
        </button>
      </span>
    </label>
    <label>Confirme sua senha
      <span className="password-field">
        <input name="confirmation" type={showConfirmation ? "text" : "password"} autoComplete="new-password" required value={confirmation} onChange={event => setConfirmation(event.target.value)} placeholder="Digite a mesma senha" minLength={8} maxLength={128}/>
        <button className="password-visibility" type="button" onClick={() => setShowConfirmation(value => !value)} aria-label={showConfirmation ? "Ocultar confirmação da senha" : "Mostrar confirmação da senha"} aria-pressed={showConfirmation}>
          <EyeIcon hidden={showConfirmation}/>
        </button>
      </span>
    </label>
    <div className="password-requirements">Use no mínimo 8 caracteres, com letra maiúscula, letra minúscula, número e caractere especial.</div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="auth-submit-button" type="submit" disabled={loading}>{loading ? "Protegendo sua conta…" : "Criar senha e entrar"}</button>
  </form>;
}

function EyeIcon({ hidden }: { hidden: boolean }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/>
    <circle cx="12" cy="12" r="2.7"/>
    {hidden && <path d="m4 4 16 16"/>}
  </svg>;
}
