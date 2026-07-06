import { useState, useEffect, useCallback } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../../../firebase/config";
import type { Turno } from "../../turnos/hooks/useTurnosPropios";

export type EstadoFiltro = "todos" | "confirmado" | "cancelado" | "completado";
export type ServicioFiltro = "todos" | "moto" | "auto" | "camioneta" | "casa";

export type TurnoAdmin = Turno;

export function useTurnosAdmin(
  fechaFiltro: string,
  estadoFiltro: EstadoFiltro,
  servicioFiltro: ServicioFiltro
) {
  const [turnos, setTurnos] = useState<TurnoAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      let q = query(collection(db, "turnos"), orderBy("fecha"), orderBy("horario"));
      if (fechaFiltro) q = query(q, where("fecha", "==", fechaFiltro));
      if (estadoFiltro !== "todos") q = query(q, where("estado", "==", estadoFiltro));
      if (servicioFiltro !== "todos") q = query(q, where("servicio", "==", servicioFiltro));
      const snap = await getDocs(q);
      setTurnos(snap.docs.map((d) => ({ ...(d.data() as Turno), id: d.id })));
    } catch {
      setError("Error al cargar turnos.");
    } finally {
      setLoading(false);
    }
  }, [fechaFiltro, estadoFiltro, servicioFiltro]);

  useEffect(() => { cargar(); }, [cargar]);

  async function cambiarEstado(id: string, nuevoEstado: string) {
    const fn = httpsCallable<{ turnoId: string; nuevoEstado: string }, void>(functions, "cancelarTurno");
    // Para cancelar desde admin usamos cancelarTurno; para otros estados usaríamos un callable dedicado
    if (nuevoEstado === "cancelado") {
      await fn({ turnoId: id, nuevoEstado });
    }
    await cargar();
  }

  return { turnos, loading, error, cambiarEstado, recargar: cargar };
}
