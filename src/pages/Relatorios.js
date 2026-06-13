// src/pages/Relatorios.js
// Geração e exportação de relatórios de estoque e movimentações.

import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { exportarCSV, exportarExcel } from '../utils/exportar';
import { registrarLog } from '../utils/log';
import Sidebar from '../components/layout/Sidebar';

const RELATORIOS = [
  { id: 'estoque_atual',   label: 'Estoque Atual',           desc: 'Todos os produtos e quantidades' },
  { id: 'criticos',        label: 'Estoque Crítico',         desc: 'Produtos abaixo do mínimo' },
  { id: 'vencendo',        label: 'Próximos ao Vencimento',  desc: 'Validade nos próximos 30 dias' },
  { id: 'movimentacoes',   label: 'Movimentações',           desc: 'Histórico por período' },
];

export default function Relatorios() {
  const [selecionado,  setSelecionado]  = useState('estoque_atual');
  const [dados,        setDados]        = useState([]);
  const [carregando,   setCarregando]   = useState(false);
  const [gerado,       setGerado]       = useState(false);
  const [dataInicio,   setDataInicio]   = useState('');
  const [dataFim,      setDataFim]      = useState('');

  const gerar = async () => {
    setCarregando(true); setGerado(false);
    let resultado = [];

    if (selecionado === 'estoque_atual') {
      const { data } = await supabase
        .from('produtos').select('nome, codigo_catmat, lote, validade, quantidade, unidade, fabricante, categorias(nome)')
        .eq('ativo', true).order('nome');
      resultado = (data ?? []).map(p => ({
        Nome:          p.nome,
        'CATMAT':      p.codigo_catmat ?? '',
        Lote:          p.lote,
        Validade:      new Date(p.validade).toLocaleDateString('pt-BR'),
        Quantidade:    p.quantidade,
        Unidade:       p.unidade,
        Fabricante:    p.fabricante ?? '',
        Categoria:     p.categorias?.nome ?? '',
      }));

    } else if (selecionado === 'criticos') {
      const { data } = await supabase
        .from('produtos').select('nome, codigo_catmat, lote, quantidade, quantidade_minima, unidade')
        .eq('ativo', true).order('quantidade');
      resultado = (data ?? [])
        .filter(p => p.quantidade <= p.quantidade_minima)
        .map(p => ({
          Nome:           p.nome,
          'CATMAT':       p.codigo_catmat ?? '',
          Lote:           p.lote,
          'Qtd Atual':    p.quantidade,
          'Qtd Mínima':   p.quantidade_minima,
          Unidade:        p.unidade,
        }));

    } else if (selecionado === 'vencendo') {
      const em30 = new Date(Date.now() + 30 * 864e5).toISOString().split('T')[0];
      const { data } = await supabase
        .from('produtos').select('nome, codigo_catmat, lote, validade, quantidade, unidade')
        .eq('ativo', true).lte('validade', em30).order('validade');
      resultado = (data ?? []).map(p => ({
        Nome:       p.nome,
        'CATMAT':   p.codigo_catmat ?? '',
        Lote:       p.lote,
        Validade:   new Date(p.validade).toLocaleDateString('pt-BR'),
        Quantidade: p.quantidade,
        Unidade:    p.unidade,
      }));

    } else if (selecionado === 'movimentacoes') {
      let query = supabase
        .from('movimentacoes')
        .select('criado_em, tipo, quantidade, observacao, produtos(nome, unidade), usuarios(nome)')
        .order('criado_em', { ascending: false });
      if (dataInicio) query = query.gte('criado_em', dataInicio);
      if (dataFim)    query = query.lte('criado_em', dataFim + 'T23:59:59');
      const { data } = await query;
      resultado = (data ?? []).map(m => ({
        'Data/Hora':   new Date(m.criado_em).toLocaleString('pt-BR'),
        Produto:       m.produtos?.nome ?? '',
        Tipo:          m.tipo,
        Quantidade:    m.quantidade,
        Unidade:       m.produtos?.unidade ?? '',
        Responsável:   m.usuarios?.nome ?? '',
        Observação:    m.observacao ?? '',
      }));
    }

    setDados(resultado);
    setGerado(true);
    setCarregando(false);
    await registrarLog('gerar_relatorio', selecionado);
  };

  const exportar = async (formato) => {
    const rel = RELATORIOS.find(r => r.id === selecionado);
    const nome = `medcontrol_${selecionado}_${new Date().toISOString().split('T')[0]}`;
    if (formato === 'csv')   exportarCSV(dados, nome);
    if (formato === 'excel') exportarExcel(dados, nome, rel?.label);
    await registrarLog('exportar_relatorio', selecionado, null, { formato, registros: dados.length });
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="topbar"><h2>Relatórios</h2></div>

        {/* Seleção */}
        <div className="form-card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 14, fontSize: '.9rem', fontWeight: 600 }}>Selecione o relatório</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 16 }}>
            {RELATORIOS.map(r => (
              <div
                key={r.id}
                onClick={() => { setSelecionado(r.id); setGerado(false); }}
                style={{
                  border: `1px solid ${selecionado === r.id ? 'var(--accent)' : 'var(--border)'}`,
                  background: selecionado === r.id ? 'var(--accent-light)' : 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px',
                  cursor: 'pointer',
                  transition: 'all .15s',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '.875rem', color: selecionado === r.id ? 'var(--accent)' : 'var(--text-primary)' }}>{r.label}</div>
                <div className="text-muted" style={{ marginTop: 4 }}>{r.desc}</div>
              </div>
            ))}
          </div>

          {/* Filtro de datas (apenas movimentações) */}
          {selecionado === 'movimentacoes' && (
            <div className="form-grid" style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label>Data início</label>
                <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Data fim</label>
                <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
              </div>
            </div>
          )}

          <button className="btn btn-primary" onClick={gerar} disabled={carregando}>
            {carregando ? 'Gerando…' : '▶ Gerar relatório'}
          </button>
        </div>

        {/* Resultado */}
        {gerado && (
          <div className="table-wrapper">
            <div className="table-header">
              <h3>{RELATORIOS.find(r => r.id === selecionado)?.label} — {dados.length} registro(s)</h3>
              <div className="flex gap-2">
                <button className="btn btn-secondary btn-sm" onClick={() => exportar('csv')}>⬇ CSV</button>
                <button className="btn btn-secondary btn-sm" onClick={() => exportar('excel')}>⬇ Excel</button>
              </div>
            </div>

            {dados.length === 0 ? (
              <p style={{ padding: 24, color: 'var(--text-muted)' }}>Nenhum dado para os filtros selecionados.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>{Object.keys(dados[0]).map(k => <th key={k}>{k}</th>)}</tr>
                  </thead>
                  <tbody>
                    {dados.slice(0, 50).map((row, i) => (
                      <tr key={i}>
                        {Object.values(row).map((v, j) => <td key={j}>{String(v)}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {dados.length > 50 && (
                  <p style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '.8rem' }}>
                    Exibindo 50 de {dados.length} registros. Exporte para ver todos.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
