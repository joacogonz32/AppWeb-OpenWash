import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../../firebase/config";
import "./Auth.css";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.nombre || !form.apellido || !form.telefono || !form.email || !form.password) {
      setError("Todos los campos son obligatorios.");
      return;
    }
    if (form.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const user = await register(form.email, form.password);

      // Guardar perfil en Firestore (espejo del schema Data Connect)
      await setDoc(doc(db, "usuarios", user.uid), {
        uid: user.uid,
        nombre: form.nombre,
        apellido: form.apellido,
        email: form.email,
        telefono: form.telefono,
        rol: "user",
        activo: true,
      });

      navigate("/mis-turnos");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/email-already-in-use") {
        setError("El email ya está en uso. Probá con otro.");
      } else {
        setError("Error al crear la cuenta. Intentá de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>🚗 OpenWash</h1>
        <h2>Crear cuenta</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Nombre</label>
              <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Juan" />
            </div>
            <div className="form-group">
              <label>Apellido</label>
              <input name="apellido" value={form.apellido} onChange={handleChange} placeholder="García" />
            </div>
          </div>
          <div className="form-group">
            <label>Teléfono</label>
            <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="011-1234-5678" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="juan@email.com" />
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Mínimo 6 caracteres" />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>
        <p className="auth-link">
          ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
        </p>
      </div>
    </div>
  );
}
