export type QuizQuestion = {
  id: string;
  text: string;
  kind: "scale" | "choice";
  options: string[];
  profile?: "automatico" | "sobrecarregada" | "adiada" | "invisivel" | "retomada";
  invert?: boolean;
  area?: string;
};

export const scaleOptions = ["Nunca", "Raramente", "Às vezes", "Frequentemente", "Quase sempre"];

export const quizQuestions: QuizQuestion[] = [
  { id: "q1", text: "Você sente que suas necessidades sempre ficam para depois?", kind: "scale", options: scaleOptions, profile: "invisivel", area: "Tempo pessoal" },
  { id: "q2", text: "Você sente culpa quando descansa?", kind: "scale", options: scaleOptions, profile: "sobrecarregada", area: "Descanso" },
  { id: "q3", text: "Você costuma assumir mais responsabilidades do que consegue cumprir?", kind: "scale", options: scaleOptions, profile: "sobrecarregada", area: "Organização" },
  { id: "q4", text: "Você sente que precisa estar disponível para todos?", kind: "scale", options: scaleOptions, profile: "invisivel", area: "Limites" },
  { id: "q5", text: "Você abandonou algum projeto pessoal nos últimos anos?", kind: "scale", options: scaleOptions, profile: "adiada", area: "Projetos" },
  { id: "q6", text: "Você sente falta de fazer coisas apenas por prazer?", kind: "scale", options: scaleOptions, profile: "automatico", area: "Vida social" },
  { id: "q7", text: "Você encontra pelo menos 15 minutos por dia para si?", kind: "scale", options: scaleOptions, profile: "retomada", invert: true, area: "Tempo pessoal" },
  { id: "q8", text: "Você tem dificuldade de dizer não?", kind: "scale", options: scaleOptions, profile: "sobrecarregada", area: "Limites" },
  { id: "q9", text: "Você se sente sobrecarregada com frequência?", kind: "scale", options: scaleOptions, profile: "sobrecarregada", area: "Energia" },
  { id: "q10", text: "Você sente que sua rotina é controlada pelas necessidades de outras pessoas?", kind: "scale", options: scaleOptions, profile: "invisivel", area: "Organização" },
  { id: "q11", text: "Você tem algum objetivo pessoal em andamento?", kind: "scale", options: scaleOptions, profile: "retomada", invert: true, area: "Projetos" },
  { id: "q12", text: "Você consegue pedir ajuda quando precisa?", kind: "scale", options: scaleOptions, profile: "retomada", invert: true, area: "Limites" },
  { id: "q13", text: "Você mantém contato com amigas ou pessoas importantes?", kind: "scale", options: scaleOptions, profile: "retomada", invert: true, area: "Vida social" },
  { id: "q14", text: "Você sente que perdeu parte da sua identidade?", kind: "scale", options: scaleOptions, profile: "invisivel", area: "Autocuidado" },
  { id: "q15", text: "Você se sente satisfeita com a forma como utiliza seu tempo?", kind: "scale", options: scaleOptions, profile: "automatico", invert: true, area: "Organização" },
  { id: "q16", text: "Você costuma adiar cuidados pessoais?", kind: "scale", options: scaleOptions, profile: "adiada", area: "Autocuidado" },
  { id: "q17", text: "Você consegue identificar o que deseja para os próximos 12 meses?", kind: "scale", options: scaleOptions, profile: "retomada", invert: true, area: "Projetos" },
  { id: "q18", text: "Você sente que está vivendo no piloto automático?", kind: "scale", options: scaleOptions, profile: "automatico", area: "Energia" },
  { id: "q19", text: "Você consegue dividir responsabilidades?", kind: "scale", options: scaleOptions, profile: "retomada", invert: true, area: "Organização" },
  { id: "q20", text: "Quando tem tempo livre, você consegue utilizá-lo sem culpa?", kind: "scale", options: scaleOptions, profile: "retomada", invert: true, area: "Descanso" },
  { id: "peso", text: "Qual área mais pesa na sua rotina hoje?", kind: "choice", options: ["Trabalho", "Casa", "Filhos", "Relacionamento", "Família", "Finanças", "Falta de organização", "Falta de energia", "Dificuldade de colocar limites"] },
  { id: "retomar", text: "Qual área você mais deseja retomar?", kind: "choice", options: ["Tempo para mim", "Aparência e autocuidado", "Saúde e movimento", "Amizades", "Projeto pessoal", "Carreira", "Organização financeira", "Descanso", "Lazer", "Relacionamento comigo mesma"] },
  { id: "tempo", text: "Quanto tempo você conseguiria dedicar por dia?", kind: "choice", options: ["5 minutos", "10 minutos", "15 minutos", "20 minutos", "30 minutos ou mais"] },
  { id: "vitoria", text: "Qual seria sua principal pequena vitória nos próximos 30 dias?", kind: "choice", options: ["Ter tempo sem culpa", "Retomar um projeto", "Descansar melhor", "Criar um limite", "Pedir ou aceitar ajuda", "Voltar a fazer algo que gosto"] },
];

export const profileContent = {
  automatico: { name: "Mulher no Piloto Automático", message: "Você não parou de viver. Mas começou a viver quase sempre no modo automático.", description: "Os dias estão preenchidos, mas falta presença para perceber o que você quer proteger e retomar." },
  sobrecarregada: { name: "Mulher Sobrecarregada", message: "Você não precisa aprender a fazer mais. Precisa descobrir o que não deveria continuar carregando sozinha.", description: "Você está presente para muitas pessoas, mas sua rotina possui pouco espaço reservado para você." },
  adiada: { name: "Mulher Adiada", message: "Seus planos não desapareceram. Eles apenas estão esperando espaço na sua vida.", description: "Seus desejos continuam vivos; o próximo passo é transformá-los em ações pequenas e possíveis." },
  invisivel: { name: "Mulher Invisível", message: "Você se tornou importante para muitas pessoas, mas começou a ficar invisível dentro da própria vida.", description: "A retomada começa quando suas necessidades voltam a existir na agenda, sem precisar competir com tudo." },
  retomada: { name: "Mulher em Retomada", message: "Você já começou a voltar para si. Agora precisa transformar intenção em continuidade.", description: "Você já identifica seus padrões e está pronta para proteger uma rotina pessoal possível." },
} as const;

export type ProfileKey = keyof typeof profileContent;

export function calculateResult(answers: Record<string, string>) {
  const scores: Record<ProfileKey, number> = { automatico: 0, sobrecarregada: 0, adiada: 0, invisivel: 0, retomada: 0 };
  const counts: Record<ProfileKey, number> = { automatico: 0, sobrecarregada: 0, adiada: 0, invisivel: 0, retomada: 0 };
  const areas: Record<string, number[]> = {};
  quizQuestions.filter(q => q.kind === "scale").forEach((question) => {
    const raw = Math.max(0, scaleOptions.indexOf(answers[question.id]));
    const severity = question.invert ? 4 - raw : raw;
    if (question.profile) { scores[question.profile] += severity; counts[question.profile] += 1; }
    if (question.area) (areas[question.area] ??= []).push(severity);
  });
  const normalized = (Object.keys(scores) as ProfileKey[]).map(key => ({ key, value: counts[key] ? scores[key] / counts[key] : 0 }));
  const overall = Math.round((Object.values(scores).reduce((a,b)=>a+b,0) / Math.max(1,Object.values(counts).reduce((a,b)=>a+b,0)) / 4) * 100);
  let profile = normalized.sort((a,b)=>b.value-a.value)[0].key;
  if (overall < 42) profile = "retomada";
  const areaScores = Object.fromEntries(Object.entries(areas).map(([name, values]) => [name, Math.round((values.reduce((a,b)=>a+b,0) / values.length / 4) * 100)]));
  const availableMinutes = Math.min(30, Math.max(5, Number.parseInt(answers.tempo || "15", 10) || 15));
  return { profile, score: overall, areas: areaScores, weight: answers.peso ?? "Rotina", desired: answers.retomar ?? "Tempo para mim", availableMinutes };
}

export const phases = [
  { letter: "V", name: "Ver", days: "1–6", description: "Reconhecer padrões, excessos e desejos adiados." },
  { letter: "O", name: "Organizar", days: "7–12", description: "Criar um espaço possível e ordenar prioridades." },
  { letter: "L", name: "Limitar", days: "13–18", description: "Reduzir excessos e dividir responsabilidades." },
  { letter: "T", name: "Tomar espaço", days: "19–24", description: "Retomar interesses, presença e autocuidado." },
  { letter: "A", name: "Avançar", days: "25–30", description: "Escolher um objetivo e construir os próximos 90 dias." },
];

const missionSeeds = [
  ["O inventário do que você carrega", "Hoje você vai olhar para sua rotina sem julgamento. Muitas responsabilidades chegaram aos poucos e ficaram por hábito. Nomeá-las é o primeiro movimento para escolher o que ainda faz sentido.", "Liste tudo que está ocupando sua cabeça e marque uma responsabilidade que pode ser simplificada."],
  ["Quinze minutos com nome", "Tempo pessoal não precisa aparecer por acaso. Quando você dá nome a um pequeno espaço, ele deixa de ser sobra e passa a ser compromisso possível.", "Reserve quinze minutos na agenda de amanhã e escreva exatamente como quer usá-los."],
  ["Uma obrigação a menos", "Você não precisa provar capacidade carregando tudo. Reduzir uma etapa também é uma forma madura de cuidado com a própria energia.", "Escolha uma tarefa e decida: adiar, dividir, delegar, cancelar ou simplificar."],
  ["Retomar o prazer", "Desejos pequenos guardam pistas importantes de identidade. Retomar algo prazeroso não exige produtividade nem justificativa.", "Faça por dez minutos algo de que você gostava antes de a rotina ficar tão cheia."],
  ["O pequeno não", "Limites cotidianos protegem tempo, energia e presença. Um não respeitoso pode ser um sim para aquilo que você decidiu preservar.", "Recuse ou renegocie um pedido que ultrapassa o que você consegue oferecer hoje."],
  ["Dar atenção ao desejo", "Um desejo não precisa virar um grande projeto hoje. Ele precisa apenas deixar de ser ignorado e ganhar um próximo passo visível.", "Escreva um desejo adiado e realize a menor ação concreta ligada a ele."],
  ["O compromisso possível", "Constância nasce de um acordo que cabe na vida real. Seu compromisso não precisa impressionar ninguém; precisa conseguir voltar amanhã.", "Escolha um ritual de quinze minutos para proteger na próxima semana."],
];

export const missions = Array.from({ length: 30 }, (_, index) => {
  const seed = missionSeeds[index % missionSeeds.length];
  const phase = phases[Math.min(4, Math.floor(index / 6))];
  return { id: `dia-${index + 1}`, day: index + 1, phase: phase.name, title: index < 7 ? seed[0] : `${seed[0]} — passo ${Math.floor(index / 7) + 1}`, letter: seed[1], action: seed[2], minutes: [8, 10, 12, 15][index % 4], difficulty: index % 3 === 0 ? "Leve" : index % 3 === 1 ? "Possível" : "Corajosa", points: 10, share: ["Hoje eu fiz algo por mim.", "Uma pequena mudança também é movimento.", "Eu não preciso terminar tudo para merecer descansar."][index % 3] };
});

export const sosItems = [
  { id: "sobrecarregada", label: "Estou sobrecarregada", message: "Você não precisa resolver tudo agora. Primeiro, separe o necessário daquilo que foi assumido por hábito.", question: "Qual tarefa poderia ser simplificada hoje?", options: ["Adiar", "Dividir", "Delegar", "Cancelar", "Fazer de forma mais simples"], action: "Escolha uma tarefa e retire pelo menos uma etapa desnecessária." },
  { id: "energia", label: "Estou sem energia", message: "Energia baixa pede uma escolha menor, não uma cobrança maior.", question: "O que é realmente suficiente para os próximos cinco minutos?", options: ["Pausar", "Beber água", "Respirar perto da janela", "Fazer só o essencial"], action: "Escolha uma ação simples e faça sem acrescentar outra tarefa." },
  { id: "culpa", label: "Estou me sentindo culpada", message: "Descanso não precisa ser a recompensa por terminar tudo. Sua lista pode esperar alguns minutos.", question: "De quem é a regra que diz que você só pode parar depois de tudo pronto?", options: ["É minha", "Aprendi na família", "Veio do trabalho", "Nunca pensei nisso"], action: "Faça uma pausa de cinco minutos sem justificar ou compensar depois." },
  { id: "nao", label: "Não consigo dizer não", message: "Você pode responder com respeito sem oferecer mais do que consegue sustentar.", question: "Qual resposta protege seu limite sem criar explicações demais?", options: ["Hoje não consigo", "Posso ajudar de outra forma", "Preciso pensar", "Desta vez não"], action: "Escreva a frase escolhida e use quando o próximo pedido chegar." },
  { id: "tempo", label: "Não tenho tempo", message: "Talvez você não precise encontrar uma hora inteira. Procure uma fresta que possa ter nome e intenção.", question: "Onde cabem cinco minutos que hoje estão sem destino?", options: ["Antes do banho", "Depois do almoço", "No deslocamento", "Antes de dormir"], action: "Proteja essa fresta hoje e use-a somente para você." },
  { id: "automatico", label: "Estou no piloto automático", message: "Voltar ao presente pode começar com uma escolha deliberada e pequena.", question: "O que você quer perceber antes que este dia termine?", options: ["Meu corpo", "Minha casa", "Uma pessoa", "Um desejo"], action: "Pare por cinco minutos e registre três detalhes da sua escolha." },
];

export const products = [
  { id: "mapa", name: "Mapa da Volta", price: 17, access: "Diagnóstico completo, plano de 7 dias, diário básico e relatório" },
  { id: "sos", name: "Kit SOS Para Dias Difíceis", price: 27, access: "Biblioteca SOS completa" },
  { id: "desafio", name: "Desafio 7 Dias Sem Me Abandonar", price: 47, access: "Desafio, cartões, check-in e gamificação" },
  { id: "jornada", name: "Jornada VOLTA — 30 Dias", price: 147, access: "Jornada completa, relatórios, comunidade e diário" },
];
