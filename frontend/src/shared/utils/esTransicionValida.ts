/**
 * esTransicionValida — FR-028
 * Implementa la tabla de transiciones de data-model.md sección 3.3 y 3.4.
 */
const TRANSICIONES_VALIDAS: Record<string, string[]> = {
  // "pendiente" nunca se persiste (INCON-02 resuelto); no se incluye en la tabla.
  confirmado: ["completado", "cancelado"],
  completado: [],   // estado final
  cancelado: [],    // estado final
};

export function esTransicionValida(
  estadoActual: string,
  nuevoEstado: string
): boolean {
  return TRANSICIONES_VALIDAS[estadoActual]?.includes(nuevoEstado) ?? false;
}

export function transicionesDisponibles(estadoActual: string): string[] {
  return TRANSICIONES_VALIDAS[estadoActual] ?? [];
}
