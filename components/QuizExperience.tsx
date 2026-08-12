"use client";
/* eslint-disable react-hooks/set-state-in-effect, no-empty */

import { SafeLink as Link } from "@/components/SafeLink";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { calculateResult, quizQuestions } from "@/lib/content";
import { trackFunnel } from "@/lib/funnel-client";
import { captureAttribution } from "@/lib/attribution";

type LeadForm = { name: string; email: string; phone: string; privacy: boolean; marketing: boolean };

function formatBrazilianPhone(value:string) {
  const digits=value.replace(/\D/g,"").slice(0,11);
  if (!digits) return "";
  if (digits.length < 3) return `(${digits}`;
  const ddd=digits.slice(0,2), number=digits.slice(2);
  if (number.length <= 1) return `(${ddd}) ${number}`;
  if (number.length <= 5) return `(${ddd}) ${number.slice(0,1)} ${number.slice(1)}`;
  return `(${ddd}) ${number.slice(0,1)} ${number.slice(1,5)}-${number.slice(5)}`;
}

export function QuizExperience() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string,string>>({});
  const [lead, setLead] = useState<LeadForm>({ name:"", email:"", phone:"", privacy:false, marketing:false });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const isLead = step === quizQuestions.length;
  const question = quizQuestions[Math.min(step, quizQuestions.length - 1)];
  const progress = Math.round((step / quizQuestions.length) * 100);
  const result = useMemo(()=>calculateResult(answers),[answers]);

  useEffect(()=>{
    void trackFunnel("quiz_started", { source: document.referrer || "direct" });
    const saved = localStorage.getItem("volta-quiz-draft");
    if (saved) try { const parsed=JSON.parse(saved); setAnswers(parsed.answers??{}); setStep(Math.min(parsed.step??0,quizQuestions.length)); } catch {}
  },[]);
  useEffect(()=>{ localStorage.setItem("volta-quiz-draft",JSON.stringify({answers,step})); },[answers,step]);

  function choose(value:string) {
    const updated={...answers,[question.id]:value}; setAnswers(updated);
    window.setTimeout(()=>setStep(current=>Math.min(current+1,quizQuestions.length)),180);
  }

  async function submit(event:FormEvent) {
    event.preventDefault(); setError("");
    if (!lead.privacy) { setError("Você precisa aceitar a política de privacidade para acessar o resultado."); return; }
    if (lead.phone.replace(/\D/g,"").length !== 11) { setError("Informe um WhatsApp completo com DDD e nove dígitos."); return; }
    setSubmitting(true);
    const attribution=captureAttribution(); const utm=Object.fromEntries(["utm_source","utm_medium","utm_campaign","utm_content","utm_term"].map(key=>[key,attribution[key as keyof typeof attribution]??""]));
    const payload={action:"lead",name:lead.name,email:lead.email,phone:lead.phone,privacyConsent:lead.privacy,marketingConsent:lead.marketing,answers,profile:result.profile,score:result.score,result,utm,landingUrl:attribution.landing_url||window.location.origin};
    try {
      const response=await fetch("/api/data",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      const data=await response.json() as {error?:string;leadId?:string}; if(!response.ok) throw new Error(data.error||"Não foi possível salvar seu diagnóstico.");
      const stored={...result,name:lead.name,email:lead.email,leadId:data.leadId,answers};
      void trackFunnel("lead_submitted", { leadId: data.leadId, profileKey: result.profile, source: attribution.utm_source || attribution.referrer || "direct" });
      localStorage.setItem("volta-result",JSON.stringify(stored)); localStorage.removeItem("volta-quiz-draft"); window.location.href="/resultado";
    } catch(e) { setError(e instanceof Error?e.message:"Tente novamente."); setSubmitting(false); }
  }

  return <main className="quiz-shell">
    <header className="quiz-header"><Link href="/" className="brand"><span className="brand-mark">V</span><span>Volta Pra <em>Você</em></span></Link><Link href="/" className="quiz-close" aria-label="Sair do diagnóstico">Fechar ×</Link></header>
    <div className="quiz-progress-wrap"><div className="quiz-progress-copy"><span>{isLead?"Quase pronto":`Pergunta ${step+1} de ${quizQuestions.length}`}</span><strong>{progress}%</strong></div><div className="progress-bar"><i style={{width:`${isLead?100:progress}%`}}/></div></div>
    {!isLead ? <section className="quiz-card" key={question.id}>
      <span className="quiz-kicker">Responda pensando na sua rotina das últimas semanas</span>
      <h1>{question.text}</h1>
      <div className="quiz-options" role="radiogroup" aria-label={question.text}>{question.options.map((option,i)=><button key={option} role="radio" aria-checked={answers[question.id]===option} className={answers[question.id]===option?"selected":""} onClick={()=>choose(option)}><span>{String.fromCharCode(65+i)}</span>{option}<i aria-hidden>→</i></button>)}</div>
      <div className="quiz-foot"><button className="text-button" disabled={step===0} onClick={()=>setStep(Math.max(0,step-1))}>← Voltar</button><p>Não existem respostas certas ou erradas.</p></div>
    </section> : <section className="quiz-card lead-card">
      <span className="result-ready">✓</span><span className="quiz-kicker">Seu resultado está pronto</span><h1>Onde podemos enviar seu primeiro plano?</h1><p>Preencha os dados abaixo para acessar seu diagnóstico completo e receber seu plano inicial.</p>
      <form onSubmit={submit} className="lead-form">
        <label>Primeiro nome<input required minLength={2} autoComplete="given-name" value={lead.name} onChange={e=>setLead({...lead,name:e.target.value})} placeholder="Como você gosta de ser chamada?"/></label>
        <label>E-mail<input required type="email" autoComplete="email" value={lead.email} onChange={e=>setLead({...lead,email:e.target.value})} placeholder="voce@exemplo.com"/></label>
        <label>WhatsApp <small>Digite DDD e número, por exemplo: (11) 9 9999-9999</small><input required type="tel" inputMode="numeric" autoComplete="tel" maxLength={16} pattern="\([0-9]{2}\) [0-9] [0-9]{4}-[0-9]{4}" value={lead.phone} onChange={e=>setLead({...lead,phone:formatBrazilianPhone(e.target.value)})} placeholder="(11) 9 9999-9999" aria-describedby="whatsapp-hint"/><span id="whatsapp-hint" className="field-hint">A formatação aparece automaticamente.</span></label>
        <label className="check-row"><input type="checkbox" checked={lead.privacy} onChange={e=>setLead({...lead,privacy:e.target.checked})}/><span>Li e aceito a <Link href="/legal#privacidade">Política de Privacidade</Link>. <b>Obrigatório</b></span></label>
        <label className="check-row"><input type="checkbox" checked={lead.marketing} onChange={e=>setLead({...lead,marketing:e.target.checked})}/><span>Quero receber conteúdos e ofertas do Movimento. Posso cancelar quando quiser.</span></label>
        {error&&<p className="form-error" role="alert">{error}</p>}
        <button className="button" disabled={submitting}>{submitting?"Preparando seu resultado…":"Ver meu diagnóstico completo"}</button>
      </form>
      <div className="quiz-foot"><button className="text-button" onClick={()=>setStep(quizQuestions.length-1)}>← Revisar última pergunta</button><p>🔒 Seus dados são protegidos.</p></div>
    </section>}
  </main>;
}
