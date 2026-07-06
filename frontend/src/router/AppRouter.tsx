import { Routes, Route, Navigate } from "react-router-dom";
import { PrivateRoute } from "./PrivateRoute";
import { AdminRoute } from "./AdminRoute";
import { LoginPage } from "../features/auth/components/LoginPage";
import { RegisterPage } from "../features/auth/components/RegisterPage";
import { ReservarPage } from "../features/turnos/components/ReservarPage";
import { MisTurnosPage } from "../features/turnos/components/MisTurnosPage";
import { PerfilPage } from "../features/perfil/components/PerfilPage";
import { AdminUsuariosPage } from "../features/admin/components/AdminUsuariosPage";
import { AdminTurnosPage } from "../features/admin/components/AdminTurnosPage";
import { NavBar } from "../shared/components/NavBar";
import { useAuth } from "../contexts/AuthContext";

export function AppRouter() {
  const { currentUser } = useAuth();

  return (
    <>
      {currentUser && <NavBar />}
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />

        {/* Rutas privadas (cualquier usuario autenticado) */}
        <Route element={<PrivateRoute />}>
          <Route path="/reservar" element={<ReservarPage />} />
          <Route path="/mis-turnos" element={<MisTurnosPage />} />
          <Route path="/perfil" element={<PerfilPage />} />
        </Route>

        {/* Rutas de administración */}
        <Route element={<AdminRoute />}>
          <Route path="/admin/usuarios" element={<AdminUsuariosPage />} />
          <Route path="/admin/turnos" element={<AdminTurnosPage />} />
        </Route>

        {/* Redirección por defecto */}
        <Route path="/" element={<Navigate to="/mis-turnos" replace />} />
        <Route path="*" element={<Navigate to="/mis-turnos" replace />} />
      </Routes>
    </>
  );
}
