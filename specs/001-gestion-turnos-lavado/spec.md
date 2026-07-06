# Feature Specification: Gestión de Turnos - Open Wash

**Feature Branch**: `001-gestion-turnos-lavado`
**Created**: 2026-07-06
**Status**: Ready for Planning *(actualizado tras resolución de issues de functional-quality — 2026-07-06)*
**Input**: User description: "Desarrollar una aplicación web para la gestión de un lavadero de autos llamado Open Wash, ubicado en Villa del Parque, CABA. La aplicación permite a los clientes registrarse, iniciar sesión y reservar turnos de lavado. Los administradores gestionan usuarios y turnos desde un panel dedicado. El sistema aplica control de acceso por rol en todas las operaciones."

---

## Clarifications

### Session 2026-07-06

- Q: ¿Debe la reserva de turno capturar datos del vehículo del cliente para habilitar
  la búsqueda "por cliente o vehículo" del panel admin? → A: Sí, se capturan patente y
  tipo de vehículo (auto, camioneta, moto) como datos mínimos.
- Q: ¿Con qué estado nace un turno apenas el cliente lo reserva? → A: Nace "pendiente"
  y el sistema lo confirma automáticamente a "confirmado" si el horario efectivamente
  está disponible al momento de la reserva (sin concurrencia).
- Q: ¿Qué debe impedir exactamente una cuenta "desactivada" por un administrador? → A:
  El usuario desactivado no puede iniciar sesión; el bloqueo se implementa a nivel
  credenciales.

### Session 2026-07-06 — Resolución functional-quality

- Q: ¿El estado `completado` lo asigna manualmente el admin o el sistema lo hace
  automáticamente? → A: El sistema transiciona automáticamente el estado de `confirmado`
  a `completado` 15 minutos después de la hora de inicio del turno (duración estándar de
  un slot). El administrador también puede marcarlo manualmente desde el panel antes de
  que ocurra la transición automática.
- Q: ¿La entidad Vehículo es independiente o está embebida en Turno? → A: Los datos del
  vehículo (patente y tipo) se capturan como atributos del Turno. No existe entidad
  Vehículo independiente en v1.0; queda identificada como mejora candidata para v2.0.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registro e inicio de sesión (Priority: P1)

Un cliente nuevo crea una cuenta con sus datos personales y credenciales, y a partir de
ese momento puede iniciar y cerrar sesión de forma segura, permaneciendo conectado
entre visitas.

**Why this priority**: Es la puerta de entrada obligatoria a todo el sistema. Sin
autenticación no existe forma de asociar reservas, datos personales ni permisos de rol
a un usuario. Ninguna otra historia puede probarse sin esta.

**Independent Test**: Puede probarse por completo registrando un usuario nuevo,
cerrando el navegador, y volviendo a abrir la aplicación para verificar que la sesión
persiste; luego cerrando sesión manualmente desde el perfil y confirmando que se
requiere volver a iniciar sesión.

**Acceptance Scenarios**:

1. **Given** un visitante sin cuenta, **When** completa el formulario de registro con
   nombre, apellido, teléfono, email y contraseña válidos, **Then** se crea su cuenta
   con rol "user" y queda con sesión iniciada.
2. **Given** un visitante intenta registrarse con un email ya utilizado, **When** envía
   el formulario, **Then** el sistema rechaza el registro e informa que el email ya
   está en uso.
3. **Given** un usuario registrado, **When** ingresa su email y contraseña correctos en
   el login, **Then** accede a la aplicación y ve contenido correspondiente a su rol.
4. **Given** un usuario registrado, **When** ingresa una contraseña incorrecta,
   **Then** el sistema rechaza el acceso e informa el error sin especificar si el
   email existe o no.
5. **Given** un usuario con sesión iniciada en cualquier pantalla, **When** navega a su
   perfil y selecciona "Cerrar sesión", **Then** su sesión finaliza y es redirigido a
   la pantalla de login.
6. **Given** un usuario cerró la aplicación sin cerrar sesión, **When** vuelve a abrir
   la aplicación más tarde, **Then** continúa con la sesión iniciada sin pedir
   credenciales nuevamente.

> **Nota**: La recuperación de contraseña por email está fuera de alcance en v1.0.
> Ver Assumptions y FR-002.

---

### User Story 2 - Reservar un turno de lavado (Priority: P1)

Un cliente autenticado elige un servicio, una fecha y un horario disponible para lavar
su vehículo, y obtiene la confirmación de que el turno quedó reservado a su nombre.

**Why this priority**: Es el valor central del producto: la razón de ser de la
aplicación es permitir reservar turnos. Sin esta historia, el sistema no cumple su
propósito de negocio aunque el resto de las funciones existan.

**Independent Test**: Puede probarse por completo iniciando sesión como cliente,
seleccionando un servicio, una fecha y un bloque horario libre, confirmando la reserva,
y verificando que el turno aparece en la lista de turnos próximos del cliente y que ese
horario deja de estar disponible para otros clientes.

**Acceptance Scenarios**:

1. **Given** un cliente autenticado en la pantalla de reservas, **When** selecciona un
   servicio (Básico, Completo o Premium), ingresa la patente y el tipo de vehículo,
   selecciona una fecha y un horario disponible, y confirma la reserva, **Then** el
   turno queda registrado con estado "confirmado" y ese horario pasa a mostrarse como
   ocupado para todos los usuarios.
2. **Given** dos clientes intentan reservar el mismo servicio, fecha y horario casi
   simultáneamente, **When** ambos confirman la reserva, **Then** solo uno de los dos
   obtiene el turno y el otro recibe un aviso de que el horario ya no está disponible.
3. **Given** un cliente visualiza el calendario de un día, **When** un horario ya tiene
   un turno reservado, **Then** ese horario se muestra bloqueado/no seleccionable en
   tiempo real para todos los clientes conectados.
4. **Given** un cliente intenta reservar un horario del día actual que ya pasó,
   **When** selecciona ese horario, **Then** el sistema no permite la reserva.
5. **Given** un cliente con un turno reservado, **When** faltan más de 30 minutos para
   el horario del turno, **Then** puede cancelarlo y el horario vuelve a estar
   disponible para otros clientes.
6. **Given** un cliente con un turno reservado, **When** faltan menos de 30 minutos
   para el horario del turno, **Then** la opción de cancelar no está disponible.
7. **Given** un cliente completa una reserva sin ingresar patente o sin seleccionar
   tipo de vehículo, **When** intenta confirmar, **Then** el sistema no permite
   completar la reserva hasta que ambos datos estén presentes.

---

### User Story 3 - Ver turnos propios (Priority: P2)

Un cliente autenticado consulta sus turnos próximos y su historial de turnos pasados
para saber qué reservas tiene activas y cuáles ya se realizaron.

**Why this priority**: Complementa directamente a la reserva de turnos (US2): permite
al cliente confiar en que su reserva existe y hacer seguimiento de su actividad, pero
la aplicación ya entrega valor sin esta vista.

**Independent Test**: Puede probarse iniciando sesión con un cliente que tiene al menos
un turno futuro y uno pasado, y verificando que ambos aparecen correctamente separados
en las secciones correspondientes.

**Acceptance Scenarios**:

1. **Given** un cliente con turnos reservados, **When** abre la sección "Mis turnos",
   **Then** ve listados sus turnos próximos ordenados por fecha/hora ascendente.
2. **Given** un cliente con turnos ya finalizados, **When** abre la sección de
   historial, **Then** ve listados esos turnos pasados con su estado final.
3. **Given** un cliente sin ningún turno reservado, **When** abre "Mis turnos",
   **Then** ve un mensaje indicando que no tiene turnos, sin errores.

---

### User Story 4 - Gestión del perfil propio (Priority: P2)

Un cliente autenticado visualiza y edita sus datos personales, cambia su contraseña, o
elimina su propia cuenta cuando ya no desea usar el servicio.

**Why this priority**: Es funcionalidad de mantenimiento de cuenta esperable en
cualquier sistema con autenticación, pero no bloquea el flujo principal de reservar
turnos (US1 + US2 ya entregan valor sin esto).

**Independent Test**: Puede probarse iniciando sesión, editando nombre/apellido/
teléfono y verificando que los cambios persisten tras recargar; y por separado,
eliminando la cuenta y verificando que ya no es posible iniciar sesión con esas
credenciales.

**Acceptance Scenarios**:

1. **Given** un cliente autenticado en su perfil, **When** edita su nombre, apellido o
   teléfono y guarda, **Then** los nuevos datos quedan persistidos y visibles en su
   perfil.
2. **Given** un cliente autenticado, **When** solicita cambiar su contraseña e ingresa
   su contraseña actual y una nueva válida, **Then** la contraseña se actualiza y puede
   usarla en el próximo login.
3. **Given** un cliente autenticado, **When** solicita eliminar su propia cuenta y
   confirma la acción, **Then** su cuenta y su acceso se eliminan, sus turnos futuros
   activos se cancelan automáticamente (FR-033), y no puede volver a iniciar sesión con
   esas credenciales.
4. **Given** un cliente intenta editar el campo email desde su perfil, **When** revisa
   el formulario, **Then** el email no es editable como dato propio (ver Assumptions).

---

### User Story 5 - Administración de usuarios (Priority: P3)

Un administrador visualiza el listado completo de usuarios registrados, edita sus
datos, cambia su rol, activa/desactiva su cuenta o la elimina cuando es necesario.

**Why this priority**: Es una función de back-office necesaria para operar el negocio a
mediano plazo, pero el sistema ya genera valor para los clientes (US1-US4) antes de que
exista un panel de administración de usuarios.

**Independent Test**: Puede probarse iniciando sesión como administrador, abriendo el
panel de usuarios, editando los datos de un usuario existente, cambiándole el rol, y
verificando que los cambios se reflejan para ese usuario en su próxima sesión.

**Acceptance Scenarios**:

1. **Given** un administrador autenticado, **When** abre el panel de usuarios,
   **Then** ve la lista completa de usuarios registrados con sus datos principales y
   rol actual.
2. **Given** un administrador en el panel de usuarios, **When** edita los datos de un
   usuario (nombre, apellido, teléfono), **Then** los cambios quedan guardados y son
   visibles para el usuario afectado en su próxima sesión.
3. **Given** un administrador en el panel de usuarios, **When** cambia el rol de un
   usuario, **Then** el cambio queda guardado y el usuario afectado opera con el nuevo
   rol a partir de su próxima sesión.
4. **Given** un administrador en el panel de usuarios, **When** desactiva la cuenta de
   un usuario activo, **Then** ese usuario no puede iniciar sesión aunque sus
   credenciales sean correctas.
5. **Given** un administrador en el panel de usuarios, **When** elimina la cuenta de un
   usuario, **Then** la cuenta se elimina y sus turnos futuros en estado "pendiente" o
   "confirmado" se cancelan automáticamente (FR-033).
6. **Given** un usuario con rol "user", **When** intenta acceder al panel de
   administración de usuarios, **Then** es redirigido a su vista de cliente sin ver
   información de otros usuarios.

---

### User Story 6 - Administración de turnos (Priority: P3)

Un administrador visualiza el listado completo de turnos, filtra por fecha, estado o
servicio, cambia el estado de un turno y busca por cliente o patente para gestionar la
operación diaria del lavadero.

**Why this priority**: Es funcionalidad de back-office necesaria para la operación del
negocio. Los clientes ya generan valor con US1-US4 sin que este panel exista, pero el
negocio no puede operar eficientemente sin control sobre el flujo de turnos.

**Independent Test**: Puede probarse iniciando sesión como administrador, navegando al
panel de turnos, filtrando por fecha, cambiando el estado de un turno a "completado" y
verificando que el cambio se refleja correctamente en el registro del cliente.

**Acceptance Scenarios**:

1. **Given** un administrador autenticado, **When** abre el panel de turnos, **Then**
   ve el listado completo de turnos con cliente, patente, tipo de vehículo, servicio,
   fecha, hora y estado actual.
2. **Given** un administrador en el panel de turnos, **When** aplica un filtro por
   fecha, estado o servicio, **Then** la lista se actualiza mostrando solo los turnos
   que coinciden con el filtro.
3. **Given** un administrador en el panel de turnos, **When** cambia manualmente el
   estado de un turno, **Then** el nuevo estado queda guardado y es visible para el
   cliente afectado.
4. **Given** un administrador en el panel de turnos, **When** cancela un turno en
   estado "pendiente" o "confirmado", **Then** el turno pasa a "cancelado" y el horario
   vuelve a estar disponible para nuevas reservas.
5. **Given** un administrador en el panel de turnos, **When** escribe parte del nombre
   o apellido de un cliente en el campo de búsqueda, **Then** la lista muestra solo los
   turnos cuyo cliente coincide parcialmente con la búsqueda, sin distinción de
   mayúsculas ni acentos.
6. **Given** un usuario con rol "user", **When** intenta acceder al panel de
   administración de turnos, **Then** es redirigido a su vista de cliente.

---

## Functional Requirements

### Autenticación y sesión

**FR-001** (P1): El sistema DEBE permitir a un visitante registrarse ingresando nombre,
apellido, teléfono, email y contraseña. Al completar el registro exitosamente, la
cuenta se crea con rol "user" y el usuario queda con sesión iniciada. Si el email ya
está en uso, el registro es rechazado con un mensaje informativo.

**FR-002** (P1): El sistema DEBE permitir a un usuario registrado iniciar sesión con su
email y contraseña. Si las credenciales son incorrectas, el sistema rechaza el acceso
sin especificar si el email existe o no.
> **Nota**: La recuperación de contraseña por email está explícitamente fuera de
> alcance en v1.0 (ver Assumptions).

**FR-003** (P1): El sistema DEBE persistir la sesión del usuario entre visitas. Un
usuario que cierra el navegador sin cerrar sesión debe encontrar su sesión activa al
volver a abrir la aplicación.

**FR-004** (P1): El sistema DEBE permitir a un usuario con sesión activa cerrar sesión
manualmente desde su perfil. Al cerrar sesión, el usuario es redirigido a la pantalla
de login.

**FR-005** (P1): El sistema DEBE aplicar control de acceso basado en rol en todas las
rutas protegidas. Las vistas y operaciones del panel de administración solo son
accesibles para usuarios con rol "admin". Un usuario con rol "user" que intente acceder
a rutas de administración DEBE ser redirigido a su vista correspondiente.

---

### Perfil y gestión de cuenta propia

**FR-006** (P2): El sistema DEBE mostrar al usuario autenticado sus datos de perfil:
nombre, apellido, teléfono y email.

**FR-007** (P2): El sistema DEBE permitir al usuario autenticado editar su nombre,
apellido y teléfono. El campo email no es editable por el propio usuario (ver
Assumptions).

**FR-008** (P2): El sistema DEBE permitir al usuario autenticado cambiar su contraseña
ingresando su contraseña actual y la nueva. La nueva contraseña reemplaza a la
anterior.

**FR-009** (P2): El sistema DEBE permitir al usuario autenticado eliminar su propia
cuenta previa confirmación explícita. Al eliminar la cuenta, el acceso queda revocado y
el sistema ejecuta automáticamente el proceso definido en FR-033.

---

### Sistema de reservas

**FR-010** (P1): El sistema DEBE permitir a un cliente autenticado crear una reserva
seleccionando servicio (Básico, Completo o Premium), fecha y horario disponible. Al
crearse, el turno nace con estado "pendiente".

**FR-011** (P1): El sistema DEBE requerir la patente del vehículo y el tipo de vehículo
(auto, camioneta, moto) como datos obligatorios para completar una reserva. Sin ambos
datos presentes, la reserva no puede confirmarse.
> Los datos del vehículo se almacenan como atributos del Turno. No existe entidad
> Vehículo independiente en v1.0 (ver Key Entities).

**FR-012** (P1): El sistema DEBE ofrecer horarios en bloques de 15 minutos entre las
8:00 y las 21:00 horas. Los horarios ya ocupados no deben aparecer como seleccionables.

**FR-013** (P1): El sistema DEBE actualizar en tiempo real la disponibilidad de los
horarios para todos los clientes conectados. Cuando un turno es reservado o cancelado,
el bloque horario correspondiente cambia de estado de forma inmediata y visible para
todos los usuarios activos.

**FR-014** (P1): Al confirmar una reserva, el sistema DEBE ejecutar las siguientes dos
operaciones:

**(1) Máquina de estados**: Si el horario seleccionado está disponible al momento de la
transacción, el sistema transiciona automáticamente el estado del turno de "pendiente"
a "confirmado". Si el horario ya no está disponible, el turno no se crea y el cliente
recibe el aviso "el horario ya no está disponible".

**(2) Prevención de concurrencia**: La verificación de disponibilidad y la escritura del
turno DEBEN ejecutarse como una operación atómica. Ante solicitudes simultáneas sobre
el mismo horario, solo la primera transacción exitosa obtiene el horario; la segunda
recibe el error "horario ocupado" independientemente del momento en que fue iniciada.

**FR-015** (P1): El sistema DEBE impedir la reserva de un horario del día actual cuya
hora ya haya transcurrido en el momento de la solicitud.

**FR-016** (P2): El sistema DEBE permitir al cliente cancelar un turno propio siempre
que falten más de 30 minutos para la hora del turno. Al cancelarse, el horario vuelve a
estar disponible para otros clientes.

**FR-017** (P2): El sistema NO DEBE ofrecer la opción de cancelar un turno cuando
falten 30 minutos o menos para su hora de inicio.

**FR-018** (P2): El sistema DEBE mostrar al cliente autenticado sus turnos próximos,
ordenados por fecha y hora ascendente.
> **Regla de clasificación — próximos**: un turno es "próximo" si
> `fecha+hora >= momento_actual` AND `estado ∈ {pendiente, confirmado}`.

**FR-019** (P2): El sistema DEBE mostrar al cliente autenticado su historial de turnos
con su estado final.
> **Regla de clasificación — historial**: un turno pertenece al historial en cualquiera
> de estos casos: (a) su `fecha+hora < momento_actual`, independientemente del estado;
> (b) su estado es `cancelado` o `completado`, independientemente de la fecha.

---

### Administración de usuarios

**FR-020** (P3): El sistema DEBE mostrar al administrador autenticado la lista completa
de usuarios registrados con sus datos principales: nombre, apellido, email, teléfono,
rol y estado de cuenta (activo/inactivo).

**FR-021** (P3): El sistema DEBE permitir al administrador editar los datos de cualquier
usuario: nombre, apellido y teléfono. Los cambios deben persistir y ser visibles para
el usuario afectado en su próxima sesión.

**FR-022** (P3): El sistema DEBE permitir al administrador cambiar el rol de cualquier
usuario entre "user" y "admin". El cambio es efectivo a partir de la próxima sesión del
usuario afectado.

**FR-023** (P3): El sistema DEBE permitir al administrador activar o desactivar la
cuenta de cualquier usuario. Cuando una cuenta es desactivada, el sistema DEBE impedir
que ese usuario inicie sesión en la aplicación. El bloqueo aplica independientemente de
que las credenciales de autenticación sigan siendo técnicamente válidas.

**FR-024** (P3): El sistema DEBE permitir al administrador eliminar la cuenta de
cualquier usuario. Al eliminar la cuenta, el sistema ejecuta automáticamente el proceso
definido en FR-033.

**FR-025** (P3): El panel de administración de usuarios solo es accesible para usuarios
con rol "admin". Un intento de acceso por parte de un usuario con rol "user" DEBE
resultar en redirección a su vista de cliente.

---

### Administración de turnos

**FR-026** (P3): El sistema DEBE mostrar al administrador el listado completo de turnos
con sus datos: cliente, patente, tipo de vehículo, servicio, fecha, hora y estado
actual.

**FR-027** (P3): El sistema DEBE permitir al administrador filtrar el listado de turnos
por: fecha, estado y/o servicio.

**FR-028** (P3): El sistema DEBE permitir al administrador cambiar manualmente el estado
de cualquier turno. Las transiciones válidas desde el panel son:
`pendiente → confirmado`, `confirmado → completado`,
`pendiente o confirmado → cancelado`.

**FR-029** (P3): El sistema DEBE permitir al administrador cancelar cualquier turno en
estado "pendiente" o "confirmado". Al cancelarse, el horario vuelve a estar disponible
para nuevas reservas.

**FR-030** (P3): El sistema DEBE permitir al administrador buscar turnos por fecha
específica.

**FR-031** (P3): El sistema DEBE permitir al administrador buscar turnos por cliente o
por patente del vehículo. La búsqueda por cliente aplica sobre los campos `nombre` y
`apellido` del usuario usando **coincidencia parcial insensible a mayúsculas y
acentos**. La búsqueda por patente aplica sobre el campo `patente` del turno con
coincidencia parcial.

**FR-032** (P3): El panel de administración de turnos solo es accesible para usuarios
con rol "admin". Un intento de acceso por parte de un usuario con rol "user" DEBE
resultar en redirección a su vista de cliente.

---

### Procesos automáticos del sistema

**FR-033** (P1): Al eliminar una cuenta —ya sea por el propio usuario (FR-009) o por un
administrador (FR-024)— el sistema DEBE cancelar automáticamente todos los turnos
futuros con estado "pendiente" o "confirmado" asociados a esa cuenta. Los turnos en
estado "completado" o "cancelado" se conservan en el sistema como historial sin
asociación activa al usuario eliminado.

**FR-034** (P1): El sistema DEBE transicionar automáticamente el estado de un turno de
"confirmado" a "completado" 15 minutos después de la hora de inicio del turno (duración
estándar de un slot). Esta transición no requiere intervención manual. El administrador
puede también marcar un turno como "completado" manualmente antes de que ocurra la
transición automática (FR-028).

---

## Key Entities

### Usuario

| Atributo     | Tipo                       | Requerido | Valor por defecto | Notas                                         |
|---|---|---|---|---|
| `uid`        | string                     | ✅        | —                 | Generado por Firebase Auth                    |
| `nombre`     | string                     | ✅        | —                 |                                               |
| `apellido`   | string                     | ✅        | —                 |                                               |
| `email`      | string                     | ✅        | —                 | Único; no editable por el propio usuario      |
| `teléfono`   | string                     | ✅        | —                 |                                               |
| `rol`        | enum {"user","admin"}      | ✅        | `"user"`          | Solo un admin puede modificarlo               |
| `activo`     | boolean                    | ✅        | **`true`**        | Solo un admin puede modificarlo a `false`     |

**Relación**: 1:N con Turno.

---

### Turno

| Atributo        | Tipo                                               | Requerido | Valor por defecto | Notas                              |
|---|---|---|---|---|
| `id`            | string                                             | ✅        | —                 | Generado automáticamente           |
| `userId`        | string                                             | ✅        | —                 | Referencia al Usuario              |
| `servicio`      | enum {"Básico","Completo","Premium"}               | ✅        | —                 |                                    |
| `fecha`         | date                                               | ✅        | —                 | Formato YYYY-MM-DD                 |
| `horario`       | time                                               | ✅        | —                 | Formato HH:MM, bloques de 15 min   |
| `estado`        | enum {"pendiente","confirmado","completado","cancelado"} | ✅ | `"pendiente"`   |                                    |
| `patente`       | string                                             | ✅        | —                 | Atributo embebido del vehículo     |
| `tipoVehiculo`  | enum {"auto","camioneta","moto"}                   | ✅        | —                 | Atributo embebido del vehículo     |
| `creadoEn`      | timestamp                                          | ✅        | automático        |                                    |

**Relación**: N:1 con Usuario.

> **Nota sobre Vehículo**: Los datos del vehículo (`patente`, `tipoVehiculo`) se
> almacenan como atributos del Turno. No existe entidad Vehículo independiente en v1.0.
> Queda identificada como mejora candidata para v2.0.

---

### Servicio (catálogo fijo, no persistido en base de datos)

| Atributo  | Tipo                              |
|---|---|
| `nombre`  | enum {"Básico","Completo","Premium"} |

> Precio y descripción se comunican fuera de la aplicación (ver Assumptions).

---

## Assumptions

1. El idioma de toda la interfaz de usuario es español.
2. Los datos del vehículo (`patente`, `tipoVehiculo`) se almacenan como atributos del
   Turno. No existe entidad Vehículo independiente en v1.0. Esta decisión simplifica el
   modelo de datos; la entidad independiente queda como mejora candidata para v2.0.
3. Todos los servicios (Básico, Completo y Premium) ocupan exactamente **un bloque de
   15 minutos** a efectos del sistema de reservas. La duración real del lavado no es
   gestionada por la aplicación en v1.0; el negocio gestiona los tiempos operativos
   fuera del sistema.
4. El estado `completado` es asignado automáticamente por el sistema 15 minutos después
   de la hora de inicio del turno (FR-034). El administrador también puede marcarlo
   manualmente antes de que ocurra la transición automática (FR-028).
5. La entidad Servicio es un catálogo fijo con tres valores (Básico, Completo, Premium).
   El precio y la descripción de cada servicio se comunican al cliente fuera de la
   aplicación (cartelería física, redes sociales). La gestión de precios o descripciones
   no es parte del sistema en v1.0.
6. El campo `email` de un usuario no es editable por el propio usuario una vez creada
   la cuenta.
7. No existe restricción sobre la cantidad de turnos activos (`pendiente` o `confirmado`)
   que un cliente puede tener en simultáneo en v1.0.
8. El sistema no envía notificaciones por email, SMS ni push en v1.0. La confirmación de
   una reserva, su cancelación y cualquier cambio de estado se comunican exclusivamente
   a través de la interfaz de la aplicación.
9. La recuperación de contraseña por email está explícitamente fuera de alcance en v1.0.
   Un usuario que olvida su contraseña no tiene mecanismo de recuperación en esta
   versión.

---

## Success Criteria

| SC    | Descripción                      | Condición de éxito                                                                                                                              | Método de medición                              |
|---|---|---|---|
| SC-001 | Registro de cuenta nueva        | Completado en < 2 min desde apertura del formulario                                                                                             | Cronómetro manual                               |
| SC-002 | Flujo de reserva completo       | Completado en < 1 min                                                                                                                           | Cronómetro manual                               |
| SC-003 | Bloqueo de horarios ocupados    | 100% de intentos rechazados, incluyendo solicitudes concurrentes                                                                                | % de casos de prueba                            |
| SC-004 | Control de acceso por rol       | 100% de casos de prueba con resultado esperado                                                                                                  | % de casos de prueba                            |
| SC-005 | Localizar turno en panel admin  | Encontrado en < 10 seg usando filtros o búsqueda                                                                                                | Cronómetro manual                               |
| SC-006 | Carga inicial de la aplicación  | < 3 seg en conexión simulada de **20 Mbps bajada / 10 Mbps subida / 50 ms latencia** (Chrome DevTools "Fast 4G" personalizado o equivalente)  | Chrome DevTools Performance / Lighthouse        |
| SC-007 | Compatibilidad cross-browser    | Sin defectos de layout en **Chrome ≥ 124**, **Firefox ≥ 125** y **Safari ≥ 17**, en breakpoints **375 px** (móvil), **768 px** (tablet) y **1280 px** (desktop) | Inspección manual en DevTools de cada navegador |
| SC-008 | Cancelación de turno            | Flujo completo (Mis turnos → seleccionar → confirmar cancelación) completado en < 15 seg                                                        | Cronómetro manual                               |

---

## Edge Cases

1. **Eliminación de cuenta con turnos activos**: Al eliminar una cuenta (por el usuario
   o por un admin), todos los turnos futuros en estado `pendiente` o `confirmado` se
   cancelan automáticamente (FR-033). Los turnos en estado `completado` o `cancelado` se
   conservan como historial.
2. **Turno confirmado con hora vencida antes de la transición automática**: Un turno
   `confirmado` cuya hora ya pasó pero que aún no recibió la transición automática a
   `completado` (durante los 15 min post-inicio) pertenece al historial, ya que la
   clasificación se basa en `fecha+hora < momento_actual` (FR-019),
   independientemente del estado.
3. **Transición automática sobre turno ya completado manualmente**: Si el administrador
   marcó el turno como `completado` antes de que transcurran los 15 min, la transición
   automática (FR-034) no tiene efecto dado que el turno ya se encuentra en estado
   final.
4. **Cuenta desactivada**: Un usuario desactivado que intenta iniciar sesión recibe un
   error, aunque sus credenciales de autenticación sigan siendo técnicamente válidas
   (FR-023).
5. **Reserva concurrente**: Dos clientes que intentan reservar el mismo horario
   simultáneamente: solo uno obtiene el turno. El otro recibe "horario ocupado" sin
   importar cuándo inició su solicitud (FR-014).
6. **Horario pasado del día actual**: El sistema bloquea la selección de horarios ya
   transcurridos del día en curso, pero no impide la reserva de fechas futuras completas
   (FR-015).