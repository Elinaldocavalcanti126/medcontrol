// src/components/common/RotaProtegida.js
// Redireciona para /login se não há sessão ativa.

import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function RotaProtegida({ children, apenasAdmin = false }) {
  const { user, perfil, loading } = useAuth();

  if (loading) return <div style={{ color: 'var(--text-muted)', padding: 40 }}>Carregando…</div>;
  if (!user)   return <Navigate to="/login" replace />;
  if (apenasAdmin && perfil?.perfil !== 'administrador') return <Navigate to="/dashboard" replace />;

  return children;
}
