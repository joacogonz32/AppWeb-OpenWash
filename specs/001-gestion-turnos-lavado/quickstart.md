# Quickstart — Open Wash: Entorno Local de Desarrollo

**Proyecto**: Open Wash
**Feature**: Gestión de Turnos
**Spec**: `specs/001-gestion-turnos-lavado/spec.md`
**Fecha**: 2026-07-06
**Estado**: Draft — generado por speckit.plan

---

## Requisitos previos

| Herramienta | Versión mínima | Cómo verificar |
|---|---|---|
| Node.js | 20.x LTS | `node --version` |
| npm | 10.x | `npm --version` |
| Firebase CLI | 13.x | `firebase --version` |
| Java Runtime | 11+ (requerido por los emuladores) | `java --version` |
| Git | cualquiera | `git --version` |

### Instalar Firebase CLI (si no está instalado)

```bash
npm install -g firebase-tools
```

---

## 1. Clonar el repositorio

```bash
git clone https://github.com/joacogonz32/AppWeb-OpenWash.git
cd AppWeb-OpenWash
```

---

## 2. Autenticarse con Firebase CLI

```bash
firebase login
```

Verificar que el proyecto está disponible:

```bash
firebase projects:list
# Debe aparecer: appweb-openwash
```

Seleccionar el proyecto activo:

```bash
firebase use appweb-openwash
```

---

## 3. Levantar Firebase Local Emulator Suite

Los emuladores permiten desarrollar y testear sin conectarse a los servicios de
Firebase en la nube. Todos los datos son efímeros (se pierden al apagar el emulador,
salvo que se use `--export-on-exit`).

### 3.1 Iniciar todos los emuladores

```bash
firebase emulators:start
```

### 3.2 Puertos de cada emulador

| Servicio | URL local |
|---|---|
| Authentication | http://localhost:9099 |
| Data Connect | http://localhost:9399 |
| Firestore | http://localhost:8080 |
| Functions | http://localhost:5001 |
| **Emulator UI** | **http://localhost:4000** |

Abrir la Emulator UI en el navegador para inspeccionar el estado de todos los
servicios en tiempo real: [http://localhost:4000](http://localhost:4000)

### 3.3 Iniciar con datos de prueba pre-cargados

```bash
firebase emulators:start --import=./test-data/emulator-state
```

> El directorio `test-data/emulator-state/` se genera la primera vez con:
> ```bash
> firebase emulators:start --export-on-exit=./test-data/emulator-state
> ```
> Luego de cargar seed data manualmente desde la Emulator UI o via script.

### 3.4 Cargar seed data

Con los emuladores corriendo en otra terminal:

```bash
npm run seed
```

Esto ejecuta el script `scripts/seed.js` que carga los datos de
`dataconnect/seed_data.gql`:

| Entidad | Cantidad | Descripción |
|---|---|---|
| Usuario admin | 1 | Email: `admin@openwash.com` / Contraseña: `admin123` |
| Usuarios activos | 2 | `cliente1@openwash.com`, `cliente2@openwash.com` / Contraseña: `pass123` |
| Usuario inactivo | 1 | `inactivo@openwash.com` — para test de bloqueo en login (FR-023) |
| Turnos confirmados (futuros) | 2 | Distintos servicios y horarios |
| Turno completado (pasado) | 1 | Para test de historial |
| Turno cancelado | 1 | Para test de historial |

---

## 4. Instalar dependencias del frontend

```bash
cd frontend
npm install
```

### 4.1 Variables de entorno del frontend

Crear el archivo `frontend/.env.local` con la siguiente configuración para desarrollo
local con emuladores:

```env
VITE_USE_FIREBASE_EMULATORS=true
VITE_FIREBASE_API_KEY=demo-key
VITE_FIREBASE_AUTH_DOMAIN=demo-openwash.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=demo-openwash
VITE_FIREBASE_STORAGE_BUCKET=demo-openwash.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=1:000000000000:web:0000000000000000
```

> **Nota**: en desarrollo local con emuladores, los valores de API Key y App ID son
> placeholders. Firebase Emulator Suite no los valida. Para producción, reemplazar
> con los valores reales de la consola de Firebase.

### 4.2 Levantar el frontend en modo desarrollo

```bash
# Desde la carpeta frontend/
npm run dev
```

La aplicación estará disponible en: [http://localhost:5173](http://localhost:5173)

> Asegurarse de que los emuladores estén corriendo antes de levantar el frontend.
> El SDK de Firebase detecta `VITE_USE_FIREBASE_EMULATORS=true` y apunta a los
> emuladores locales en lugar de los servicios de producción.

---

## 5. Instalar dependencias de Cloud Functions

```bash
cd functions
npm install
```

### 5.1 Compilar las funciones (TypeScript → JavaScript)

```bash
# Desde la carpeta functions/
npm run build
```

Las funciones compiladas quedan en `functions/lib/`.

### 5.2 Watch mode para desarrollo (recompila automáticamente al editar)

```bash
# Desde la carpeta functions/
npm run build:watch
```

> Los emuladores de Functions detectan los cambios en `functions/lib/` y recargan
> automáticamente. Mantener `build:watch` corriendo en paralelo con los emuladores.

---

## 6. Ejecutar la suite de tests

### 6.1 Tests unitarios del frontend (hooks y servicios de feature)

```bash
cd frontend
npm run test
```

Corre Vitest para:
- Hook `usePuedeCancelar`: regla de 30 min (FR-016, FR-017)
- Hook `useTurnosPropios`: clasificación próximos/historial (FR-018, FR-019)
- Utilidad `esHorarioPasado`: validación de horario del día actual (FR-015)
- Función `esTransicionValida`: reglas de la máquina de estados (FR-014, FR-028)

### 6.2 Tests de Cloud Functions

```bash
cd functions
npm run test
```

Corre Jest contra el emulador local para:
- `completarTurnos.ts`: transición automática `confirmado → completado` (FR-034)
- `cancelarTurnosEnCascada.ts`: cancelación de turnos al eliminar usuario (FR-033)
- `disponibilidad.ts`: actualización de slots de Firestore al crear/cancelar turno (FR-013)

### 6.3 Tests de operaciones Data Connect

```bash
# Desde la raíz del proyecto, con emuladores corriendo
npm run test:dataconnect
```

Corre tests contra Firebase Local Emulator Suite para:
- `ObtenerTurnosPropios`: retorna solo los turnos del usuario autenticado
- `CrearTurno`: caso exitoso, caso de horario ocupado (concurrencia)
- `CancelarTurnoPropio`: caso válido, caso de turno ajeno (debe rechazarse)
- `CambiarEstadoTurno`: transiciones válidas e inválidas
- `BuscarTurnosPorClienteOPatente`: coincidencia parcial, case-insensitive

### 6.4 Tests end-to-end (Playwright)

```bash
# Paso 1: asegurarse de que los emuladores estén corriendo con datos de seed
firebase emulators:start --import=./test-data/emulator-state &

# Paso 2: levantar el frontend en modo test
cd frontend && npm run build && npm run preview &

# Paso 3: correr los tests de Playwright
npm run test:e2e
```

Flujos cubiertos:
- Registro → login → reserva → ver en mis-turnos → cancelación (US1 + US2 + US3)
- Admin: gestión de usuarios (US5) — listar, editar, desactivar, eliminar
- Admin: gestión de turnos (US6) — filtrar, cambiar estado, buscar
- Control de acceso: usuario con rol "user" intenta acceder a `/admin/*` → redirección

### 6.5 Correr toda la suite en secuencia

```bash
# Desde la raíz del proyecto
npm run test:all
```

Este comando:
1. Inicia los emuladores en background con datos de seed
2. Ejecuta tests unitarios del frontend
3. Ejecuta tests de Cloud Functions
4. Ejecuta tests de operaciones Data Connect
5. Ejecuta tests end-to-end
6. Apaga los emuladores al finalizar

---

## 7. Scripts npm disponibles (package.json raíz)

```json
{
  "scripts": {
    "emulators": "firebase emulators:start",
    "emulators:seed": "firebase emulators:start & sleep 5 && npm run seed",
    "emulators:import": "firebase emulators:start --import=./test-data/emulator-state",
    "emulators:export": "firebase emulators:start --export-on-exit=./test-data/emulator-state",
    "seed": "node scripts/seed.js",
    "test:frontend": "cd frontend && npm run test",
    "test:functions": "cd functions && npm run test",
    "test:dataconnect": "firebase emulators:exec --only auth,dataconnect,firestore --project demo-openwash 'node test/dataconnect/run.js'",
    "test:e2e": "firebase emulators:exec --only auth,dataconnect,firestore,functions --import=./test-data/emulator-state --project demo-openwash 'cd frontend && npm run test:e2e'",
    "test:all": "npm run test:frontend && npm run test:functions && npm run test:dataconnect && npm run test:e2e"
  }
}
```

---

## 8. Limitaciones conocidas del entorno local

| Limitación | Descripción | Impacto |
|---|---|---|
| Ventana de hasta 5 min en `completado` automático | El Cloud Scheduler corre cada 5 min. Un turno confirmado puede tardar hasta 5 min en aparecer como `completado` | Bajo: la clasificación próximos/historial se basa en `fecha+hora`, no en el estado |
| Desincronización Firestore–Data Connect ante fallo de Cloud Function | Si la Function de disponibilidad falla, el slot de Firestore puede no actualizarse | Muy bajo en local; mitigado por idempotencia de la función |
| Auth trigger asíncrono al eliminar cuenta | La cancelación en cascada de turnos (FR-033) puede tardar algunos segundos tras eliminar la cuenta | Bajo: los tests deben incluir un pequeño delay para esperar la propagación |
| `pg_trgm` en emulador | El emulador de Data Connect puede no soportar extensiones de PostgreSQL; la búsqueda parcial (FR-031) puede comportarse diferente en local vs producción | Medio: verificar en Fase 6 (F6-07) |

---

## 9. Solución de problemas comunes

| Problema | Causa probable | Solución |
|---|---|---|
| `firebase emulators:start` falla con error de Java | Java no instalado o versión < 11 | `sudo apt install openjdk-11-jdk` (Linux) o instalar JDK desde adoptium.net |
| `Error: Could not load the default credentials` | No está autenticado con Firebase CLI | Ejecutar `firebase login` |
| Emulador de Data Connect no arranca | Schema inválido en `dataconnect/schema/schema.gql` | Verificar el schema contra la especificación en `data-model.md` sección 1 |
| Frontend no conecta a los emuladores | `VITE_USE_FIREBASE_EMULATORS` no está en `.env.local` | Crear `frontend/.env.local` según sección 4.1 |
| Cloud Functions no se recargan al editar | TypeScript no está compilando | Correr `npm run build:watch` en `functions/` en una terminal separada |
| Tests end-to-end fallan con "no emulators running" | Los emuladores no están corriendo en el momento del test | Usar `firebase emulators:exec` en lugar de iniciar manualmente |
| `auth/user-disabled` en tests con usuario de seed | El usuario fue desactivado en una sesión anterior del emulador | Limpiar el estado del emulador: borrar `test-data/emulator-state/` y regenerar con `npm run seed` |
