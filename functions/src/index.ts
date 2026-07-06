import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

/**
 * Cloud Functions for Firebase — Open Wash
 * Exporta todas las funciones del sistema.
 * Ver: specs/001-gestion-turnos-lavado/plan.md Fases 1, 2, 5
 */
admin.initializeApp();

// ─── Triggers ───────────────────────────────────────────────────────────────
export { cancelarTurnosEnCascada } from "./triggers/cancelarTurnosEnCascada";
export { onTurnoEscrito } from "./triggers/disponibilidad";

// ─── Schedulers ─────────────────────────────────────────────────────────────
export { completarTurnos } from "./schedulers/completarTurnos";

// ─── Callables (Admin SDK) ──────────────────────────────────────────────────
export { crearTurno } from "./callables/crearTurno";
export { cancelarTurno } from "./callables/cancelarTurno";
export { setActivoUsuario } from "./callables/setActivoUsuario";
export { eliminarUsuarioAdmin } from "./callables/eliminarUsuarioAdmin";

