// Simulated opportunity templates for the discovery engine
const problems = [
  { problem: "Pequenos empreendedores têm dificuldade para gerenciar redes sociais em múltiplas plataformas", niche: "Pequenos Negócios", title: "Gerenciador de Mídias Sociais com IA para PMEs" },
  { problem: "Desenvolvedores perdem horas depurando pipelines de CI/CD com mensagens de erro pouco claras", niche: "Ferramentas para Desenvolvedores", title: "Depurador Inteligente de CI/CD" },
  { problem: "Criadores de conteúdo não conseguem reaproveitar facilmente conteúdos longos em clipes curtos", niche: "Economia Criativa", title: "Motor de Reaproveitamento de Conteúdo com IA" },
  { problem: "Times remotos não têm ferramentas de vídeo assíncrono que respeitem fusos horários", niche: "Trabalho Remoto", title: "Hub de Vídeo Assíncrono com Consciência de Fuso" },
  { problem: "Vendedores de e-commerce não têm forma simples de testar descrições de produto em escala", niche: "E-commerce", title: "Otimizador de Copy de Produto com IA" },
  { problem: "Terapeutas gastam tempo demais com anotações de sessão e documentação para convênios", niche: "Saúde", title: "Assistente de Notas Terapêuticas com IA" },
  { problem: "Desenvolvedores indie de jogos não conseguem pagar por serviços profissionais de QA", niche: "Games", title: "QA Automatizado para Jogos Indie" },
  { problem: "Corretores imobiliários criam descrições de imóveis manualmente para cada anúncio", niche: "Imobiliário", title: "Gerador de Descrições de Imóveis com IA" },
  { problem: "Professores têm dificuldade para criar quizzes personalizados para diferentes níveis de alunos", niche: "EdTech", title: "Gerador Adaptativo de Quizzes para Professores" },
  { problem: "Hosts de podcast não têm forma automatizada de encontrar e convidar convidados relevantes", niche: "Mídia", title: "Matchmaker de Convidados para Podcast com IA" },
  { problem: "Fundadores de SaaS não conseguem acompanhar lançamentos de funcionalidades da concorrência em tempo real", niche: "Ferramentas SaaS", title: "Rastreador em Tempo Real de Funcionalidades da Concorrência" },
  { problem: "Redatores freelancers não têm ferramentas para centralizar briefings e prazos de clientes", niche: "Freelancers", title: "Central de Comando para Redatores Freelancers" },
  { problem: "Times de RH levam semanas para criar materiais de onboarding para cada novo cargo", niche: "HR Tech", title: "Construtor de Conteúdo de Onboarding com IA" },
  { problem: "ONGs têm dificuldade para escrever propostas de captação de recursos com eficiência", niche: "Terceiro Setor", title: "Redator de Projetos para Editais com IA" },
  { problem: "Donos de pets não conseguem encontrar facilmente pet sitters confiáveis com avaliações verificadas", niche: "Cuidados com Pets", title: "Marketplace de Pet Sitters Verificados" },
];

const solutions = [
  "Uma plataforma com IA que automatiza o processo de ponta a ponta com mínima entrada do usuário.",
  "Uma ferramenta SaaS com templates inteligentes, sugestões de IA e fluxos com um clique.",
  "Uma combinação de extensão de navegador + dashboard que integra com ferramentas já usadas pelo cliente.",
  "Um app mobile-first com notificações push e recursos de colaboração em tempo real.",
  "Uma plataforma API-first que se conecta aos fluxos existentes via integrações.",
];

const competitionLevels = ["Low", "Medium", "High"];
const difficultyLevels = ["Low", "Medium", "High"];

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateOpportunities(count: number) {
  const shuffled = [...problems].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  return selected.map((p) => ({
    title: p.title,
    problem: p.problem,
    niche: p.niche,
    solution: pick(solutions),
    market_score: rand(60, 98),
    competition_level: pick(competitionLevels),
    difficulty_level: pick(difficultyLevels),
  }));
}

export const pipelineSteps = [
  { id: "problems", label: "Detectando problemas em comunidades online", agent: "Pain Hunter", duration: 1800 },
  { id: "trends", label: "Identificando tendências de mercado", agent: "Trend Detector", duration: 1500 },
  { id: "tools", label: "Analisando ferramentas e concorrentes", agent: "Tool Hunter", duration: 1400 },
  { id: "niches", label: "Detectando nichos de mercado", agent: "Niche Detector", duration: 1200 },
  { id: "generate", label: "Gerando oportunidades de SaaS", agent: "SaaS Generator", duration: 2000 },
  { id: "filter", label: "Filtrando ideias saturadas", agent: "Saturation Filter", duration: 1000 },
  { id: "score", label: "Pontuando potencial de mercado", agent: "Market Predictor", duration: 1500 },
];
