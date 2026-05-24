// src/services/dashboardService.js
import { supabase } from '../supabaseClient';

export async function getDashboardData(filters) {
  const { periodo, responsavel, motivo } = filters;
  
  // Como não sabemos se as Chaves Estrangeiras (FKs) estão perfeitamente configuradas no Supabase,
  // é mais seguro puxar as tabelas base e fazer o join relacional no próprio Javascript (para um MVP rápido).
  // PostgREST é case-sensitive e tabelas são tipicamente minúsculas no Supabase
  const [resChamados, resStatus, resMotivos, resResps] = await Promise.all([
    supabase.from('chamados').select('*'),
    supabase.from('status').select('*'),
    supabase.from('motivos').select('*'),
    supabase.from('responsaveis').select('*')
  ]);

  if (resChamados.error) throw new Error('Tabela Chamados: ' + resChamados.error.message);
  if (resStatus.error) throw new Error('Tabela Status: ' + resStatus.error.message);
  if (resMotivos.error) throw new Error('Tabela Motivos: ' + resMotivos.error.message);
  if (resResps.error) throw new Error('Tabela Responsaveis: ' + resResps.error.message);

  let chamados = resChamados.data || [];
  const statusList = resStatus.data || [];
  const motivosList = resMotivos.data || [];
  const respsList = resResps.data || [];

  const statusMap = Object.fromEntries(statusList.map(s => [s.codstatus, s.descricao]));
  const motivosMap = Object.fromEntries(motivosList.map(m => [m.codmotivo, m.descricao]));
  const respsMap = Object.fromEntries(respsList.map(r => [r.codresponsavel, r.nome]));

  // 1. Aplicação de Filtros
  if (responsavel !== 'todos') {
    chamados = chamados.filter(c => c.codresponsavel == responsavel);
  }
  if (motivo !== 'todos') {
    chamados = chamados.filter(c => c.codmotivo == motivo);
  }
  
  if (periodo !== 'geral') {
    const now = new Date();
    chamados = chamados.filter(c => {
      const start = new Date(c.data_de_inicio);
      if (periodo === 'hoje') {
        const today = new Date(now); today.setHours(0,0,0,0);
        return start >= today;
      } else if (periodo === 'semana') {
        const week = new Date(now); week.setDate(week.getDate() - 7);
        return start >= week;
      } else if (periodo === 'mes') {
        const month = new Date(now); month.setMonth(month.getMonth() - 1);
        return start >= month;
      }
      return true;
    });
  }

  // 2. INDICADORES
  let abertos = 0, fechados = 0;
  chamados.forEach(c => {
    if (c.codstatus === 4 || c.codstatus === 5) fechados++; else abertos++;
  });
  const total = abertos + fechados;
  const abertos_percent = total > 0 ? ((abertos / total) * 100).toFixed(1) : 0;

  let totalMinutos = 0, chamadosFechadosComTempo = 0;
  chamados.forEach(c => {
    if (c.data_de_fechamento) {
      const diffMins = (new Date(c.data_de_fechamento) - new Date(c.data_de_inicio)) / (1000 * 60);
      totalMinutos += diffMins;
      chamadosFechadosComTempo++;
    }
  });
  const tempo_medio_minutos = chamadosFechadosComTempo > 0 ? (totalMinutos / chamadosFechadosComTempo) : 0;

  let abertos_hoje = 0;
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  chamados.forEach(c => {
    if (new Date(c.data_de_inicio) >= todayStart) abertos_hoje++;
  });

  let no_prazo = 0;
  chamados.forEach(c => {
    if ((c.codstatus === 4 || c.codstatus === 5) && c.data_de_fechamento) {
      const diffMins = (new Date(c.data_de_fechamento) - new Date(c.data_de_inicio)) / (1000 * 60);
      if (diffMins <= 1440) no_prazo++; // 24 horas = 1440 min
    }
  });
  const taxa_resolucao_prazo = fechados > 0 ? ((no_prazo / fechados) * 100).toFixed(1) : 0;

  const atrasosPorMotivo = {};
  chamados.forEach(c => {
    let atrasado = false;
    if (c.codstatus === 4 || c.codstatus === 5) {
      if (c.data_de_fechamento) {
        const diffMins = (new Date(c.data_de_fechamento) - new Date(c.data_de_inicio)) / (1000 * 60);
        if (diffMins > 1440) atrasado = true;
      }
    } else {
      const dias = (new Date() - new Date(c.data_de_inicio)) / (1000 * 60 * 60 * 24);
      if (dias >= 1) atrasado = true;
    }
    
    if (atrasado) {
      const nomeMotivo = motivosMap[c.codmotivo] || 'Outros';
      atrasosPorMotivo[nomeMotivo] = (atrasosPorMotivo[nomeMotivo] || 0) + 1;
    }
  });

  let pior_motivo = { motivo: 'Nenhum', quantidade: 0 };
  for (const [motivo, count] of Object.entries(atrasosPorMotivo)) {
    if (count > pior_motivo.quantidade) {
      pior_motivo = { motivo, quantidade: count };
    }
  }

  const responsaveisCount = {};
  chamados.forEach(c => {
    if (c.codstatus === 4 || c.codstatus === 5) {
      const nome = respsMap[c.codresponsavel] || 'Não Atribuído';
      responsaveisCount[nome] = (responsaveisCount[nome] || 0) + 1;
    }
  });

  const top_responsaveis = Object.entries(responsaveisCount)
    .filter(([nome]) => nome !== 'Não Atribuído')
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 3);

  // 3. GRÁFICOS
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const mapSemana = [0,0,0,0,0,0,0];
  chamados.forEach(c => {
    mapSemana[new Date(c.data_de_inicio).getDay()]++;
  });
  const por_dia_semana = mapSemana.map((total, idx) => ({ name: diasSemana[idx], total }));

  const mapMotivos = {};
  chamados.forEach(c => {
    const nomeMotivo = motivosMap[c.codmotivo] || 'Outros';
    mapMotivos[nomeMotivo] = (mapMotivos[nomeMotivo] || 0) + 1;
  });
  const por_motivo = Object.entries(mapMotivos).map(([name, value]) => ({ name, value }));

  const mapMeses = {};
  chamados.forEach(c => {
    const d = new Date(c.data_de_inicio);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!mapMeses[m]) mapMeses[m] = { name: m, abertos: 0, fechados: 0 };
    if (c.codstatus === 4 || c.codstatus === 5) mapMeses[m].fechados++; else mapMeses[m].abertos++;
  });
  const evolucao_mensal = Object.values(mapMeses).sort((a,b) => a.name.localeCompare(b.name)).slice(-6);

  // 4. LISTA PAGINADA
  let listaAbertos = chamados.filter(c => c.codstatus !== 4 && c.codstatus !== 5);
  listaAbertos.sort((a, b) => new Date(b.data_de_inicio) - new Date(a.data_de_inicio)); // mais recentes primeiro
  
  const now = new Date();
  listaAbertos = listaAbertos.map(c => ({
    ...c,
    status: statusMap[c.codstatus],
    motivo: motivosMap[c.codmotivo],
    responsavel: respsMap[c.codresponsavel],
    dias_aberto: Math.floor((now - new Date(c.data_de_inicio)) / (1000 * 60 * 60 * 24))
  }));

  return {
    indicadores: { total_status: { abertos, fechados, total, abertos_percent }, tempo_medio_minutos, abertos_hoje, taxa_resolucao_prazo, pior_motivo, top_responsaveis },
    graficos: { por_dia_semana, por_motivo, evolucao_mensal },
    lista: listaAbertos
  };
}
