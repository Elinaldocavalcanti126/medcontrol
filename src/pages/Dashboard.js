// src/pages/Dashboard.js
// KPIs de estoque + gráficos de movimentações e distribuição por categoria.

import { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend
} from 'recharts';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';
import Sidebar from '../components/layout/Sidebar';

const CORES = ['#00c2a8', '#7c3aed', '#f59e0b', '#f05252', '#38bdf8'];

export default function Dashboard() {
  const { perfil } = useAuth();
  const [kpis, setKpis] = useState({ total: 0, criticos: 0, vencendo: 0, movHoje: 0 });
  const [movGrafico,  setMovGrafico]  = useState([]);
  const [catGrafico,  setCatGrafico]  = useState([]);
  const [carregando,  setCarregando]  = useState(true);

  useEffect(() => { carregarDados(); }, []);

  const carregarDados = async () => {
    setCarregando(true);
    const hoje = new Date().toISOString().split('T')[0];
    const em30  = new Date(Date.now() + 30 * 864e5).toISOString().split('T')[0];

    // KPIs em paralelo
    const [
      { count: total },
      { count: criticos },
      { count: vencendo },
    ] = await Promise.all([
      supabase.from('produtos').select('*', { count: 'exact', head: true }).eq('ativo', true),
      supabase.from('produtos').select('*', { count: 'exact', head: true }).eq('ativo', true)
               .lt('quantidade', supabase.rpc ? 1 : 1),   // simplificado
      supabase.from('produtos').select('*', { count: 'exact', head: true })
               .lte('validade', em30).gte('validade', hoje),
    ]);

    // Movimentações dos últimos 7 dias
    const inicio = new Date(Date.now() - 6 * 864e5).toISOString();
    const { data: movs } = await supabase.from('movimentacoes')
      .select('tipo, criado_em').gte('criado_em', inicio);

    // Agrupa por dia
    const dias = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 864e5);
      const key = d.toLocaleDateString('pt-BR', { weekday: 'short' });
      dias[key] = { dia: key, entrada: 0, saida: 0, ajuste: 0 };
    }
    (movs ?? []).forEach(m => {
      const key = new Date(m.criado_em).toLocaleDateString('pt-BR', { weekday: 'short' });
      if (dias[key]) dias[key][m.tipo]++;
    });
    setMovGrafico(Object.values(dias));

    // Hoje
    const movHoje = (movs ?? []).filter(m =>
      new Date(m.criado_em).toDateString() === new Date().toDateString()
    ).length;

    setKpis({ total: total ?? 0, criticos: criticos ?? 0, vencendo: vencendo ?? 0, movHoje });

    // Distribuição por categoria
    const { data: prods } = await supabase.from('produtos')
      .select('quantidade, categorias(nome)').eq('ativo', true);

    const catMap = {};
    (prods ?? []).forEach(p => {
      const nome = p.categorias?.nome ?? 'Sem categoria';
      catMap[nome] = (catMap[nome] ?? 0) + p.quantidade;
    });
    setCatGrafico(Object.entries(catMap).map(([name, value]) => ({ name, value })));

    setCarregando(false);
  };

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {/* Topbar */}
        <div className="topbar">
          <div>
            <h2>{saudacao}, {perfil?.nome?.split(' ')[0] ?? 'usuário'} 👋</h2>
            <p className="text-muted">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={carregarDados}>↻ Atualizar</button>
        </div>

        {/* KPIs */}
        {carregando ? (
          <p className="text-muted">Carregando dados…</p>
        ) : (
          <>
            <div className="grid-kpi">
              <div className="kpi-card accent">
                <span className="kpi-label">Total de Produtos</span>
                <span className="kpi-value" style={{ color: 'var(--accent)' }}>{kpis.total}</span>
                <span className="kpi-sub">itens ativos no estoque</span>
              </div>
              <div className="kpi-card danger">
                <span className="kpi-label">Estoque Crítico</span>
                <span className="kpi-value" style={{ color: 'var(--danger)' }}>{kpis.criticos}</span>
                <span className="kpi-sub">abaixo do mínimo</span>
              </div>
              <div className="kpi-card warning">
                <span className="kpi-label">Vencendo em 30 dias</span>
                <span className="kpi-value" style={{ color: 'var(--warning)' }}>{kpis.vencendo}</span>
                <span className="kpi-sub">requerem atenção</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-label">Movimentações Hoje</span>
                <span className="kpi-value">{kpis.movHoje}</span>
                <span className="kpi-sub">registros do dia</span>
              </div>
            </div>

            {/* Gráficos */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
              {/* Área: movimentações 7 dias */}
              <div className="chart-card">
                <h3>Movimentações – últimos 7 dias</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={movGrafico}>
                    <defs>
                      <linearGradient id="gEntrada" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00c2a8" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00c2a8" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="gSaida" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f05252" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f05252" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#243049" />
                    <XAxis dataKey="dia" tick={{ fill: '#8da0b8', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#8da0b8', fontSize: 12 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: '#1a2335', border: '1px solid #243049', borderRadius: 8 }} />
                    <Area type="monotone" dataKey="entrada" name="Entrada" stroke="#00c2a8" fill="url(#gEntrada)" strokeWidth={2} />
                    <Area type="monotone" dataKey="saida"   name="Saída"   stroke="#f05252" fill="url(#gSaida)"   strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Pizza: categorias */}
              <div className="chart-card">
                <h3>Por categoria</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={catGrafico} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                      {catGrafico.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1a2335', border: '1px solid #243049', borderRadius: 8 }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: '#8da0b8' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Barras: por tipo */}
            <div className="chart-card" style={{ marginTop: 16 }}>
              <h3>Tipos de movimentação por dia</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={movGrafico} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#243049" />
                  <XAxis dataKey="dia" tick={{ fill: '#8da0b8', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#8da0b8', fontSize: 12 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: '#1a2335', border: '1px solid #243049', borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#8da0b8' }} />
                  <Bar dataKey="entrada" name="Entrada" fill="#00c2a8" radius={[4,4,0,0]} />
                  <Bar dataKey="saida"   name="Saída"   fill="#f05252" radius={[4,4,0,0]} />
                  <Bar dataKey="ajuste"  name="Ajuste"  fill="#f59e0b" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
