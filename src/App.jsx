import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { getDashboardData } from './services/dashboardService';
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

  // Table specific filters
  const [searchTerm, setSearchTerm] = useState('');
  const [tablePriority, setTablePriority] = useState('todas');

  // Modal state
  const [selectedTicket, setSelectedTicket] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await getDashboardData({ periodo, responsavel, motivo });

      setIndicadores(data.indicadores);
      setGraficos(data.graficos);
      setLista(data.lista);
      setLastUpdated(new Date());
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Erro: ' + (err.message || err.error_description || JSON.stringify(err)));
      setLoading(false);
    }
  };

  // Fetch when global filters change (remove page from dependency to avoid refetching on pagination)
  useEffect(() => {
    fetchDashboardData();
    setPage(1); // Reset page on global filter change
  }, [periodo, responsavel, motivo]);

  // Auto-refresh a cada 5 minutos
  useEffect(() => {
    const interval = setInterval(fetchDashboardData, 300000);
    return () => clearInterval(interval);
  }, [periodo, responsavel, motivo]);

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
        <div className="card">
          <div className="card-title">Maior Gargalo (Atrasos)</div>
          <div className="card-value" style={{fontSize: '1.4rem'}}>{indicadores?.pior_motivo?.motivo || 'N/A'}</div>
          <div className="card-subtitle">{indicadores?.pior_motivo?.quantidade || 0} chamados fora do prazo</div>
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

        {/* Top 3 Responsáveis */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-title" style={{ marginBottom: '1rem' }}>🏆 Top 3 Resolvidos</div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {(indicadores?.top_responsaveis || []).map((resp, index) => (
              <div key={resp.nome} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', borderBottom: index < 2 ? '1px solid var(--card-border)' : 'none' }}>
                <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'} {resp.nome}
                </span>
                <span style={{ color: 'var(--accent-color)', fontWeight: 'bold', fontSize: '1.1rem' }}>{resp.total}</span>
              </div>
            ))}
            {(!indicadores?.top_responsaveis || indicadores.top_responsaveis.length === 0) && (
              <div style={{ textAlign: 'center', color: 'gray', padding: '2rem 0' }}>Nenhum chamado concluído</div>
            )}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="table-container" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div className="card-title" style={{ margin: 0 }}>Fila de Chamados Abertos (Ação Requerida)</div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              placeholder="Buscar ID ou Título..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
              style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'white' }}
            />
            <select 
              value={tablePriority}
              onChange={e => { setTablePriority(e.target.value); setPage(1); }}
              style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--bg-color)', color: 'white' }}
            >
              <option value="todas">Todas Prioridades</option>
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica</option>
            </select>
          </div>
        </div>
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
            {(() => {
              let filteredTable = lista || [];
              if (searchTerm) {
                const term = searchTerm.toLowerCase();
                filteredTable = filteredTable.filter(c => 
                  c.titulo?.toLowerCase().includes(term) || 
                  String(c.codigo).includes(term)
                );
              }
              if (tablePriority !== 'todas') {
                filteredTable = filteredTable.filter(c => (c.prioridade || 'Media').toLowerCase() === tablePriority.toLowerCase());
              }
              
              const totalPages = Math.ceil(filteredTable.length / 10) || 1;
              const pagedTable = filteredTable.slice((page - 1) * 10, page * 10);

              if (pagedTable.length === 0) {
                return <tr><td colSpan="6" style={{ textAlign: 'center' }}>Nenhum chamado encontrado com estes filtros.</td></tr>;
              }

              return (
                <>
                  {pagedTable.map((ticket) => (
                    <tr key={ticket.codigo} className="clickable-row" onClick={() => setSelectedTicket(ticket)}>
                      <td style={{fontWeight: 'bold', color: 'var(--accent-color)'}}>#{ticket.codigo}</td>
                      <td>{ticket.titulo}</td>
                      <td>{ticket.motivo}</td>
                      <td>{ticket.responsavel || 'Não Atribuído'}</td>
                      <td>{getStatusBadge(ticket)}</td>
                      <td>{formatDate(ticket.data_de_inicio)}</td>
                    </tr>
                  ))}
                  {totalPages > 1 && (
                    <tr style={{background: 'transparent', border: 'none'}}>
                      <td colSpan="6" style={{padding: 0}}>
                        <div className="pagination" style={{padding: '1rem 0'}}>
                          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Anterior</button>
                          <span style={{alignSelf: 'center'}}>Página {page} de {totalPages}</span>
                          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Próxima</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })()}
          </tbody>
        </table>
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
