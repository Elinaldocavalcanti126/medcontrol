// src/pages/Movimentacoes.js
// Registro e listagem de entradas, saídas e ajustes de estoque.

import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { registrarLog } from '../utils/log';
import Sidebar from '../components/layout/Sidebar';

export default function Movimentacoes() {
  const { user, podeEditar } = useAuth();
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [produtos,      setProdutos]      = useState([]);
  const [form, setForm] = useState({ produto_id: '', tipo: 'entrada', quantidade: 1, observacao: '' });
  const [erro,    setErro]    = useState('');
  const [sucesso, setSucesso] = useState('');
  const [filtro,  setFiltro]  = useState('todos');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => { carregarTudo(); }, []);

  const carregarTudo = async () => {
    setCarregando(true);
    const [{ data: movs }, { data: prods }] = await Promise.all([
      supabase.from('movimentacoes')
        .select('*, produtos(nome, unidade), usuarios(nome)')
        .order('criado_em', { ascending: false })
        .limit(100),
      supabase.from('produtos').select('id, nome, quantidade, unidade').eq('ativo', true).order('nome'),
    ]);
    setMovimentacoes(movs ?? []);
    setProdutos(prods ?? []);
    setCarregando(false);
  };

  const atualizar = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const registrar = async e => {
    e.preventDefault();
    setErro(''); setSucesso('');

    if (!form.produto_id) { setErro('Selecione um produto.'); return; }
    if (Number(form.quantidade) <= 0) { setErro('Quantidade deve ser maior que zero.'); return; }

    // Valida saída: não pode tirar mais do que tem
    if (form.tipo === 'saida') {
      const prod = produtos.find(p => p.id === Number(form.produto_id));
      if (prod && Number(form.quantidade) > prod.quantidade) {
        setErro(`Estoque insuficiente. Disponível: ${prod.quantidade} ${prod.unidade}.`);
        return;
      }
    }

    const { error } = await supabase.from('movimentacoes').insert({
      produto_id:  Number(form.produto_id),
      usuario_id:  user.id,
      tipo:        form.tipo,
      quantidade:  Number(form.quantidade),
      observacao:  form.observacao || null,
    });

    if (error) { setErro(error.message); return; }

    await registrarLog('registrar_movimentacao', 'movimentacoes', null, form);
    setSucesso(`${form.tipo.charAt(0).toUpperCase() + form.tipo.slice(1)} registrada com sucesso!`);
    setForm({ produto_id: '', tipo: 'entrada', quantidade: 1, observacao: '' });
    carregarTudo();
    setTimeout(() => setSucesso(''), 4000);
  };

  // Filtro por tipo
  const filtradas = filtro === 'todos'
    ? movimentacoes
    : movimentacoes.filter(m => m.tipo === filtro);

  const produtoSelecionado = produtos.find(p => p.id === Number(form.produto_id));

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="topbar"><h2>Movimentações de Estoque</h2></div>

        {/* Formulário de registro */}
        {podeEditar && (
          <div className="form-card" style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16, fontSize: '.95rem', fontWeight: 600 }}>Registrar movimentação</h3>
            {erro    && <div className="alert alert-error">{erro}</div>}
            {sucesso && <div className="alert alert-success">{sucesso}</div>}
            <form onSubmit={registrar}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Produto *</label>
                  <select name="produto_id" value={form.produto_id} onChange={atualizar} required>
                    <option value="">– Selecione –</option>
                    {produtos.map(p => (
                      <option key={p.id} value={p.id}>{p.nome} (Estoque: {p.quantidade} {p.unidade})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Tipo *</label>
                  <select name="tipo" value={form.tipo} onChange={atualizar}>
                    <option value="entrada">Entrada</option>
                    <option value="saida">Saída</option>
                    <option value="ajuste">Ajuste (definir quantidade)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>
                    Quantidade {produtoSelecionado && `(${produtoSelecionado.unidade})`}
                    {form.tipo === 'ajuste' && ' – novo total'}
                  </label>
                  <input
                    name="quantidade" type="number"
                    min={form.tipo === 'ajuste' ? 0 : 1}
                    value={form.quantidade} onChange={atualizar} required
                  />
                </div>
                <div className="form-group">
                  <label>Observação</label>
                  <input name="observacao" value={form.observacao} onChange={atualizar} placeholder="Ex: Recebimento NF 12345" />
                </div>
              </div>
              <div className="flex gap-2 mt-4" style={{ justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary">Registrar</button>
              </div>
            </form>
          </div>
        )}

        {/* Histórico */}
        <div className="table-wrapper">
          <div className="table-header">
            <h3>Histórico</h3>
            <div className="flex gap-2">
              {['todos', 'entrada', 'saida', 'ajuste'].map(t => (
                <button
                  key={t}
                  className={`btn btn-sm ${filtro === t ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setFiltro(t)}
                >
                  {t === 'todos' ? 'Todos' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {carregando ? (
            <p style={{ padding: 24, color: 'var(--text-muted)' }}>Carregando…</p>
          ) : (
            <table>
              <thead>
                <tr><th>Data/Hora</th><th>Produto</th><th>Tipo</th><th>Quantidade</th><th>Responsável</th><th>Observação</th></tr>
              </thead>
              <tbody>
                {filtradas.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>Nenhum registro</td></tr>
                ) : filtradas.map(m => (
                  <tr key={m.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '.8rem' }}>
                      {new Date(m.criado_em).toLocaleString('pt-BR')}
                    </td>
                    <td>{m.produtos?.nome ?? '–'}</td>
                    <td><span className={`tag tag-${m.tipo}`}>{m.tipo}</span></td>
                    <td>{m.quantidade} {m.produtos?.unidade ?? ''}</td>
                    <td>{m.usuarios?.nome ?? '–'}</td>
                    <td className="text-muted">{m.observacao ?? '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
