/**
 * Callable: eliminarUsuarioAdmin — FR-024, FR-033
 *
 * Elimina la cuenta de cualquier usuario (solo admin).
 * El Auth trigger onUserDeleted cancela los turnos en cascada (FR-033).
 */
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

interface EliminarUsuarioData {
  uid: string;
}

export const eliminarUsuarioAdmin = functions.https.onCall(
  async (data: EliminarUsuarioData, context: functions.https.CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "No autenticado.");
    }

    const callerToken = context.auth.token as { rol?: string };
    if (callerToken.rol !== "admin") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Solo administradores pueden eliminar cuentas."
      );
    }

    const { uid } = data;

    // Eliminar en Firebase Auth → dispara onUserDeleted → cancela turnos (FR-033)
    await admin.auth().deleteUser(uid);

    // Eliminar registro en Firestore
    await admin.firestore().collection("usuarios").doc(uid).delete();

    return { exito: true };
  }
);
