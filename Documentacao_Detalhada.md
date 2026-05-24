# Manual e Documentação Técnica - Dashboard de Chamados

## 1. Visão Geral
A Dashboard de Chamados é uma aplicação Web (Single Page Application) desenvolvida em React.js que se conecta diretamente a um banco de dados PostgreSQL hospedado no Supabase. O objetivo da ferramenta é fornecer à equipe de gestão e operações uma visão clara, em tempo real, sobre a saúde do atendimento de chamados (tickets), gargalos e desempenho da equipe.

## 2. Arquitetura do Sistema
- **Frontend:** Desenvolvido com React e Vite. A interface não necessita de um backend intermediário (como PHP ou Node.js) para buscar os dados, conectando-se diretamente e com segurança ao Supabase via a biblioteca oficial `@supabase/supabase-js`.
- **Backend (BaaS):** Supabase. Responsável por armazenar os dados e prover uma API RESTful instantânea.
- **Hospedagem:** Vercel, serviço otimizado para aplicações front-end de alta performance.

## 3. Funcionalidades e KPIs (Key Performance Indicators)

### Filtros Globais
Localizados no topo da tela, afetam todos os cálculos e gráficos da dashboard simultaneamente:
- **Período:** Filtra os chamados pela data de abertura (Hoje, Última Semana, Último Mês, Geral).
- **Responsável:** Isola a visão para o desempenho de um atendente específico.
- **Motivo:** Permite analisar apenas um tipo de solicitação (ex: Erro no Sistema, Dúvidas, Infraestrutura).

### Painéis de Indicadores Principais (Cards)
1. **Abertos vs Fechados:** Mostra o volume atual da fila de trabalho e o percentual de conclusão geral.
2. **Tempo Médio Geral:** Calcula o tempo médio (em horas) que os chamados fechados levaram desde a abertura até a resolução.
3. **Abertos Hoje:** Contagem de novos chamados que entraram no dia atual.
4. **Resolução no Prazo (<24h):** Percentual de eficiência da equipe. Mede a taxa de chamados que foram solucionados dentro da janela de 24 horas (SLA).
5. **Maior Gargalo (Atrasos):** Identifica matematicamente qual tipo de chamado (Motivo) possui o maior volume de tickets fora do prazo (abertos há mais de 24h ou que foram fechados após 24h).

### Gráficos Dinâmicos
- **Distribuição por Dia da Semana:** Gráfico de barras identificando os dias de maior pico de abertura de chamados.
- **Distribuição por Motivo:** Gráfico de pizza (Donut) demonstrando as categorias mais acionadas, facilitando a identificação de problemas sistêmicos.
- **Evolução Mensal:** Gráfico de linhas comparando a entrada de novos chamados com a resolução (Fechados) ao longo dos meses.

### Fila de Chamados Abertos (Tabela)
Uma tabela paginada exibindo apenas os chamados que requerem ação (status em aberto).
- **Busca Rápida (Client-side):** Filtro local por ID ou Título da solicitação que responde instantaneamente à digitação.
- **Filtro de Prioridade:** Permite segmentar a fila para focar em chamados de prioridade Crítica, Alta, Média ou Baixa.
- **Paginação:** Exibe 10 chamados por página, mantendo os mais recentes no topo.

## 4. Estrutura de Banco de Dados
O sistema consome 4 tabelas relacionais do Supabase:
- `chamados`: Tabela principal que registra a ocorrência (codigo, titulo, descricao, data_de_inicio, data_de_fechamento, prioridade, codstatus, codmotivo, codresponsavel).
- `status`: Dicionário de status da operação.
- `motivos`: Dicionário de categorização do chamado.
- `responsaveis`: Dicionário da equipe técnica.

## 5. Como Atualizar e Manter o Projeto
O ciclo de vida do código é integrado nativamente ao Vercel via Git:
1. Faça as melhorias no código fonte localmente.
2. Teste utilizando `npm run dev`.
3. Utilize o Git para registrar as mudanças (`git add .` e `git commit -m "Sua alteracao"`).
4. Envie as alterações para o repositório (`git push`).
5. O Vercel interceptará a atualização automaticamente e o site em produção (`.vercel.app`) será atualizado em poucos segundos sem downtime.
