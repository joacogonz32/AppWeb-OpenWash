import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/** Ruta que requiere usuario autenticado (cualquier rol). FR-005 */
export function PrivateRoute() {
  const { currentUser, loading } = useAuth();
  if (loading) return <div className="loading">Cargando...</div>;
  return currentUser ? <Outlet /> : <Navigate to="/login" replace />;
}
