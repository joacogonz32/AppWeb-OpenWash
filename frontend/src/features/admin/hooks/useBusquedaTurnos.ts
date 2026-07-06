import { useState, useEffect, useCallback } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { db } from "../../../firebase/config";
import type { Turno } from "../../turnos/hooks/useTurnosPropios";

export interface TurnoBusqueda extends Turno {
  clienteNombre?: string;
}

export function useBusquedaTurnos(texto: string) {
  const [resultados, setResultados] = useState<TurnoBusqueda[]>([]);
  const [buscando, setBuscando] = useState(false);

  const buscar = useCallback(async (t: string) => {
    if (!t || t.trim().length < 2) { setResultados([]); return; }
    setBuscando(true);
    try {
      // Búsqueda por patente (case insensitive vía startAt/endAt pattern)
      const upper = t.toUpperCase();
      const q = query(
        collection(db, "turnos"),
        where("patente", ">=", upper),
        where("patente", "<=", upper + "\uf8ff"),
        orderBy("patente"),
        orderBy("fecha")
      );
      const snap = await getDocs(q);
      setResultados(snap.docs.map((d) => ({ ...(d.data() as Turno), id: d.id })));
    } catch {
      setResultados([]);
    } finally {
      setBuscando(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => buscar(texto), 400);
    return () => clearTimeout(timer);
  }, [texto, buscar]);

  return { resultados, buscando };
}
