# Plan de Implementación — 001-gestion-turnos-lavado

**Proyecto**: Open Wash
**Feature**: Gestión de Turnos
**Spec**: `specs/001-gestion-turnos-lavado/spec.md`
**Fecha**: 2026-07-06
**Estado**: Draft — generado por speckit.plan

---

## Estructura de carpetas esperada al finalizar

```
AppWeb-OpenWash/
├── dataconnect/
│   ├── dataconnect.yaml
│   ├── seed_data.gql
│   ├── schema/
│   │   └── schema.gql              ← reemplazar schema de ejemplo (películas)
│   └── connector/                  ← reemplazar carpeta example/
│       ├── connector.yaml
│       ├── queries.gql
│       └── mutations.gql
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── firebase/
│       │   └── config.ts
│       ├── contexts/
│       │   └── AuthContext.tsx
│       ├── router/
│       │   └── AppRouter.tsx
│       ├── features/
│       │   ├── auth/
│       │   │   ├── hooks/
│       │   │   ├── components/
│       │   │   └── services/
│       │   ├── turnos/
│       │   │   ├── hooks/
│       │   │   ├── components/
│       │   │   └── services/
│       │   ├── perfil/
│       │   │   ├── hooks/
│       │   │   └── components/
│       │   └── admin/
│       │       ├── hooks/
│       │       └── components/
│       └── shared/
│           ├── components/
│           └── utils/
├── functions/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       ├── schedulers/
│       │   └── completarTurnos.ts      ← FR-034
│       ├── triggers/
│       │   ├── disponibilidad.ts       ← FR-013
│       │   └── cancelarTurnosEnCascada.ts  ← FR-033
│       └── shared/
│           └── dataconnect.ts
└── specs/
    └── 001-gestion-turnos-lavado/
        ├── spec.md
        ├── functional-quality.md
        ├── plan.md                     ← este archivo
        ├── research.md
        ├── data-model.md
        ├── quickstart.md
        └── contracts/
            └── operations.gql
```

---

## Fases de implementación

### Fase 0 — Infraestructura y configuración base

**Objetivo**: Dejar el proyecto Firebase completamente configurable en local antes de
escribir ninguna feature. Todo el equipo puede levantar el entorno con un solo comando.

| ID | Tarea | Complejidad | Notas |
|---|---|---|---|
| F0-01 | Inicializar `firebase.json` con Auth + Data Connect + Firestore + Functions + Emulators | Baja | `firebase init` |
| F0-02 | Reemplazar `dataconnect/schema/schema.gql` con el schema de OpenWash (ver `data-model.md`) | Baja | Eliminar schema de películas |
| F0-03 | Crear `dataconnect/connector/` con `connector.yaml`, `queries.gql` y `mutations.gql` a partir de `contracts/operations.gql` | Baja | Reemplaza `dataconnect/example/` |
| F0-04 | Inicializar `functions/` con TypeScript y Node.js 20 | Baja | `firebase init functions` |
| F0-05 | Inicializar `frontend/` con Vite + React + TypeScript | Baja | `npm create vite@latest` |
| F0-06 | Configurar Firebase Web SDK en `frontend/src/firebase/config.ts` con detección de emuladores | Baja | Ver `quickstart.md` sección 4.1 |
| F0-07 | Verificar que `firebase emulators:start` levanta Auth + Data Connect + Firestore + Functions sin errores | Baja | Prerequisito de todo lo demás |
| F0-08 | Configurar `dataconnect/seed_data.gql` con datos de prueba iniciales | Baja | 1 admin, 3 users, 5 turnos en distintos estados |

**Dependencias**: Ninguna. Punto de partida absoluto.

**Criterio de salida**: `firebase emulators:start` levanta sin errores; el schema de
OpenWash se valida contra Data Connect emulado; la Emulator UI accesible en
`http://localhost:4000`.

---

### Fase 1 — Autenticación y control de acceso por rol (P1)

**Objetivo**: Cualquier usuario puede registrarse, iniciar sesión, mantener sesión
entre visitas, cerrar sesión, y el sistema controla el acceso a rutas por rol.

**Historias cubiertas**: US1 completa
**FRs cubiertos**: FR-001, FR-002, FR-003, FR-004, FR-005, FR-023 (verificación login), FR-033 (Cloud Function)

| ID | Tarea | Complejidad | FR |
|---|---|---|---|
| F1-01 | Mutation `RegistrarUsuario` en Data Connect | Baja | FR-001 |
| F1-02 | `AuthContext` con `onAuthStateChanged` + lectura de campo `activo` post-init | Media | FR-003, FR-023 |
| F1-03 | Pantalla `/registro`: formulario nombre/apellido/teléfono/email/contraseña, validación client-side | Media | FR-001 |
| F1-04 | Pantalla `/login`: email/contraseña, manejo de `auth/user-disabled` para cuentas desactivadas | Media | FR-002, FR-023 |
| F1-05 | Acción de logout desde `AuthContext` + redirección a `/login` | Baja | FR-004 |
| F1-06 | React Router v6: `PrivateRoute` (autenticado) y `AdminRoute` (rol admin) | Media | FR-005, FR-025, FR-032 |
| F1-07 | Redirecciones automáticas: visita a rutas de admin con rol "user" → `/mis-turnos` | Baja | FR-005 |
| F1-08 | Cloud Function Auth trigger `onUserDeleted`: cancelar en cascada todos los turnos futuros activos del usuario eliminado | Alta | FR-033 |

> **Nota sobre F1-08**: Aunque FR-033 se activa por eliminación de cuenta (FR-009 P2
> y FR-024 P3), la Cloud Function debe existir antes de que cualquier cuenta sea
> eliminada. Se implementa en Fase 1 para evitar deuda técnica.

**Dependencias**: Fase 0 completada.

**Criterio de salida**: Los 6 escenarios de aceptación de US1 pasan. La sesión persiste
entre cierres del navegador (SC sin código). Un usuario desactivado recibe error en
login sin poder acceder.

---

### Fase 2 — Reserva atómica y disponibilidad en tiempo real (P1)

**Objetivo**: El núcleo del negocio. Un cliente autenticado puede reservar un turno y
el calendario se actualiza en tiempo real para todos los clientes conectados.

**Historias cubiertas**: US2 completa
**FRs cubiertos**: FR-010, FR-011, FR-012, FR-013, FR-014, FR-015, FR-034

| ID | Tarea | Complejidad | FR |
|---|---|---|---|
| F2-01 | Mutation `CrearTurno` con operación atómica (ver `research.md` RD-002) | Alta | FR-010, FR-011, FR-014 |
| F2-02 | Cloud Function Firestore trigger `onTurnoEscrito`: al crear o cancelar turno, actualizar `disponibilidad/{fecha}/slots/{horario}` | Alta | FR-013 |
| F2-03 | Pantalla `/reservar`: selector de servicio, DatePicker, grilla de 52 slots (08:00–20:45 cada 15 min) | Alta | FR-010, FR-012 |
| F2-04 | Suscripción `onSnapshot` en `/reservar`: slots ocupados se actualizan en tiempo real sin recargar | Alta | FR-013 |
| F2-05 | Validación client-side: deshabilitar slots del día actual cuya hora ya transcurrió | Baja | FR-015 |
| F2-06 | Campos obligatorios patente y tipoVehiculo en formulario de reserva; bloquear submit si faltan | Baja | FR-011 |
| F2-07 | Cloud Scheduler cada 5 min: transición `confirmado → completado` para turnos con `fecha+horario+15min <= ahora` | Alta | FR-034 |
| F2-08 | Manejo de errores en UI: "horario ya ocupado" y "horario ya pasado" con mensajes claros | Baja | FR-014, FR-015 |

**Dependencias**: Fase 0 y Fase 1 completadas (requiere usuario autenticado).

**Criterio de salida**: Los 7 escenarios de aceptación de US2 pasan, incluyendo el
escenario de concurrencia (SC-003: 100% de intentos rechazados). El scheduler
transiciona turnos correctamente en el emulador.

---

### Fase 3 — Ver turnos propios y cancelación (P2)

**Objetivo**: El cliente puede consultar sus turnos próximos e historial, y cancelar
los que todavía lo permiten por la regla de 30 minutos.

**Historias cubiertas**: US3 completa
**FRs cubiertos**: FR-016, FR-017, FR-018, FR-019

| ID | Tarea | Complejidad | FR |
|---|---|---|---|
| F3-01 | Query `ObtenerTurnosPropios` en Data Connect (todos los turnos del usuario, sin filtro de estado) | Baja | FR-018, FR-019 |
| F3-02 | Hook `useTurnosPropios`: aplica reglas de clasificación próximos/historial en cliente | Media | FR-018, FR-019 |
| F3-03 | Pantalla `/mis-turnos`: sección "Próximos" y sección "Historial", ordenados por fecha/hora ASC | Media | FR-018, FR-019 |
| F3-04 | Hook `usePuedeCancelar(turno)`: evalúa `fecha+hora - ahora > 30 min` AND `estado ∈ {pendiente, confirmado}` | Baja | FR-016, FR-017 |
| F3-05 | Mutation `CancelarTurnoPropio` en Data Connect | Baja | FR-016 |
| F3-06 | UI: botón "Cancelar" visible solo cuando `usePuedeCancelar` devuelve `true` | Baja | FR-017 |
| F3-07 | Estado vacío: mensaje "No tenés turnos" cuando la lista está vacía, sin errores | Baja | US3-escenario-3 |

**Dependencias**: Fase 2 completada.

**Criterio de salida**: Los 3 escenarios de aceptación de US3 pasan. El botón cancelar
aparece y desaparece correctamente según la regla de 30 min.

---

### Fase 4 — Perfil y gestión de cuenta propia (P2)

**Objetivo**: El cliente puede ver y editar sus datos personales, cambiar contraseña y
eliminar su propia cuenta.

**Historias cubiertas**: US4 completa
**FRs cubiertos**: FR-006, FR-007, FR-008, FR-009

| ID | Tarea | Complejidad | FR |
|---|---|---|---|
| F4-01 | Query `ObtenerPerfilPropio` en Data Connect | Baja | FR-006 |
| F4-02 | Pantalla `/perfil`: mostrar nombre, apellido, teléfono, email (read-only) | Baja | FR-006 |
| F4-03 | Mutation `ActualizarPerfilPropio`: editar nombre, apellido, teléfono | Baja | FR-007 |
| F4-04 | Cambio de contraseña: `updatePassword` de Firebase Auth (requiere re-autenticación con `reauthenticateWithCredential`) | Media | FR-008 |
| F4-05 | Eliminar cuenta: `deleteUser` de Firebase Auth → Auth trigger (F1-08) cancela turnos activos automáticamente | Media | FR-009, FR-033 |
| F4-06 | Campo email: no renderizar como input editable en el formulario de perfil | Baja | FR-007, Assumptions-6 |
| F4-07 | Confirmación explícita antes de eliminar cuenta (modal de confirmación) | Baja | FR-009 |

**Dependencias**: Fase 1 completada. F4-05 requiere F1-08 (Cloud Function de
cancelación en cascada).

**Criterio de salida**: Los 4 escenarios de aceptación de US4 pasan. Tras eliminar la
cuenta, no es posible iniciar sesión con esas credenciales.

---

### Fase 5 — Panel admin: gestión de usuarios (P3)

**Objetivo**: El administrador puede listar, editar, cambiar rol, activar/desactivar y
eliminar cualquier cuenta de usuario.

**Historias cubiertas**: US5 completa
**FRs cubiertos**: FR-020, FR-021, FR-022, FR-023, FR-024, FR-025

| ID | Tarea | Complejidad | FR |
|---|---|---|---|
| F5-01 | Query `ObtenerUsuariosAdmin` en Data Connect | Baja | FR-020 |
| F5-02 | Pantalla `/admin/usuarios`: tabla con nombre, apellido, email, teléfono, rol, estado activo/inactivo | Media | FR-020 |
| F5-03 | Mutation `ActualizarDatosUsuario` (admin): editar nombre, apellido, teléfono de cualquier usuario | Baja | FR-021 |
| F5-04 | Mutation `CambiarRolUsuario`: alternar user ↔ admin | Baja | FR-022 |
| F5-05 | Mutation `SetActivoUsuario` + Cloud Function callable que ejecuta `admin.auth().updateUser(uid, { disabled: true/false })` | Alta | FR-023 |
| F5-06 | Cloud Function callable `eliminarUsuarioAdmin`: `admin.auth().deleteUser(uid)` + `EliminarCuentaAdmin` mutation → Auth trigger cancela turnos | Alta | FR-024, FR-033 |
| F5-07 | `AdminRoute` ya implementado en Fase 1 cubre el acceso a `/admin/usuarios` | — | FR-025 |

> **Nota F5-05 y F5-06**: Cualquier operación que usa Firebase Admin SDK debe
> ejecutarse desde Cloud Functions, no desde el cliente. El frontend llama a una
> Cloud Function callable (HTTPS) que internamente usa Admin SDK.

**Dependencias**: Fase 1 y Fase 4 completadas.

**Criterio de salida**: Los 6 escenarios de aceptación de US5 pasan. Un usuario
desactivado recibe `auth/user-disabled` al intentar login.

---

### Fase 6 — Panel admin: gestión de turnos (P3)

**Objetivo**: El administrador puede listar todos los turnos, filtrarlos, cambiar
estados, cancelar y buscar por cliente o patente.

**Historias cubiertas**: US6 completa
**FRs cubiertos**: FR-026, FR-027, FR-028, FR-029, FR-030, FR-031, FR-032

| ID | Tarea | Complejidad | FR |
|---|---|---|---|
| F6-01 | Query `ObtenerTurnosAdmin` con filtros opcionales fecha/estado/servicio | Media | FR-026, FR-027 |
| F6-02 | Pantalla `/admin/turnos`: tabla con cliente, patente, tipoVehiculo, servicio, fecha, hora, estado | Media | FR-026 |
| F6-03 | Controles de filtro en UI: date picker, select de estado, select de servicio | Media | FR-027 |
| F6-04 | Mutation `CambiarEstadoTurno` (admin): transiciones válidas con validación en hook antes del call | Media | FR-028 |
| F6-05 | Mutation `CancelarTurnoAdmin` + Cloud Function trigger actualiza disponibilidad en Firestore | Media | FR-029 |
| F6-06 | Query `BuscarTurnosPorFecha` (covered por F6-01 con filtro $fecha) | Baja | FR-030 |
| F6-07 | Query `BuscarTurnosPorClienteOPatente`: input de búsqueda libre, coincidencia parcial insensible a mayúsculas y acentos | Media | FR-031 |
| F6-08 | `AdminRoute` ya implementado en Fase 1 cubre el acceso a `/admin/turnos` | — | FR-032 |

**Dependencias**: Fase 2 y Fase 5 completadas.

**Criterio de salida**: Los 6 escenarios de aceptación de US6 pasan. Los filtros
combinados retornan resultados correctos. La búsqueda por nombre parcial (case-insensitive)
funciona (SC-005: localizar turno < 10 seg).

---

## Mapa de dependencias entre fases

```
Fase 0 (Infraestructura)
  └── Fase 1 (Auth + control de acceso)                 [P1]
          ├── Fase 2 (Reservas + disponibilidad)         [P1]
          │       └── Fase 3 (Ver turnos + cancelación)  [P2]
          │
          └── Fase 4 (Perfil + cuenta)                   [P2]
                  └── Fase 5 (Admin usuarios)            [P3]
                          └── Fase 6 (Admin turnos)      [P3]
                                  ↑
                          (también requiere Fase 2)
```

---

## Orden recomendado de desarrollo

| Semana | Fase(s) | Entregable testeable |
|---|---|---|
| 1 | F0 + F1 | Registro, login, sesión persistente, logout, rutas protegidas por rol |
| 2 | F2 parte 1: schema + mutations + Firestore trigger | Schema validado en emulador; trigger de disponibilidad funcionando |
| 3 | F2 parte 2: pantalla `/reservar` + scheduler | Reserva completa con bloqueo en tiempo real; completado automático |
| 4 | F3 + F4 | Mis turnos, historial, cancelación, perfil completo |
| 5 | F5 | Panel admin usuarios funcional con desactivación real (Firebase Auth disabled) |
| 6 | F6 + testing integral | Panel admin turnos; suite completa de tests ejecutando en CI |

---

## Estimación de complejidad por feature

| Feature | Complejidad global | Riesgo principal |
|---|---|---|
| Auth + sesión (F1) | Media | Bloqueo de cuenta desactivada: verificar `activo` en cada `onAuthStateChanged`, no solo en login. Ver `research.md` RD-006 |
| Operación atómica `CrearTurno` (F2-01) | **Alta** | Data Connect puede no soportar lógica condicional nativa en mutations; puede requerir Cloud Function callable intermedia. Ver `research.md` RD-002 |
| Disponibilidad en tiempo real (F2-02, F2-04) | **Alta** | Sincronización entre Data Connect (source of truth) y Firestore (proyección real-time); desincronización posible ante fallo de la Cloud Function |
| Cloud Scheduler completado automático (F2-07) | Alta | Granularidad de 5 min genera ventana de hasta 5 min de inconsistencia; comportamiento conocido y aceptado en v1.0 |
| Cancelación en cascada al eliminar cuenta (F1-08) | Alta | Auth trigger `onUserDeleted` es asíncrono; existe lag entre eliminación y cancelación de turnos |
| Búsqueda parcial case-insensitive (F6-07) | Media | Requiere `pg_trgm` o `ILIKE` en PostgreSQL; verificar soporte en Cloud SQL. Ver `research.md` RD-003 |
| Panel admin usuarios (F5) | Media | Eliminación y desactivación requieren Firebase Admin SDK en Cloud Functions, no desde cliente |
| Panel admin turnos (F6) | Media | Filtros múltiples combinados; query con `_and` de campos opcionales en Data Connect |

---

## Trazabilidad FR ↔ Fase

| FR | Título | Fase |
|---|---|---|
| FR-001 | Registro | F1 |
| FR-002 | Login | F1 |
| FR-003 | Sesión persistente | F1 |
| FR-004 | Logout | F1 |
| FR-005 | Control de acceso por rol | F1 |
| FR-006 | Ver perfil | F4 |
| FR-007 | Editar perfil | F4 |
| FR-008 | Cambiar contraseña | F4 |
| FR-009 | Eliminar cuenta propia | F4 |
| FR-010 | Crear turno | F2 |
| FR-011 | Datos obligatorios vehículo | F2 |
| FR-012 | Grilla de slots 15 min | F2 |
| FR-013 | Disponibilidad en tiempo real | F2 |
| FR-014 | Operación atómica + máquina de estados | F2 |
| FR-015 | Impedir horario pasado | F2 |
| FR-016 | Cancelar turno propio | F3 |
| FR-017 | Impedir cancelar < 30 min | F3 |
| FR-018 | Ver turnos próximos | F3 |
| FR-019 | Ver historial | F3 |
| FR-020 | Listar usuarios (admin) | F5 |
| FR-021 | Editar datos usuario (admin) | F5 |
| FR-022 | Cambiar rol (admin) | F5 |
| FR-023 | Desactivar cuenta (admin) + verificación login | F1 + F5 |
| FR-024 | Eliminar cuenta (admin) | F5 |
| FR-025 | Ruta protegida /admin/usuarios | F1 |
| FR-026 | Listar turnos (admin) | F6 |
| FR-027 | Filtros (admin) | F6 |
| FR-028 | Cambiar estado turno (admin) | F6 |
| FR-029 | Cancelar turno (admin) | F6 |
| FR-030 | Buscar por fecha (admin) | F6 |
| FR-031 | Buscar por cliente o patente (admin) | F6 |
| FR-032 | Ruta protegida /admin/turnos | F1 |
| FR-033 | Cancelación en cascada al eliminar cuenta | F1 |
| FR-034 | Completado automático a los 15 min | F2 |
