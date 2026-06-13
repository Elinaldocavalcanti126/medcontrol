// src/pages/Produtos.js
// CRUD completo de medicamentos com busca, filtros e modal de formulário.

import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { registrarLog } from '../utils/log';
import Sidebar from '../components/layout/Sidebar';

const VAZIO = { nome: '', codigo_catmat: '', lote: '', validade: '', quantidade: 0, quantidade_minima: 10, categoria_id: '', unidade: 'UN', fabricante: '' };

export default function Produtos() {
  const { podeEditar } = useAuth();
  const [produtos,    setProdutos]    = useState([]);
  const [categorias,  setCategorias]  = useState([]);
  const [busca,       setBusca]       = useState('');
  const [modal,       setModal]       = useState(false);
  const [editando,    setEditando]    = useState(null);  // null = novo
  const [form,        setForm]        = useState(VAZIO);
  const [erro,        setErro]        = useState('');
  const [carregando,  setCarregando]  = useState(true);

  useEffect(() => { carregarTudo(); }, []);

  // ── Carregamento ──────────────────────────────
  const carregarTudo = async () => {
    setCarregando(true);
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from('produtos').select('*, categorias(nome)').eq('ativo', true).order('nome'),
      supabase.from('categorias').select('*').order('nome'),
    ]);
    setProdutos(prods ?? []);
    setCategorias(cats ?? []);
    setCarregando(false);
  };

  // ── Filtro local ──────────────────────────────
  const produtosFiltrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    p.codigo_catmat?.toLowerCase().includes(busca.toLowerCase()) ||
    p.lote.toLowerCase().includes(busca.toLowerCase())
  );

  // ── Formulário ────────────────────────────────
  const abrirNovo = () => { setForm(VAZIO); setEditando(null); setErro(''); setModal(true); };
  const abrirEditar = (p) => {
    setForm({ ...p, categoria_id: p.categoria_id ?? '' });
    setEditando(p.id);
    setErro('');
    setModal(true);
  };
  const fecharModal = () => { setModal(false); setErro(''); };
  const atualizar = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const salvar = async e => {
    e.preventDefault();
    setErro('');
    const payload = {
      nome:            form.nome,
      codigo_catmat:   form.codigo_catmat || null,
      lote:            form.lote,
      validade:        form.validade,
      quantidade:      Number(form.quantidade),
      quantidade_minima: Number(form.quantidade_minima),
      categoria_id:    form.categoria_id ? Number(form.categoria_id) : null,
      unidade:         form.unidade,
      fabricante:      form.fabricante || null,
    };

    let error;
    if (editando) {
      ({ error } = await supabase.from('produtos').update(payload).eq('id', editando));
      if (!error) await registrarLog('editar_produto', 'produtos', editando, payload);
    } else {
      ({ error } = await supabase.from('produtos').insert(payload));
      if (!error) await registrarLog('criar_produto', 'produtos', null, payload);
    }

    if (error) { setErro(error.message); return; }
    fecharModal();
    carregarTudo();
  };

  // ── Exclusão lógica ───────────────────────────
  const excluir = async (id, nome) => {
    if (!window.confirm(`Desativar "${nome}"?`)) return;
    await supabase.from('produtos').update({ ativo: false }).eq('id', id);
    await registrarLog('excluir_produto', 'produtos', id, { nome });
    carregarTudo();
  };

  // ── Status de validade ────────────────────────
  const statusValidade = (val) => {
    const dias = Math.ceil((new Date(val) - new Date()) / 864e5);
    if (dias < 0)   return { label: 'Vencido',   cls: 'text-danger' };
    if (dias <= 30) return { label: `${dias}d`,  cls: 'text-warning' };
    return { label: new Date(val).toLocaleDateString('pt-BR'), cls: '' };
  };

  const statusEstoque = (qtd, min) => {
    if (qtd <= 0)   return { label: 'Sem estoque', cls: 'text-danger' };
    if (qtd <= min) return { label: 'Crítico',     cls: 'text-warning' };
    return { label: 'OK',  cls: 'text-success' };
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {/* Topbar */}
        <div className="topbar">
          <h2>Produtos</h2>
          {podeEditar && (
            <button className="btn btn-primary" onClick={abrirNovo}>+ Novo produto</button>
          )}
        </div>

        {/* Busca */}
        <div style={{ marginBottom: 16 }}>
          <input
            placeholder="Buscar por nome, CATMAT ou lote…"
            value={busca} onChange={e => setBusca(e.target.value)}
            style={{ maxWidth: 400 }}
          />
        </div>

        {/* Tabela */}
        <div className="table-wrapper">
          <div className="table-header">
            <h3>Estoque de medicamentos</h3>
            <span className="text-muted">{produtosFiltrados.length} produto(s)</span>
          </div>
          {carregando ? (
            <p style={{ padding: 24, color: 'var(--text-muted)' }}>Carregando…</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Nome</th><th>CATMAT</th><th>Lote</th>
                  <th>Validade</th><th>Qtd</th><th>Estoque</th>
                  <th>Categoria</th>
                  {podeEditar && <th>Ações</th>}
                </tr>
              </thead>
              <tbody>
                {produtosFiltrados.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 32 }}>Nenhum produto encontrado</td></tr>
                ) : produtosFiltrados.map(p => {
                  const val = statusValidade(p.validade);
                  const est = statusEstoque(p.quantidade, p.quantidade_minima);
                  return (
                    <tr key={p.id}>
                      <td><strong>{p.nome}</strong></td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '.8rem' }}>{p.codigo_catmat ?? '–'}</td>
                      <td>{p.lote}</td>
                      <td className={val.cls}>{val.label}</td>
                      <td>{p.quantidade} {p.unidade}</td>
                      <td className={est.cls}>{est.label}</td>
                      <td>{p.categorias?.nome ?? '–'}</td>
                      {podeEditar && (
                        <td>
                          <div className="flex gap-2">
                            <button className="btn btn-secondary btn-sm" onClick={() => abrirEditar(p)}>Editar</button>
                            <button className="btn btn-danger btn-sm" onClick={() => excluir(p.id, p.nome)}>Remover</button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal ─────────────────────────────────── */}
        {modal && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && fecharModal()}>
            <div className="modal">
              <div className="modal-header">
                <h3>{editando ? 'Editar produto' : 'Novo produto'}</h3>
                <button className="btn btn-secondary btn-sm" onClick={fecharModal}>✕</button>
              </div>
              {erro && <div className="alert alert-error">{erro}</div>}
              <form onSubmit={salvar}>
                <div className="form-grid">
                  <div className="form-group full">
                    <label>Nome do medicamento *</label>
                    <input name="nome" value={form.nome} onChange={atualizar} required placeholder="Ex: Dipirona Sódica 500mg" />
                  </div>
                  <div className="form-group">
                    <label>Código CATMAT</label>
                    <input name="codigo_catmat" value={form.codigo_catmat} onChange={atualizar} placeholder="Ex: 376786" />
                  </div>
                  <div className="form-group">
                    <label>Lote *</label>
                    <input name="lote" value={form.lote} onChange={atualizar} required placeholder="Ex: LOT2024001" />
                  </div>
                  <div className="form-group">
                    <label>Validade *</label>
                    <input name="validade" type="date" value={form.validade} onChange={atualizar} required />
                  </div>
                  <div className="form-group">
                    <label>Quantidade inicial</label>
                    <input name="quantidade" type="number" min="0" value={form.quantidade} onChange={atualizar} />
                  </div>
                  <div className="form-group">
                    <label>Qtd. mínima (alerta)</label>
                    <input name="quantidade_minima" type="number" min="0" value={form.quantidade_minima} onChange={atualizar} />
                  </div>
                  <div className="form-group">
                    <label>Unidade</label>
                    <select name="unidade" value={form.unidade} onChange={atualizar}>
                      {['UN', 'CX', 'FR', 'AMP', 'COM', 'BIS'].map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Categoria</label>
                    <select name="categoria_id" value={form.categoria_id} onChange={atualizar}>
                      <option value="">– Selecione –</option>
                      {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  </div>
                  <div className="form-group full">
                    <label>Fabricante</label>
                    <input name="fabricante" value={form.fabricante} onChange={atualizar} placeholder="Ex: EMS S.A." />
                  </div>
                </div>
                <div className="flex gap-2 mt-6" style={{ justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={fecharModal}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">Salvar</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
