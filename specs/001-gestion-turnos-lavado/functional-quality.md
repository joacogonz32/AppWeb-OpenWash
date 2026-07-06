# Functional Quality Checklist — 001-gestion-turnos-lavado

**Documento**: `functional-quality.md`
**Spec evaluada**: `specs/001-gestion-turnos-lavado/spec.md`
**Fecha de revisión**: 2026-07-06
**Revisor**: speckit.checklist
**Estado general**: ⚠️ CONDICIONAL — requiere resolución de 4 issues críticos antes de planificación

---

## Resumen ejecutivo

| Categoría | Estado | Issues críticos | Warnings |
|---|---|---|---|
| Historias de usuario & criterios de aceptación | ✅ PASS | 0 | 1 |
| Numeración de requisitos funcionales | ⚠️ WARN | 1 | 1 |
| Ambigüedades sin resolver | ❌ FAIL | 3 | 5 |
| Entidades clave | ⚠️ WARN | 1 | 2 |
| Criterios de éxito medibles | ⚠️ WARN | 0 | 2 |

---

## 1. Historias de usuario — criterios de aceptación testeables

### Resultado: ✅ PASS

| US | Título | Escenarios | Formato G/W/T | Cobertura edge cases | Veredicto |
|---|---|---|---|---|---|
| US1 | Registro e inicio de sesión | 6 | ✅ | ✅ (email duplicado, sesión persistente) | ✅ |
| US2 | Reservar turno | 7 | ✅ | ✅ (concurrencia, horario pasado, cancelación, datos faltantes) | ✅ |
| US3 | Ver turnos propios | 3 | ✅ | ✅ (estado vacío) | ✅ |
| US4 | Gestión del perfil | 4 | ✅ | ✅ (email no editable) | ✅ |
| US5 | Administración de usuarios | 6 | ✅ | ✅ (acceso denegado, desactivación) | ✅ |
| US6 | Administración de turnos | 6 | ✅ | ✅ (filtros, búsqueda) | ✅ |

### ⚠️ Warning US3-W01
**Historial de turnos — definición de "pasado" ambigua**
US3 escenario 2 dice "turnos ya finalizados" y FR-018 dice "historial de turnos pasados", pero no queda definido el criterio exacto:
- ¿Un turno es "pasado" cuando su `fecha+hora` ya transcurrió independientemente de su estado?
- ¿O solo cuando está en estado `completado` o `cancelado`?

Un turno `confirmado` cuya hora ya pasó, ¿aparece en "próximos" o en "historial"?

> **Acción requerida**: Agregar en Assumptions o en FR-018 la regla de clasificación: próximos = `fecha+hora >= ahora AND estado ∈ {pendiente, confirmado}`; historial = todo lo demás.

---

## 2. Numeración de requisitos funcionales

### Resultado: ⚠️ WARN — 1 issue crítico, 0 duplicados detectados

**Listado completo verificado**:

| Rango | Sección | Cantidad | Observación |
|---|---|---|---|
| FR-001–FR-005 | Autenticación | 5 | ✅ |
| FR-006–FR-009 | Perfil y cuenta | 4 | ✅ |
| FR-010, FR-010a, FR-011–FR-018 | Sistema de reservas | 10 | ⚠️ FR-010a |
| FR-019–FR-024 | Admin usuarios | 6 | ✅ |
| FR-025–FR-031 | Admin turnos | 7 | ✅ |
| **Total declarados** | | **32** | |

No se detectaron requisitos con contenido duplicado.

### ❌ Issue crítico FR-NUM-01
**FR-010a usa sufijo alfabético, rompiendo la numeración secuencial**

`FR-010a` es semánticamente un requisito independiente (captura de datos de vehículo), no una sub-cláusula de FR-010. Esto genera ambigüedad al referenciar requisitos en planificación y testing.

> **Acción requerida**: Renombrar `FR-010a` → `FR-010b`... No, mejor: renombrar como `FR-010a → FR-010` (datos del vehículo) y el actual `FR-010` pasa a ser `FR-010 + FR-010a` combinados, **o** simplemente promover `FR-010a` a `FR-011` y correr la numeración. La opción más limpia es insertar como `FR-010a` con nota explícita de que es sub-requisito de FR-010, o renombrar toda la sección a partir de FR-011.

### ⚠️ Warning FR-SPLIT-01
**FR-013 contiene dos responsabilidades distintas**

FR-013 mezcla: (a) la máquina de estados `pendiente → confirmado/rechazado` y (b) la prevención de doble reserva ante concurrencia. Son testeables de forma independiente y podrían mapearse a implementaciones distintas (transacciones Firestore vs. lógica de estado).

> **Recomendación**: Considerar dividir en FR-013 (máquina de estados del turno) y FR-013b (prevención de concurrencia con transacción atómica).

---

## 3. Ambigüedades sin resolver

### Resultado: ❌ FAIL — 3 críticas, 5 warnings

---

### ❌ Ambigüedad crítica AMB-01
**Ausencia de FR para cancelación automática de turnos al eliminar cuenta**

Las secciones Edge Cases y Assumptions establecen que al eliminar una cuenta "los turnos futuros en estado `pendiente` o `confirmado` se cancelan automáticamente". Sin embargo, **no existe ningún FR** que especifique este comportamiento. Esto lo convierte en un supuesto no verificable durante QA.

Afecta: FR-009 (el usuario elimina su cuenta), FR-023 (admin elimina usuario).

> **Acción requerida**: Crear `FR-032`: "Al eliminar una cuenta (por el propio usuario vía FR-009 o por un administrador vía FR-023), el sistema DEBE cancelar automáticamente todos los turnos futuros con estado `pendiente` o `confirmado` asociados a esa cuenta."

---

### ❌ Ambigüedad crítica AMB-02
**Duración de cada servicio y ocupación de slots no definida**

FR-011 define bloques de 15 minutos entre 8:00 y 21:00. Los servicios son Básico, Completo y Premium. No se especifica:

- ¿Todos los servicios ocupan exactamente 1 slot de 15 minutos?
- ¿O Completo/Premium pueden ocupar múltiples slots consecutivos?

Si un servicio ocupa más de un slot, la lógica de conflictos (FR-013) cambia sustancialmente. Si todos ocupan exactamente un slot, debe declararse explícitamente.

> **Acción requerida**: Agregar en Assumptions: "Todos los servicios (Básico, Completo, Premium) ocupan exactamente un bloque de 15 minutos a efectos de la reserva. La duración real del servicio no es gestionada por el sistema en v1.0."

---

### ❌ Ambigüedad crítica AMB-03
**Estado `completado`: quién lo asigna y cuándo**

FR-027 permite al administrador cambiar el estado a `completado`. No se define:

- ¿El sistema transiciona automáticamente un turno `confirmado` a `completado` cuando su hora ya pasó?
- ¿O `completado` es exclusivamente una acción manual del administrador?

Esto afecta directamente la lógica de US3 (historial), edge cases de cancelación, y la disponibilidad del botón "cancelar" en US2.

> **Acción requerida**: Definir explícitamente en Assumptions si existe alguna transición automática a `completado`. Si es solo manual: declararlo. Si es automático: crear el FR correspondiente.

---

### ⚠️ Warning AMB-W01
**FR-022 mezcla requisito funcional con decisión de implementación**

FR-022 especifica la verificación del campo `activo` en Firestore "desde el contexto de autenticación del cliente". Esta es una decisión de implementación (AuthContext de React + Firestore), no un comportamiento observable. Un FR debe describir *qué* hace el sistema, no *cómo* lo hace.

> **Recomendación**: Reformular como: "Al desactivarla, el sistema DEBE impedir el inicio de sesión de ese usuario en la aplicación, independientemente de que las credenciales de Firebase Authentication sigan siendo válidas."

---

### ⚠️ Warning AMB-W02
**Búsqueda "por cliente": criterio de coincidencia no definido**

FR-030 dice "buscar turnos por cliente o por patente". US6 escenario 6 dice "cuyo nombre coincide con la búsqueda". No se especifica:

- ¿La búsqueda es por nombre completo, por nombre, por apellido o por cualquiera de los dos?
- ¿Es búsqueda exacta o por coincidencia parcial (contains)?
- ¿Es case-sensitive?

> **Recomendación**: Agregar en FR-030 o en Assumptions: "La búsqueda por cliente aplica sobre nombre y/o apellido usando coincidencia parcial insensible a mayúsculas."

---

### ⚠️ Warning AMB-W03
**Límite de turnos activos por cliente no especificado**

La spec no establece si un cliente puede tener múltiples turnos activos simultáneamente (ej. dos turnos el mismo día en distintos horarios). Si no hay restricción, debe declararse. Si la hay, debe ser un FR.

> **Recomendación**: Agregar en Assumptions: "No existe restricción sobre la cantidad de turnos activos que un cliente puede tener en simultáneo en v1.0."

---

### ⚠️ Warning AMB-W04
**Notificaciones y confirmaciones: fuera de alcance no declarado**

Ninguna sección menciona si el sistema envía emails de confirmación, recordatorios u otras notificaciones. Para un sistema de reservas es una expectativa común del usuario final. Si está fuera de alcance, debe declararse explícitamente.

> **Recomendación**: Agregar en Assumptions: "El sistema no envía notificaciones por email, SMS ni push en v1.0. La confirmación de una reserva se comunica únicamente a través de la interfaz de la aplicación."

---

### ⚠️ Warning AMB-W05
**Recuperación de contraseña: out-of-scope declarado solo en Assumptions**

La Assumption indica que la recuperación de contraseña está fuera de alcance. Sin embargo, esta restricción impacta directamente la UX de US1 (login con contraseña incorrecta) y debería estar referenciada también en los criterios de US1 o en FR-002 para que el equipo de testing no lo trate como un gap.

> **Recomendación**: Agregar nota en FR-002 o en US1: "La recuperación de contraseña por email está explícitamente fuera de alcance en v1.0 (ver Assumptions)."

---

## 4. Entidades clave

### Resultado: ⚠️ WARN — 1 issue crítico, 2 warnings

### Evaluación por entidad declarada

| Entidad | Atributos definidos | Relaciones definidas | Veredicto |
|---|---|---|---|
| **Usuario** | nombre, apellido, teléfono, email, rol, activo | 1:N con Turno | ✅ |
| **Turno** | servicio, fecha, horario, estado, patente, tipo vehículo, userId | N:1 con Usuario | ✅ |
| **Servicio** | solo nombre (Básico/Completo/Premium) | referenciado por Turno | ⚠️ ver EK-W01 |

### ❌ Issue crítico EK-01
**Entidad "Vehículo" ausente del modelo**

El checklist de validación solicitado identifica explícitamente a "Vehículo" como entidad clave a verificar. En la spec, los datos del vehículo (`patente`, `tipo`) están embebidos como atributos del `Turno`, sin entidad independiente.

Esto tiene implicaciones:
- Un cliente que siempre trae el mismo auto debe reingresar la patente en cada reserva.
- No es posible buscar el historial de turnos de un vehículo específico a lo largo del tiempo.
- FR-030 menciona búsqueda por patente, pero sin entidad Vehículo, la búsqueda solo aplica turno a turno.

> **Acción requerida**: Decidir explícitamente si Vehículo es una entidad independiente (con su propio ciclo de vida y relación Usuario → Vehículo 1:N → Turno N:1) o si permanece como atributo embebido en Turno. Documentar la decisión en Key Entities y actualizar FR-010a y FR-030 acorde.

---

### ⚠️ Warning EK-W01
**Entidad Servicio carece de atributos relevantes**

La entidad Servicio está declarada como "catálogo fijo" pero sin ningún atributo más allá del nombre. Para un sistema de reservas es esperable que incluya al menos:

- `precio` (o indicación de que el precio no es gestionado por el sistema)
- `descripción` (qué incluye cada tipo de lavado)

Esto podría afectar la UI de la pantalla de reservas (US2) donde el cliente debe elegir un servicio de forma informada.

> **Recomendación**: Definir si Servicio incluye precio y/o descripción, o agregar en Assumptions que "el detalle y precio de cada servicio se comunica fuera de la aplicación en v1.0."

---

### ⚠️ Warning EK-W02
**Atributo `activo` del Usuario no tiene valor por defecto declarado en el modelo**

El campo `activo` de Usuario se menciona en FR-022 y en Assumptions (en el contexto de desactivación), pero las Key Entities no declaran que su valor inicial al crear la cuenta sea `true`.

> **Recomendación**: Agregar en la definición de la entidad Usuario: "`activo`: booleano, valor por defecto `true` al crear la cuenta."

---

## 5. Criterios de éxito medibles

### Resultado: ⚠️ WARN — 0 críticos, 2 warnings

| SC | Descripción | Métrica | Veredicto |
|---|---|---|---|
| SC-001 | Registro completo < 2 min | Tiempo cronometrado | ✅ |
| SC-002 | Reserva completa < 1 min | Tiempo cronometrado | ✅ |
| SC-003 | 100% bloqueo de horarios ocupados | % de intentos rechazados | ✅ |
| SC-004 | 100% control de acceso entre roles | % de casos de prueba | ✅ |
| SC-005 | Localizar turno en panel < 10 seg | Tiempo cronometrado | ✅ |
| SC-006 | Carga inicial < 3 seg en 4G | Tiempo de carga | ⚠️ ver SC-W01 |
| SC-007 | Sin errores en Chrome/FF/Safari | Compatibilidad visual | ⚠️ ver SC-W02 |
| SC-008 | Cancelar turno < 15 seg | Tiempo cronometrado | ✅ |

### ⚠️ Warning SC-W01
**SC-006 usa "4G típica" como baseline sin definir la velocidad de referencia**

"4G típica" no es una métrica reproducible. Distintos testers pueden obtener resultados distintos según el entorno de red.

> **Recomendación**: Reemplazar por una velocidad de red concreta: ej. "en una conexión simulada de 20 Mbps bajada / 10 Mbps subida con latencia de 50 ms (usando Chrome DevTools Network Throttling o equivalente)."

---

### ⚠️ Warning SC-W02
**SC-007 usa "errores visuales" como criterio subjetivo y no define versiones de browser**

"Sin errores visuales ni de layout" es subjetivo y no reproducible entre equipos. Tampoco se especifican las versiones exactas de cada navegador.

> **Recomendación**: Reemplazar por: "La aplicación se renderiza sin defectos de layout en Chrome ≥ 124, Firefox ≥ 125 y Safari ≥ 17, en los breakpoints móvil (375px), tablet (768px) y desktop (1280px), verificado con herramientas de DevTools."

---

## 6. Cobertura de control de acceso por rol

### Resultado: ✅ PASS — verificación adicional

| Operación | user | admin | FR que lo cubre |
|---|---|---|---|
| Registrarse / login | ✅ permitido | ✅ permitido | FR-001, FR-002 |
| Reservar turno propio | ✅ permitido | ✅ permitido | FR-010 |
| Ver turnos propios | ✅ permitido | ✅ permitido | FR-017, FR-018 |
| Cancelar turno propio | ✅ permitido (con restricción 30 min) | ✅ permitido | FR-015, FR-016 |
| Ver turnos de otros usuarios | ❌ denegado | ✅ permitido | FR-031 |
| Panel admin usuarios | ❌ denegado | ✅ permitido | FR-024 |
| Panel admin turnos | ❌ denegado | ✅ permitido | FR-031 |
| Editar datos de otro usuario | ❌ denegado | ✅ permitido | FR-031 |
| Eliminar cuenta propia | ✅ permitido | ✅ permitido | FR-009 |

No se detectaron gaps de cobertura de roles. ✅

---

## 7. Resumen de acciones requeridas

### 🔴 Críticas (bloquean planificación)

| ID | Acción |
|---|---|
| FR-NUM-01 | Corregir la numeración de `FR-010a` para mantener secuencia sin sufijos alfabéticos |
| AMB-01 | Crear `FR-032` para cancelación automática de turnos al eliminar cuenta |
| AMB-02 | Declarar en Assumptions que todos los servicios ocupan exactamente 1 slot de 15 min |
| AMB-03 | Definir si el estado `completado` es manual (admin) o automático (sistema) |
| EK-01 | Decidir si Vehículo es entidad independiente o atributo embebido, y documentarlo |

### 🟡 Warnings (resolver antes de development, no bloquean planificación)

| ID | Acción |
|---|---|
| US3-W01 | Definir criterio exacto de clasificación "próximo" vs. "historial" en FR-018 |
| FR-SPLIT-01 | Evaluar dividir FR-013 en dos requisitos independientes |
| AMB-W01 | Reformular FR-022 para separar comportamiento de implementación |
| AMB-W02 | Definir criterio de búsqueda por cliente (parcial, insensible a mayúsculas) |
| AMB-W03 | Declarar en Assumptions si hay límite de turnos activos por cliente |
| AMB-W04 | Declarar en Assumptions que no hay notificaciones en v1.0 |
| AMB-W05 | Referenciar el out-of-scope de recuperación de contraseña desde FR-002 |
| EK-W01 | Definir atributos de Servicio o declarar que precio/descripción están fuera del sistema |
| EK-W02 | Agregar `activo: true` como valor por defecto en la entidad Usuario |
| SC-W01 | Reemplazar "4G típica" por velocidad de red concreta en SC-006 |
| SC-W02 | Definir versiones de browser y breakpoints exactos en SC-007 |

---

> **Veredicto final**: La spec está bien estructurada y cubre la mayoría del dominio con criterios de aceptación testeables y requisitos sin duplicados. Antes de pasar a planificación deben resolverse los **5 issues críticos** (especialmente AMB-01, AMB-02, AMB-03 y EK-01 que pueden generar retrabajo de arquitectura). Los warnings pueden resolverse en paralelo durante la primera semana de desarrollo.