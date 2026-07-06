/**
 * ModalCambiarEstado — FR-028, FR-029 (transiciones de estado de turnos)
 * Muestra únicamente las transiciones válidas según esTransicionValida().
 */
import { useState } from "react";
import { esTransicionValida } from "../../../shared/utils/esTransicionValida";
import "./Admin.css";

const TODOS_ESTADOS = ["confirmado", "completado", "cancelado"] as const;
type Estado = typeof TODOS_ESTADOS[number];

interface Props {
  turnoId: string;
  estadoActual: string;
  onConfirmar: (turnoId: string, nuevoEstado: string) => Promise<void>;
  onCerrar: () => void;
}

export function ModalCambiarEstado({ turnoId, estadoActual, onConfirmar, onCerrar }: Props) {
  const [seleccionado, setSeleccionado] = useState<Estado | "">("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const estadosValidos = TODOS_ESTADOS.filter(
    (e) => e !== estadoActual && esTransicionValida(estadoActual, e)
  );

  async function handleConfirmar() {
    if (!seleccionado) return;
    setLoading(true); setError(null);
    try {
      await onConfirmar(turnoId, seleccionado);
      onCerrar();
    } catch {
      setError("Error al cambiar el estado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h3>Cambiar estado del turno</h3>
        <p>Estado actual: <strong>{estadoActual}</strong></p>

        {estadosValidos.length === 0 ? (
          <p style={{ color: "#888" }}>No hay transiciones válidas desde este estado.</p>
        ) : (
          <div className="estado-options">
            {estadosValidos.map((e) => (
              <button
                key={e}
                className={`estado-btn ${seleccionado === e ? "selected" : ""} estado-${e}`}
                onClick={() => setSeleccionado(e)}
              >
                {e}
              </button>
            ))}
          </div>
        )}

        {error && <p className="error">{error}</p>}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCerrar}>Cancelar</button>
          <button
            className="btn-primary"
            onClick={handleConfirmar}
            disabled={!seleccionado || loading}
          >
            {loading ? "Guardando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
