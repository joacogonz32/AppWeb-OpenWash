import { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../../firebase/config";
import { useTurnosPropios, Turno } from "../hooks/useTurnosPropios";
import { usePuedeCancelar } from "../hooks/usePuedeCancelar";
import { formatearFecha } from "../../../shared/utils/fecha";
import "./Turnos.css";

const ESTADO_LABELS: Record<string, string> = {
  pendiente: "⏳ Pendiente",
  confirmado: "✅ Confirmado",
  completado: "🏁 Completado",
  cancelado: "❌ Cancelado",
};

function TarjetaTurno({
  turno,
  onCancelado,
}: {
  turno: Turno;
  onCancelado: () => void;
}) {
  const puedeCancelar = usePuedeCancelar(turno);
  const [cancelando, setCancelando] = useState(false);
  const [error, setError] = useState("");

  async function handleCancelar() {
    if (!confirm("¿Cancelar este turno?")) return;
    setCancelando(true);
    setError("");
    try {
      const cancelar = httpsCallable(functions, "cancelarTurno");
      await cancelar({ turnoId: turno.id });
      onCancelado();
    } catch {
      setError("No se pudo cancelar. Intentá de nuevo.");
    } finally {
      setCancelando(false);
    }
  }

  return (
    <div className="turno-card">
      <div className="turno-header">
        <span className="turno-servicio">{turno.servicio}</span>
        <span className={`turno-estado estado-${turno.estado}`}>
          {ESTADO_LABELS[turno.estado] ?? turno.estado}
        </span>
      </div>
      <div className="turno-info">
        <span>📅 {formatearFecha(turno.fecha)} a las {turno.horario}</span>
        <span>🚗 {turno.patente} · {turno.tipoVehiculo}</span>
      </div>
      {error && <p className="error">{error}</p>}
      {puedeCancelar && (
        <button
          onClick={handleCancelar}
          disabled={cancelando}
          className="btn-cancelar"
        >
          {cancelando ? "Cancelando..." : "Cancelar turno"}
        </button>
      )}
    </div>
  );
}

export function MisTurnosPage() {
  const { proximos, historial, loading, error, refetch } = useTurnosPropios();

  if (loading) return <div className="page-container"><p>Cargando turnos...</p></div>;

  return (
    <div className="page-container">
      <div className="page-card">
        <h2>Mis Turnos</h2>

        <section>
          <h3>Próximos</h3>
          {proximos.length === 0 ? (
            <p className="empty-msg">No tenés turnos próximos.</p>
          ) : (
            proximos.map((t) => (
              <TarjetaTurno key={t.id} turno={t} onCancelado={refetch} />
            ))
          )}
        </section>

        <section>
          <h3>Historial</h3>
          {historial.length === 0 ? (
            <p className="empty-msg">No hay turnos en el historial.</p>
          ) : (
            historial.map((t) => (
              <TarjetaTurno key={t.id} turno={t} onCancelado={refetch} />
            ))
          )}
        </section>

        {error && <p className="error">{error}</p>}
      </div>
    </div>
  );
}
