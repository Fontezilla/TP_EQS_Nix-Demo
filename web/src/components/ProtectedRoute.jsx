// Só deixa passar utilizadores autenticados com um dos papéis indicados
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ roles = [] }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (roles.length && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}
