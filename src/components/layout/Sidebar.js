// src/components/layout/Sidebar.js

import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

// Ícones SVG inline leves (sem dependência extra)
const Icon = {
  dashboard:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  produtos:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>,
  movimentacoes:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>,
  relatorios:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  usuarios:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  logout:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

const navItems = [
  { to: '/dashboard',      label: 'Dashboard',      icon: Icon.dashboard },
  { to: '/produtos',       label: 'Produtos',        icon: Icon.produtos },
  { to: '/movimentacoes',  label: 'Movimentações',   icon: Icon.movimentacoes },
  { to: '/relatorios',     label: 'Relatórios',      icon: Icon.relatorios },
  { to: '/usuarios',       label: 'Usuários',        icon: Icon.usuarios, adminOnly: true },
];

export default function Sidebar() {
  const { perfil, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const iniciais = (perfil?.nome ?? 'U').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  const badgeClass = {
    administrador: 'badge badge-admin',
    farmaceutico:  'badge badge-farmaceutico',
    estoque:       'badge badge-estoque',
  }[perfil?.perfil] ?? 'badge';

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <h1>⚕ MedControl</h1>
        <span>Gestão Farmacêutica</span>
      </div>

      {/* Navegação */}
      <nav className="sidebar-nav">
        {navItems
          .filter(item => !item.adminOnly || isAdmin)
          .map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))
        }
      </nav>

      {/* Rodapé com usuário */}
      <div className="sidebar-footer">
        <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
          <div className="avatar">{iniciais}</div>
          <div>
            <div style={{ fontSize: '.8rem', fontWeight: 600 }}>{perfil?.nome ?? '–'}</div>
            <span className={badgeClass}>{perfil?.perfil ?? ''}</span>
          </div>
        </div>
        <button className="nav-item" style={{ color: 'var(--danger)' }} onClick={handleLogout}>
          {Icon.logout} Sair
        </button>
      </div>
    </aside>
  );
}
