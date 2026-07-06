import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../../firebase/config";
import { useDisponibilidad } from "../hooks/useDisponibilidad";
import { esHorarioPasado } from "../../../shared/utils/esHorarioPasado";
import { generarSlots, hoy } from "../../../shared/utils/fecha";
import "./Turnos.css";

const SERVICIOS = ["Básico", "Completo", "Premium"] as const;
const TIPOS_VEHICULO = ["auto", "camioneta", "moto"] as const;
const SLOTS = generarSlots();

export function ReservarPage() {
  const navigate = useNavigate();
  const [fecha, setFecha] = useState(hoy());
  const [servicio, setServicio] = useState("");
  const [horario, setHorario] = useState("");
  const [patente, setPatente] = useState("");
  const [tipoVehiculo, setTipoVehiculo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const disponibilidad = useDisponibilidad(fecha);

  async function handleReservar(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!servicio || !fecha || !horario || !patente || !tipoVehiculo) {
      setError("Completá todos los campos.");
      return;
    }

    // FR-015: no reservar horario pasado
    if (esHorarioPasado(fecha, horario)) {
      setError("No podés reservar un horario que ya pasó.");
      return;
    }

    setLoading(true);
    try {
      const crearTurno = httpsCallable(functions, "crearTurno");
      await crearTurno({ servicio, fecha, horario, patente: patente.toUpperCase(), tipoVehiculo });
      navigate("/mis-turnos");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === "already-exists") {
        setError("El horario ya no está disponible. Elegí otro.");
      } else {
        setError("Error al reservar. Intentá de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  }

  function slotDisponible(slot: string): boolean {
    if (esHorarioPasado(fecha, slot)) return false;
    return !disponibilidad[slot]?.ocupado;
  }

  return (
    <div className="page-container">
      <div className="page-card">
        <h2>Reservar turno de lavado</h2>
        <form onSubmit={handleReservar}>

          {/* Selector de servicio */}
          <div className="form-group">
            <label>Servicio</label>
            <div className="servicios-grid">
              {SERVICIOS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`servicio-btn ${servicio === s ? "selected" : ""}`}
                  onClick={() => setServicio(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Fecha */}
          <div className="form-group">
            <label>Fecha</label>
            <input
              type="date"
              value={fecha}
              min={hoy()}
              onChange={(e) => { setFecha(e.target.value); setHorario(""); }}
            />
          </div>

          {/* Grilla de slots — FR-012, FR-013 */}
          <div className="form-group">
            <label>Horario ({SLOTS.length} slots disponibles)</label>
            <div className="slots-grid">
              {SLOTS.map((slot) => {
                const disponible = slotDisponible(slot);
                return (
                  <button
                    key={slot}
                    type="button"
                    className={`slot-btn ${!disponible ? "ocupado" : ""} ${horario === slot ? "selected" : ""}`}
                    disabled={!disponible}
                    onClick={() => setHorario(slot)}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Datos del vehículo — FR-011 */}
          <div className="form-row">
            <div className="form-group">
              <label>Patente</label>
              <input
                value={patente}
                onChange={(e) => setPatente(e.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={8}
              />
            </div>
            <div className="form-group">
              <label>Tipo de vehículo</label>
              <select value={tipoVehiculo} onChange={(e) => setTipoVehiculo(e.target.value)}>
                <option value="">Seleccionar...</option>
                {TIPOS_VEHICULO.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="error">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Reservando..." : "Confirmar reserva"}
          </button>
        </form>
      </div>
    </div>
  );
}
