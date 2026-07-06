/**
 * useTurnosPropios — FR-018, FR-019
 * Carga los turnos del usuario y aplica la clasificación próximos/historial.
 * Ver: data-model.md sección 4.
 */
import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { db } from "../../../firebase/config";
import { useAuth } from "../../../contexts/AuthContext";

export interface Turno {
  id: string;
  servicio: string;
  fecha: string;
  horario: string;
  estado: string;
  patente: string;
  tipoVehiculo: string;
  creadoEn: Date;
  usuarioUid: string;
}

interface TurnosPropios {
  proximos: Turno[];
  historial: Turno[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function clasificar(turno: Turno): "proximo" | "historial" {
  const [anio, mes, dia] = turno.fecha.split("-").map(Number);
  const [hh, mm] = turno.horario.split(":").map(Number);
  const fechaHoraTurno = new Date(anio, mes - 1, dia, hh, mm, 0);
  const ahora = new Date();

  // Reglas de data-model.md sección 4.1
  if (
    fechaHoraTurno >= ahora &&
    ["pendiente", "confirmado"].includes(turno.estado)
  ) {
    return "proximo";
  }
  return "historial";
}

export function useTurnosPropios(): TurnosPropios {
  const { currentUser } = useAuth();
  const [proximos, setProximos] = useState<Turno[]>([]);
  const [historial, setHistorial] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  function refetch() {
    setTick((t) => t + 1);
  }

  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    const q = query(
      collection(db, "turnos"),
      where("usuarioUid", "==", currentUser.uid),
      orderBy("fecha", "asc"),
      orderBy("horario", "asc")
    );

    getDocs(q)
      .then((snap) => {
        const todos: Turno[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Turno, "id">),
        }));
        setProximos(todos.filter((t) => clasificar(t) === "proximo"));
        setHistorial(todos.filter((t) => clasificar(t) === "historial"));
      })
      .catch(() => setError("No se pudieron cargar tus turnos."))
      .finally(() => setLoading(false));
  }, [currentUser, tick]);

  return { proximos, historial, loading, error, refetch };
}
