/**
 * esHorarioPasado — FR-015
 * Retorna true si la combinación fecha+horario ya transcurrió.
 * Zona horaria: America/Argentina/Buenos_Aires (UTC-3, sin DST).
 */
export function esHorarioPasado(fecha: string, horario: string): boolean {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const [hh, mm] = horario.split(":").map(Number);
  const fechaHoraTurno = new Date(anio, mes - 1, dia, hh, mm, 0);
  return fechaHoraTurno <= new Date();
}
