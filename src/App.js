// src/App.js
// Ponto de entrada: configura rotas, contexto de autenticação e CSS global.

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import RotaProtegida from './components/common/RotaProtegida';

// Páginas
import Login         from './pages/Login';
import Dashboard     from './pages/Dashboard';
import Produtos      from './pages/Produtos';
import Movimentacoes from './pages/Movimentacoes';
import Relatorios    from './pages/Relatorios';
import Usuarios      from './pages/Usuarios';

// Estilos globais
import './styles/global.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import '@fontsource/dm-sans/700.css';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rota pública */}
          <Route path="/login" element={<Login />} />

          {/* Rotas protegidas – qualquer usuário autenticado */}
          <Route path="/dashboard"     element={<RotaProtegida><Dashboard /></RotaProtegida>} />
          <Route path="/produtos"      element={<RotaProtegida><Produtos /></RotaProtegida>} />
          <Route path="/movimentacoes" element={<RotaProtegida><Movimentacoes /></RotaProtegida>} />
          <Route path="/relatorios"    element={<RotaProtegida><Relatorios /></RotaProtegida>} />

          {/* Rota exclusiva para administradores */}
          <Route path="/usuarios" element={<RotaProtegida apenasAdmin><Usuarios /></RotaProtegida>} />

          {/* Redirecionamento padrão */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
