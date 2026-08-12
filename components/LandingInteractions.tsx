"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { SafeLink as Link } from "@/components/SafeLink";

export function PublicNavigation() {
  const [open, setOpen] = useState(false);

  return <>
    <button className="menu-toggle" aria-expanded={open} aria-controls="public-navigation" aria-label={open ? "Fechar menu" : "Abrir menu"} onClick={() => setOpen(value => !value)}>{open ? "Fechar" : "Menu"}</button>
    <nav id="public-navigation" className={open ? "main-nav open" : "main-nav"} aria-label="Navegação principal">
      <a href="#movimento" onClick={() => setOpen(false)}>O movimento</a>
      <a href="#metodo" onClick={() => setOpen(false)}>Método VOLTA</a>
      <a href="#duvidas" onClick={() => setOpen(false)}>Dúvidas</a>
      <Link href="/entrar" onClick={() => setOpen(false)}>Entrar</Link>
      <Link href="/quiz" className="button button-small" onClick={() => setOpen(false)}>Fazer diagnóstico</Link>
    </nav>
  </>;
}

export function SpeakIntroduction() {
  function speak() {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const message = new SpeechSynthesisUtterance("Em que momento da vida você começou a se deixar para depois? Faça o diagnóstico gratuito e descubra quanto espaço você ainda ocupa na sua própria vida.");
    message.lang = "pt-BR";
    window.speechSynthesis.speak(message);
  }

  return <button className="text-button" onClick={speak}>◉ Ler em voz alta</button>;
}

export function PublicAccessibilityTools() {
  const [largeText, setLargeText] = useState(false);
  const [dark, setDark] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const savedText = localStorage.getItem("volta-text-size") === "large";
    const savedTheme = localStorage.getItem("volta-theme") === "dark";
    setLargeText(savedText);
    setDark(savedTheme);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.documentElement.dataset.text = largeText ? "large" : "normal";
    localStorage.setItem("volta-theme", dark ? "dark" : "light");
    localStorage.setItem("volta-text-size", largeText ? "large" : "normal");
  }, [dark, hydrated, largeText]);

  return <div className="access-tools" aria-label="Ferramentas de acessibilidade">
    <button onClick={() => setLargeText(value => !value)} aria-pressed={largeText} aria-label={largeText ? "Usar texto padrão" : "Aumentar texto"}>{largeText ? "A−" : "A+"}</button>
    <button onClick={() => setDark(value => !value)} aria-pressed={dark}>{dark ? "Claro" : "Escuro"}</button>
  </div>;
}
