import { useEffect, useState } from 'react';
import './index.css';

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // No Vercel, o proxy do vercel.json lidará com /api/
    const apiUrl = import.meta.env.DEV 
      ? 'http://localhost:8000/api/indicadores.php' 
      : '/api/indicadores.php';

    fetch(apiUrl)
      .then(res => {
        if (!res.ok) throw new Error('Erro na resposta do servidor');
        return res.json();
      })
      .then(json => {
        if (json.error) throw new Error(json.error);
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        // Fallback de dados para demonstração caso não tenha banco conectado
        setData({
          maior_volume: { motivo: 'Problema de Hardware', total: 42 },
          maior_tempo: { codigo: 104, titulo: 'Falha no Servidor', minutos: 14400 },
          sem_atendimento: { codigo: 201, titulo: 'Acesso bloqueado ERP', dias_aberto: 15 },
          mais_recente: { codigo: 305, titulo: 'Monitor piscando', data_de_inicio: new Date().toISOString() },
          top_responsaveis: [
            { nome: 'Maria Souza', concluidos: 120 },
            { nome: 'Carlos Eduardo', concluidos: 98 },
            { nome: 'João Silva', concluidos: 85 },
            { nome: 'Ana Clara', concluidos: 76 },
            { nome: 'Pedro Paulo', concluidos: 62 },
          ]
        });
        setError('Aviso: Utilizando dados de demonstração. Não foi possível conectar à API real.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Carregando indicadores...</p>
      </div>
    );
  }

  const formatMinutos = (mins) => {
    if (!mins) return 'N/A';
    const dias = Math.floor(mins / 1440);
    const horas = Math.floor((mins % 1440) / 60);
    if (dias > 0) return `${dias}d ${horas}h`;
    return `${horas}h ${mins % 60}m`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="dashboard-container">
      <header>
        <h1>Painel de Chamados</h1>
        <p>Monitoramento em Tempo Real</p>
      </header>

      {error && <div className="error-message">{error}</div>}

      <div className="grid-container">
        <div className="card">
          <div className="card-title">Maior Volume</div>
          <div className="card-value">{data?.maior_volume?.motivo || 'N/A'}</div>
          <div className="card-subtitle">
            {data?.maior_volume?.total || 0} solicitações deste tipo
          </div>
        </div>

        <div className="card">
          <div className="card-title">Maior Tempo de Atendimento</div>
          <div className="card-value">{formatMinutos(data?.maior_tempo?.minutos)}</div>
          <div className="card-subtitle">
            Chamado #{data?.maior_tempo?.codigo || 'N/A'}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Mais Antigo Sem Atendimento</div>
          <div className="card-value">{data?.sem_atendimento?.dias_aberto || 0} dias</div>
          <div className="card-subtitle">
            Chamado #{data?.sem_atendimento?.codigo || 'N/A'}
          </div>
        </div>

      </div>

      <div className="dashboard-content">
        <div className="table-container">
          <div className="card-title" style={{ marginBottom: '1.5rem' }}>Top Responsáveis (Resolvidos)</div>
          <table>
          <thead>
            <tr>
              <th>Posição</th>
              <th>Responsável</th>
              <th>Chamados Concluídos</th>
            </tr>
          </thead>
          <tbody>
            {data?.top_responsaveis?.map((resp, index) => (
              <tr key={index}>
                <td>#{index + 1}</td>
                <td style={{ fontWeight: 500 }}>{resp.nome}</td>
                <td>
                  <span style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    color: 'var(--accent-color)',
                    padding: '4px 12px',
                    borderRadius: '99px',
                    fontWeight: 'bold'
                  }}>
                    {resp.concluidos}
                  </span>
                </td>
              </tr>
            ))}
            {(!data?.top_responsaveis || data.top_responsaveis.length === 0) && (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center' }}>Nenhum dado encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="recent-details-card">
        <div className="card-title">Chamado Mais Recente</div>
        <div className="ticket-header">
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            #{data?.mais_recente?.codigo || 'N/A'}
          </span>
          <span style={{ color: 'var(--accent-color)', fontSize: '0.9rem' }}>
            {formatDate(data?.mais_recente?.data_de_inicio)}
          </span>
        </div>
        <div style={{ color: 'var(--text-primary)', fontWeight: '500', marginBottom: '0.5rem' }}>
          {data?.mais_recente?.titulo || 'Nenhum chamado recente'}
        </div>
        {data?.mais_recente?.descricao && (
          <div className="ticket-description">
            {data.mais_recente.descricao}
          </div>
        )}
      </div>
    </div>
  </div>
  );
}

export default App;
