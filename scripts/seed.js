/**
 * scripts/seed.js
 * Datos de prueba para el emulador de Firestore (Firebase Local Emulator Suite).
 * Ejecutar: npm run seed  (requiere emuladores activos con: npm run emulators)
 *
 * Crea:
 *  - 1 usuario admin
 *  - 2 usuarios clientes
 *  - Slots de disponibilidad para hoy y mañana (todos libres)
 *  - 2 turnos de ejemplo
 */

const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  setDoc,
  collection,
  writeBatch,
} = require("firebase/firestore");
const {
  getAuth,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
} = require("firebase/auth");

const firebaseConfig = {
  apiKey: "demo-key",
  authDomain: "appweb-openwash.firebaseapp.com",
  projectId: "appweb-openwash",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

connectFirestoreEmulator(db, "localhost", 8080);
connectAuthEmulator(auth, "http://localhost:9099");

// Genera slots de 08:00 a 20:45 cada 15 min (52 slots, ver fecha.ts)
function generarSlots() {
  const slots = [];
  for (let h = 8; h <= 20; h++) {
    const maxMin = h === 20 ? 45 : 59;
    for (let m = 0; m <= maxMin; m += 15) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
}

// Formatea fecha YYYY-MM-DD
function fechaStr(offsetDias = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDias);
  return d.toISOString().split("T")[0];
}

async function crearUsuario(email, password, perfil) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, "usuarios", cred.user.uid), { uid: cred.user.uid, ...perfil });
  console.log(`  ✓ Usuario ${email} (uid: ${cred.user.uid})`);
  return cred.user.uid;
}

async function crearSlotsDisponibilidad(fecha) {
  const slots = generarSlots();
  const batch = writeBatch(db);
  for (const horario of slots) {
    const ref = doc(db, "disponibilidad", fecha, "slots", horario);
    batch.set(ref, { ocupado: false, turnoId: null });
  }
  await batch.commit();
  console.log(`  ✓ ${slots.length} slots libres para ${fecha}`);
}

async function main() {
  console.log("\n🌱 Seeding emulador de Firebase...\n");

  // Usuarios
  console.log("👤 Creando usuarios...");
  const adminUid = await crearUsuario("admin@openwash.test", "Admin1234!", {
    nombre: "Admin",
    apellido: "OpenWash",
    email: "admin@openwash.test",
    rol: "admin",
    activo: true,
    telefono: "+54 11 1234-5678",
    creadoEn: new Date(),
  });

  const cliente1Uid = await crearUsuario("juan@test.com", "Juan1234!", {
    nombre: "Juan",
    apellido: "Pérez",
    email: "juan@test.com",
    rol: "cliente",
    activo: true,
    telefono: "+54 11 9876-5432",
    creadoEn: new Date(),
  });

  await crearUsuario("maria@test.com", "Maria1234!", {
    nombre: "María",
    apellido: "García",
    email: "maria@test.com",
    rol: "cliente",
    activo: true,
    telefono: "+54 11 5555-1234",
    creadoEn: new Date(),
  });

  // Disponibilidad
  console.log("\n📅 Creando disponibilidad...");
  const hoy = fechaStr(0);
  const manana = fechaStr(1);
  const pasado = fechaStr(2);
  await crearSlotsDisponibilidad(hoy);
  await crearSlotsDisponibilidad(manana);
  await crearSlotsDisponibilidad(pasado);

  // Turno de ejemplo (slot ocupado)
  console.log("\n🚗 Creando turnos de ejemplo...");
  const turno1Id = "turno-seed-001";
  await setDoc(doc(db, "turnos", turno1Id), {
    id: turno1Id,
    usuarioUid: cliente1Uid,
    servicio: "Completo",
    fecha: manana,
    horario: "10:00",
    estado: "confirmado",
    patente: "AA123BB",
    tipoVehiculo: "auto",
    creadoEn: new Date(),
  });
  // Marcar slot como ocupado
  await setDoc(doc(db, "disponibilidad", manana, "slots", "10:00"), {
    ocupado: true,
    turnoId: turno1Id,
  });
  console.log(`  ✓ Turno ${turno1Id} para ${manana} 10:00`);

  // Turno completado (historial)
  const ayer = fechaStr(-1);
  const turno2Id = "turno-seed-002";
  await setDoc(doc(db, "turnos", turno2Id), {
    id: turno2Id,
    usuarioUid: cliente1Uid,
    servicio: "Básico",
    fecha: ayer,
    horario: "14:00",
    estado: "completado",
    patente: "AA123BB",
    tipoVehiculo: "auto",
    creadoEn: new Date(Date.now() - 86400000),
  });
  console.log(`  ✓ Turno ${turno2Id} para ${ayer} 14:00 (completado)`);

  console.log("\n✅ Seed completado!\n");
  console.log("Credenciales de acceso:");
  console.log("  Admin:    admin@openwash.test / Admin1234!");
  console.log("  Cliente:  juan@test.com / Juan1234!");
  console.log("  Cliente:  maria@test.com / Maria1234!\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Error en seed:", err.message);
  process.exit(1);
});
