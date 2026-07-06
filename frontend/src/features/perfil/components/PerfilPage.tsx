import { useState } from "react";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../../firebase/config";
import { useAuth } from "../../../contexts/AuthContext";
import "../../../features/auth/components/Auth.css";
import "../../../features/turnos/components/Turnos.css";

export function PerfilPage() {
  const { currentUser, userProfile, changePassword, deleteAccount } = useAuth();
  const [form, setForm] = useState({
    nombre: userProfile?.nombre ?? "",
    apellido: userProfile?.apellido ?? "",
    telefono: userProfile?.telefono ?? "",
  });
  const [msg, setMsg] = useState("");
  const [pwdForm, setPwdForm] = useState({ actual: "", nueva: "" });
  const [pwdMsg, setPwdMsg] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) return;
    setLoading(true); setMsg("");
    try {
      await updateDoc(doc(db, "usuarios", currentUser.uid), {
        nombre: form.nombre,
        apellido: form.apellido,
        telefono: form.telefono,
      });
      setMsg("Datos guardados correctamente.");
    } catch {
      setMsg("Error al guardar. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCambiarPassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdMsg("");
    if (!pwdForm.nueva || pwdForm.nueva.length < 6) {
      setPwdMsg("La nueva contraseña debe tener al menos 6 caracteres."); return;
    }
    try {
      await changePassword(pwdForm.actual, pwdForm.nueva);
      setPwdMsg("Contraseña actualizada correctamente.");
      setPwdForm({ actual: "", nueva: "" });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setPwdMsg("La contraseña actual es incorrecta.");
      } else {
        setPwdMsg("Error al cambiar la contraseña.");
      }
    }
  }

  async function handleEliminarCuenta() {
    if (!confirm("¿Estás seguro? Tus turnos futuros serán cancelados y no podrás deshacer esta acción.")) return;
    try {
      if (currentUser) {
        await deleteDoc(doc(db, "usuarios", currentUser.uid));
        await deleteAccount(); // dispara Auth trigger → cancela turnos (FR-033)
      }
    } catch {
      alert("Error al eliminar la cuenta. Intentá de nuevo.");
    }
  }

  return (
    <div className="page-container">
      <div className="page-card">
        <h2>Mi perfil</h2>

        {/* Datos personales */}
        <form onSubmit={handleGuardar}>
          <div className="form-row">
            <div className="form-group">
              <label>Nombre</label>
              <input name="nombre" value={form.nombre} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Apellido</label>
              <input name="apellido" value={form.apellido} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label>Teléfono</label>
            <input name="telefono" value={form.telefono} onChange={handleChange} />
          </div>
          {/* Email no editable — Assumptions-6, FR-007 */}
          <div className="form-group">
            <label>Email (no editable)</label>
            <input value={userProfile?.email ?? ""} disabled style={{ background: "#f5f5f5", color: "#888" }} />
          </div>
          {msg && <p className={msg.includes("Error") ? "error" : "success"}>{msg}</p>}
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>

        {/* Cambio de contraseña — FR-008 */}
        <hr style={{ margin: "2rem 0" }} />
        <h3>Cambiar contraseña</h3>
        <form onSubmit={handleCambiarPassword}>
          <div className="form-group">
            <label>Contraseña actual</label>
            <input type="password" value={pwdForm.actual} onChange={(e) => setPwdForm({ ...pwdForm, actual: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Nueva contraseña</label>
            <input type="password" value={pwdForm.nueva} onChange={(e) => setPwdForm({ ...pwdForm, nueva: e.target.value })} />
          </div>
          {pwdMsg && <p className={pwdMsg.includes("Error") || pwdMsg.includes("incorrecta") ? "error" : "success"}>{pwdMsg}</p>}
          <button type="submit" className="btn-primary">Cambiar contraseña</button>
        </form>

        {/* Eliminar cuenta — FR-009 */}
        <hr style={{ margin: "2rem 0" }} />
        <h3>Zona de peligro</h3>
        <p style={{ color: "#666", fontSize: "0.9rem", marginBottom: "1rem" }}>
          Al eliminar tu cuenta, tus turnos futuros activos serán cancelados automáticamente.
          Esta acción no se puede deshacer.
        </p>
        <button
          onClick={handleEliminarCuenta}
          style={{ background: "#ef4444", color: "white", border: "none", padding: "0.6rem 1.25rem", borderRadius: "6px", cursor: "pointer", fontWeight: 600 }}
        >
          Eliminar mi cuenta
        </button>
      </div>
    </div>
  );
}
