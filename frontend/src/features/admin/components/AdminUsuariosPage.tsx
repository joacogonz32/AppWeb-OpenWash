/**
 * AdminUsuariosPage — FR-024, FR-025, FR-026, FR-027 (gestión de usuarios por admin)
 * Tabla de todos los usuarios con acciones: activar/desactivar, cambiar rol, eliminar.
 */
import { useState } from "react";
import { useUsuariosAdmin } from "../hooks/useUsuariosAdmin";
import "./Admin.css";

export function AdminUsuariosPage() {
  const { usuarios, loading, error, setActivo, eliminar } = useUsuariosAdmin();
  const [actionMsg, setActionMsg] = useState<{ uid: string; msg: string } | null>(null);

  async function handleToggleActivo(uid: string, activo: boolean) {
    try {
      await setActivo(uid, !activo);
      setActionMsg({ uid, msg: !activo ? "Cuenta activada." : "Cuenta desactivada." });
    } catch {
      setActionMsg({ uid, msg: "Error al actualizar el estado." });
    }
  }

  async function handleEliminar(uid: string, nombre: string) {
    if (!confirm(`¿Eliminar la cuenta de ${nombre}? Se cancelarán sus turnos activos.`)) return;
    try {
      await eliminar(uid);
    } catch {
      setActionMsg({ uid, msg: "Error al eliminar." });
    }
  }

  if (loading) return <div className="page-container"><p>Cargando usuarios...</p></div>;
  if (error) return <div className="page-container"><p className="error">{error}</p></div>;

  return (
    <div className="page-container wide">
      <h2>Gestión de usuarios</h2>
      <p style={{ marginBottom: "1rem", color: "#666" }}>{usuarios.length} usuarios registrados</p>

      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.uid} className={!u.activo ? "row-inactive" : ""}>
                <td>{u.nombre} {u.apellido}</td>
                <td>{u.email}</td>
                <td>{u.telefono ?? "—"}</td>
                <td>
                  <span className={`badge badge-${u.rol}`}>{u.rol}</span>
                </td>
                <td>
                  <span className={`badge badge-${u.activo ? "activo" : "inactivo"}`}>
                    {u.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="actions-cell">
                  {/* Activar / desactivar — FR-025, FR-026 */}
                  <button
                    className={`btn-action ${u.activo ? "btn-warn" : "btn-ok"}`}
                    onClick={() => handleToggleActivo(u.uid, u.activo)}
                  >
                    {u.activo ? "Desactivar" : "Activar"}
                  </button>
                  {/* Eliminar — FR-027 */}
                  <button
                    className="btn-action btn-danger"
                    onClick={() => handleEliminar(u.uid, `${u.nombre} ${u.apellido}`)}
                  >
                    Eliminar
                  </button>
                  {actionMsg?.uid === u.uid && (
                    <span className="action-msg">{actionMsg.msg}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
