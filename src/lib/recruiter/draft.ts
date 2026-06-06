/**
 * Gera um rascunho de abordagem ao recrutador (texto pronto para copiar) + um
 * link genérico de busca de pessoas da empresa no LinkedIn. Função pura, sem rede:
 * o objetivo é dar ao Rodrigo um ponto de partida editável, não automatizar envio
 * (nada é disparado em nome dele). Sem LLM — template determinístico (trilha LITE).
 */
export interface DraftInput {
  title: string;
  company: string;
}

export interface RecruiterDraft {
  subject: string;
  message: string;
  linkedinSearchUrl: string;
}

export function buildRecruiterDraft({ title, company }: DraftInput): RecruiterDraft {
  const vaga = title.trim() || "a vaga";
  const empresa = company.trim() || "a empresa";

  const subject = `Interesse na vaga de ${vaga}`;

  const message = [
    `Olá! Vi a vaga de ${vaga} na ${empresa} e tenho grande interesse na oportunidade.`,
    `[Apresente-se em uma linha: curso, período e um destaque seu.]`,
    `Gostaria de entender melhor o processo seletivo e como posso contribuir com o time. Fico à disposição para conversar. Obrigado!`,
  ].join("\n\n");

  // Busca de pessoas (recrutadores/RH) ligadas à empresa — ponto de partida p/ networking.
  const keywords = `${empresa} recrutador`;
  const linkedinSearchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(keywords)}`;

  return { subject, message, linkedinSearchUrl };
}
