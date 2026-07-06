import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./NavBar.css";

export function NavBar() {
  const { isAdmin, logout, userProfile } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/mis-turnos">🚗 OpenWash</Link>
      </div>
      <div className="navbar-links">
        <Link to="/reservar">Reservar</Link>
        <Link to="/mis-turnos">Mis Turnos</Link>
        <Link to="/perfil">Perfil</Link>
        {isAdmin && (
          <>
            <Link to="/admin/usuarios">Admin Usuarios</Link>
            <Link to="/admin/turnos">Admin Turnos</Link>
          </>
        )}
      </div>
      <div className="navbar-user">
        <span>{userProfile?.nombre} {userProfile?.apellido}</span>
        <button onClick={handleLogout} className="btn-logout">
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
