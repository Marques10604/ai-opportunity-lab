import { supabase } from "@/integrations/supabase/client";

export async function seedUserData(userId: string) {
  const { data: existing } = await supabase.from("opportunities").select("id").eq("user_id", userId).limit(1);
  if (existing && existing.length > 0) return;

  await supabase.from("opportunities").insert([
    { user_id: userId, title: "Code Review com IA para Devs Solo", problem: "Desenvolvedores solo não têm ferramentas acessíveis de revisão de código. As soluções atuais focam em geração, não em revisão.", niche: "Ferramentas para Desenvolvedores", solution: "Um agente de IA que revisa PRs com entendimento contextual de todo o código.", market_score: 92, competition_level: "Low", difficulty_level: "Medium" },
    { user_id: userId, title: "Micro-SaaS para Automação de Faturas Freelance", problem: "Freelancers gastam horas com emissão de faturas e cobranças.", niche: "Freelancers", solution: "Faturamento automatizado com lembretes inteligentes e rastreio de pagamentos.", market_score: 88, competition_level: "Medium", difficulty_level: "Low" },
    { user_id: userId, title: "Notas de Reunião com IA para Times Remotos", problem: "Times remotos perdem contexto de reuniões por falta de anotações eficazes.", niche: "Trabalho Remoto", solution: "IA que participa de reuniões, transcreve e gera itens de ação estruturados.", market_score: 85, competition_level: "Medium", difficulty_level: "Medium" },
    { user_id: userId, title: "Plataforma de Comunidade para Pais de Plantas", problem: "Entusiastas de plantas não têm ferramentas de comunidade dedicadas além de fóruns genéricos.", niche: "Lifestyle", solution: "Plataforma com identificação de plantas, guias de cuidado e marketplace.", market_score: 79, competition_level: "Low", difficulty_level: "Low" },
    { user_id: userId, title: "Copiloto de IA para Suporte ao Cliente", problem: "Agentes de suporte perdem tempo buscando respostas em bases de conhecimento.", niche: "Sucesso do Cliente", solution: "Copiloto de IA que sugere respostas com base no contexto do ticket e em resoluções anteriores.", market_score: 91, competition_level: "Medium", difficulty_level: "High" },
  ]);

  await supabase.from("trends").insert([
    { user_id: userId, name: "Ferramentas de Desenvolvimento Nativas em IA", category: "Tecnologia", growth_score: 95, source: "HackerNews" },
    { user_id: userId, name: "Construtores de SaaS No-Code", category: "Tecnologia", growth_score: 82, source: "ProductHunt" },
    { user_id: userId, name: "Infraestrutura para Trabalho Remoto", category: "Trabalho", growth_score: 78, source: "Google Trends" },
    { user_id: userId, name: "Ferramentas para Economia Criativa", category: "Social", growth_score: 88, source: "Twitter/X" },
    { user_id: userId, name: "IA para Usuários Não Técnicos", category: "IA", growth_score: 91, source: "TechCrunch" },
  ]);

  await supabase.from("niches").insert([
    { user_id: userId, niche_name: "Desenvolvedores Solo", audience: "Desenvolvedores independentes", demand_score: 89, competition_score: 35 },
    { user_id: userId, niche_name: "Designers Freelancers", audience: "Designers de UI/UX e gráficos", demand_score: 76, competition_score: 45 },
    { user_id: userId, niche_name: "Fundadores Não Técnicos", audience: "Empreendedores sem habilidades de programação", demand_score: 92, competition_score: 28 },
  ]);

  await supabase.from("tools").insert([
    { user_id: userId, tool_name: "GitHub Copilot", category: "Ferramentas para Desenvolvedores", website: "https://github.com/features/copilot", description: "Programação em par com IA" },
    { user_id: userId, tool_name: "Linear", category: "Gestão de Projetos", website: "https://linear.app", description: "Rastreamento de tarefas para times de software" },
    { user_id: userId, tool_name: "Notion AI", category: "Produtividade", website: "https://notion.so", description: "Workspace com IA" },
  ]);

  await supabase.from("agents").insert([
    { user_id: userId, agent_name: "Pain Hunter", role: "Coleta dores em qualquer nicho, independente do setor", status: "active", last_run: new Date().toISOString() },
    { user_id: userId, agent_name: "Niche Classifier", role: "Identifica setor da dor, ajusta vocabulário, ferramentas e tom do conteúdo", status: "active", last_run: new Date().toISOString() },
    { user_id: userId, agent_name: "Competitor Analyzer", role: "Busca reviews, issues e reclamações para gerar conteúdo com base em falhas de ferramentas", status: "active", last_run: new Date().toISOString() },
    { user_id: userId, agent_name: "5 Angles Engine", role: "Gera 5 versões de conteúdo por dor: tutorial, polêmica, hack, comparativo, transformação", status: "idle", last_run: null },
    { user_id: userId, agent_name: "Platform Personalizer", role: "Adapta automaticamente cada conteúdo para Instagram, TikTok, LinkedIn, X e YouTube Shorts", status: "active", last_run: new Date().toISOString() },
    { user_id: userId, agent_name: "Learning Loop", role: "Analisa métricas dos posts e retroalimenta os agentes com o que funciona", status: "active", last_run: new Date().toISOString() },
    { user_id: userId, agent_name: "Trend Predictor", role: "Detecta sinais de tendências emergentes e calcula a Janela Ideal de postagem", status: "active", last_run: new Date().toISOString() },
    { user_id: userId, agent_name: "Anti Saturation Filter", role: "Elimina ideias ruins, nichos saturados e hypes sem demanda antes de chegar até o usuário", status: "processing", last_run: new Date().toISOString() },
  ]);
}
