/**
 * AuthContext — Open Wash
 * Gestiona el estado global de autenticación.
 * FR-003: sesión persistente entre visitas.
 * FR-023: verifica campo activo tras cada cambio de estado (doble bloqueo, research.md RD-006).
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User,
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";

export interface UserProfile {
  uid: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  rol: "user" | "admin";
  activo: boolean;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (
    email: string,
    password: string
  ) => Promise<User>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(user: User): Promise<UserProfile | null> {
    try {
      // Leer perfil desde Firestore (espejo del Data Connect)
      const ref = doc(db, "usuarios", user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      return snap.data() as UserProfile;
    } catch {
      return null;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCurrentUser(null);
        setUserProfile(null);
        setLoading(false);
        return;
      }

      // FR-023: verificar campo activo para doble bloqueo (research.md RD-006)
      const profile = await fetchProfile(user);
      if (profile && !profile.activo) {
        // Cuenta desactivada: forzar logout aunque el token sea válido
        await signOut(auth);
        setCurrentUser(null);
        setUserProfile(null);
        setLoading(false);
        return;
      }

      setCurrentUser(user);
      setUserProfile(profile);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    await signOut(auth);
  }

  async function register(email: string, password: string): Promise<User> {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    if (!currentUser?.email) throw new Error("No hay usuario autenticado.");
    const credential = EmailAuthProvider.credential(
      currentUser.email,
      currentPassword
    );
    await reauthenticateWithCredential(currentUser, credential);
    await updatePassword(currentUser, newPassword);
  }

  async function deleteAccount() {
    if (!currentUser) throw new Error("No hay usuario autenticado.");
    await deleteUser(currentUser);
  }

  const isAdmin = userProfile?.rol === "admin";

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isAdmin,
        loading,
        login,
        logout,
        register,
        changePassword,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de <AuthProvider>.");
  }
  return context;
}
