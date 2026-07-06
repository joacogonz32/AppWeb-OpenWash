/** Genera los 52 slots de 15 minutos entre 08:00 y 20:45. FR-012 */
export function generarSlots(): string[] {
  const slots: string[] = [];
  for (let h = 8; h <= 20; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 20 && m > 45) break;
      slots.push(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
      );
    }
  }
  return slots;
}

/** Formatea una fecha YYYY-MM-DD para mostrar al usuario. */
export function formatearFecha(fecha: string): string {
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}

/** Retorna la fecha de hoy en formato YYYY-MM-DD. */
export function hoy(): string {
  return new Date().toISOString().split("T")[0];
}
