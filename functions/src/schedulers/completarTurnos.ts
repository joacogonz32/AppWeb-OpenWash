/**
 * Cloud Scheduler: completarTurnos — FR-034
 *
 * Corre cada 5 minutos. Transiciona confirmado → completado para turnos
 * cuya fecha+horario+15min <= ahora.
 *
 * Ventana de inconsistencia: hasta 5 min (aceptada en v1.0).
 * Ver: research.md RD-004, quickstart.md sección 8.
 */
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export const completarTurnos = functions.pubsub
  .schedule("every 5 minutes")
  .timeZone("America/Argentina/Buenos_Aires")
  .onRun(async () => {
    const db = admin.firestore();
    const ahora = new Date();

    // Los turnos cuyo horario+15min ya transcurrió deben completarse
    const snapshot = await db
      .collection("turnos")
      .where("estado", "==", "confirmado")
      .get();

    if (snapshot.empty) return;

    const batch = db.batch();
    let completados = 0;

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const { fecha, horario } = data;

      // Parsear fecha y horario en zona Argentina
      const [anio, mes, dia] = fecha.split("-").map(Number);
      const [hh, mm] = horario.split(":").map(Number);

      const fechaHoraTurno = new Date(anio, mes - 1, dia, hh, mm + 15, 0);

      if (fechaHoraTurno <= ahora) {
        batch.update(doc.ref, { estado: "completado" });
        completados++;
      }
    });

    if (completados > 0) {
      await batch.commit();
      functions.logger.info(`completarTurnos: ${completados} turnos completados.`);
    }
  });
