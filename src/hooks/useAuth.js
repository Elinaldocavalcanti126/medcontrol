// src/hooks/useAuth.js
// Hook centralizado de autenticação – gerencia sessão, perfil e permissões.

import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

// ──────────────────────────────────────────────
// Provider: envolve o app e disponibiliza auth
// ──────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);  // dados do auth.users
  const [perfil,  setPerfil]  = useState(null);  // dados da tabela usuarios
  const [loading, setLoading] = useState(true);

  // Busca o perfil na tabela publica após login
  const fetchPerfil = async (userId) => {
    const { data } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', userId)
      .single();
    setPerfil(data);
  };

  useEffect(() => {
    // Sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchPerfil(session.user.id);
      setLoading(false);
    });

    // Listener de mudanças de sessão
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchPerfil(session.user.id);
      else setPerfil(null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // ── Ações ──
  const login = async (email, senha) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    return error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const registrar = async ({ nome, email, senha, perfil: perfilNome }) => {
    // 1. Cria usuário no Auth
    const { data, error } = await supabase.auth.signUp({ email, password: senha });
    if (error) return error;

    // 2. Insere na tabela usuarios
    const { error: err2 } = await supabase.from('usuarios').insert({
      id: data.user.id,
      nome,
      email,
      perfil: perfilNome,
    });
    return err2;
  };

  // ── Helpers de permissão ──
  const isAdmin      = perfil?.perfil === 'administrador';
  const isFarmaceutico = perfil?.perfil === 'farmaceutico';
  const podeEditar   = isAdmin || isFarmaceutico;
  const podeGerenciarUsuarios = isAdmin;

  return (
    <AuthContext.Provider value={{
      user, perfil, loading,
      login, logout, registrar,
      isAdmin, isFarmaceutico, podeEditar, podeGerenciarUsuarios
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook de uso
export function useAuth() {
  return useContext(AuthContext);
}
