/**
 * usePuedeCancelar — FR-016, FR-017
 * Retorna true si el turno puede cancelarse (> 30 min para el inicio, estado activo).
 */
export interface TurnoParaCancelar {
  fecha: string;
  horario: string;
  estado: string;
}

export function usePuedeCancelar(turno: TurnoParaCancelar): boolean {
  if (!["pendiente", "confirmado"].includes(turno.estado)) return false;

  const [anio, mes, dia] = turno.fecha.split("-").map(Number);
  const [hh, mm] = turno.horario.split(":").map(Number);
  const fechaHoraTurno = new Date(anio, mes - 1, dia, hh, mm, 0);
  const diffMs = fechaHoraTurno.getTime() - Date.now();
  const diffMin = diffMs / 1000 / 60;

  return diffMin > 30;
}
