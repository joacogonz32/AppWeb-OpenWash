/**
 * Shared — cliente de Firestore para Cloud Functions.
 */
import * as admin from "firebase-admin";

export const db = admin.firestore();
export const auth = admin.auth();

/** Actualiza el slot de disponibilidad en Firestore. */
export async function setSlot(
  fecha: string,
  horario: string,
  ocupado: boolean,
  turnoId: string | null
): Promise<void> {
  const ref = db
    .collection("disponibilidad")
    .doc(fecha)
    .collection("slots")
    .doc(horario);

  await ref.set({ ocupado, turnoId });
}
