/**
 * Firestore trigger: onTurnoEscrito — FR-013
 *
 * NOTA: Este trigger se dispara sobre la colección 'turnos' en Firestore.
 * (Data Connect/PostgreSQL no puede disparar Cloud Functions directamente — INCON-01)
 * En esta implementación, los turnos se guardan en Firestore por crearTurno callable.
 *
 * Ver: tasks.md INCON-01, research.md RD-001
 */
import * as functions from "firebase-functions";
import { setSlot } from "../shared/firestore";

// Este trigger es informativo — la disponibilidad ya fue actualizada
// por crearTurno/cancelarTurno callables en la misma transacción.
// Se mantiene como segunda línea de defensa para sincronización.
export const onTurnoEscrito = functions.firestore
  .document("turnos/{turnoId}")
  .onWrite(async (change) => {
    const after = change.after.exists ? change.after.data() : null;
    const before = change.before.exists ? change.before.data() : null;

    if (!after) return; // Turno eliminado — no aplica en v1.0

    const { fecha, horario, estado, id } = after;

    // Si el turno pasó a cancelado, liberar el slot
    if (before?.estado !== "cancelado" && estado === "cancelado") {
      await setSlot(fecha, horario, false, null);
      return;
    }

    // Si el turno fue confirmado (creado), marcar slot como ocupado
    if (!before && estado === "confirmado") {
      await setSlot(fecha, horario, true, id);
    }
  });
