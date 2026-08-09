import type { ProfileKey } from "@/lib/content";

type Mission = {
  id: string;
  day: number;
  phase: string;
  title: string;
  letter: string;
  action: string;
  minutes: number;
  difficulty: string;
  points: number;
  share: string;
};

export const profileExperience: Record<ProfileKey, {
  promise: string;
  reassurance: string;
  attention: string;
  firstWin: string;
  offerReason: string;
  verbs: string[];
}> = {
  automatico: {
    promise: "sair do automático e voltar a perceber suas próprias escolhas",
    reassurance: "Você não precisa encontrar uma grande resposta hoje. Primeiro, precisa voltar a se escutar.",
    attention: "os momentos em que você age por repetição antes de perceber o que realmente precisa",
    firstWin: "interromper um hábito por alguns minutos e fazer uma escolha consciente",
    offerReason: "Um roteiro curto ajuda a transformar percepção em escolhas visíveis antes que a rotina volte a decidir por você.",
    verbs: ["perceba", "interrompa", "escolha", "registre"],
  },
  sobrecarregada: {
    promise: "reduzir o peso da rotina sem criar mais uma obrigação",
    reassurance: "Seu próximo passo não é fazer mais. É descobrir o que pode deixar de depender somente de você.",
    attention: "responsabilidades assumidas por hábito, culpa ou falta de divisão",
    firstWin: "retirar uma etapa, renegociar um prazo ou dividir uma responsabilidade",
    offerReason: "Um plano pequeno cria alívio concreto e impede que o autocuidado vire apenas mais um item da lista.",
    verbs: ["reduza", "divida", "renegocie", "simplifique"],
  },
  adiada: {
    promise: "tirar um desejo do campo da intenção e devolvê-lo à sua agenda",
    reassurance: "O que você adiou não precisa voltar inteiro. Basta ganhar um próximo passo que caiba hoje.",
    attention: "desejos sempre empurrados para depois das urgências de outras pessoas",
    firstWin: "reservar um horário real para algo que importa para você",
    offerReason: "Quando um desejo recebe data, duração e primeira ação, ele deixa de depender do momento perfeito.",
    verbs: ["retome", "agende", "proteja", "comece"],
  },
  invisivel: {
    promise: "recolocar suas necessidades na rotina sem precisar disputar importância",
    reassurance: "Você não precisa justificar cada necessidade para que ela mereça espaço.",
    attention: "situações em que você se adapta tanto que deixa de dizer o que sente ou precisa",
    firstWin: "nomear uma necessidade e comunicá-la com uma frase simples",
    offerReason: "Ações guiadas ajudam você a praticar presença e limites sem transformar tudo em confronto.",
    verbs: ["nomeie", "comunique", "proteja", "ocupe"],
  },
  retomada: {
    promise: "transformar a vontade de voltar para si em continuidade possível",
    reassurance: "Você já iniciou o movimento. Agora precisa reconhecer o que funciona e conseguir repetir.",
    attention: "a tendência de exigir perfeição e abandonar o processo quando um dia não sai como planejado",
    firstWin: "repetir uma pequena ação útil sem aumentar sua dificuldade",
    offerReason: "Acompanhamento e progresso visível ajudam a consolidar o que já começou, mesmo com dias imperfeitos.",
    verbs: ["repita", "acompanhe", "ajuste", "continue"],
  },
};

function normalizeArea(area: string, fallback: string) {
  return (area || fallback).trim().toLowerCase();
}

export function personalizedPlan(profileKey: ProfileKey, desiredArea: string, weightArea: string, minutes: number) {
  const experience = profileExperience[profileKey];
  const desired = normalizeArea(desiredArea, "um espaço para você");
  const weight = normalizeArea(weightArea, "a parte mais pesada da rotina");
  return [
    `Observe ${experience.attention}, especialmente quando ${weight} ocupa mais espaço.`,
    `Proteja ${Math.max(5, minutes)} minutos para ${desired}, com começo e fim definidos.`,
    `Busque esta primeira evidência: ${experience.firstWin}.`,
  ];
}

export function personalizeMission(mission: Mission, profileKey: ProfileKey, desiredArea: string, weightArea: string, availableMinutes: number): Mission {
  const experience = profileExperience[profileKey];
  const minutes = Math.max(5, Math.min(mission.minutes, availableMinutes || 15));
  const desired = normalizeArea(desiredArea, "tempo para você");
  const weight = normalizeArea(weightArea, "a rotina");
  const verb = experience.verbs[(mission.day - 1) % experience.verbs.length];
  return {
    ...mission,
    minutes,
    letter: `${experience.reassurance} ${mission.letter}`,
    action: `${mission.action} Hoje, ${verb} algo ligado a ${desired} e observe como ${weight} interfere nessa escolha. Encerre em até ${minutes} minutos, mesmo que ainda pudesse continuar.`,
  };
}

export function personalizedOfferReason(profileKey?: ProfileKey) {
  return profileKey ? profileExperience[profileKey].offerReason : "Seu próximo produto continua a experiência dentro da mesma conta e preserva tudo o que você já registrou.";
}
