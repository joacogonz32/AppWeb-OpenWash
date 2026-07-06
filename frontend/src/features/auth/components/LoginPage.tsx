import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import "./Auth.css";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/mis-turnos");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/user-disabled") {
        // FR-023: cuenta desactivada por administrador
        setError("Tu cuenta fue desactivada. Contactá al administrador.");
      } else {
        // FR-002: no revelar si el email existe o no
        setError("Email o contraseña incorrectos.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>🚗 OpenWash</h1>
        <h2>Iniciar sesión</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
            />
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu contraseña"
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
        <p className="auth-link">
          ¿No tenés cuenta? <Link to="/registro">Registrate</Link>
        </p>
        <p className="auth-note">
          La recuperación de contraseña no está disponible en v1.0.
        </p>
      </div>
    </div>
  );
}
