/**
 * Callable: cancelarTurno — FR-016, FR-013
 *
 * Cancela un turno en Firestore y libera el slot de disponibilidad.
 * Precondición de regla de 30 min validada en el cliente (usePuedeCancelar).
 */
import * as functions from "firebase-functions";
import { db } from "../shared/firestore";

interface CancelarTurnoData {
  turnoId: string;
}

export const cancelarTurno = functions.https.onCall(
  async (data: CancelarTurnoData, context: functions.https.CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Debés iniciar sesión.");
    }

    const { turnoId } = data;
    if (!turnoId) {
      throw new functions.https.HttpsError("invalid-argument", "turnoId es requerido.");
    }

    const turnoRef = db.collection("turnos").doc(turnoId);
    const turnoSnap = await turnoRef.get();

    if (!turnoSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Turno no encontrado.");
    }

    const turno = turnoSnap.data()!;

    // Verificar que el turno pertenece al usuario (o que es admin)
    const uid = context.auth.uid;
    const token = context.auth.token as { rol?: string };
    const esAdmin = token.rol === "admin";

    if (!esAdmin && turno.usuarioUid !== uid) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "No podés cancelar un turno de otro usuario."
      );
    }

    // Cancelar turno y liberar slot
    await db.runTransaction(async (t) => {
      t.update(turnoRef, { estado: "cancelado" });

      const slotRef = db
        .collection("disponibilidad")
        .doc(turno.fecha)
        .collection("slots")
        .doc(turno.horario);

      t.set(slotRef, { ocupado: false, turnoId: null });
    });

    return { exito: true };
  }
);
