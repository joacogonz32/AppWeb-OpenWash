/**
 * useDisponibilidad — FR-013
 * Suscripción onSnapshot a la colección disponibilidad/{fecha}/slots.
 * Retorna mapa en tiempo real de slots ocupados para el día dado.
 */
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebase/config";

export interface SlotInfo {
  ocupado: boolean;
  turnoId: string | null;
}

export function useDisponibilidad(fecha: string): Record<string, SlotInfo> {
  const [slots, setSlots] = useState<Record<string, SlotInfo>>({});

  useEffect(() => {
    if (!fecha) return;

    const slotsRef = collection(db, "disponibilidad", fecha, "slots");
    const unsubscribe = onSnapshot(slotsRef, (snapshot) => {
      const mapa: Record<string, SlotInfo> = {};
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        mapa[doc.id] = {
          ocupado: data.ocupado ?? false,
          turnoId: data.turnoId ?? null,
        };
      });
      setSlots(mapa);
    });

    return unsubscribe;
  }, [fecha]);

  return slots;
}
