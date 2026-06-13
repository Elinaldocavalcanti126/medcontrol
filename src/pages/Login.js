// src/pages/Login.js
// Página de autenticação com login e alternância para cadastro.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { login, registrar } = useAuth();
  const navigate = useNavigate();

  const [modo,   setModo]   = useState('login'); // 'login' | 'registro'
  const [form,   setForm]   = useState({ nome: '', email: '', senha: '', perfil: 'estoque' });
  const [erro,   setErro]   = useState('');
  const [carregando, setCarregando] = useState(false);

  const atualizar = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submeter = async e => {
    e.preventDefault();
    setErro(''); setCarregando(true);

    let error;
    if (modo === 'login') {
      error = await login(form.email, form.senha);
    } else {
      error = await registrar(form);
    }

    setCarregando(false);
    if (error) { setErro(error.message); return; }
    navigate('/dashboard');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <h1>⚕ MedControl</h1>
          <p>Sistema de Gestão Farmacêutica Hospitalar</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2" style={{ marginBottom: 24 }}>
          {['login', 'registro'].map(m => (
            <button
              key={m}
              className={`btn ${modo === m ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => { setModo(m); setErro(''); }}
            >
              {m === 'login' ? 'Entrar' : 'Cadastrar'}
            </button>
          ))}
        </div>

        {/* Erro */}
        {erro && <div className="alert alert-error">{erro}</div>}

        {/* Formulário */}
        <form onSubmit={submeter}>
          {modo === 'registro' && (
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label>Nome completo</label>
              <input name="nome" value={form.nome} onChange={atualizar} required placeholder="Ex: Maria Santos" />
            </div>
          )}

          <div className="form-group" style={{ marginBottom: 14 }}>
            <label>E-mail</label>
            <input name="email" type="email" value={form.email} onChange={atualizar} required placeholder="usuario@hospital.gov.br" />
          </div>

          <div className="form-group" style={{ marginBottom: 14 }}>
            <label>Senha</label>
            <input name="senha" type="password" value={form.senha} onChange={atualizar} required placeholder="Mínimo 6 caracteres" minLength={6} />
          </div>

          {modo === 'registro' && (
            <div className="form-group" style={{ marginBottom: 14 }}>
              <label>Perfil</label>
              <select name="perfil" value={form.perfil} onChange={atualizar}>
                <option value="estoque">Estoque</option>
                <option value="farmaceutico">Farmacêutico</option>
                <option value="administrador">Administrador</option>
              </select>
            </div>
          )}

          <button className="btn btn-primary" type="submit" disabled={carregando}
            style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '12px' }}>
            {carregando ? 'Aguarde…' : modo === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>
      </div>
    </div>
  );
}
