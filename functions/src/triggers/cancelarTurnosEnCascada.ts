/**
 * Auth trigger: cancelarTurnosEnCascada — FR-033
 *
 * Se dispara cuando se elimina un usuario en Firebase Auth.
 * Cancela todos los turnos futuros en estado pendiente o confirmado.
 *
 * Ver: contracts/operations.gql sección operaciones internas
 *      tasks.md T027
 */
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export const cancelarTurnosEnCascada = functions.auth
  .user()
  .onDelete(async (user) => {
    const db = admin.firestore();
    const uid = user.uid;
    const hoy = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // Buscar turnos futuros activos del usuario eliminado
    const snapshot = await db
      .collection("turnos")
      .where("usuarioUid", "==", uid)
      .where("estado", "in", ["pendiente", "confirmado"])
      .where("fecha", ">=", hoy)
      .get();

    if (snapshot.empty) return;

    const batch = db.batch();
    const slotsALiberar: Array<{ fecha: string; horario: string }> = [];

    snapshot.docs.forEach((doc) => {
      // Cancelar el turno
      batch.update(doc.ref, { estado: "cancelado" });
      // Registrar slot para liberar en Firestore
      const data = doc.data();
      slotsALiberar.push({ fecha: data.fecha, horario: data.horario });
    });

    await batch.commit();

    // Liberar slots de disponibilidad en Firestore
    const slotBatch = db.batch();
    for (const { fecha, horario } of slotsALiberar) {
      const slotRef = db
        .collection("disponibilidad")
        .doc(fecha)
        .collection("slots")
        .doc(horario);
      slotBatch.set(slotRef, { ocupado: false, turnoId: null });
    }
    await slotBatch.commit();

    functions.logger.info(
      `cancelarTurnosEnCascada: cancelados ${snapshot.size} turnos del usuario ${uid}`
    );
  });
