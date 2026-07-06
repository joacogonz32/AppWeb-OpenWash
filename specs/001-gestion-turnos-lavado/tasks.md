# Tasks — 001-gestion-turnos-lavado

**Proyecto**: Open Wash
**Feature**: Gestión de Turnos
**Spec**: `specs/001-gestion-turnos-lavado/spec.md`
**Plan**: `specs/001-gestion-turnos-lavado/plan.md`
**Fecha**: 2026-07-06
**Estado**: Draft — generado por speckit.tasks

---

## Convenciones

- **[P]**: tarea paralelizable con otras tareas de la misma fase que también tengan [P].
- **Depende de**: IDs de tareas que deben completarse antes de iniciar esta.
- **FR / US**: referencia al requisito funcional o historia de usuario en `spec.md`.
- Las tareas no incluyen implementación de código; describen **qué** crear o modificar y
  **en qué archivos**, listo para ejecutarse en la siguiente etapa.

---

## Resumen de tareas por fase

| Fase | Tareas | Total |
|---|---|---|
| Fase 0 — Infraestructura Firebase | T001–T008 | 8 |
| Fase 1 — Schema Data Connect | T009–T013 | 5 |
| Fase 2 — Operaciones Data Connect | T014–T025 | 12 |
| Fase 3 — Cloud Functions | T026–T030 | 5 |
| Fase 4 — Setup del frontend | T031–T035 | 5 |
| Fase 5 — Feature: Autenticación | T036–T039 | 4 |
| Fase 6 — Feature: Reservas | T040–T044 | 5 |
| Fase 7 — Feature: Mis turnos y perfil | T045–T049 | 5 |
| Fase 8 — Feature: Panel admin | T050–T055 | 6 |
| Fase 9 — Testing | T056–T062 | 7 |
| Fase 10 — Validación end-to-end | T063–T066 | 4 |
| **Total** | | **66** |

---

## Fase 0 — Infraestructura Firebase y configuración base

> Objetivo: dejar el entorno completamente configurable en local antes de escribir
> ninguna feature. Corresponde a `plan.md` Fase 0, tareas F0-01 a F0-08.
> Criterio de salida: `firebase emulators:start` levanta sin errores.

---

### T001 — Inicializar firebase.json con todos los servicios

**Archivos a crear/modificar**:
- `firebase.json`
- `.firebaserc`

**Descripción**: Crear `firebase.json` habilitando los servicios Auth, Data Connect,
Firestore y Functions. Configurar `.firebaserc` con el alias del proyecto
`appweb-openwash`. El campo `"default"` de `.firebaserc` debe apuntar al proyecto
`appweb-openwash`.

**FR / US**: infraestructura base
**Depende de**: —

---

### T002 — Configurar sección emulators en firebase.json

**Archivos a crear/modificar**:
- `firebase.json` (sección `emulators`)

**Descripción**: Agregar la sección `emulators` en `firebase.json` con los puertos
definidos en `quickstart.md` sección 3.2:
- Auth → 9099
- Data Connect → 9399
- Firestore → 8080
- Functions → 5001
- Emulator UI → 4000

Habilitar `singleProjectMode: true` para desarrollo local con `demo-openwash`.

**FR / US**: infraestructura base — `quickstart.md` sección 3.2
**Depende de**: T001

---

### T003 — Reemplazar dataconnect/schema/schema.gql con esqueleto OpenWash

**Archivos a crear/modificar**:
- `dataconnect/schema/schema.gql` (eliminar contenido de ejemplo de películas, dejar
  archivo listo para recibir los tipos de OpenWash en Fase 1)

**Descripción**: Eliminar completamente el schema de ejemplo (tipos `User`, `Movie`,
`MovieMetadata`, `Review`). Dejar el archivo con solo el comentario de cabecera que
indica que el contenido se completa en T009–T011.

**FR / US**: infraestructura base — `data-model.md` sección 1
**Depende de**: T001

---

### T004 — Crear dataconnect/connector/ reemplazando dataconnect/example/

**Archivos a crear**:
- `dataconnect/connector/connector.yaml`
- `dataconnect/connector/queries.gql` (vacío, listo para T014–T019)
- `dataconnect/connector/mutations.gql` (vacío, listo para T020–T025)

**Descripción**: Crear la carpeta `dataconnect/connector/` que reemplazará a
`dataconnect/example/`. El `connector.yaml` debe referenciar el `serviceId`
`appweb-openwash` definido en `dataconnect/dataconnect.yaml`. Los archivos `.gql`
quedan vacíos con comentarios de cabecera que indican que el contenido se completa en
Fase 2.

**FR / US**: infraestructura base — `contracts/operations.gql`
**Depende de**: T001

---

### T005 — Inicializar functions/ con TypeScript y Node.js 20

**Archivos a crear**:
- `functions/package.json`
- `functions/tsconfig.json`
- `functions/src/index.ts` (vacío con exports pendientes)
- `functions/.eslintrc.js`
- `functions/.gitignore`

**Descripción**: Inicializar el directorio de Cloud Functions con TypeScript y Node.js
20. El `package.json` debe incluir `firebase-functions`, `firebase-admin` como
dependencias, y `typescript`, `ts-node`, `jest`, `firebase-functions-test` como
devDependencies. El `tsconfig.json` debe apuntar a `"outDir": "./lib"` y target `es2020`.
Agregar scripts: `build`, `build:watch`, `test`.

**FR / US**: infraestructura base — `plan.md` F0-04
**Depende de**: T001

---

### T006 — Inicializar frontend/ con Vite + React + TypeScript

**Archivos a crear**:
- `frontend/package.json`
- `frontend/vite.config.ts`
- `frontend/index.html`
- `frontend/tsconfig.json`
- `frontend/tsconfig.node.json`
- `frontend/src/main.tsx`
- `frontend/src/App.tsx`
- `frontend/.gitignore`

**Descripción**: Inicializar el frontend con Vite + React + TypeScript. El
`package.json` debe incluir `react`, `react-dom`, `react-router-dom`, `firebase`
(Web SDK v10+) como dependencias; y `vite`, `@vitejs/plugin-react`, `typescript`,
`vitest`, `@testing-library/react`, `playwright` como devDependencies. Agregar
scripts: `dev`, `build`, `preview`, `test`, `test:e2e`.

**FR / US**: infraestructura base — `plan.md` F0-05
**Depende de**: T001

---

### T007 — Crear package.json raíz con scripts npm unificados

**Archivos a crear**:
- `package.json` (raíz del repo)
- `scripts/seed.js` (placeholder vacío, a completar en T013)

**Descripción**: Crear el `package.json` raíz con todos los scripts definidos en
`quickstart.md` sección 7: `emulators`, `emulators:seed`, `emulators:import`,
`emulators:export`, `seed`, `test:frontend`, `test:functions`, `test:dataconnect`,
`test:e2e`, `test:all`. Cada script referencia el workspace o directorio correcto.

**FR / US**: infraestructura base — `quickstart.md` sección 7
**Depende de**: T005, T006

---

### T008 — Verificar levantamiento del emulador con schema vacío

**Archivos a modificar**: ninguno (tarea de validación)

**Descripción**: Validar manualmente que `firebase emulators:start` levanta Auth,
Data Connect, Firestore y Functions sin errores con el schema vacío de T003 y el
conector vacío de T004. Confirmar que la Emulator UI es accesible en
`http://localhost:4000`. Documentar cualquier error de configuración encontrado.

**FR / US**: `quickstart.md` sección 3.1
**Depende de**: T001, T002, T003, T004, T005

---

## Fase 1 — Schema de Data Connect y modelo de datos

> Objetivo: definir el schema relacional completo de OpenWash en Data Connect
> (PostgreSQL). Corresponde a `plan.md` Fase 0 tareas F0-02 y F0-08.
> Criterio de salida: `firebase emulators:start` valida el schema sin errores de tipo.
> Fuente de verdad: `data-model.md` secciones 1.1, 1.2, 1.3.

---

### T009 — Escribir tipo Usuario en schema.gql

**Archivos a modificar**:
- `dataconnect/schema/schema.gql`

**Descripción**: Agregar el tipo `Usuario` con todos los atributos definidos en
`data-model.md` sección 1.1:
- `uid: String!` con `@default(expr: "auth.uid")`
- `nombre: String!` con `@col(dataType: "varchar(100)")`
- `apellido: String!` con `@col(dataType: "varchar(100)")`
- `email: String!` con `@col(dataType: "varchar(255)")` y `@unique`
- `telefono: String!` con `@col(dataType: "varchar(30)")`
- `rol: String!` con `@col(dataType: "varchar(10)")` y `@default(value: "user")`
- `activo: Boolean!` con `@default(value: true)`
- Directiva `@table(name: "usuarios")`
- Comentario indicando la relación inversa generada `turnos_on_usuario: [Turno!]!`

**FR / US**: FR-001 (email único), FR-005 (rol), FR-023 (activo)
**Depende de**: T003

---

### T010 — Escribir tipo Turno en schema.gql

**Archivos a modificar**:
- `dataconnect/schema/schema.gql`

**Descripción**: Agregar el tipo `Turno` con todos los atributos definidos en
`data-model.md` sección 1.2:
- `id: UUID!` con `@default(expr: "uuidV4()")`
- `usuario: Usuario!` (FK generada como `usuarioUid`)
- `servicio: String!` con `@col(dataType: "varchar(20)")`
- `fecha: Date!`
- `horario: String!` con `@col(dataType: "varchar(5)")`
- `estado: String!` con `@col(dataType: "varchar(20)")` y `@default(value: "pendiente")`
- `patente: String!` con `@col(dataType: "varchar(10)")`
- `tipoVehiculo: String!` con `@col(dataType: "varchar(15)")`
- `creadoEn: Timestamp!` con `@default(expr: "request.time")`
- Directiva `@table(name: "turnos")`
- Nota sobre vehículo embebido (`data-model.md` sección 1.2)

**FR / US**: FR-010, FR-011, FR-014 — `data-model.md` sección 1.2
**Depende de**: T009

---

### T011 — Documentar CHECK constraints como comentarios en schema.gql

**Archivos a modificar**:
- `dataconnect/schema/schema.gql`

**Descripción**: Agregar comentarios sobre los campos `servicio`, `estado` y
`tipoVehiculo` del tipo `Turno`, y sobre `rol` del tipo `Usuario`, indicando los
valores válidos (CHECK constraints) según `data-model.md` sección 1.2. Estos
comentarios guiarán la validación en el application layer hasta que Data Connect
soporte CHECK nativo.

```
# CHECK: servicio IN ('Básico', 'Completo', 'Premium')
# CHECK: estado IN ('pendiente', 'confirmado', 'completado', 'cancelado')
# CHECK: tipoVehiculo IN ('auto', 'camioneta', 'moto')
# CHECK: rol IN ('user', 'admin')
```

**FR / US**: FR-010, FR-011 — `data-model.md` sección 1.2
**Depende de**: T010

---

### T012 — Documentar índices requeridos como comentarios en schema.gql

**Archivos a modificar**:
- `dataconnect/schema/schema.gql`

**Descripción**: Agregar un bloque de comentarios al inicio del schema documentando
los 7 índices necesarios según `data-model.md` sección 1.3 y `research.md` RD-003:

| Índice | Columnas | Tipo | FR |
|---|---|---|---|
| `idx_turnos_fecha_horario` | `(fecha, horario)` | BTREE compuesto | FR-014 |
| `idx_turnos_usuarioid` | `(usuarioUid)` | BTREE | FR-018, FR-019 |
| `idx_turnos_estado` | `(estado)` | BTREE | FR-027 |
| `idx_turnos_fecha` | `(fecha)` | BTREE | FR-030 |
| `idx_turnos_patente` | `(patente)` | GIN + `pg_trgm` | FR-031 |
| `uq_usuarios_email` | `(email)` | UNIQUE (ya en @unique) | FR-001 |
| `idx_usuarios_nombre_apellido` | `(LOWER(nombre), LOWER(apellido))` | GIN + `pg_trgm` | FR-031 |

Incluir nota sobre verificación de `pg_trgm` en Cloud SQL (`research.md` RD-003).

**FR / US**: FR-014, FR-018, FR-019, FR-027, FR-030, FR-031
**Depende de**: T010

---

### T013 — Escribir seed_data.gql con datos de prueba

**Archivos a modificar**:
- `dataconnect/seed_data.gql`
- `scripts/seed.js` (completar el placeholder de T007)

**Descripción**: Reemplazar el contenido de ejemplo de `seed_data.gql` con los
datos de prueba definidos en `quickstart.md` sección 3.4:

| Registro | Email / detalle | Estado |
|---|---|---|
| Usuario admin | `admin@openwash.com` | activo, rol admin |
| Usuario cliente 1 | `cliente1@openwash.com` | activo, rol user |
| Usuario cliente 2 | `cliente2@openwash.com` | activo, rol user |
| Usuario inactivo | `inactivo@openwash.com` | activo=false — test FR-023 |
| Turno `confirmado` futuro | cliente1, Básico, fecha futura | — |
| Turno `confirmado` futuro | cliente2, Premium, fecha futura distinta | — |
| Turno `pendiente` futuro | cliente1, Completo | — |
| Turno `completado` pasado | cliente1 | — historial FR-019 |
| Turno `cancelado` | cliente2 | — historial FR-019 |

Actualizar `scripts/seed.js` para ejecutar el seed via Firebase Emulator REST API.

**FR / US**: `quickstart.md` sección 3.4 — FR-019, FR-023
**Depende de**: T010, T007

---

## Fase 2 — Operaciones Data Connect

> Objetivo: implementar todas las queries y mutations del conector según
> `contracts/operations.gql`. Corresponde a `plan.md` Fase 0 tarea F0-03.
> Las tareas T015–T019 y T021–T025 son paralelizables entre sí.
> Criterio de salida: todas las operaciones se validan en el emulador de Data Connect.

---

### T014 — Query ObtenerPerfilPropio

**Archivos a modificar**:
- `dataconnect/connector/queries.gql`

**Descripción**: Implementar la query `ObtenerPerfilPropio` con `@auth(level: USER)`,
filtrada por `key: { uid_expr: "auth.uid" }`. Retorna uid, nombre, apellido, email,
telefono, rol, activo. Ver `contracts/operations.gql`.

**FR / US**: FR-006 — US4
**Depende de**: T009, T004

---

### T015 [P] — Query ObtenerTurnosPropios

**Archivos a modificar**:
- `dataconnect/connector/queries.gql`

**Descripción**: Implementar la query `ObtenerTurnosPropios` con `@auth(level: USER)`,
`where: { usuarioUid: { eq_expr: "auth.uid" } }` y `orderBy: [{ fecha: ASC }, { horario: ASC }]`.
Retorna todos los campos del turno sin filtrar por estado (la clasificación
próximos/historial se aplica en el cliente). Ver `data-model.md` sección 4 nota de
implementación.

**FR / US**: FR-018, FR-019 — US3
**Depende de**: T010, T004

---

### T016 [P] — Query ObtenerUsuariosAdmin

**Archivos a modificar**:
- `dataconnect/connector/queries.gql`

**Descripción**: Implementar la query `ObtenerUsuariosAdmin` con `@auth(level: USER)`,
`orderBy: [{ apellido: ASC }, { nombre: ASC }]`. Retorna todos los campos de usuario.
Agregar comentario indicando que la verificación de rol admin se realiza en `AdminRoute`
(no en la query; ver `data-model.md` sección 1.4).

**FR / US**: FR-020 — US5
**Depende de**: T009, T004

---

### T017 [P] — Query ObtenerTurnosAdmin

**Archivos a modificar**:
- `dataconnect/connector/queries.gql`

**Descripción**: Implementar la query `ObtenerTurnosAdmin($fecha, $estado, $servicio)`
con variables opcionales y filtros combinados usando `_and`. Incluir join con el objeto
`usuario` (uid, nombre, apellido, email). `orderBy: [{ fecha: ASC }, { horario: ASC }]`.
Variables opcionales: si son null, el filtro se ignora.

**FR / US**: FR-026, FR-027 — US6
**Depende de**: T010, T004

---

### T018 [P] — Query BuscarTurnosPorFecha

**Archivos a modificar**:
- `dataconnect/connector/queries.gql`

**Descripción**: Implementar la query `BuscarTurnosPorFecha($fecha: Date!)` con
`where: { fecha: { eq: $fecha } }` y `orderBy: [{ horario: ASC }]`. Incluir join con
usuario. Agregar comentario de trazabilidad a FR-030 (cubierto también por
`ObtenerTurnosAdmin` con `$fecha` no nulo; se mantiene como query independiente por
claridad de contrato).

**FR / US**: FR-030 — US6
**Depende de**: T010, T004

---

### T019 [P] — Query BuscarTurnosPorClienteOPatente

**Archivos a modificar**:
- `dataconnect/connector/queries.gql`

**Descripción**: Implementar la query `BuscarTurnosPorClienteOPatente($textoBusqueda: String!)`
con `where: { _or: [{ patente: { contains: $textoBusqueda } }, { usuario: { nombre: { contains: $textoBusqueda } } }, { usuario: { apellido: { contains: $textoBusqueda } } }] }`.
Agregar nota sobre coincidencia parcial case-insensitive y la dependencia de `pg_trgm`
(`research.md` RD-003). Documentar comportamiento esperado vs. comportamiento del
emulador local (pueden diferir).

**FR / US**: FR-031 — US6 escenario 5
**Depende de**: T010, T004

---

### T020 — Mutation RegistrarUsuario

**Archivos a modificar**:
- `dataconnect/connector/mutations.gql`

**Descripción**: Implementar la mutation `RegistrarUsuario($nombre, $apellido, $email, $telefono)`
con `usuario_insert` usando `uid_expr: "auth.uid"`, `rol: "user"`, `activo: true`.
Los campos rol y activo no se reciben como parámetros del cliente. Ver
`contracts/operations.gql`.

**FR / US**: FR-001 — US1 escenario 1
**Depende de**: T009, T004

---

### T021 [P] — Mutation ActualizarPerfilPropio

**Archivos a modificar**:
- `dataconnect/connector/mutations.gql`

**Descripción**: Implementar la mutation `ActualizarPerfilPropio($nombre, $apellido, $telefono)`
con `usuario_update` usando `key: { uid_expr: "auth.uid" }`. Solo actualiza nombre,
apellido y teléfono. Agregar comentario explícito: "email NO es editable
(Assumptions-6, FR-007)".

**FR / US**: FR-007 — US4 escenario 1
**Depende de**: T009, T004

---

### T022 [P] — Mutation CrearTurno

**Archivos a modificar**:
- `dataconnect/connector/mutations.gql`

**Descripción**: Implementar la mutation `CrearTurno($servicio, $fecha, $horario, $patente, $tipoVehiculo)`
con `turno_insert` usando `usuarioUid_expr: "auth.uid"` y `estado: "confirmado"`.
Agregar bloque de comentario prominente:

```
# ACCIÓN PENDIENTE — research.md RD-002:
# Verificar en Fase 2 si Data Connect soporta INSERT ... WHERE NOT EXISTS
# para la operación atómica de FR-014. Si no soporta lógica condicional
# nativa, esta mutation debe reemplazarse por una Cloud Function callable.
```

**FR / US**: FR-010, FR-011, FR-014 — US2 escenario 1
**Depende de**: T010, T004

---

### T023 [P] — Mutation CancelarTurnoPropio

**Archivos a modificar**:
- `dataconnect/connector/mutations.gql`

**Descripción**: Implementar la mutation `CancelarTurnoPropio($turnoId: UUID!)` con
`turno_update` actualizando `estado: "cancelado"`. Agregar nota: "la precondición
de regla de 30 min se valida en el hook `usePuedeCancelar` antes de llamar esta
mutation (FR-016, FR-017). Verificar si Data Connect permite añadir `WHERE usuarioUid = auth.uid`
para evitar cancelación de turno ajeno."

**FR / US**: FR-016 — US2 escenario 5, US3
**Depende de**: T010, T004

---

### T024 [P] — Mutation EliminarCuentaPropia

**Archivos a modificar**:
- `dataconnect/connector/mutations.gql`

**Descripción**: Implementar la mutation `EliminarCuentaPropia` (sin parámetros) con
`usuario_delete` usando `key: { uid_expr: "auth.uid" }`. Documentar el flujo completo
de 4 pasos definido en `contracts/operations.gql` (modal → mutation → `deleteUser()`
→ Auth trigger → FR-033).

**FR / US**: FR-009 — US4 escenario 3
**Depende de**: T009, T004

---

### T025 [P] — Mutations de administrador

**Archivos a modificar**:
- `dataconnect/connector/mutations.gql`

**Descripción**: Implementar las 6 mutations de admin según `contracts/operations.gql`:

1. `ActualizarDatosUsuario($uid, $nombre, $apellido, $telefono)` — FR-021
2. `CambiarRolUsuario($uid, $rol)` — FR-022
3. `SetActivoUsuario($uid, $activo)` — FR-023 (solo actualiza campo en Data Connect;
   el bloqueo real requiere Cloud Function callable, ver T030)
4. `EliminarCuentaAdmin($uid)` — FR-024
5. `CambiarEstadoTurno($turnoId, $nuevoEstado)` — FR-028 (las transiciones válidas se
   validan en el hook `useTransicionesValidas` antes del call)
6. `CancelarTurnoAdmin($turnoId)` — FR-029

Para cada mutation: agregar comentario con el FR y la restricción de rol admin.

**FR / US**: FR-021, FR-022, FR-023, FR-024, FR-028, FR-029 — US5, US6
**Depende de**: T009, T010, T004

---

## Fase 3 — Cloud Functions

> Objetivo: especificar (crear archivos con estructura y comentarios jsdoc completos,
> sin lógica implementada) las cinco Cloud Functions del sistema.
> Corresponde a `plan.md` Fase 1 (F1-08), Fase 2 (F2-02, F2-07), Fase 5 (F5-05, F5-06).
> Las tareas T027–T030 son paralelizables entre sí.
> Criterio de salida: `functions/src/index.ts` exporta todas las funciones sin errores
> de compilación TypeScript.

---

### T026 — Crear estructura de carpetas y archivos de Cloud Functions

**Archivos a crear**:
- `functions/src/schedulers/completarTurnos.ts`
- `functions/src/triggers/disponibilidad.ts`
- `functions/src/triggers/cancelarTurnosEnCascada.ts`
- `functions/src/shared/dataconnect.ts`
- Actualizar `functions/src/index.ts` para exportar todas las funciones

**Descripción**: Crear la estructura de carpetas definitiva de `functions/src/` y los
archivos vacíos (con comentarios de cabecera) listos para implementar en cada tarea
siguiente. `functions/src/index.ts` debe tener los imports y exports de cada función
con `// TODO: implementar` en el cuerpo. `functions/src/shared/dataconnect.ts` expone
el cliente de Data Connect para uso interno de las funciones.

**FR / US**: infraestructura functions — `plan.md` Fase 1 F1-08
**Depende de**: T005

---

### T027 — Especificar Auth trigger: cancelación en cascada al eliminar cuenta

**Archivos a modificar**:
- `functions/src/triggers/cancelarTurnosEnCascada.ts`

**Descripción**: Definir la Cloud Function Auth trigger `onUserDeleted`. Documentar
con jsdoc:
- **Trigger**: `functions.auth.user().onDeleted()`
- **FR**: FR-033
- **Lógica**: consultar todos los turnos del usuario eliminado con
  `estado IN ('pendiente', 'confirmado')` y `fecha >= hoy`, ejecutar
  `CancelarTurnosFuturosDeUsuario` (mutation definida en `contracts/operations.gql`
  sección operaciones internas)
- **Idempotencia**: la función es segura de ejecutar múltiples veces
- **Edge case**: los turnos en estado `completado` o `cancelado` no se modifican (FR-033)

**FR / US**: FR-033 — US4 escenario 3, US5 escenario 5
**Depende de**: T026, T023

---

### T028 [P] — Especificar Firestore trigger: actualizar disponibilidad de slots

**Archivos a modificar**:
- `functions/src/triggers/disponibilidad.ts`

**Descripción**: Definir la Cloud Function Firestore trigger `onDocumentWritten` sobre
la tabla de turnos en Data Connect. Documentar con jsdoc:
- **Trigger**: detectar escritura en tabla `turnos` (nuevo turno o cambio de estado)
- **FR**: FR-013
- **Lógica al crear turno `confirmado`**: escribir `disponibilidad/{fecha}/slots/{HH:MM}`
  con `{ ocupado: true, turnoId: id }`
- **Lógica al cancelar turno**: escribir `{ ocupado: false, turnoId: null }` en el
  slot correspondiente
- **Idempotencia**: segura de re-ejecutar
- **Nota**: solo Cloud Functions usan Admin SDK para escribir en Firestore (ver
  Security Rules en `data-model.md` sección 2)

**FR / US**: FR-013 — US2 escenario 3
**Depende de**: T026, T022

---

### T029 [P] — Especificar Cloud Scheduler: completado automático a los 15 min

**Archivos a modificar**:
- `functions/src/schedulers/completarTurnos.ts`

**Descripción**: Definir la Cloud Function `onSchedule` que corre cada 5 minutos.
Documentar con jsdoc:
- **Schedule**: `every 5 minutes`
- **FR**: FR-034
- **Lógica**: consultar turnos con `estado = 'confirmado'` cuya
  `fecha + horario + 15 minutos <= CURRENT_TIMESTAMP` en zona horaria
  `America/Argentina/Buenos_Aires`, actualizar estado a `'completado'`
- **Ventana de inconsistencia**: hasta 5 min (documentada en `research.md` RD-004,
  `quickstart.md` sección 8)
- **Nota**: no actualizar Firestore al completar (slots de horas pasadas no se
  consultan para nuevas reservas)

**FR / US**: FR-034 — `research.md` RD-004
**Depende de**: T026, T022

---

### T030 [P] — Especificar Cloud Functions callables: Admin SDK para gestión de cuentas

**Archivos a modificar**:
- `functions/src/index.ts`

**Descripción**: Definir dos Cloud Functions HTTPS callables que usan Firebase Admin
SDK (no accesibles desde el cliente directamente):

1. **`setActivoUsuario`**: recibe `{ uid, activo: boolean }`. Ejecuta
   `admin.auth().updateUser(uid, { disabled: !activo })` Y la mutation
   `SetActivoUsuario` en Data Connect. Verificar que el caller tiene rol admin
   antes de ejecutar. FR-023, `research.md` RD-006.

2. **`eliminarUsuarioAdmin`**: recibe `{ uid }`. Ejecuta
   `admin.auth().deleteUser(uid)` Y la mutation `EliminarCuentaAdmin`. El Auth
   trigger `onUserDeleted` (T027) maneja la cancelación de turnos en cascada
   automáticamente. FR-024, FR-033.

Documentar con jsdoc las precondiciones, lógica, errores esperados y FR de cada función.

**FR / US**: FR-023, FR-024, FR-033 — US5 escenarios 4, 5 — `research.md` RD-006
**Depende de**: T026

---

## Fase 4 — Setup del frontend

> Objetivo: dejar la infraestructura del frontend lista para recibir las features.
> Corresponde a `plan.md` Fase 0 (F0-05, F0-06) y Fase 1 (parcial F1-02, F1-06).
> Criterio de salida: `npm run dev` levanta la app con Auth conectado al emulador;
> rutas PrivateRoute y AdminRoute redirigen correctamente.

---

### T031 — Crear estructura de carpetas del frontend

**Archivos a crear** (directorios con `.gitkeep` hasta completar con código):
- `frontend/src/firebase/`
- `frontend/src/contexts/`
- `frontend/src/router/`
- `frontend/src/features/auth/hooks/`
- `frontend/src/features/auth/components/`
- `frontend/src/features/auth/services/`
- `frontend/src/features/turnos/hooks/`
- `frontend/src/features/turnos/components/`
- `frontend/src/features/perfil/hooks/`
- `frontend/src/features/perfil/components/`
- `frontend/src/features/admin/hooks/`
- `frontend/src/features/admin/components/`
- `frontend/src/shared/components/`
- `frontend/src/shared/utils/`

**FR / US**: arquitectura frontend — `plan.md` estructura de carpetas
**Depende de**: T006

---

### T032 — Crear frontend/src/firebase/config.ts

**Archivos a crear**:
- `frontend/src/firebase/config.ts`
- `frontend/.env.example`

**Descripción**: Crear `config.ts` que inicializa la app de Firebase con las
variables de entorno `VITE_FIREBASE_*` y, si `VITE_USE_FIREBASE_EMULATORS === "true"`,
conecta cada servicio (Auth, Firestore, Data Connect) a los puertos locales definidos
en `quickstart.md` sección 3.2. El archivo `.env.example` documenta todas las
variables requeridas con valores placeholder.

**FR / US**: `quickstart.md` sección 4.1 — infraestructura SDK
**Depende de**: T031

---

### T033 — Crear AuthContext con onAuthStateChanged + verificación de activo

**Archivos a crear**:
- `frontend/src/contexts/AuthContext.tsx`

**Descripción**: Crear el contexto de autenticación con:
- `onAuthStateChanged` de Firebase Auth para estado reactivo de sesión (FR-003)
- Tras recibir el usuario autenticado, consultar `ObtenerPerfilPropio` para leer el
  campo `activo`. Si `activo === false`, ejecutar logout inmediato (FR-023,
  `research.md` RD-006 — doble bloqueo)
- Exponer: `currentUser`, `userProfile`, `isAdmin`, `loading`, `logout`
- El campo `isAdmin` se deriva de `userProfile.rol === "admin"` (FR-005)

**FR / US**: FR-003, FR-005, FR-023 — `research.md` RD-006
**Depende de**: T031, T032, T014

---

### T034 — Crear AppRouter con PrivateRoute y AdminRoute

**Archivos a crear**:
- `frontend/src/router/AppRouter.tsx`
- `frontend/src/router/PrivateRoute.tsx`
- `frontend/src/router/AdminRoute.tsx`

**Descripción**:
- `PrivateRoute`: si `!currentUser && !loading` → redirige a `/login`. Para:
  `/reservar`, `/mis-turnos`, `/perfil`, `/admin/*` (FR-005)
- `AdminRoute`: si `!isAdmin` → redirige a `/mis-turnos` (FR-025, FR-032)
- `AppRouter`: define todas las rutas de la app:
  - `/login`, `/registro` (públicas)
  - `/reservar`, `/mis-turnos`, `/perfil` (PrivateRoute)
  - `/admin/usuarios`, `/admin/turnos` (AdminRoute)
- Componentes de pantalla en rutas se definen como placeholders (`<div>TODO</div>`)
  hasta implementarse en Fases 5–8

**FR / US**: FR-005, FR-025, FR-032 — US1 escenario 5, US5 escenario 6, US6 escenario 6
**Depende de**: T031, T033

---

### T035 — Crear frontend/.env.local

**Archivos a crear**:
- `frontend/.env.local`

**Descripción**: Crear el archivo `.env.local` con los valores de emulador definidos
en `quickstart.md` sección 4.1:
```
VITE_USE_FIREBASE_EMULATORS=true
VITE_FIREBASE_PROJECT_ID=demo-openwash
[resto de variables con valores placeholder]
```
Agregar `frontend/.env.local` al `.gitignore` del repo. Verificar que `config.ts`
(T032) lee correctamente las variables al ejecutar `npm run dev`.

**FR / US**: `quickstart.md` sección 4.1
**Depende de**: T032

---

## Fase 5 — Feature: Autenticación

> Objetivo: implementar US1 completa (6 escenarios de aceptación).
> Corresponde a `plan.md` Fase 1, tareas F1-01 a F1-07.
> Criterio de salida: todos los escenarios de US1 pasan.

---

### T036 — Pantalla /registro y hook useRegistro

**Archivos a crear**:
- `frontend/src/features/auth/components/RegisterPage.tsx`
- `frontend/src/features/auth/hooks/useRegistro.ts`
- `frontend/src/features/auth/services/authService.ts`

**Descripción**:
- `RegisterPage.tsx`: formulario con campos nombre, apellido, teléfono, email,
  contraseña. Validación client-side (campos requeridos, formato email, contraseña
  mínima). Mensaje de error "el email ya está en uso" si Firebase devuelve
  `auth/email-already-in-use` (US1 escenario 2)
- `useRegistro.ts`: orquesta `createUserWithEmailAndPassword` → mutation
  `RegistrarUsuario` (T020) → redirección a `/mis-turnos`
- `authService.ts`: wrapper de operaciones de Firebase Auth

**FR / US**: FR-001 — US1 escenarios 1, 2
**Depende de**: T034, T020

---

### T037 [P] — Pantalla /login y manejo de auth/user-disabled

**Archivos a crear**:
- `frontend/src/features/auth/components/LoginPage.tsx`

**Descripción**: Formulario email + contraseña. Manejo de errores:
- `auth/wrong-password` o `auth/user-not-found`: mensaje genérico sin revelar si
  el email existe (US1 escenario 4)
- `auth/user-disabled`: mensaje "tu cuenta ha sido desactivada, contactá al
  administrador" (FR-023, US5 escenario 4)

**FR / US**: FR-002, FR-023 — US1 escenarios 3, 4
**Depende de**: T034, T033

---

### T038 [P] — Logout en NavBar con redirección a /login

**Archivos a crear/modificar**:
- `frontend/src/shared/components/NavBar.tsx`

**Descripción**: Crear componente `NavBar` con enlace de navegación y botón
"Cerrar sesión" que llama a `logout()` del `AuthContext`. Al ejecutar logout,
React Router redirige a `/login` (US1 escenario 5). La NavBar solo se renderiza
cuando `currentUser !== null`.

**FR / US**: FR-004 — US1 escenario 5
**Depende de**: T033

---

### T039 — Validar redirección de AdminRoute para rol "user"

**Archivos a modificar**:
- `frontend/src/router/AdminRoute.tsx` (ya existe por T034, validar lógica)

**Descripción**: Confirmar que el componente `AdminRoute` redirige a `/mis-turnos`
cuando el usuario autenticado tiene `isAdmin === false`. Agregar un test manual con
una cuenta de rol "user" intentando navegar a `/admin/usuarios` y `/admin/turnos`.
Documentar el resultado en el archivo como comentario.

**FR / US**: FR-005, FR-025, FR-032 — US5 escenario 6, US6 escenario 6
**Depende de**: T034, T037

---

## Fase 6 — Feature: Reservas y disponibilidad en tiempo real

> Objetivo: implementar US2 completa (7 escenarios de aceptación).
> Corresponde a `plan.md` Fase 2, tareas F2-01 a F2-08.
> Criterio de salida: reserva completa con bloqueo en tiempo real; SC-003 pasa.

---

### T040 — Hook useDisponibilidad con suscripción onSnapshot

**Archivos a crear**:
- `frontend/src/features/turnos/hooks/useDisponibilidad.ts`

**Descripción**: Hook que recibe una `fecha: string` (YYYY-MM-DD) y retorna un mapa
`{ [horario: string]: { ocupado: boolean, turnoId: string | null } }` actualizado en
tiempo real vía `onSnapshot` sobre la subcolección
`disponibilidad/{fecha}/slots` de Firestore. Si un documento de slot no existe,
se interpreta como `{ ocupado: false, turnoId: null }`. Limpia la suscripción en el
cleanup del `useEffect`.

**FR / US**: FR-013 — US2 escenario 3
**Depende de**: T032, T028

---

### T041 — Pantalla /reservar con grilla de 52 slots

**Archivos a crear**:
- `frontend/src/features/turnos/components/ReservarPage.tsx`
- `frontend/src/features/turnos/components/GrillaSlots.tsx`
- `frontend/src/features/turnos/components/SelectorServicio.tsx`

**Descripción**:
- `SelectorServicio.tsx`: tres botones/tarjetas para Básico, Completo, Premium (FR-010)
- `GrillaSlots.tsx`: renderiza los 52 slots definidos en `data-model.md` sección 5
  (08:00 a 20:45 cada 15 min). Cada slot recibe `disponible: boolean` y
  `seleccionado: boolean`. Los slots no disponibles se muestran deshabilitados visualmente
  (US2 escenario 3)
- `ReservarPage.tsx`: orquesta SelectorServicio + DatePicker + GrillaSlots +
  formulario de patente y tipoVehiculo + botón confirmar. Consume `useDisponibilidad`
  para el estado reactivo de slots

**FR / US**: FR-010, FR-011, FR-012, FR-013 — US2 escenarios 1, 3, 7
**Depende de**: T040, T036

---

### T042 — Hook useCrearTurno con manejo de errores

**Archivos a crear**:
- `frontend/src/features/turnos/hooks/useCrearTurno.ts`

**Descripción**: Hook que orquesta la mutation `CrearTurno` (T022). Manejo de errores:
- Si Data Connect retorna error de unicidad (horario ocupado): mostrar
  "el horario ya no está disponible" (US2 escenario 2, FR-014)
- Si `esHorarioPasado` (T043) retorna true: mostrar "no podés reservar
  un horario que ya pasó" (US2 escenario 4, FR-015)
- Tras éxito: redirigir a `/mis-turnos`

**FR / US**: FR-014, FR-015 — US2 escenarios 1, 2, 4
**Depende de**: T041, T022, T043

---

### T043 [P] — Utilidad esHorarioPasado

**Archivos a crear**:
- `frontend/src/shared/utils/esHorarioPasado.ts`

**Descripción**: Función pura `esHorarioPasado(fecha: string, horario: string): boolean`
que retorna `true` si la combinación `fecha + horario` es anterior al momento actual
en la zona horaria `America/Argentina/Buenos_Aires`. No tiene efectos secundarios.
Diseñada para ser testeable en aislamiento (T058).

**FR / US**: FR-015 — US2 escenario 4
**Depende de**: T031

---

### T044 [P] — Utilidad esTransicionValida

**Archivos a crear**:
- `frontend/src/shared/utils/esTransicionValida.ts`

**Descripción**: Función pura
`esTransicionValida(estadoActual: string, nuevoEstado: string): boolean`
que implementa la tabla de transiciones válidas de `data-model.md` sección 3.3.
Retorna `false` para todos los casos de la tabla de transiciones inválidas
(sección 3.4): estados finales, saltos no permitidos. Diseñada para ser testeable
en aislamiento (T058).

**FR / US**: FR-028 — `data-model.md` secciones 3.3 y 3.4
**Depende de**: T031

---

## Fase 7 — Feature: Mis turnos, cancelación y perfil

> Objetivo: implementar US3 y US4 completas.
> Corresponde a `plan.md` Fases 3 y 4, tareas F3-01 a F3-07 y F4-01 a F4-07.
> Criterio de salida: 3 escenarios de US3 y 4 escenarios de US4 pasan.

---

### T045 — Hook useTurnosPropios con clasificación próximos/historial

**Archivos a crear**:
- `frontend/src/features/turnos/hooks/useTurnosPropios.ts`

**Descripción**: Hook que ejecuta la query `ObtenerTurnosPropios` (T015) y aplica
las reglas de clasificación de `data-model.md` sección 4 para separar los turnos en
dos listas:
- `próximos`: `fecha+hora >= ahora` AND `estado ∈ { pendiente, confirmado }`
- `historial`: resto (hora pasada O estado ∈ { cancelado, completado })

Retorna `{ próximos, historial, loading, error }`. Diseñado para ser testeable con
los 5 casos edge de `data-model.md` sección 4.2 (T057).

**FR / US**: FR-018, FR-019 — US3 escenarios 1, 2 — `data-model.md` sección 4
**Depende de**: T015, T036

---

### T046 — Hook usePuedeCancelar

**Archivos a crear**:
- `frontend/src/features/turnos/hooks/usePuedeCancelar.ts`

**Descripción**: Hook (o función pura) que recibe un objeto `turno` y retorna
`boolean`. Evalúa:
1. `turno.estado ∈ { "pendiente", "confirmado" }`
2. `(turno.fecha + turno.horario) - ahora > 30 minutos` en zona horaria
   `America/Argentina/Buenos_Aires`

Retorna `true` solo si ambas condiciones se cumplen. Diseñado para ser testeable
en aislamiento con múltiples casos edge (T056).

**FR / US**: FR-016, FR-017 — US2 escenarios 5, 6
**Depende de**: T031

---

### T047 — Pantalla /mis-turnos

**Archivos a crear**:
- `frontend/src/features/turnos/components/MisTurnosPage.tsx`
- `frontend/src/features/turnos/components/TarjetaTurno.tsx`

**Descripción**:
- `TarjetaTurno.tsx`: muestra servicio, fecha, horario, patente, tipoVehiculo, estado.
  Muestra botón "Cancelar" solo si `usePuedeCancelar(turno)` es `true` (FR-017).
  Al cancelar: llama mutation `CancelarTurnoPropio` (T023) con confirmación inline
- `MisTurnosPage.tsx`: usa `useTurnosPropios` (T045). Sección "Próximos" con turnos
  ordenados por fecha/hora ASC. Sección "Historial". Estado vacío: mensaje "No tenés
  turnos" si ambas listas están vacías (US3 escenario 3)

**FR / US**: FR-016, FR-017, FR-018, FR-019 — US3 escenarios 1, 2, 3
**Depende de**: T045, T046, T023

---

### T048 — Pantalla /perfil: ver y editar datos

**Archivos a crear**:
- `frontend/src/features/perfil/components/PerfilPage.tsx`
- `frontend/src/features/perfil/hooks/usePerfil.ts`

**Descripción**:
- `usePerfil.ts`: ejecuta `ObtenerPerfilPropio` (T014) y expone `actualizarPerfil`
  que llama mutation `ActualizarPerfilPropio` (T021)
- `PerfilPage.tsx`: muestra nombre, apellido, teléfono (editables) y email (campo
  read-only, sin input editable — FR-007, Assumptions-6). Mensaje de éxito tras guardar
  cambios (US4 escenario 1). Acceso a secciones de cambio de contraseña y eliminar
  cuenta (T049)

**FR / US**: FR-006, FR-007 — US4 escenarios 1, 4
**Depende de**: T014, T021, T036

---

### T049 — Perfil: cambio de contraseña y eliminación de cuenta con modal

**Archivos a crear/modificar**:
- `frontend/src/features/perfil/components/PerfilPage.tsx` (ampliar T048)
- `frontend/src/features/perfil/components/ModalEliminarCuenta.tsx`

**Descripción**:
- **Cambio de contraseña**: formulario con contraseña actual + nueva contraseña.
  Llama `reauthenticateWithCredential` (re-autenticación requerida por Firebase Auth)
  seguido de `updatePassword`. Manejo de error si la contraseña actual es incorrecta
  (US4 escenario 2, FR-008)
- **Eliminar cuenta**: botón que abre `ModalEliminarCuenta`. El modal muestra
  advertencia "tus turnos futuros serán cancelados automáticamente". Al confirmar:
  llama `EliminarCuentaPropia` (T024) → `deleteUser()` → Auth trigger cancela
  turnos (T027) → redirección a `/login` (US4 escenario 3, FR-009, FR-033)

**FR / US**: FR-008, FR-009, FR-033 — US4 escenarios 2, 3
**Depende de**: T048, T024

---

## Fase 8 — Feature: Panel admin — usuarios y turnos

> Objetivo: implementar US5 y US6 completas.
> Corresponde a `plan.md` Fases 5 y 6, tareas F5-01 a F5-07 y F6-01 a F6-08.
> Criterio de salida: 6 escenarios de US5 y 6 escenarios de US6 pasan.

---

### T050 — Hook useUsuariosAdmin

**Archivos a crear**:
- `frontend/src/features/admin/hooks/useUsuariosAdmin.ts`

**Descripción**: Hook que ejecuta la query `ObtenerUsuariosAdmin` (T016) y expone
las operaciones de gestión:
- `actualizarDatos(uid, datos)` → mutation `ActualizarDatosUsuario` (T025)
- `cambiarRol(uid, rol)` → mutation `CambiarRolUsuario` (T025)
- `setActivo(uid, activo)` → Cloud Function callable `setActivoUsuario` (T030)
- `eliminarUsuario(uid)` → Cloud Function callable `eliminarUsuarioAdmin` (T030)

Retorna `{ usuarios, loading, error, ...operaciones }`.

**FR / US**: FR-020–FR-024 — US5
**Depende de**: T016, T025, T034, T030

---

### T051 — Pantalla /admin/usuarios

**Archivos a crear**:
- `frontend/src/features/admin/components/AdminUsuariosPage.tsx`
- `frontend/src/features/admin/components/TablaUsuarios.tsx`
- `frontend/src/features/admin/components/ModalEditarUsuario.tsx`

**Descripción**:
- `TablaUsuarios.tsx`: columnas nombre, apellido, email, teléfono, rol, activo.
  Botones de acción por fila: editar, cambiar rol, activar/desactivar, eliminar
- `ModalEditarUsuario.tsx`: formulario de edición de nombre, apellido, teléfono
  (US5 escenario 2)
- `AdminUsuariosPage.tsx`: consume `useUsuariosAdmin`. Confirmación antes de eliminar
  con advertencia de cancelación de turnos en cascada (US5 escenario 5)

**FR / US**: FR-020, FR-021, FR-022, FR-023, FR-024 — US5 escenarios 1–5
**Depende de**: T050

---

### T052 — Hook useTurnosAdmin

**Archivos a crear**:
- `frontend/src/features/admin/hooks/useTurnosAdmin.ts`

**Descripción**: Hook que mantiene estado reactivo de filtros (`fecha`, `estado`,
`servicio`) y ejecuta `ObtenerTurnosAdmin` (T017) re-ejecutando la query cuando
cambian los filtros. Expone también `cambiarEstado(turnoId, nuevoEstado)` →
mutation `CambiarEstadoTurno` (T025) con validación previa por `esTransicionValida`
(T044), y `cancelarTurno(turnoId)` → mutation `CancelarTurnoAdmin` (T025).

**FR / US**: FR-026, FR-027, FR-028, FR-029, FR-030 — US6
**Depende de**: T017, T018, T025, T034, T044

---

### T053 [P] — Hook useBusquedaTurnos con debounce

**Archivos a crear**:
- `frontend/src/features/admin/hooks/useBusquedaTurnos.ts`

**Descripción**: Hook que recibe `textoBusqueda: string` y ejecuta la query
`BuscarTurnosPorClienteOPatente` (T019) con debounce de 300 ms para evitar
queries excesivas mientras el usuario tipea. Retorna `{ resultados, loading }`.
Si `textoBusqueda` está vacío, retorna lista vacía sin ejecutar la query.

**FR / US**: FR-031 — US6 escenario 5
**Depende de**: T019, T034

---

### T054 — Pantalla /admin/turnos

**Archivos a crear**:
- `frontend/src/features/admin/components/AdminTurnosPage.tsx`
- `frontend/src/features/admin/components/TablaTurnos.tsx`
- `frontend/src/features/admin/components/FiltrosTurnos.tsx`

**Descripción**:
- `FiltrosTurnos.tsx`: DatePicker para fecha, select para estado, select para
  servicio. Botón "Limpiar filtros" (FR-027)
- `TablaTurnos.tsx`: columnas cliente, patente, tipoVehiculo, servicio, fecha,
  hora, estado + acciones cambiar estado y cancelar por fila (FR-026)
- `AdminTurnosPage.tsx`: integra filtros + tabla + campo de búsqueda libre
  (consume `useBusquedaTurnos`). Cuando hay texto de búsqueda, usa los resultados
  de `useBusquedaTurnos`; cuando no, usa los resultados de `useTurnosAdmin` con
  filtros (FR-031)

**FR / US**: FR-026, FR-027, FR-028, FR-029, FR-030, FR-031 — US6 escenarios 1–6
**Depende de**: T052, T053, T044

---

### T055 [P] — Componente ModalCambiarEstado con validación de transiciones

**Archivos a crear**:
- `frontend/src/features/admin/components/ModalCambiarEstado.tsx`

**Descripción**: Modal que muestra el estado actual del turno y los estados destino
disponibles. Usa `esTransicionValida` (T044) para filtrar qué estados destino se
muestran como habilitados. Si el turno está en estado final (`completado` o
`cancelado`), el modal informa que no hay transiciones disponibles. Al confirmar,
llama `cambiarEstado` del hook `useTurnosAdmin`.

**FR / US**: FR-028 — `data-model.md` secciones 3.3, 3.4
**Depende de**: T044, T054

---

## Fase 9 — Testing

> Objetivo: implementar cobertura completa de tests según `research.md` RD-005.
> Las tareas T057–T060 son paralelizables entre sí.
> Criterio de salida: `npm run test:all` pasa con 0 errores.

---

### T056 — Tests Vitest: usePuedeCancelar

**Archivos a crear**:
- `frontend/src/features/turnos/hooks/usePuedeCancelar.test.ts`

**Descripción**: Suite de tests unitarios con Vitest para el hook/función
`usePuedeCancelar`. Casos obligatorios:

| Caso | Estado | Tiempo restante | Esperado |
|---|---|---|---|
| Puede cancelar | confirmado | 60 min | true |
| Límite exacto | confirmado | 30 min | false |
| Ventana cerrada | confirmado | 29 min | false |
| Estado inválido | completado | 60 min | false |
| Estado inválido | cancelado | 60 min | false |
| Horario pasado | confirmado | -5 min | false |

**FR / US**: FR-016, FR-017 — `research.md` RD-005
**Depende de**: T046

---

### T057 [P] — Tests Vitest: useTurnosPropios (clasificación)

**Archivos a crear**:
- `frontend/src/features/turnos/hooks/useTurnosPropios.test.ts`

**Descripción**: Suite de tests unitarios para la lógica de clasificación de
`useTurnosPropios`. Cubrir los 5 casos edge de `data-model.md` sección 4.2:

| Caso | Estado | Fecha | Lista esperada |
|---|---|---|---|
| Turno confirmado futuro | confirmado | mañana | próximos |
| Turno pendiente futuro | pendiente | pasado mañana | próximos |
| Turno confirmado hora pasada (scheduler no corrió) | confirmado | hoy hace 1 hora | historial |
| Turno completado con fecha futura (admin lo completó) | completado | mañana | historial |
| Turno cancelado con fecha futura | cancelado | mañana | historial |

**FR / US**: FR-018, FR-019 — `data-model.md` sección 4.2
**Depende de**: T045

---

### T058 [P] — Tests Vitest: esHorarioPasado y esTransicionValida

**Archivos a crear**:
- `frontend/src/shared/utils/esHorarioPasado.test.ts`
- `frontend/src/shared/utils/esTransicionValida.test.ts`

**Descripción**:
- `esHorarioPasado.test.ts`: verificar `true` para horarios del día actual ya
  transcurridos; `false` para horarios futuros y para fechas de días futuros
  independientemente del horario
- `esTransicionValida.test.ts`: cubrir todas las transiciones válidas e inválidas
  de `data-model.md` secciones 3.3 y 3.4, incluyendo todos los intentos desde
  estados finales (`completado`, `cancelado`)

**FR / US**: FR-015, FR-028 — `data-model.md` secciones 3.3, 3.4
**Depende de**: T043, T044

---

### T059 — Tests Jest: Cloud Functions

**Archivos a crear**:
- `functions/src/schedulers/completarTurnos.test.ts`
- `functions/src/triggers/cancelarTurnosEnCascada.test.ts`
- `functions/src/triggers/disponibilidad.test.ts`

**Descripción**: Tests Jest usando `firebase-functions-test` contra Firebase Local
Emulator Suite:

- `completarTurnos.test.ts`: verificar que el scheduler actualiza a `completado`
  solo los turnos con `fecha+horario+15min <= ahora`; no modifica turnos futuros;
  no modifica turnos ya `completado` o `cancelado`. FR-034.
- `cancelarTurnosEnCascada.test.ts`: verificar que al eliminar un usuario, todos
  sus turnos futuros en `pendiente`/`confirmado` pasan a `cancelado`; los turnos
  `completado`/`cancelado` no cambian; los turnos pasados no se modifican. FR-033.
- `disponibilidad.test.ts`: verificar que al crear turno `confirmado` se escribe
  `ocupado: true` en Firestore; al cancelar se escribe `ocupado: false`. FR-013.

**FR / US**: FR-013, FR-033, FR-034 — `research.md` RD-005
**Depende de**: T027, T028, T029

---

### T060 [P] — Tests de operaciones Data Connect contra emuladores

**Archivos a crear**:
- `test/dataconnect/crearTurno.test.ts`
- `test/dataconnect/cancelarTurno.test.ts`
- `test/dataconnect/obtenerTurnosPropios.test.ts`
- `test/dataconnect/cambiarEstado.test.ts`
- `test/dataconnect/busqueda.test.ts`

**Descripción**: Tests de integración contra Firebase Local Emulator Suite:

- `crearTurno.test.ts`: caso exitoso (turno creado + slot Firestore ocupado);
  concurrencia (dos requests simultáneas, solo una tiene éxito). FR-014.
- `cancelarTurno.test.ts`: caso válido; intento de cancelar turno ajeno
  (debe rechazarse). FR-016.
- `obtenerTurnosPropios.test.ts`: solo retorna turnos del usuario autenticado,
  no de otros usuarios. FR-018, FR-019.
- `cambiarEstado.test.ts`: transiciones válidas funcionan; transiciones inválidas
  retornan error. FR-028.
- `busqueda.test.ts`: coincidencia parcial case-insensitive por nombre, apellido
  y patente. FR-031.

**FR / US**: FR-014, FR-016, FR-018, FR-019, FR-028, FR-031 — `research.md` RD-005
**Depende de**: T013, T022, T023, T025

---

### T061 — Script de CI y configuración de emulators:exec

**Archivos a crear/modificar**:
- `.github/workflows/ci.yml` (o `scripts/ci.sh` si no se usa GitHub Actions)
- `scripts/seed.js` (completar la implementación del placeholder de T013)

**Descripción**: Configurar el pipeline de CI para ejecutar la suite completa de
tests usando `firebase emulators:exec` según `quickstart.md` sección 6.5:
```bash
firebase emulators:exec \
  --only auth,dataconnect,firestore,functions \
  --project demo-openwash \
  "npm run test:all"
```
El script `scripts/seed.js` debe cargar los datos de `dataconnect/seed_data.gql`
usando la REST API del emulador de Data Connect antes de ejecutar los tests.

**FR / US**: `quickstart.md` sección 6.5 — `research.md` RD-005
**Depende de**: T013, T007

---

### T062 — Tests end-to-end Playwright

**Archivos a crear**:
- `test/e2e/auth.spec.ts`
- `test/e2e/reserva.spec.ts`
- `test/e2e/misTurnos.spec.ts`
- `test/e2e/adminUsuarios.spec.ts`
- `test/e2e/adminTurnos.spec.ts`
- `test/e2e/accesoRol.spec.ts`
- `playwright.config.ts`

**Descripción**: Tests end-to-end contra la app frontend con emuladores activos:

- `auth.spec.ts`: flujo registro → sesión persistente → logout → login (US1)
- `reserva.spec.ts`: login → reserva completa → verificar slot bloqueado en
  calendario (US2 escenarios 1, 3)
- `misTurnos.spec.ts`: turno aparece en próximos → cancelar → horario liberado
  (US2 escenario 5, US3 escenarios 1, 2)
- `adminUsuarios.spec.ts`: listar → editar → desactivar → intentar login con
  cuenta desactivada → error (US5 escenarios 1–4)
- `adminTurnos.spec.ts`: listar → filtrar por estado → buscar por nombre parcial
  → cambiar estado (US6 escenarios 1–5)
- `accesoRol.spec.ts`: usuario rol "user" intenta `/admin/usuarios` y
  `/admin/turnos` → redirección a `/mis-turnos` (US5 escenario 6, US6 escenario 6)

**FR / US**: FR-001–FR-005, FR-010–FR-019, FR-020–FR-032 — US1–US6
**Depende de**: T036, T041, T047, T051, T054

---

## Fase 10 — Validación end-to-end según quickstart.md

> Objetivo: confirmar que el sistema completo funciona y cumple todos los criterios
> de éxito de `spec.md`. Criterio de salida: SC-001 a SC-008 verificados.

---

### T063 — Validar levantamiento completo del emulador

**Archivos a modificar**: ninguno (tarea de validación)

**Descripción**: Ejecutar `firebase emulators:start` y confirmar:
- Auth, Data Connect, Firestore y Functions levantan sin errores
- Emulator UI accesible en `http://localhost:4000`
- Schema de Data Connect se valida sin errores de tipo
- Documentar versiones de herramientas en `quickstart.md` si difieren de las
  documentadas (`quickstart.md` sección 1)

**FR / US**: `quickstart.md` sección 3.1
**Depende de**: T001, T002, T009, T010, T026

---

### T064 [P] — Validar carga de seed data

**Archivos a modificar**: ninguno (tarea de validación)

**Descripción**: Ejecutar `npm run seed` con emuladores corriendo y verificar en
Emulator UI que:
- Los 5 usuarios de `quickstart.md` sección 3.4 están creados en Auth y Data Connect
- Los 5 turnos están creados con los estados correctos
- El usuario `inactivo@openwash.com` tiene `activo: false` y `disabled: true` en Auth

**FR / US**: `quickstart.md` sección 3.4
**Depende de**: T013, T061

---

### T065 — Ejecutar npm run test:all y verificar que pasa completo

**Archivos a modificar**: ninguno (tarea de validación)

**Descripción**: Ejecutar `npm run test:all` (`quickstart.md` sección 6.5) y
confirmar que todos los tests pasan:
- Tests unitarios Vitest (T056, T057, T058): 0 fallos
- Tests Jest Cloud Functions (T059): 0 fallos
- Tests Data Connect contra emuladores (T060): 0 fallos
- Tests end-to-end Playwright (T062): 0 fallos

Documentar el resultado (cantidad de tests por suite) como comentario en este archivo.

**FR / US**: `quickstart.md` sección 6.5
**Depende de**: T056, T057, T058, T059, T060, T062, T063, T064

---

### T066 — Validar Success Criteria SC-001 a SC-008

**Archivos a modificar**: ninguno (tarea de validación manual)

**Descripción**: Verificar manualmente cada criterio de éxito de `spec.md`:

| SC | Criterio | Método |
|---|---|---|
| SC-001 | Registro completo < 2 min | Cronómetro manual |
| SC-002 | Reserva completa < 1 min | Cronómetro manual |
| SC-003 | 100% bloqueo horarios ocupados (incluye concurrencia) | Ejecutar test T060 `crearTurno.test.ts` caso concurrencia |
| SC-004 | 100% control de acceso por rol | Ejecutar test T062 `accesoRol.spec.ts` |
| SC-005 | Localizar turno en panel admin < 10 seg | Cronómetro manual en `/admin/turnos` con filtros |
| SC-006 | Carga inicial < 3 seg @ 20 Mbps / 10 Mbps / 50 ms | Chrome DevTools "Fast 4G" personalizado / Lighthouse |
| SC-007 | Sin defectos de layout en Chrome ≥ 124 / Firefox ≥ 125 / Safari ≥ 17 @ 375/768/1280 px | Inspección en DevTools de cada navegador |
| SC-008 | Cancelar turno (flujo completo) < 15 seg | Cronómetro manual en `/mis-turnos` |

Documentar el resultado de cada SC como ✅ / ❌ con notas.

**FR / US**: SC-001 a SC-008 — `spec.md` sección Success Criteria
**Depende de**: T065
