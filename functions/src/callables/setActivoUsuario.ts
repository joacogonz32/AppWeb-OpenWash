/**
 * Callable: setActivoUsuario — FR-023
 *
 * Activa o desactiva la cuenta de un usuario.
 * Estrategia de doble bloqueo (research.md RD-006):
 *   1. Actualiza Firebase Auth: disabled = !activo
 *   2. Actualiza campo activo en Firestore (Data Connect sync pendiente)
 */
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

interface SetActivoData {
  uid: string;
  activo: boolean;
}

export const setActivoUsuario = functions.https.onCall(
  async (data: SetActivoData, context: functions.https.CallableContext) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "No autenticado.");
    }

    // Verificar que el caller es admin
    const callerToken = context.auth.token as { rol?: string };
    if (callerToken.rol !== "admin") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Solo administradores pueden modificar cuentas."
      );
    }

    const { uid, activo } = data;

    // 1. Actualizar Firebase Auth (bloqueo real de sesión)
    await admin.auth().updateUser(uid, { disabled: !activo });

    // 2. Actualizar campo activo en Firestore (para el AuthContext del frontend)
    await admin.firestore().collection("usuarios").doc(uid).set(
      { activo },
      { merge: true }
    );

    return { exito: true };
  }
);
