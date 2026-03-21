# 1. Objetivo Aparente do Sistema (O que o AI Opportunity Lab faz?)

O **AI Opportunity Lab** (referenciado também no ecossistema de Conteúdo Infinito) é uma plataforma abrangente de "product intelligence" e "content intelligence" voltada para criadores de conteúdo, empreendedores e desenvolvedores de software (SaaS). 

O sistema funciona como um motor preditivo e colaborativo (um "Radar de Oportunidades") massivamente alimentado por Inteligência Artificial (integrado com o ecossistema Anthropic/Claude e Gemini). O objetivo principal é automatizar a jornada que vai desde a **descoberta de dores do mercado** até a **ideação de roteiros** e a **arquitetura de novos negócios de software**.

Suas principais propostas de valor incluem:
- **Descoberta de Dores e Padrões (Discovery):** Monitoramento e detecção de dores reais, agrupando-as por nichos de mercado e identificando padrões comportamentais recorrentes.
- **Inteligência de Conteúdo:** Plataforma de criação automática de ideias de posts, roteiros de vídeo, abordagens através de um "Motor 5 Ângulos", além da geração de um calendário semanal otimizado para redes sociais.
- **SaaS Lab (Ferramentas e Produto):** Foco na análise de ferramentas existentes para detectar falhas e oportunidades no mercado, seguido do fornecimento técnico para construir soluções: geração de *Technical Blueprints* (arquitetura técnica), *Landing Pages* e *MVP Plans* para novas aplicações SaaS baseadas nas dores recém descobertas pelo radar.

---

# 2. Stack Tecnológica Utilizada

O projeto é uma aplicação full-stack moderna, com arquitetura Serverless baseada no robusto ecossistema React e Supabase, desenhada para ter performance e UI premium.

**Interface de Usuário (Frontend):**
- **Core Framework:** React 18 escrito em TypeScript, orquestrado e empacotado pelo Vite (com plugin SWC para builds ultra-rápidas).
- **Roteamento:** React Router DOM (v6).
- **Estilização e Design System:** Tailwind CSS configurado para temas modo dark/light, acoplado com a biblioteca `shadcn/ui` (construída sobre componentes acessíveis do Radix UI) e Lucide React para iconografia. Utiliza Framer Motion para microinterações e animações complexas.
- **Gerenciamento de Estado e Cache de Dados:** React Query (TanStack Query v5) orquestrando o data fetching assíncrono, complementado por React Context (como `AuthContext` e `SelectedProblemContext`) para estado global simples.
- **Validação e UX:** React Hook Form junto com Zod para tipagem restrita em formulários, e Sonner/Toaster para notificações visuais.

**Backend, Infraestrutura e Banco de Dados:**
- **BaaS (Backend as a Service):** Supabase cuidando do banco de dados relacional (PostgreSQL), Autenticação unificada e hospedagem de funções backend.
- **Integração de Inteligências Artificiais Externas:** Comunicação via API segura com LLMs avançados (Claude 3.5 Sonnet / Gemini), orquestrada no backend.
- **Processamento Serverless:** Uso intensivo de **Supabase Edge Functions** escritas em TypeScript/Deno. As funções executam na borda as lógicas mais pesadas ("pipelines" de IA). A pasta `supabase/functions` revela microsserviços como: `daily-pain-discovery`, `detect-patterns`, `discover-problems`, `generate-blueprint`, `generate-content-idea`, `generate-mvp-plan` e `run-pipeline`.

---

# 3. Estado Atual do Projeto e Principais Funcionalidades

O projeto já se encontra em um estágio bastante **maduro e funcional**, com as bases do aplicativo já de pé, possuindo rotas dinâmicas, proteção de autenticação e diversas dashboards operantes.

**Principais Funcionalidades Já Implementadas e Ativas:**
1. **Opportunity Radar (`/radar`):** É o fluxo central e otimizado da aplicação. Uma tela complexa que unificou tarefas de *"Problem Hunter"* e *"Tool Discovery"*, permitindo ao usuário selecionar um nicho, rastrear dores ali presentes e instanciar um pipeline inteiro de IA com o clique de um card. Existe também uma versão nativa projetada via ecossistema Anthropic (`/anthropic/radar`).
2. **Setup de Projeto (`/project-setup`):** Uma tela dedicada a injetar repositórios do GitHub ou informações pontuais para gerar pacotes completos de instruções prontas ("Claude Code files"), auxiliando na codificação remota daquele novo software idealizado.
3. **Content Hub Robusto:** Telas completas entregando produtividade para criadores: Ideias de Conteúdo (`/content/ideas`), Roteiros de Vídeos automatizados (`/content/scripts`), Visão Estratégica via Motor 5 Ângulos (`/content/angles`) e distribuição via Calendário Semanal Dinâmico (`/content/calendar`).
4. **SaaS Lab e Discovery:** Onde as oportunidades detectadas tomam vida de projeto real. Possui gerenciadores avançados visualizando as oportunidades (`/saas/opportunities`), além de gerador próprio de Landing Pages (`/saas/landing`) e Projetos base/Blueprints (`/saas/blueprint`).
5. **Autenticação e Limpeza de Dados:** Conta com login operacional e uma inteligência implementada recente para fazer o cleanup de base de dados para evitar lixo não-proveniente do pipeline do radar.

**Espaços Mapeados no Roadmap (Em Desenvolvimento / Futuro Promissor):**
Com grande planejamento modular, existem páginas de *Placeholder* indicando expansões claras num futuro bem próximo, destacando-se:
-  **Deeper Niche Intelligence:** Listagens isoladas e robustas organizadas nativamente por "Dores" e "Ferramentas" mapeadas.
-  **Intelligence Analytics:** Três telas voltadas para rastrear a assertividade do conteúdo publicado (Métricas de posts, Análise de Viralidade e um "Loop de Aprendizado" que calibrará a IA baseada nestes números).
-  **Tool Reviews Deep Dive:** Sistema feito para minerar "Reviews Negativas" e "Falhas" das ferramentas do mercado identificando onde criar features concorrentes e gerar conteúdo criticando essas soluções ineficientes.

**Resumo da Ópera:** O *AI Opportunity Lab* encontra-se perfeitamente estabilizado como a ferramenta indispensável de um infoprodutor/empreendedor full-stack. Ele une de forma inovadora a detecção preditiva de problemas no mercado à máquina de execução capaz de estruturar tanto conteúdo viral de vendas quanto o próprio produto digital SaaS para solucioná-lo.
