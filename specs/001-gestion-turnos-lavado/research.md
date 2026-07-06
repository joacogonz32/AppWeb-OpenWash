# Research & Decisiones Técnicas — 001-gestion-turnos-lavado

**Proyecto**: Open Wash
**Feature**: Gestión de Turnos
**Spec**: `specs/001-gestion-turnos-lavado/spec.md`
**Fecha**: 2026-07-06
**Estado**: Draft — generado por speckit.plan

---

## RD-001 — Firestore para disponibilidad en tiempo real (FR-013)

### Pregunta
¿Por qué usar Cloud Firestore para la disponibilidad de slots en lugar de hacer
polling a Firebase Data Connect?

### Contexto
FR-013 requiere que cuando un horario se reserva o cancela, **todos los clientes
conectados vean el cambio de forma inmediata** sin necesidad de refrescar la página.

Firebase Data Connect usa PostgreSQL como base de datos relacional. PostgreSQL no
expone streams de cambios de forma nativa al cliente web. Para leer datos de Data
Connect desde el frontend es necesario ejecutar queries GraphQL que devuelven una
respuesta puntual (pull), no un stream continuo (push).

### Opciones evaluadas

| Opción | Mecanismo | Latencia real-time | Complejidad |
|---|---|---|---|
| **A) Firestore `onSnapshot`** | Push vía WebSocket nativo del SDK | < 500 ms | Media (requiere sincronizar dos fuentes) |
| B) Polling a Data Connect | Pull cada N segundos | N segundos (perceptible) | Baja |
| C) WebSocket propio | Servidor WebSocket dedicado | < 200 ms | Alta (requiere infraestructura extra) |

### Decisión: Opción A — Firestore como capa de proyección

Arquitectura dual:

- **Data Connect (PostgreSQL)**: fuente de verdad (*source of truth*) para todos
  los datos estructurados de usuarios y turnos.
- **Firestore**: proyección de solo el estado de disponibilidad de cada slot,
  optimizada para lectura en tiempo real con `onSnapshot`.

```
Colección Firestore:
  disponibilidad/{YYYY-MM-DD}/slots/{HH:MM}
  Campos:
    - ocupado: boolean
    - turnoId: string | null
```

**Flujo**:
1. Cliente crea turno → Data Connect persiste en PostgreSQL.
2. Cloud Function detecta el cambio → actualiza el documento Firestore del slot.
3. Todos los clientes suscritos con `onSnapshot` reciben el cambio < 500 ms.

### Trade-offs

| Ventaja | Riesgo |
|---|---|
| Baja latencia real-time sin polling (SC-006 compatible) | Posible desincronización si la Cloud Function falla entre pasos 2 y 3 |
| API nativa `onSnapshot` en Firebase Web SDK | Costo adicional de Firestore en tráfico alto |
| Escalable para múltiples clientes conectados | Mantener dos fuentes de datos coherentes agrega complejidad operativa |

### Mitigación del riesgo de desincronización
- La Cloud Function es **idempotente**: ejecutarla dos veces para el mismo turno
  produce el mismo resultado.
- El cliente puede hacer una query de *fallback* a Data Connect antes de permitir
  una nueva reserva, como segunda línea de defensa.
- El Scheduler de FR-034 solo necesita actualizar el estado en Data Connect;
  no libera slots en Firestore (un slot de turno completado no vuelve a estar
  disponible, ya ocurrió).
- El comportamiento ante falla de la Cloud Function se documenta en `quickstart.md`
  como limitación conocida de v1.0.

---

## RD-002 — Operación atómica para prevención de concurrencia (FR-014)

### Pregunta
¿Cómo garantizar que dos clientes que intentan reservar el mismo horario
simultáneamente no obtengan ambos el turno?

### Contexto
FR-014 establece que la verificación de disponibilidad y la escritura del turno deben
ejecutarse como una **operación atómica**. Ante solicitudes simultáneas, solo la
primera transacción exitosa obtiene el horario; la segunda recibe error
"horario ocupado".

### Opciones evaluadas

**Opción A — Transacción nativa en Data Connect (PostgreSQL)**

Data Connect genera SQL que se ejecuta en PostgreSQL. Si la mutation `CrearTurno`
puede verificar disponibilidad y crear el turno en un único statement condicional,
la atomicidad la garantiza el motor relacional.

El statement equivalente en SQL es:

```sql
INSERT INTO turnos (id, userId, servicio, fecha, horario, estado, patente, tipoVehiculo, creadoEn)
SELECT
  gen_random_uuid(), $userId, $servicio, $fecha, $horario, 'confirmado',
  $patente, $tipoVehiculo, now()
WHERE NOT EXISTS (
  SELECT 1 FROM turnos
  WHERE fecha = $fecha
    AND horario = $horario
    AND estado IN ('pendiente', 'confirmado')
);
```

Si el `INSERT` no inserta ninguna fila (el `WHERE NOT EXISTS` se cumplió), la mutation
retorna error tipado `HORARIO_OCUPADO`.

→ **Ventaja**: atomicidad garantizada por PostgreSQL sin infraestructura adicional.
→ **Riesgo**: Data Connect (en versión actual) puede no exponer SQL condicional en
  mutations. Investigar durante Fase 2.

**Opción B — Cloud Function callable como intermediario**

El frontend llama a una Cloud Function HTTP callable en lugar de llamar directamente
a Data Connect. La Cloud Function abre una transacción PostgreSQL con Admin SDK y
ejecuta la lógica condicional.

→ **Ventaja**: control total de la lógica transaccional.
→ **Desventaja**: mayor latencia (cold start de Cloud Function + round-trip adicional),
  más infraestructura, introduce un único punto de fallo.

**Opción C — Transacción Firestore como lock + Data Connect para persistencia**

Usar `runTransaction` de Firestore como mecanismo de lock optimista, y Data Connect
para la persistencia estructural.

→ **Desventaja**: mezcla dos fuentes de datos para una misma operación atómica, difícil
  de razonar y testear. No recomendado.

### Decisión recomendada
**Opción A** si Data Connect soporta el patrón de `INSERT ... WHERE NOT EXISTS` o
equivalente en su lenguaje de mutations.

**Opción B** como fallback si Data Connect no lo soporta.

### Acción pendiente (Fase 2)
- Verificar soporte de lógica condicional en mutations de Data Connect v1.
- Documentar la decisión definitiva en este archivo al iniciar la Fase 2.

---

## RD-003 — Índices de base de datos y justificación

### Tabla `turnos` — índices recomendados

| Nombre | Columnas | Tipo | FR que justifica | Consulta objetivo |
|---|---|---|---|---|
| `idx_turnos_fecha_horario` | `(fecha, horario)` | BTREE compuesto | FR-014 | `WHERE fecha = X AND horario = Y AND estado IN (...)` en la operación atómica |
| `idx_turnos_userid` | `(usuarioUid)` | BTREE | FR-018, FR-019 | `WHERE usuarioUid = auth.uid` para turnos propios |
| `idx_turnos_estado` | `(estado)` | BTREE | FR-027 | `WHERE estado = X` en filtro del panel admin |
| `idx_turnos_fecha` | `(fecha)` | BTREE | FR-030 | `WHERE fecha = X` en búsqueda por fecha |
| `idx_turnos_patente` | `(patente)` | GIN con `pg_trgm` | FR-031 | `WHERE patente ILIKE '%texto%'` en búsqueda parcial |

### Tabla `usuarios` — índices recomendados

| Nombre | Columnas | Tipo | FR que justifica | Consulta objetivo |
|---|---|---|---|---|
| `uq_usuarios_email` | `(email)` | UNIQUE | FR-001 | Rechazo de email duplicado en registro |
| `idx_usuarios_nombre_apellido` | `(LOWER(nombre), LOWER(apellido))` | GIN con `pg_trgm` | FR-031 | `WHERE nombre ILIKE '%texto%' OR apellido ILIKE '%texto%'` |

### Nota sobre `pg_trgm`

La extensión `pg_trgm` de PostgreSQL habilita índices GIN para búsquedas de similitud
de texto (`ILIKE '%texto%'`) con buen rendimiento incluso en tablas grandes.

Firebase Data Connect usa **Cloud SQL for PostgreSQL**, que soporta extensiones. Verificar si `pg_trgm` está habilitada en la instancia `appweb-openwash-fdc`:

```sql
SELECT * FROM pg_extension WHERE extname = 'pg_trgm';
-- Si no está, habilitarla:
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

**Alternativa sin `pg_trgm`**: usar `LOWER(nombre) LIKE LOWER('%$búsqueda%')`. Sin
índice GIN, el rendimiento es aceptable para el volumen esperado en v1.0 (pocos
miles de usuarios y turnos). Si el volumen escala, se prioriza `pg_trgm`.

---

## RD-004 — Cloud Scheduler para completado automático (FR-034)

### Requisito
FR-034: el sistema transiciona automáticamente un turno de `confirmado` a `completado`
15 minutos después de su hora de inicio. Esta transición no requiere intervención manual.

### Estrategia elegida: Cloud Scheduler + Cloud Function

**Cloud Scheduler** dispara una Cloud Function cada **5 minutos**.

La función (`completarTurnos.ts`):
1. Consulta en Data Connect (PostgreSQL) todos los turnos con:
   - `estado = 'confirmado'`
   - `fecha + horario + 15 minutos <= CURRENT_TIMESTAMP`
2. Para cada turno encontrado, ejecuta la mutation `CambiarEstadoTurno(id, "completado")`.
3. No necesita actualizar Firestore: un turno `completado` no libera su slot
   (el slot ya ocurrió; la disponibilidad de fechas pasadas no se consulta).

### Ventana de inconsistencia

Con un scheduler cada 5 min existe una ventana de **hasta 5 minutos** donde el turno
ya finalizó pero el sistema aún lo muestra como `confirmado`.

**Impacto real en v1.0**:
- El cliente puede ver el turno como `confirmado` hasta 5 min después de que terminó.
- La clasificación próximos/historial (FR-018, FR-019) se basa en
  `fecha+hora < ahora`, **no en el estado**, por lo que el turno aparece
  correctamente en historial aunque el estado aún sea `confirmado`.
- No hay impacto funcional en la disponibilidad de slots (los slots de horas pasadas
  no se consultan para nuevas reservas).

Este comportamiento es **aceptado en v1.0** y se documenta como limitación conocida.

### Alternativa considerada y descartada

**Cloud Tasks por turno**: al crear cada turno, encolar un `Task` con un delay de
`horario + 15 min`. Más preciso (resolución de segundos), pero:
- Mayor costo y complejidad operativa.
- Requiere gestionar cancelación del task si el turno se cancela antes.
- Fuera de alcance para v1.0; identificada como mejora para v2.0.

---

## RD-005 — Testing con Firebase Local Emulator Suite

### Emuladores necesarios

| Emulador | Puerto sugerido | Propósito |
|---|---|---|
| Authentication | 9099 | Tests de registro, login, bloqueo de cuenta, eliminación |
| Data Connect | 9399 | Tests de queries y mutations (esquema de OpenWash) |
| Firestore | 8080 | Tests de disponibilidad en tiempo real y triggers |
| Functions | 5001 | Tests de Cloud Functions (triggers, scheduler, callables) |
| Emulator UI | 4000 | Inspección visual del estado de todos los emuladores |

### Estrategia de testing por capa

| Capa | Framework sugerido | Scope |
|---|---|---|
| Hooks y servicios frontend | Vitest + Testing Library | Lógica de negocio: regla 30 min, clasificación próximos/historial, validación horario pasado, reglas de transición de estado |
| Cloud Functions | Jest + `firebase-functions-test` | Transición automática `completado`, cancelación en cascada, actualización de disponibilidad en Firestore |
| Operaciones Data Connect | Firebase Emulator + cliente Web SDK | Queries y mutations tipadas; cobertura de: crearTurno (concurrencia), cancelarTurnoPropio, obtenerTurnosPropios |
| Tests end-to-end | Playwright + Firebase Emulators | Flujos principales: registro → login → reserva → cancelación (US1+US2+US3); panel admin gestión de usuarios y turnos (US5+US6) |

### Seed data para tests

El archivo `dataconnect/seed_data.gql` debe incluir:

| Entidad | Cantidad | Descripción |
|---|---|---|
| Usuarios | 1 admin | Para tests del panel de administración |
| Usuarios | 2 activos con rol "user" | Para tests de reserva y conflictos concurrentes |
| Usuarios | 1 inactivo | Para test de bloqueo en login (FR-023) |
| Usuarios | 1 que se eliminará | Para test de cancelación en cascada (FR-033) |
| Turnos | 2 próximos `confirmado` | Para tests de US2 y US3 |
| Turnos | 1 futuro `pendiente` | Para test de máquina de estados |
| Turnos | 1 pasado `completado` | Para test de historial (FR-019) |
| Turnos | 1 `cancelado` | Para test de historial (FR-019) |

### Aislamiento entre tests

- Usar `firebase emulators:exec` en CI: inicia emulators, ejecuta tests, apaga.
- Limpiar estado entre suites con la API REST del emulador:
  - Firestore: `DELETE http://localhost:8080/emulator/v1/projects/{id}/databases/(default)/documents`
  - Auth: `DELETE http://localhost:9099/emulator/v1/projects/{id}/accounts`
- Los tests de Data Connect se aíslan recreando los datos de seed antes de cada suite.

### Ejecución en CI/CD

```bash
# Comando para CI (GitHub Actions u equivalente)
firebase emulators:exec \
  --only auth,dataconnect,firestore,functions \
  --project demo-openwash \
  "npm run test:all"
```

---

## RD-006 — Bloqueo de cuenta desactivada: Firebase Auth disabled vs campo `activo`

### Pregunta
¿Cómo impedir que un usuario desactivado inicie sesión, dado que Firebase
Authentication no tiene un campo "activo" nativo accesible desde el cliente?

### Opciones evaluadas

**Opción A — Firebase Auth campo `disabled` nativo (Admin SDK)**

Firebase Authentication expone `admin.auth().updateUser(uid, { disabled: true })`.
Un usuario con `disabled: true` recibe el error `auth/user-disabled` al llamar
`signInWithEmailAndPassword`.

→ **Ventaja**: el bloqueo es aplicado por Firebase Auth antes de que el token
  llegue al cliente. No hay ventana de bypass.
→ **Desventaja**: `updateUser` requiere Firebase Admin SDK, disponible solo en
  Cloud Functions (no en el cliente web).

**Opción B — Campo `activo` en Data Connect, verificación post-login**

El campo `activo` en la tabla de usuarios se lee después de que el login de Firebase
Auth sea exitoso. Si `activo === false`, el cliente fuerza un logout manual.

→ **Ventaja**: no requiere Admin SDK para la verificación.
→ **Desventaja**: existe una ventana pequeña entre el login exitoso y la verificación
  de `activo`. Un usuario con un token JWT válido (pre-existente) podría en teoría
  hacer requests directos a Data Connect mientras el token esté vigente.

### Decisión: Opción A + B combinadas (doble bloqueo)

1. **Al desactivar** un usuario (F5-05): el admin llama a una Cloud Function callable
   que ejecuta `admin.auth().updateUser(uid, { disabled: true })` **Y** actualiza
   `activo = false` en Data Connect en la misma operación.

2. **Al intentar login**: `signInWithEmailAndPassword` devuelve `auth/user-disabled`
   nativo antes de que el usuario obtenga un token → el cliente muestra el error sin
   acceso posible.

3. **AuthContext al inicializar**: tras recibir el usuario autenticado de
   `onAuthStateChanged`, consulta el campo `activo` en Data Connect. Si `activo === false`
   (caso edge: token pre-existente antes de la desactivación), fuerza logout inmediato.

4. **Al reactivar**: Cloud Function callable ejecuta
   `admin.auth().updateUser(uid, { disabled: false })` Y `activo = true` en Data Connect.

### Justificación del doble bloqueo

Las directivas `@auth(level: USER)` de Data Connect verifican que el usuario esté
autenticado en Firebase Auth, pero **no verifican el campo `activo`** en la base de
datos. Sin el bloqueo en Firebase Auth (`disabled: true`), un usuario con token vigente
podría seguir ejecutando mutations aunque `activo` sea `false`.

El bloqueo en Firebase Auth garantiza que el token se invalida en la próxima sesión.
El campo `activo` en Data Connect es la verificación de segundo nivel para el AuthContext.
