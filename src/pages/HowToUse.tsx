import React from 'react';
import { 
  Signal, Bell, Settings, Calendar, 
  ChevronRight, Info, Lightbulb, Zap, CheckCircle2,
  Mic, Layers, Search, Terminal, FileCode, Github, Bookmark
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
  <div className="flex items-center gap-3">
    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
      <Icon className="h-4 w-4 text-primary" />
    </div>
    <span className="font-bold text-base tracking-tight">{title}</span>
  </div>
);

const DicaBox = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-3">
    <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
    <div className="text-sm text-primary/90 italic">
      <span className="font-bold not-italic">Dica:</span> {children}
    </div>
  </div>
);

const StepList = ({ steps }: { steps: (string | React.ReactNode)[] }) => (
  <ol className="space-y-4 mt-4">
    {steps.map((step, i) => (
      <li key={i} className="flex gap-4 text-sm text-muted-foreground leading-relaxed">
        <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-secondary text-[11px] font-bold text-foreground mt-0.5">
          {i + 1}
        </span>
        <div className="space-y-1">
          {typeof step === 'string' ? (
            step.split('\n').map((line, li) => (
              <p key={li} className={li === 0 ? "font-semibold text-foreground" : "text-muted-foreground"}>
                {line}
              </p>
            ))
          ) : step}
        </div>
      </li>
    ))}
  </ol>
);

const FileGrid = ({ files }: { files: { name: string, desc: string }[] }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
    {files.map((file, i) => (
      <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/20 border border-border/30">
        <span className="text-[10px] font-bold font-mono text-primary whitespace-nowrap min-w-[100px]">{file.name}</span>
        <span className="text-[10px] text-muted-foreground leading-tight">→ {file.desc}</span>
      </div>
    ))}
  </div>
);

const HowToUse = () => {
  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl space-y-8 animate-in fade-in duration-500">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Como Usar Esta Aba</h1>
        <p className="text-muted-foreground">Guia completo para dominar todas as ferramentas da plataforma.</p>
      </header>

      <Accordion type="single" collapsible className="w-full space-y-4">
        {/* Section 1 - Radar de Dores */}
        <AccordionItem value="radar-dores" className="border border-border/50 bg-card/40 backdrop-blur-sm rounded-2xl overflow-hidden px-4">
          <AccordionTrigger className="hover:no-underline py-6 [&[data-state=open]>div>svg]:rotate-180">
            <div className="flex flex-col items-start gap-1">
              <SectionHeader icon={Signal} title="Radar de Dores Anthropic" />
              <p className="text-xs text-muted-foreground font-normal ml-11">
                Encontra os problemas mais quentes do ecossistema Anthropic e entrega roteiro de vídeo pronto + prompt de solução para cada dor.
              </p>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-8 pt-2">
            <div className="space-y-6">
              <StepList steps={[
                "Leia o banner no topo\nSe aparecer \"JANELA ABERTA AGORA\", você tem ~72h para criar conteúdo antes do mercado saturar. Clique \"Gerar Conteúdo Agora\".",
                "Entenda os badges de prioridade\nALTA DEMANDA (vermelho) — crie conteúdo agora\nJANELA ABERTA (ciano) — crescendo rápido, pouco conteúdo existente\nEMERGINDO (amarelo) — tendência nova, vale monitorar\nESTÁVEL (verde) — dor constante, sem urgência de timing\nPasse o mouse no Score para ver o breakdown (volume, velocidade, ausência de conteúdo, urgência técnica).",
                "Use os filtros à esquerda\nFiltre por produto (Claude Code, MCP, API...), fonte, período e tipo de dor. Deixe tudo em \"Todos\" se quiser ver tudo rankeado por urgência.",
                "Expanda o card para ver a solução\nClique \"Ver Detalhes\" para abrir:\n- Prompt pronto para colar no Claude Code e resolver o problema\n- Workflow em passos numerados\nClique \"Copiar Prompt\" ou \"Copiar Workflow\" para usar direto.",
                "Gere o roteiro do vídeo\nClique \"Gerar Conteúdo\" para abrir o painel lateral com 5 ângulos: Tutorial | Polêmica | Hack | Comparativo | Transformação. Escolha o ângulo e a plataforma: Reels, LinkedIn ou Thread. O roteiro completo é gerado com estrutura de 60 segundos: Hook (0-3s) → Frame (3-10s) → Execução (10-45s) → Payoff (45-55s) → CTA (55-60s)",
                "Use o Roteiro para NotebookLM (bônus)\nClique \"Gerar Roteiro NotebookLM\" no card expandido. O app gera um documento estruturado. Cole no NotebookLM e:\n- Gere um podcast técnico com dois hosts de IA conversando\n- Adicione outras fontes (vídeo YouTube + doc oficial) para cruzar tudo num único entendimento\n- Cole a documentação do seu projeto para encontrar contradições",
                "Use o Calendário de 15 Dias\nClique \"Gerar Calendário 15 Dias\" no topo do feed. O app escolhe os 15 melhores problemas e gera todos os roteiros de uma vez, salvos no banco. Acesse pelo \"Calendário de Conteúdo\" para abrir o roteiro de cada dia.",
                "Salve dores para trabalhar depois\nClique \"Salvar\" em qualquer card. Escolha: app, Notion ou Trello. Acesse pelo tab \"Salvos\"."
              ]} />

              <DicaBox>
                Não espere ter uma ideia. Abra o app, olhe o banner, gere o roteiro e grave. O conteúdo mais valioso é o criado antes de todo mundo — e o Radar te diz exatamente quando agir.
              </DicaBox>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 2 - Monitor de Lançamentos */}
        <AccordionItem value="monitor-lancamentos" className="border border-border/50 bg-card/40 backdrop-blur-sm rounded-2xl overflow-hidden px-4">
          <AccordionTrigger className="hover:no-underline py-6">
            <div className="flex flex-col items-start gap-1 text-left">
              <SectionHeader icon={Bell} title="Monitor de Lançamentos" />
              <p className="text-xs text-muted-foreground font-normal ml-11">
                Monitora tudo que a Anthropic lança ou muda. Para cada novidade: o que mudou, comparativo com OpenAI e Google, e roteiros prontos.
              </p>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-8 pt-2">
            <div className="space-y-6">
              <StepList steps={[
                "Leia os badges por cor\nAzul (novo modelo) | Ciano (feature nova) | Verde (bug fix)\nVermelho (limitação) | Amarelo (mudança de preço)\nCinza (doc atualizada) | Roxo (nova integração) | Laranja (apagão)",
                "Filtre por categoria e período\nUse os chips no topo para focar no que importa agora.",
                "Abra o comparativo completo\nClique \"Ver comparativo completo\" dentro de qualquer card para ver tabela com dados reais: velocidade, custo por token, context window, recall score e melhor caso de uso.",
                "Gere o roteiro\nClique \"Gerar Conteúdo\" → os 5 ângulos aparecem prontos. Clique na plataforma desejada para gerar o script completo.",
                "Adicione ao Calendário\nApós gerar, clique \"Adicionar ao Calendário\" e escolha o dia (1 a 15). O roteiro vai direto para o Calendário de Conteúdo.",
                "Use a Linha do Tempo\nClique \"Linha do Tempo\" no canto direito. Bolinhas coloridas mostram cada lançamento em ordem cronológica. \"✓ conteúdo gerado\" = coberto | \"○ pendente\" = ainda não cobriu. Clique em qualquer item para ir direto ao card no feed.",
                "Salve lançamentos importantes\nClique \"Salvar\" em qualquer card. Acesse pelo tab \"Salvos\"."
              ]} />

              <DicaBox>
                O melhor conteúdo sobre lançamentos sai nas primeiras 48h. Quando aparecer badge ALTA com lançamento novo, gere o roteiro imediatamente.
              </DicaBox>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 3 - Project Setup */}
        <AccordionItem value="project-setup" className="border border-border/50 bg-card/40 backdrop-blur-sm rounded-2xl overflow-hidden px-4">
          <AccordionTrigger className="hover:no-underline py-6">
            <div className="flex flex-col items-start gap-1 text-left">
              <SectionHeader icon={Settings} title="Configuração de Projeto (Claude Code)" />
              <p className="text-xs text-muted-foreground font-normal ml-11">
                Gera 17 arquivos que ensinam o Claude Code tudo sobre o seu projeto. Resultado: 60-70% menos tokens e Claude trabalhando como especialista.
              </p>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-8 pt-2">
            <div className="space-y-8">
              <div className="space-y-4">
                <h4 className="text-sm font-bold flex items-center gap-2 text-primary">
                  <Zap className="h-4 w-4" /> CAMINHO 1 — Formulário manual
                </h4>
                <StepList steps={[
                  "Preencha Nome, Stack (selecione do menu), o que o projeto faz e Objetivo principal",
                  "Preencha Features atuais e Roadmap (quanto mais detalhe, melhores os arquivos gerados)",
                  "Selecione Tamanho do time — Solo Dev gera configuração leve, Time Grande ativa regras de segurança mais rígidas",
                  "Marque as Integrações que o projeto usa (Supabase, Pagar.me, etc.)",
                  "Adicione Contexto adicional se necessário (LGPD, monorepo, etc.)",
                  "Clique \"Gerar Pacote Claude Code\""
                ]} />
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold flex items-center gap-2 text-primary">
                  <Github className="h-4 w-4" /> CAMINHO 2 — Importar do GitHub
                </h4>
                <StepList steps={[
                  "Clique \"Importar GitHub\" e cole a URL do repositório público",
                  "O app lê README, package.json e estrutura automaticamente",
                  "Complete o que faltou: objetivo, roadmap, tamanho do time",
                  "Clique \"Gerar Pacote Claude Code\""
                ]} />
              </div>

              <div className="space-y-4 pt-4 border-t border-border/30">
                <h4 className="text-sm font-bold flex items-center gap-2 text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> Instalação e Inicialização
                </h4>
                <StepList steps={[
                  "Baixe o ZIP gerado e extraia na raiz do repositório",
                  "Propague as mudanças: git add . && git commit -m \"chore: add Claude Code config\" && git push",
                  "Abra o Claude Code no projeto e cole o Primeiro Comando:\n\"Leia o CLAUDE.md e me confirme que entendeu o projeto respondendo:\n1. O que este projeto faz em uma frase\n2. Qual é a stack principal\n3. Quais são as 3 regras mais importantes que você vai seguir\nDepois leia todos os arquivos na pasta .tasks/ e me diga:\n1. Quais tarefas estão mapeadas\n2. Qual é a próxima tarefa prioritária\n3. O que você precisa saber antes de começar essa tarefa\"",
                  <div key="autocompact-rule" className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg space-y-2">
                    <p className="font-bold text-xs text-destructive flex items-center gap-2">
                      <AlertCircle className="h-3 w-3" /> Regra importante sobre /compact:
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      O app configura o Claude para <strong>NUNCA usar autocompact automático</strong>. Use /compact manualmente apenas nos checkpoints (depois de feature, bug ou antes de nova tarefa). O autocompact automático é destrutivo e cria a "Zona Burra" (perda de precisão e alucinações).
                    </p>
                  </div>
                ]} />
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">O que cada arquivo faz:</h4>
                <FileGrid files={[
                  { name: "CLAUDE.md", desc: "memória do Claude em toda sessão" },
                  { name: "AGENTS.md", desc: "funciona em Claude Code, Cursor, Codex e OpenCode" },
                  { name: "settings.json", desc: "economiza 60-70% dos tokens" },
                  { name: "rules/", desc: "regras que o Claude nunca ignora" },
                  { name: "commands/", desc: "atalhos /tdd /plan /code-review prontos" },
                  { name: "hooks.json", desc: "bloqueia leitura de .env e secrets" },
                  { name: ".tasks/", desc: "resolve a Zona Burra entre sessões" },
                  { name: "contexts/", desc: "muda comportamento por modo" },
                  { name: "handoff.md", desc: "continuidade entre dias de trabalho" },
                  { name: "mcp-servers.json", desc: "conecta Supabase, Pagar.me e outros" }
                ]} />
              </div>

              <DicaBox>
                Preencha o Roadmap com detalhes. O app usa isso para criar os arquivos .tasks/ já preenchidos com suas próximas tarefas reais.
              </DicaBox>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 4 - Calendário de Conteúdo */}
        <AccordionItem value="calendario-conteudo" className="border border-border/50 bg-card/40 backdrop-blur-sm rounded-2xl overflow-hidden px-4">
          <AccordionTrigger className="hover:no-underline py-6">
            <div className="flex flex-col items-start gap-1 text-left">
              <SectionHeader icon={Calendar} title="Calendário de Conteúdo" />
              <p className="text-xs text-muted-foreground font-normal ml-11">
                Mostra 15 roteiros organizados por dia. Abra o dia, leia, grave e publique. Sem precisar pensar no assunto por 15 dias.
              </p>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-8 pt-2">
            <div className="space-y-6">
              <StepList steps={[
                "Gere o calendário primeiro\nVá para o Radar de Dores e clique \"Gerar Calendário 15 Dias\". Preencha: plataforma foco, data de início, nível da audiência e seu @. Clique \"Gerar 15 Roteiros Agora\".",
                "Escolha a visualização\nGrade (📅) — todos os 15 dias visíveis de uma vez\nLista (📋) — mais fácil de ler no celular",
                "Entenda os status\nPENDENTE (cinza) — pronto, ainda não gravou\nGRAVADO (amarelo) — gravou mas não publicou\nPUBLICADO (verde) — conteúdo no ar",
                "Abra o roteiro do dia\nClique \"Ver Roteiro Completo\". O modal tem 4 abas: Narração, O que mostrar na tela, Detalhes e Notas. Aba Narração tem seções coloridas: Ciano (Hook 0-3s), Amarelo (Frame 3-10s), Branco (Execução 10-45s), Verde (Payoff 45-55s), Laranja (CTA 55-60s).",
                "Atualize o status\nClique em \"Gravado\" após gravar, \"Publicado\" após publicar. O painel atualiza os contadores automaticamente.",
                "Navegue entre dias\nUse as setas no fundo do modal para ir ao dia anterior ou próximo sem fechar e abrir novamente.",
                "Gere novo calendário\nQuando os 15 dias acabarem, volte ao Radar de Dores e clique \"Gerar Novo Calendário\" para o próximo ciclo."
              ]} />

              <DicaBox>
                Separe 15 minutos no início da semana para revisar os roteiros dos próximos 7 dias. O calendário existe para você saber exatamente o que gravar cada dia sem precisar pensar no assunto.
              </DicaBox>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

// Simple utility icon for the rule warning
const AlertCircle = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
);

export default HowToUse;
