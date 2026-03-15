export interface Launch {
  id: number;
  title: string;
  category: string;
  time_ago: string;
  source: string;
  opportunity: 'ALTA' | 'MÉDIA' | 'BAIXA';
  changes: string[];
  vs_competitors: string[];
  comparison_table: { param: string; anthropic: string; openai: string; google: string }[];
  content_angles: { type: string; title: string }[];
}

export const PRE_MAPPED_LAUNCHES: Launch[] = [
  {
    id: 1,
    title: 'Claude Sonnet 4.6 — 2x mais rápido, mesmo custo',
    category: 'Novo modelo',
    time_ago: 'há 3 dias',
    source: 'anthropic.com/news',
    opportunity: 'ALTA',
    changes: [
      'Velocidade: 2x superior ao Sonnet anterior',
      'Custo: mantido em $3/MTok input',
      'Context window: 1M tokens em beta (antes 200k)',
      'Extended Thinking aprimorado para raciocínio complexo'
    ],
    vs_competitors: [
      'GPT-4o: Sonnet 4.6 mais rápido, custo similar ($2.50 vs $3)',
      'Gemini 1.5 Pro: Gemini mais barato ($1.25), Sonnet melhor em código'
    ],
    comparison_table: [
      { param: 'Velocidade', anthropic: '2x vs anterior (Rápido)', openai: 'Rápido (referência)', google: 'Médio' },
      { param: 'Custo input', anthropic: '$3/MTok', openai: '$2.50/MTok', google: '$1.25/MTok' },
      { param: 'Context window', anthropic: '1M tokens (beta)', openai: '128k tokens', google: '1M-2M tokens' },
      { param: 'Recall Score 1M', anthropic: 'N/D', openai: 'N/D', google: 'Variável' },
      { param: 'Melhor para', anthropic: 'Código + agentes', openai: 'Uso geral', google: 'Documentos longos' }
    ],
    content_angles: [
      { type: 'comparativo', title: 'Sonnet 4.6 vs GPT-4o vs Gemini: tabela definitiva para devs' },
      { type: 'tutorial', title: 'Como migrar para o Sonnet 4.6 e manter qualidade' },
      { type: 'hack', title: 'Como economizar 60% usando Sonnet 4.6 no lugar do Opus' },
      { type: 'polemica', title: 'A Anthropic está ganhando a corrida de velocidade?' },
      { type: 'transformacao', title: 'Minha conta de API caiu 40% depois de migrar para o Sonnet 4.6' }
    ]
  },
  {
    id: 2,
    title: 'Claude Opus 4.6 — janela de contexto de 1 milhão de tokens',
    category: 'Novo modelo',
    time_ago: 'há 1 semana',
    source: 'anthropic.com/news',
    opportunity: 'ALTA',
    changes: [
      'Context window: 1 milhão de tokens GA (disponível para todos)',
      'Agent Teams: múltiplas instâncias coordenadas por agente líder',
      'Recall Score de 78.3% no benchmark MRCR v2 com 1M tokens',
      'Análise simultânea de bibliotecas inteiras sem fragmentação de contexto'
    ],
    vs_competitors: [
      'GPT-4o: limitado a 128k tokens — Opus 4.6 tem 8x mais contexto',
      'Gemini 1.5 Pro: também tem 1M-2M tokens, mas sem Agent Teams nativo'
    ],
    comparison_table: [
      { param: 'Velocidade', anthropic: 'Lento (Deep Thinking)', openai: 'Rápido (referência)', google: 'Médio' },
      { param: 'Custo input', anthropic: '$15/MTok', openai: '$2.50/MTok', google: '$1.25/MTok' },
      { param: 'Context window', anthropic: '1M tokens (GA)', openai: '128k tokens', google: '1M-2M tokens' },
      { param: 'Recall Score 1M', anthropic: '78.3% MRCR v2', openai: 'N/D', google: 'Variável' },
      { param: 'Melhor para', anthropic: 'Raciocínio complexo', openai: 'Uso geral', google: 'Docs corporativos' }
    ],
    content_angles: [
      { type: 'comparativo', title: '1M tokens: Opus 4.6 vs Gemini 1.5 Pro — qual usar?' },
      { type: 'tutorial', title: 'Como usar o contexto de 1M para analisar projetos inteiros' },
      { type: 'polemica', title: 'Janela de 1M tokens resolve o Context Rot de vez?' },
      { type: 'hack', title: 'Agent Teams: como orquestrar múltiplos Claudes em paralelo' },
      { type: 'transformacao', title: 'Analisei minha codebase inteira de uma vez. O resultado:' }
    ]
  },
  {
    id: 3,
    title: 'Claude Code Security — encontra vulnerabilidades zero-day',
    category: 'Feature nova',
    time_ago: 'há 1 semana',
    source: 'anthropic.com/news',
    opportunity: 'ALTA',
    changes: [
      'Usa raciocínio profundo do Opus 4.6 para análise de segurança',
      'Encontrou 500+ falhas em código open-source não detectadas por décadas',
      'Integração direta com Claude Code via /security-scan',
      'Relatórios com sugestões de correção automáticas por LLM'
    ],
    vs_competitors: [
      'GitHub Copilot/Dependabot: baseado em regras, não entende lógica de negócio',
      'Cursor: sem equivalente de security scan com LLM profundo'
    ],
    comparison_table: [
      { param: 'Disponível Anthropic', anthropic: 'Sim — /security-scan', openai: 'Não', google: 'Não' },
      { param: 'Profundidade', anthropic: 'Zero-day + lógica de negócio', openai: 'Regras estáticas', google: 'Regras estáticas' },
      { param: 'Integração', anthropic: 'Claude Code nativo', openai: 'GitHub Actions', google: 'Google Cloud' },
      { param: 'Quem lançou primeiro', anthropic: 'Anthropic (fev 2026)', openai: 'Não tem', google: 'Não tem' }
    ],
    content_angles: [
      { type: 'polemica', title: 'IA encontrou 500 falhas de segurança que humanos ignoraram por décadas' },
      { type: 'tutorial', title: 'Como usar o Claude Code Security para auditar seu projeto' },
      { type: 'hack', title: 'O comando /security-scan que todo dev deveria rodar agora' },
      { type: 'comparativo', title: 'Claude Code Security vs GitHub Dependabot: quem ganha?' },
      { type: 'transformacao', title: 'Rodei o security scan no meu projeto. Encontrei 12 falhas críticas' }
    ]
  },
  {
    id: 4,
    title: 'Claude Cowork (Beta) — IA como colega digital autônomo',
    category: 'Feature nova',
    time_ago: 'há 2 semanas',
    source: 'anthropic.com/news',
    opportunity: 'ALTA',
    changes: [
      'Organiza arquivos e pastas autonomamente no computador',
      'Analisa planilhas e gera relatórios sem intervenção manual',
      'OSWorld benchmark: 72.5% (modelos anteriores faziam apenas 15%)',
      'Executa tarefas multietapa em ambientes reais de computador'
    ],
    vs_competitors: [
      'Microsoft Copilot: integrado ao Office 365, Cowork mais autônomo fora do Office',
      'Google Duet AI: similar em docs, Cowork mais amplo em tarefas do sistema'
    ],
    comparison_table: [
      { param: 'Disponível', anthropic: 'Beta — Claude Cowork', openai: 'Não tem equivalente', google: 'Duet AI (limitado)' },
      { param: 'OSWorld benchmark', anthropic: '72.5%', openai: '~28%', google: '~35%' },
      { param: 'Autonomia', anthropic: 'Alta — age sem confirmação', openai: 'Média', google: 'Baixa' },
      { param: 'Quem lançou primeiro', anthropic: 'Anthropic (jan 2026)', openai: 'Não tem', google: 'Parcial' }
    ],
    content_angles: [
      { type: 'polemica', title: 'O Claude Cowork vai substituir assistentes administrativos?' },
      { type: 'tutorial', title: 'Como configurar o Claude Cowork para organizar seus arquivos' },
      { type: 'hack', title: '5 tarefas chatas que o Claude Cowork faz por você agora' },
      { type: 'comparativo', title: 'Claude Cowork vs Microsoft Copilot: qual é mais útil no dia a dia?' },
      { type: 'transformacao', title: 'Deleguei minhas tarefas repetitivas pro Cowork. Resultado:' }
    ]
  },
  {
    id: 5,
    title: 'Marketplace de Skills — instale expertises prontas no Claude Code',
    category: 'Nova integração',
    time_ago: 'há 1 semana',
    source: 'anthropic.com/news',
    opportunity: 'ALTA',
    changes: [
      'Marketplace oficial de skills criadas pela comunidade',
      'Instalação com um comando: /plugin marketplace add',
      'Skills disponíveis: TypeScript, Python, Go, Django, Spring Boot, Perl',
      'Sistema aberto de avaliação e contribuição'
    ],
    vs_competitors: [
      'Cursor: extensões via marketplace do VS Code',
      'GitHub Copilot: sem marketplace de skills customizadas para LLM'
    ],
    comparison_table: [
      { param: 'Disponível', anthropic: 'Sim — Marketplace oficial', openai: 'Não', google: 'Não' },
      { param: 'Instalação', anthropic: '1 comando (/plugin)', openai: 'N/A', google: 'N/A' },
      { param: 'Contribuição', anthropic: 'Aberta — community PRs', openai: 'Fechada', google: 'Fechada' },
      { param: 'Quem lançou primeiro', anthropic: 'Anthropic (mar 2026)', openai: 'Não tem', google: 'Não tem' }
    ],
    content_angles: [
      { type: 'tutorial', title: 'Como instalar skills no Claude Code em 2 minutos' },
      { type: 'hack', title: 'As 5 skills do marketplace que todo dev deveria instalar agora' },
      { type: 'polemica', title: 'O marketplace de skills vai mudar como usamos o Claude Code' },
      { type: 'comparativo', title: 'Skills do marketplace vs configurar tudo manual: qual vale mais?' },
      { type: 'transformacao', title: 'Instalei 3 skills do marketplace. Minha produtividade dobrou' }
    ]
  },
  {
    id: 6,
    title: 'Prompt Caching v2 — isolamento por workspace e 91% de hit rate',
    category: 'Feature nova',
    time_ago: 'há 2 semanas',
    source: 'anthropic.com/changelog',
    opportunity: 'MÉDIA',
    changes: [
      'Cache isolado por workspace — sem miss entre projetos distintos',
      'Hit rate de 91-95% com estrutura de prompt otimizada',
      'Latência reduzida de 11.5s para 2.4s em chamadas cacheadas',
      'Economia de até 90% em chamadas com conteúdo estático repetido'
    ],
    vs_competitors: [
      'OpenAI: tem prompt caching mas sem isolamento granular de workspace',
      'Google Gemini: context caching disponível mas configuração mais complexa'
    ],
    comparison_table: [
      { param: 'Hit rate máximo', anthropic: '91-95%', openai: '~80%', google: '~75%' },
      { param: 'Isolamento workspace', anthropic: 'Sim (v2)', openai: 'Não', google: 'Parcial' },
      { param: 'Redução de latência', anthropic: '11.5s → 2.4s', openai: 'Variável', google: 'Variável' },
      { param: 'Economia máxima', anthropic: 'Até 90%', openai: 'Até 50%', google: 'Até 60%' }
    ],
    content_angles: [
      { type: 'tutorial', title: 'Como estruturar prompts para 91% de cache hit na API Anthropic' },
      { type: 'hack', title: 'De 11.5s para 2.4s de latência: o poder do Prompt Caching v2' },
      { type: 'polemica', title: 'Se você não usa Prompt Caching está pagando 10x mais do que precisa' },
      { type: 'comparativo', title: 'Prompt Caching Anthropic vs OpenAI: qual economiza mais?' },
      { type: 'transformacao', title: 'Reduzi minha conta de API em 87% com uma mudança de estrutura' }
    ]
  },
  {
    id: 7,
    title: 'Apagão mundial — Claude Code fora do ar por 3 horas',
    category: 'Instabilidade',
    time_ago: 'há 3 semanas',
    source: 'Twitter/X',
    opportunity: 'ALTA',
    changes: [
      'Serviço indisponível globalmente por 3 horas em março de 2026',
      'Pipelines de CI/CD dependentes do Claude Code pararam completamente',
      'Sem comunicação oficial durante o incidente',
      'Perda de contexto em sessões ativas sem possibilidade de recuperação'
    ],
    vs_competitors: [
      'OpenAI: teve instabilidades similares em janeiro de 2026',
      'Google Gemini: uptime historicamente mais estável que os concorrentes'
    ],
    comparison_table: [
      { param: 'Uptime 2026', anthropic: '~99.1%', openai: '~98.9%', google: '~99.5%' },
      { param: 'Incidentes graves', anthropic: '1 (mar 2026)', openai: '2 (jan 2026)', google: '0' },
      { param: 'Comunicação', anthropic: 'Atrasada', openai: 'Status page', google: 'Rápida' },
      { param: 'Recuperação', anthropic: '3 horas', openai: '1-2 horas', google: '< 1 hora' }
    ],
    content_angles: [
      { type: 'polemica', title: 'O apagão do Claude Code que parou pipelines de produção no mundo todo' },
      { type: 'hack', title: 'Como proteger seu pipeline de desenvolvimento contra apagões de IA' },
      { type: 'tutorial', title: 'Fallback de IA: configure um plano B para quando a API cair' },
      { type: 'comparativo', title: 'Estabilidade: Anthropic vs OpenAI vs Google — dados reais de uptime' },
      { type: 'transformacao', title: 'O apagão me ensinou a nunca depender de uma única IA' }
    ]
  }
];

export const CATEGORY_COLORS: Record<string, string> = {
  'Novo modelo': 'border-blue-500/30 bg-blue-500/10 text-blue-400',
  'Feature nova': 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',
  'Bug corrigido': 'border-green-500/30 bg-green-500/10 text-green-400',
  'Limitação': 'border-red-500/30 bg-red-500/10 text-red-400',
  'Mudança de preço': 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
  'Doc atualizada': 'border-gray-500/30 bg-gray-500/10 text-gray-400',
  'Nova integração': 'border-purple-500/30 bg-purple-500/10 text-purple-400',
  'Instabilidade': 'border-orange-500/30 bg-orange-500/10 text-orange-400'
};

export const CATEGORIES = ['Todos', 'Novo modelo', 'Feature nova', 'Bug corrigido', 'Limitação', 'Mudança de preço', 'Doc atualizada', 'Nova integração', 'Instabilidade'];
export const PERIODS = ['Últimas 24h', 'Últimos 7 dias', 'Últimos 30 dias', 'Todos'];
