/**
 * AdminTurnosPage — FR-029, FR-030, FR-031, FR-032
 * Panel de administración de turnos: filtros por fecha/estado/servicio, búsqueda por patente,
 * tabla con acción de cambio de estado vía modal.
 */
import { useState } from "react";
import { useTurnosAdmin } from "../hooks/useTurnosAdmin";
import { useBusquedaTurnos } from "../hooks/useBusquedaTurnos";
import { ModalCambiarEstado } from "./ModalCambiarEstado";
import type { EstadoFiltro, ServicioFiltro } from "../hooks/useTurnosAdmin";
import "./Admin.css";

export function AdminTurnosPage() {
  const [fecha, setFecha] = useState("");
  const [estado, setEstado] = useState<EstadoFiltro>("todos");
  const [servicio, setServicio] = useState<ServicioFiltro>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [modalTurno, setModalTurno] = useState<{ id: string; estadoActual: string } | null>(null);

  const { turnos, loading, error, cambiarEstado } = useTurnosAdmin(fecha, estado, servicio);
  const { resultados: busquedaRes, buscando } = useBusquedaTurnos(busqueda);

  const turnosAMostrar = busqueda.trim().length >= 2 ? busquedaRes : turnos;

  return (
    <div className="page-container wide">
      <h2>Gestión de turnos</h2>

      {/* Filtros — FR-030, FR-031 */}
      <div className="filtros-bar">
        <div className="filtro-group">
          <label>Fecha</label>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          {fecha && <button className="btn-clear" onClick={() => setFecha("")}>✕</button>}
        </div>
        <div className="filtro-group">
          <label>Estado</label>
          <select value={estado} onChange={(e) => setEstado(e.target.value as EstadoFiltro)}>
            <option value="todos">Todos</option>
            <option value="confirmado">Confirmado</option>
            <option value="completado">Completado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
        <div className="filtro-group">
          <label>Servicio</label>
          <select value={servicio} onChange={(e) => setServicio(e.target.value as ServicioFiltro)}>
            <option value="todos">Todos</option>
            <option value="moto">Moto</option>
            <option value="auto">Auto</option>
            <option value="camioneta">Camioneta</option>
            <option value="casa">Casa</option>
          </select>
        </div>
        {/* Búsqueda por patente — FR-032 */}
        <div className="filtro-group">
          <label>Buscar por patente</label>
          <input
            type="text"
            placeholder="Ej: AA123BB"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value.toUpperCase())}
          />
          {buscando && <span className="buscando">Buscando...</span>}
        </div>
      </div>

      {loading && <p>Cargando turnos...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Horario</th>
                <th>Servicio</th>
                <th>Patente</th>
                <th>Vehículo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {turnosAMostrar.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: "center", color: "#888" }}>Sin turnos</td></tr>
              ) : (
                turnosAMostrar.map((t) => (
                  <tr key={t.id}>
                    <td>{t.fecha}</td>
                    <td>{t.horario}</td>
                    <td>{t.servicio}</td>
                    <td>{t.patente}</td>
                    <td>{t.tipoVehiculo}</td>
                    <td><span className={`badge badge-estado-${t.estado}`}>{t.estado}</span></td>
                    <td>
                      {/* Solo se puede cambiar estado si no es estado terminal */}
                      {t.estado !== "cancelado" && t.estado !== "completado" && (
                        <button
                          className="btn-action btn-primary-sm"
                          onClick={() => setModalTurno({ id: t.id, estadoActual: t.estado })}
                        >
                          Cambiar estado
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal cambio de estado — FR-028 */}
      {modalTurno && (
        <ModalCambiarEstado
          turnoId={modalTurno.id}
          estadoActual={modalTurno.estadoActual}
          onConfirmar={cambiarEstado}
          onCerrar={() => setModalTurno(null)}
        />
      )}
    </div>
  );
}
