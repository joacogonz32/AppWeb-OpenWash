import { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../../../firebase/config";
import type { UserProfile } from "../../../contexts/AuthContext";

export interface UsuarioAdmin extends UserProfile {
  uid: string;
}

export function useUsuariosAdmin() {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "usuarios"), orderBy("apellido")));
      const data = snap.docs.map((d) => ({ ...(d.data() as UserProfile), uid: d.id }));
      setUsuarios(data);
    } catch {
      setError("Error al cargar usuarios.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  async function setActivo(uid: string, activo: boolean) {
    const fn = httpsCallable<{ uid: string; activo: boolean }, void>(functions, "setActivoUsuario");
    await fn({ uid, activo });
    await cargar();
  }

  async function eliminar(uid: string) {
    const fn = httpsCallable<{ uid: string }, void>(functions, "eliminarUsuarioAdmin");
    await fn({ uid });
    await cargar();
  }

  return { usuarios, loading, error, setActivo, eliminar, recargar: cargar };
}
