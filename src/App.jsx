import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import './index.css';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

function App() {
  const [indicadores, setIndicadores] = useState(null);
  const [graficos, setGraficos] = useState(null);
  const [lista, setLista] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [periodo, setPeriodo] = useState('geral');
  const [responsavel, setResponsavel] = useState('todos');
  const [motivo, setMotivo] = useState('todos');
  const [page, setPage] = useState(1);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Modal state
  const [selectedTicket, setSelectedTicket] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const baseUrl = import.meta.env.DEV ? 'http://localhost:8000' : '';
      const qs = `?periodo=${periodo}&responsavel=${responsavel}&motivo=${motivo}`;
      
      const [resInd, resGraf, resLista] = await Promise.all([
        fetch(`${baseUrl}/api/indicadores.php${qs}`),
        fetch(`${baseUrl}/api/graficos.php${qs}`),
        fetch(`${baseUrl}/api/lista_chamados.php${qs}&page=${page}&limit=10`)
      ]);

      const [jsonInd, jsonGraf, jsonLista] = await Promise.all([
        resInd.json(), resGraf.json(), resLista.json()
      ]);

      setIndicadores(jsonInd);
      setGraficos(jsonGraf);
      setLista(jsonLista);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Aviso: Falha ao carregar dados da API.');
      setLoading(false);
    }
  };

  // Fetch when filters or page change
  useEffect(() => {
    fetchDashboardData();
  }, [periodo, responsavel, motivo, page]);

  // Auto-refresh a cada 5 minutos
  useEffect(() => {
    const interval = setInterval(fetchDashboardData, 300000);
    return () => clearInterval(interval);
  }, [periodo, responsavel, motivo, page]);

  if (loading && !indicadores) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Carregando dashboard...</p>
      </div>
    );
  }

  const getStatusBadge = (ticket) => {
    const prioridade = ticket.prioridade?.toLowerCase() || '';
    if (prioridade === 'critica' || prioridade === 'crítica') {
      return <span className="badge badge-critical blink-critical">CRÍTICO</span>;
    }
    const dias = ticket.dias_aberto || 0;
    if (dias >= 3) return <span className="badge badge-red">MUITO ATRASADO ({dias}d)</span>;
    if (dias >= 1) return <span className="badge badge-yellow">ATRASADO ({dias}d)</span>;
    return <span className="badge badge-green">NO PRAZO</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="dashboard-container">
      <header>
        <h1>Painel de Operações</h1>
        <p>Última atualização: {lastUpdated.toLocaleTimeString()}</p>
      </header>

      {error && <div className="error-message">{error}</div>}

      <div className="filters-bar">
        <select value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
          <option value="geral">Período: Geral</option>
          <option value="hoje">Período: Hoje</option>
          <option value="semana">Período: Última Semana</option>
          <option value="mes">Período: Último Mês</option>
        </select>
        
        <select value={responsavel} onChange={(e) => setResponsavel(e.target.value)}>
          <option value="todos">Responsável: Todos</option>
          <option value="1">João Silva</option>
          <option value="2">Maria Souza</option>
          <option value="3">Carlos Eduardo</option>
          <option value="4">Ana Clara</option>
          <option value="5">Pedro Paulo</option>
        </select>

        <select value={motivo} onChange={(e) => setMotivo(e.target.value)}>
          <option value="todos">Motivo: Todos</option>
          <option value="1">Dúvida de Sistema</option>
          <option value="2">Erro na Plataforma</option>
          <option value="3">Solicitação de Acesso</option>
          <option value="4">Problema de Hardware</option>
          <option value="5">Instalação de Software</option>
        </select>

        <button onClick={fetchDashboardData}>Atualizar Agora</button>
      </div>

      {/* KPIs Row */}
      <div className="grid-container">
        <div className="card">
          <div className="card-title">Abertos vs Fechados</div>
          <div className="card-value">{indicadores?.total_status?.abertos_percent}%</div>
          <div className="card-subtitle">
            {indicadores?.total_status?.abertos} Abertos | {indicadores?.total_status?.fechados} Fechados
          </div>
        </div>
        <div className="card">
          <div className="card-title">Tempo Médio Geral</div>
          <div className="card-value">{Math.floor((indicadores?.tempo_medio_minutos || 0) / 60)}h</div>
          <div className="card-subtitle">Tempo desde a abertura até a resolução</div>
        </div>
        <div className="card">
          <div className="card-title">Abertos Hoje</div>
          <div className="card-value">{indicadores?.abertos_hoje || 0}</div>
          <div className="card-subtitle">Novas solicitações no dia atual</div>
        </div>
        <div className="card">
          <div className="card-title">Resolução no Prazo (&lt;24h)</div>
          <div className="card-value">{indicadores?.taxa_resolucao_prazo || 0}%</div>
          <div className="card-subtitle">Dos chamados fechados no período</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="card-title" style={{marginBottom: '1rem'}}>Chamados por Dia da Semana</div>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={graficos?.por_dia_semana || []}>
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px'}} />
              <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="card-title" style={{marginBottom: '1rem'}}>Distribuição por Motivo</div>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie data={graficos?.por_motivo || []} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                {(graficos?.por_motivo || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px'}} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="card-title" style={{marginBottom: '1rem'}}>Evolução Mensal (Abertos x Fechados)</div>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={graficos?.evolucao_mensal || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px'}} />
              <Line type="monotone" dataKey="abertos" stroke="#ef4444" strokeWidth={3} />
              <Line type="monotone" dataKey="fechados" stroke="#10b981" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table Section */}
      <div className="table-container" style={{ marginBottom: '2rem' }}>
        <div className="card-title" style={{ marginBottom: '1.5rem' }}>Fila de Chamados Abertos (Ação Requerida)</div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Título</th>
              <th>Motivo</th>
              <th>Responsável</th>
              <th>Status do Prazo</th>
              <th>Data de Abertura</th>
            </tr>
          </thead>
          <tbody>
            {(lista?.data || []).map((ticket) => (
              <tr key={ticket.codigo} className="clickable-row" onClick={() => setSelectedTicket(ticket)}>
                <td style={{fontWeight: 'bold', color: 'var(--accent-color)'}}>#{ticket.codigo}</td>
                <td>{ticket.titulo}</td>
                <td>{ticket.motivo}</td>
                <td>{ticket.responsavel || 'Não Atribuído'}</td>
                <td>{getStatusBadge(ticket)}</td>
                <td>{formatDate(ticket.data_de_inicio)}</td>
              </tr>
            ))}
            {(!lista?.data || lista.data.length === 0) && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center' }}>Nenhum chamado aberto na fila atual.</td>
              </tr>
            )}
          </tbody>
        </table>
        
        {lista?.totalPages > 1 && (
          <div className="pagination">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</button>
            <span style={{alignSelf: 'center'}}>Página {page} de {lista.totalPages}</span>
            <button disabled={page === lista.totalPages} onClick={() => setPage(p => p + 1)}>Próxima</button>
          </div>
        )}
      </div>

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedTicket(null)}>&times;</button>
            <h2 style={{marginBottom: '1rem'}}>Chamado #{selectedTicket.codigo}</h2>
            
            <div style={{display: 'flex', gap: '1rem', marginBottom: '1.5rem'}}>
              {getStatusBadge(selectedTicket)}
              <span className="badge" style={{background: 'rgba(255,255,255,0.1)'}}>
                Prioridade: {selectedTicket.prioridade || 'Normal'}
              </span>
            </div>

            <div style={{marginBottom: '1rem'}}>
              <strong>Título:</strong> {selectedTicket.titulo}
            </div>
            <div style={{marginBottom: '1rem'}}>
              <strong>Motivo:</strong> {selectedTicket.motivo}
            </div>
            <div style={{marginBottom: '1rem'}}>
              <strong>Status Atual:</strong> {selectedTicket.status}
            </div>
            <div style={{marginBottom: '1rem'}}>
              <strong>Responsável:</strong> {selectedTicket.responsavel || 'Aguardando atribuição'}
            </div>
            
            <div className="ticket-description">
              {selectedTicket.descricao || 'Sem descrição detalhada fornecida.'}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;
