# Data Model — 001-gestion-turnos-lavado

**Proyecto**: Open Wash
**Feature**: Gestión de Turnos
**Spec**: `specs/001-gestion-turnos-lavado/spec.md`
**Fecha**: 2026-07-06
**Estado**: Draft — generado por speckit.plan

---

## 1. Schema de Firebase Data Connect (PostgreSQL via Cloud SQL)

Este schema reemplaza el ejemplo de películas en `dataconnect/schema/schema.gql`.

### 1.1 Tipo `Usuario`

```graphql
# Tabla usuarios — keyed by Firebase Auth UID
type Usuario @table(name: "usuarios") {
  # uid: Firebase Auth UID del usuario. Se inyecta automáticamente desde auth.uid.
  uid: String! @col(dataType: "varchar(128)") @default(expr: "auth.uid")
  nombre: String! @col(dataType: "varchar(100)")
  apellido: String! @col(dataType: "varchar(100)")
  # email es único; no editable por el propio usuario (Assumptions-6, FR-007)
  email: String! @col(dataType: "varchar(255)") @unique
  telefono: String! @col(dataType: "varchar(30)")
  # rol: "user" (default) o "admin". Solo un admin puede modificarlo (FR-022).
  rol: String! @col(dataType: "varchar(10)") @default(value: "user")
  # activo: true (default). El admin puede modificarlo a false (FR-023).
  # Ver research.md RD-006 para la estrategia de bloqueo.
  activo: Boolean! @default(value: true)
  # Relación inversa generada por Data Connect:
  #   turnos_on_usuario: [Turno!]!
}
```

**Restricciones de base de datos** (a definir como CHECK constraints en el schema SQL):

| Columna | Restricción |
|---|---|
| `email` | UNIQUE |
| `rol` | CHECK (`rol` IN ('user', 'admin')) |
| `activo` | DEFAULT TRUE |

---

### 1.2 Tipo `Turno`

```graphql
# Tabla turnos — keyed by UUID autogenerado
type Turno @table(name: "turnos") {
  # id: UUID autogenerado (PK)
  id: UUID! @default(expr: "uuidV4()")
  # Relación N:1 con Usuario. Genera FK usuarioUid en la tabla.
  usuario: Usuario!
  # servicio: catálogo fijo de tres valores (Assumptions-5)
  servicio: String! @col(dataType: "varchar(20)")
  # fecha: formato YYYY-MM-DD
  fecha: Date!
  # horario: formato HH:MM, valores válidos entre 08:00 y 20:45 en bloques de 15 min
  horario: String! @col(dataType: "varchar(5)")
  # estado: máquina de estados — ver sección 3 de este documento
  estado: String! @col(dataType: "varchar(20)") @default(value: "pendiente")
  # Datos del vehículo embebidos en el Turno (Assumptions-2, EK-01 resuelto)
  patente: String! @col(dataType: "varchar(10)")
  tipoVehiculo: String! @col(dataType: "varchar(15)")
  # creadoEn: timestamp automático al momento de la inserción
  creadoEn: Timestamp! @default(expr: "request.time")
}
```

**Restricciones de base de datos**:

| Columna | Restricción |
|---|---|
| `servicio` | CHECK (`servicio` IN ('Básico', 'Completo', 'Premium')) |
| `estado` | CHECK (`estado` IN ('pendiente', 'confirmado', 'completado', 'cancelado')) |
| `tipoVehiculo` | CHECK (`tipoVehiculo` IN ('auto', 'camioneta', 'moto')) |
| `horario` | Valores válidos: 08:00 a 20:45 en pasos de 15 min (enforcement en application layer) |

> **Nota sobre Vehículo**: `patente` y `tipoVehiculo` son atributos del `Turno`.
> No existe entidad `Vehículo` independiente en v1.0. Decisión documentada en
> `spec.md` Key Entities y Assumptions punto 2.

---

### 1.3 Índices recomendados

#### Tabla `turnos`

| Nombre del índice | Columnas | Tipo | FR | Consulta que optimiza |
|---|---|---|---|---|
| `idx_turnos_fecha_horario` | `(fecha, horario)` | BTREE compuesto | FR-014 | Verificación de disponibilidad en operación atómica de `CrearTurno` |
| `idx_turnos_usuarioid` | `(usuarioUid)` | BTREE | FR-018, FR-019 | `WHERE usuarioUid = auth.uid` — turnos propios del cliente |
| `idx_turnos_estado` | `(estado)` | BTREE | FR-027 | `WHERE estado = $estado` — filtro del panel admin |
| `idx_turnos_fecha` | `(fecha)` | BTREE | FR-030 | `WHERE fecha = $fecha` — búsqueda por fecha del panel admin |
| `idx_turnos_patente` | `(patente)` | GIN con `pg_trgm` | FR-031 | `WHERE patente ILIKE '%texto%'` — búsqueda parcial por patente |

#### Tabla `usuarios`

| Nombre del índice | Columnas | Tipo | FR | Consulta que optimiza |
|---|---|---|---|---|
| `uq_usuarios_email` | `(email)` | UNIQUE (ya declarado con `@unique`) | FR-001 | Rechazo de email duplicado al registrarse |
| `idx_usuarios_nombre_apellido` | `(LOWER(nombre), LOWER(apellido))` | GIN con `pg_trgm` | FR-031 | `WHERE nombre ILIKE '%texto%' OR apellido ILIKE '%texto%'` — búsqueda parcial por cliente |

> Ver `research.md` RD-003 para la justificación detallada de índices y estrategia
> con `pg_trgm`.

---

### 1.4 Directivas @auth por operación

| Operación | Nivel `@auth` | Restricción adicional |
|---|---|---|
| `ObtenerPerfilPropio` | `USER` | Filtra por `auth.uid` |
| `ObtenerTurnosPropios` | `USER` | Filtra por `usuarioUid = auth.uid` |
| `ObtenerUsuariosAdmin` | `USER` | Verificación de rol `admin` en el resolver / hook del cliente |
| `ObtenerTurnosAdmin` | `USER` | Verificación de rol `admin` en el resolver / hook del cliente |
| `BuscarTurnosPorClienteOPatente` | `USER` | Verificación de rol `admin` |
| `BuscarTurnosPorFecha` | `USER` | Verificación de rol `admin` |
| `RegistrarUsuario` | `USER` | Solo inserta con `uid_expr: "auth.uid"` |
| `ActualizarPerfilPropio` | `USER` | Solo actualiza donde `uid = auth.uid` |
| `CrearTurno` | `USER` | Inserta con `usuarioUid_expr: "auth.uid"` |
| `CancelarTurnoPropio` | `USER` | Solo actualiza donde `usuarioUid = auth.uid` |
| `ActualizarDatosUsuario` | `USER` | Verificación de rol `admin` |
| `CambiarRolUsuario` | `USER` | Verificación de rol `admin` |
| `SetActivoUsuario` | `USER` | Verificación de rol `admin` |
| `EliminarCuentaPropia` | `USER` | Solo elimina donde `uid = auth.uid` |
| `EliminarCuentaAdmin` | `USER` | Verificación de rol `admin` |
| `CambiarEstadoTurno` | `USER` | Verificación de rol `admin` |
| `CancelarTurnoAdmin` | `USER` | Verificación de rol `admin` |

> Data Connect no tiene un nivel `@auth(level: ADMIN)` nativo en v1. La
> verificación de rol se implementa en el cliente (hooks/AdminRoute) y, para
> operaciones críticas, en Cloud Functions callables con Admin SDK.

---

## 2. Estructura Firestore para disponibilidad en tiempo real

Solo Cloud Functions pueden escribir en esta colección. El frontend solo lee.

```
disponibilidad/                          (colección raíz)
  └── {YYYY-MM-DD}/                      (documento por fecha, ej: "2026-07-10")
        └── slots/                       (subcolección)
              └── {HH:MM}/              (documento por slot, ej: "09:00")
                    ocupado: boolean
                    turnoId: string | null
```

### Ejemplo de documento de slot

```json
// Path: disponibilidad/2026-07-10/slots/09:00
{
  "ocupado": true,
  "turnoId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

### Reglas de Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Solo usuarios autenticados pueden leer disponibilidad
    match /disponibilidad/{fecha}/slots/{horario} {
      allow read: if request.auth != null;
      allow write: if false; // Solo Cloud Functions via Admin SDK
    }
  }
}
```

### Ciclo de vida de un documento de slot

| Evento | Acción sobre Firestore | Actor |
|---|---|---|
| Turno creado con estado `confirmado` | `ocupado = true`, `turnoId = id_del_turno` | Cloud Function trigger (FR-013) |
| Turno cancelado (por cliente o admin) | `ocupado = false`, `turnoId = null` | Cloud Function trigger (FR-013, FR-016, FR-029) |
| Turno transicionado a `completado` | Sin cambio en Firestore (slot de hora pasada, no hay nuevas reservas) | — |
| Consulta de disponibilidad de un día sin ningún turno | Documentos de slots no existen → cliente interpreta como `ocupado: false` | Cliente (lectura safe del SDK) |

---

## 3. Máquina de estados del Turno

### 3.1 Estados válidos

| Estado | Descripción |
|---|---|
| `pendiente` | Estado inicial al momento de crear el turno (entre el envío y la verificación de disponibilidad) |
| `confirmado` | El horario estaba disponible; la operación atómica fue exitosa (FR-014) |
| `completado` | El turno fue realizado. Asignado automáticamente a los 15 min post-inicio (FR-034) o manualmente por admin (FR-028) |
| `cancelado` | El turno fue cancelado por el cliente (si aplica la regla de 30 min, FR-016) o por un admin (FR-028, FR-029) |

### 3.2 Diagrama de transiciones

```
                             Horario disponible
             Reserva cliente  (operación atómica)
  ───────────────────────────────────────────────────►  [confirmado]
                [pendiente]                                  │    │
                    │                                        │    │
                    │ Admin cancela                          │    │ 15 min post-inicio
                    ▼                                        │    │ (Cloud Scheduler)
               [cancelado] ◄────────────────────────────────┘    │
                    ▲        Cliente cancela (> 30 min)           │
                    │        o Admin cancela                       ▼
                    │                                         [completado]
                    │         Admin marca manualmente ◄───────────┘
                    │         antes de los 15 min
                    │
  Horario ocupado: error, el turno NO se crea
```

### 3.3 Tabla de transiciones válidas

| Estado origen | Evento | Estado destino | Actor | FR |
|---|---|---|---|---|
| *(no existe)* | Cliente reserva, horario disponible | `pendiente` → `confirmado` (en una sola operación atómica) | Sistema | FR-014 |
| *(no existe)* | Cliente reserva, horario ocupado | Error `HORARIO_OCUPADO`, turno no se crea | Sistema | FR-014 |
| `pendiente` | Admin cancela | `cancelado` | Admin | FR-028, FR-029 |
| `confirmado` | 15 min post-inicio del turno (Cloud Scheduler) | `completado` | Sistema | FR-034 |
| `confirmado` | Admin marca manualmente como completado | `completado` | Admin | FR-028 |
| `confirmado` | Cliente cancela (faltan > 30 min para el turno) | `cancelado` | Cliente | FR-016 |
| `confirmado` | Admin cancela | `cancelado` | Admin | FR-028, FR-029 |
| `completado` | — | *(estado final, sin transición saliente)* | — | — |
| `cancelado` | — | *(estado final, sin transición saliente)* | — | — |

### 3.4 Transiciones explícitamente inválidas

| Intento | Motivo | FR |
|---|---|---|
| `completado → cualquier estado` | Estado final | FR-028 |
| `cancelado → cualquier estado` | Estado final | FR-028 |
| `confirmado → cancelado` por el cliente con < 30 min | Regla de ventana de cancelación | FR-017 |
| `confirmado → pendiente` | Transición no definida en la máquina de estados | FR-028 |
| `pendiente → completado` | No puede saltarse `confirmado` | FR-028 |

---

## 4. Reglas de clasificación próximos / historial (FR-018, FR-019)

### 4.1 Definición formal

```
momentoActual     = Date.now() en zona horaria America/Argentina/Buenos_Aires
fechaHoraTurno    = Date.parse(turno.fecha + "T" + turno.horario + ":00",
                               "America/Argentina/Buenos_Aires")

esPróximo(turno)  =   fechaHoraTurno >= momentoActual
                    AND turno.estado ∈ { "pendiente", "confirmado" }

esHistorial(turno) =   fechaHoraTurno < momentoActual
                     OR turno.estado ∈ { "cancelado", "completado" }
```

> **Nota de implementación**: la query `ObtenerTurnosPropios` retorna **todos** los
> turnos del usuario. La clasificación próximos/historial se aplica en el cliente
> (hook `useTurnosPropios`) sobre el resultado de la query. Esto simplifica la query
> de Data Connect y centraliza la lógica de clasificación en el frontend donde es
> fácilmente testeable.

### 4.2 Tabla de casos edge cubiertos

| Caso | Clasificación correcta | Motivo de la regla |
|---|---|---|
| Turno `confirmado`, hora futura | **Próximo** | `fecha+hora >= ahora` AND `estado = confirmado` |
| Turno `pendiente`, hora futura | **Próximo** | `fecha+hora >= ahora` AND `estado = pendiente` |
| Turno `confirmado`, hora ya pasada (scheduler no corrió aún) | **Historial** | `fecha+hora < ahora` (independiente del estado) — US3-W01 resuelto |
| Turno `completado`, hora futura (admin lo completó manualmente antes) | **Historial** | `estado = completado` (independiente de fecha) |
| Turno `cancelado`, hora futura | **Historial** | `estado = cancelado` (independiente de fecha) |

---

## 5. Slots de tiempo válidos (FR-012)

Bloques de 15 minutos entre las **08:00** y las **21:00** (el último slot comienza a
las **20:45** y finaliza a las 21:00).

```
08:00  08:15  08:30  08:45
09:00  09:15  09:30  09:45
10:00  10:15  10:30  10:45
11:00  11:15  11:30  11:45
12:00  12:15  12:30  12:45
13:00  13:15  13:30  13:45
14:00  14:15  14:30  14:45
15:00  15:15  15:30  15:45
16:00  16:15  16:30  16:45
17:00  17:15  17:30  17:45
18:00  18:15  18:30  18:45
19:00  19:15  19:30  19:45
20:00  20:15  20:30  20:45
```

**Total**: 52 slots por día.

Un slot `HH:MM` se considera **ocupado** si existe al menos un turno con
`fecha = YYYY-MM-DD`, `horario = HH:MM` y `estado ∈ { "pendiente", "confirmado" }`.

---

## 6. Relaciones entre entidades

```
Usuario (1) ────────────── (N) Turno
  uid (PK)                       id (PK)
  nombre                         usuarioUid (FK → Usuario.uid)
  apellido                       servicio
  email (UNIQUE)                 fecha
  telefono                       horario
  rol                            estado
  activo                         patente
                                 tipoVehiculo
                                 creadoEn

Servicio (catálogo fijo, no persistido)
  nombre: "Básico" | "Completo" | "Premium"
  — referenciado por Turno.servicio como string

Slot Firestore (proyección real-time, no en PostgreSQL)
  disponibilidad/{fecha}/slots/{horario}
  — ocupado: boolean
  — turnoId: string | null
  — escrito exclusivamente por Cloud Functions
  — leído por el frontend via onSnapshot
```
