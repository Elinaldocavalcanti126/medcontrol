// src/pages/Usuarios.js
// Administração de usuários – apenas administradores têm acesso (via RotaProtegida).

import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { registrarLog } from '../utils/log';
import Sidebar from '../components/layout/Sidebar';

const PERFIS = ['administrador', 'farmaceutico', 'estoque'];

export default function Usuarios() {
  const { registrar } = useAuth();
  const [usuarios,   setUsuarios]   = useState([]);
  const [modal,      setModal]      = useState(false);
  const [form,       setForm]       = useState({ nome: '', email: '', senha: '', perfil: 'estoque' });
  const [erro,       setErro]       = useState('');
  const [sucesso,    setSucesso]    = useState('');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => { carregar(); }, []);

  const carregar = async () => {
    setCarregando(true);
    const { data } = await supabase.from('usuarios').select('*').order('nome');
    setUsuarios(data ?? []);
    setCarregando(false);
  };

  const atualizar = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const criarUsuario = async e => {
    e.preventDefault();
    setErro('');
    const error = await registrar(form);
    if (error) { setErro(error.message); return; }
    setSucesso(`Usuário "${form.nome}" criado com sucesso!`);
    await registrarLog('criar_usuario', 'usuarios', null, { nome: form.nome, email: form.email, perfil: form.perfil });
    setForm({ nome: '', email: '', senha: '', perfil: 'estoque' });
    setModal(false);
    carregar();
    setTimeout(() => setSucesso(''), 4000);
  };

  const alterarPerfil = async (id, novoPerfil) => {
    await supabase.from('usuarios').update({ perfil: novoPerfil }).eq('id', id);
    await registrarLog('alterar_perfil_usuario', 'usuarios', id, { perfil: novoPerfil });
    carregar();
  };

  const alterarAtivo = async (id, ativo) => {
    await supabase.from('usuarios').update({ ativo }).eq('id', id);
    await registrarLog(ativo ? 'ativar_usuario' : 'desativar_usuario', 'usuarios', id);
    carregar();
  };
  // eslint-disable-next-line no-unused-vars
  const badgeClass = (p) => ({
    administrador: 'badge badge-admin',
    farmaceutico:  'badge badge-farmaceutico',
    estoque:       'badge badge-estoque',
  }[p] ?? 'badge');

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="topbar">
          <h2>Administração de Usuários</h2>
          <button className="btn btn-primary" onClick={() => { setErro(''); setModal(true); }}>+ Novo usuário</button>
        </div>

        {sucesso && <div className="alert alert-success">{sucesso}</div>}

        {/* Tabela */}
        <div className="table-wrapper">
          <div className="table-header">
            <h3>Usuários cadastrados</h3>
            <span className="text-muted">{usuarios.length} usuário(s)</span>
          </div>
          {carregando ? (
            <p style={{ padding: 24, color: 'var(--text-muted)' }}>Carregando…</p>
          ) : (
            <table>
              <thead>
                <tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Status</th><th>Cadastro</th><th>Ações</th></tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id}>
                    <td><strong>{u.nome}</strong></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '.8rem' }}>{u.email}</td>
                    <td>
                      <select
                        value={u.perfil}
                        onChange={e => alterarPerfil(u.id, e.target.value)}
                        style={{ width: 'auto', padding: '4px 8px', fontSize: '.8rem' }}
                      >
                        {PERFIS.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </td>
                    <td>
                      <span className={`badge ${u.ativo ? 'badge-farmaceutico' : ''}`}
                        style={!u.ativo ? { background: '#f0525222', color: '#f05252' } : {}}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="text-muted" style={{ fontSize: '.8rem' }}>
                      {new Date(u.criado_em).toLocaleDateString('pt-BR')}
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${u.ativo ? 'btn-danger' : 'btn-secondary'}`}
                        onClick={() => alterarAtivo(u.id, !u.ativo)}
                      >
                        {u.ativo ? 'Desativar' : 'Ativar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal novo usuário */}
        {modal && (
          <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
            <div className="modal">
              <div className="modal-header">
                <h3>Novo usuário</h3>
                <button className="btn btn-secondary btn-sm" onClick={() => setModal(false)}>✕</button>
              </div>
              {erro && <div className="alert alert-error">{erro}</div>}
              <form onSubmit={criarUsuario}>
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label>Nome completo *</label>
                  <input name="nome" value={form.nome} onChange={atualizar} required placeholder="Ex: João Silva" />
                </div>
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label>E-mail *</label>
                  <input name="email" type="email" value={form.email} onChange={atualizar} required />
                </div>
                <div className="form-group" style={{ marginBottom: 14 }}>
                  <label>Senha *</label>
                  <input name="senha" type="password" value={form.senha} onChange={atualizar} required minLength={6} placeholder="Mínimo 6 caracteres" />
                </div>
                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label>Perfil *</label>
                  <select name="perfil" value={form.perfil} onChange={atualizar}>
                    {PERFIS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
                <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">Criar usuário</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
