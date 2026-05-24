# Ujieres App

Aplicacion web progresiva para la gestion operativa de servidores, ujieres, asistencia, calendario, planificacion mensual y analitica interna de la Iglesia Avivamiento y Poder.

## Descripcion General

Ujieres App centraliza procesos que normalmente se gestionan de forma manual: asignacion de servidores por fecha y posicion, registro de asistencia, revision de ausencias, administracion de departamentos, suspensiones, disponibilidad, reportes y comunicacion de eventos internos.

El proyecto esta orientado a lideres, sublideres, encargados y servidores. Su proposito principal es reducir la carga administrativa de la coordinacion del ministerio, mejorar la trazabilidad de asistencia y facilitar una planificacion mensual mas equitativa.

La aplicacion funciona como una SPA/PWA construida con React y Vite. El backend se apoya en Supabase para autenticacion, base de datos PostgreSQL, politicas RLS, RPCs y Edge Functions.

## Caracteristicas Principales

- Inicio de sesion con Supabase Auth usando una estrategia de email virtual a partir del nombre de usuario.
- Rutas protegidas por autenticacion y permisos funcionales.
- Panel principal con resumen operativo y widget de consultas conversacionales.
- Calendario de servicios y vista detallada de asignaciones.
- Planificador mensual por departamento con asistente de asignacion automatica.
- Gestion de asistencia general, asistencia personal y registro historico.
- Gestion de usuarios, membresias, disponibilidad, suspensiones e inactividad.
- Gestion de departamentos, posiciones y uniformes.
- Agenda interna con eventos vistos/no vistos por usuario.
- Analitica departamental y analitica global para administradores.
- Exportacion visual de reportes/calendarios mediante captura HTML a imagen.
- Notificaciones visuales con Mantine Notifications.
- PWA con service worker, cache de assets y cache de llamadas a Supabase.
- Observabilidad con Sentry en frontend y algunas Edge Functions.
- Pruebas unitarias, de componentes, seguridad y E2E.

## Tecnologias Utilizadas

| Categoria | Tecnologia |
| --- | --- |
| Lenguaje | TypeScript, JavaScript |
| Frontend | React 18, Vite 6 |
| UI | Mantine 8, Mantine Dates, Mantine Notifications |
| Iconos | Tabler Icons React |
| Routing | React Router DOM 6 |
| Estado servidor/cache | TanStack React Query 5 |
| Calendario | React Big Calendar, Day.js |
| Graficos | Mantine Charts, Recharts |
| Backend/BaaS | Supabase Auth, PostgreSQL, Edge Functions, RPCs, RLS |
| IA/NLP | Groq API compatible con OpenAI, modelo `llama-3.1-8b-instant`, via Edge Function `chat-ai` |
| Validacion | Zod |
| Exportacion | html-to-image, jsPDF, jspdf-autotable |
| PWA | vite-plugin-pwa, Workbox |
| Observabilidad | Sentry, Vercel Analytics |
| Testing | Vitest, Testing Library, Playwright, axe-core/playwright |
| Linting | ESLint 9, typescript-eslint |
| Deploy | Vercel |

## Arquitectura del Proyecto

La aplicacion sigue una arquitectura frontend modular por funcionalidades. El cliente React consume Supabase directamente para operaciones de datos autorizadas por RLS y usa Edge Functions para tareas privilegiadas o integraciones externas.

```text
Usuario
  |
  v
React SPA / PWA
  |
  +-- React Router: rutas publicas y protegidas
  +-- UserContext: sesion, perfil y membresias
  +-- usePermissions: permisos derivados de roles
  +-- React Query: cache y sincronizacion de datos
  |
  v
Servicios frontend / Hooks
  |
  +-- Supabase Client
  +-- Servicios de dominio
  +-- Edge Functions
  |
  v
Supabase
  |
  +-- Auth
  +-- PostgreSQL
  +-- Row Level Security
  +-- RPCs SQL
  +-- Edge Functions Deno
```

### Flujo de autenticacion

1. El usuario escribe un nombre de usuario y una contrasena en `/login`.
2. El login transforma el nombre de usuario en un email interno con el formato `usuario@ayp.com`.
3. Supabase Auth valida las credenciales con `signInWithPassword`.
4. `UserProvider` obtiene la sesion activa, carga `user_profiles` y relaciona el usuario autenticado con `usuarios`.
5. Se consultan las membresias del usuario en `membresias` junto con su `departamento`.
6. `usePermissions` calcula permisos como administrador, lider, sublider, encargado o servidor.
7. `ProtectedRoute` y `DashboardLayout` habilitan u ocultan secciones segun esos permisos.

### Flujo de datos general

- Los componentes de `src/features` usan hooks y servicios para leer o escribir datos.
- Los servicios en `src/services` encapsulan operaciones contra Supabase.
- React Query gestiona cache, reintentos y actualizacion de datos.
- Las reglas criticas de acceso deben vivir en Supabase RLS y RPCs; el frontend solo refleja permisos para UX.
- Las Edge Functions se usan para IA, creacion de usuarios Auth, claims de administrador y notificaciones externas.

## Estructura del Proyecto

```text
ujieres-app/
|-- public/
|   |-- logo-iglesia.png
|   `-- vite.svg
|-- src/
|   |-- App.tsx
|   |-- AppRoutes.tsx
|   |-- main.tsx
|   |-- assets/
|   |-- components/
|   |-- constants/
|   |-- contexts/
|   |-- features/
|   |   |-- admin/
|   |   |-- agenda/
|   |   |-- analytics/
|   |   |-- attendance/
|   |   |-- auth/
|   |   |-- calendar/
|   |   |-- dashboard/
|   |   |-- departments/
|   |   |-- planning/
|   |   |-- reports/
|   |   `-- users/
|   |-- hooks/
|   |-- layouts/
|   |-- schemas/
|   |-- services/
|   |-- test/
|   |-- types/
|   `-- utils/
|-- supabase/
|   |-- config.toml
|   |-- functions/
|   |-- migrations/
|   `-- snippets/
|-- tests/
|   `-- e2e/
|-- index.html
|-- package.json
|-- playwright.config.ts
|-- tsconfig.json
|-- vercel.json
`-- vite.config.ts
```

### Carpetas principales

| Ruta | Proposito |
| --- | --- |
| `src/features` | Modulos funcionales de la aplicacion. |
| `src/components` | Componentes reutilizables globales: loaders, boundaries, estados vacios, badges, proteccion de acceso. |
| `src/layouts` | Layout principal con sidebar, header, navegacion y acciones de usuario. |
| `src/contexts` | Contexto global de usuario autenticado y membresias. |
| `src/hooks` | Hooks compartidos y hooks de consulta con React Query. |
| `src/services` | Capa de acceso a Supabase y servicios de dominio. |
| `src/schemas` | Esquemas Zod para validar formularios o entradas. |
| `src/utils` | Utilidades de roles, calendario, exportacion, disponibilidad y logica de exclusion. |
| `src/types` | Tipos de dominio y tipos generados desde Supabase. |
| `supabase/migrations` | Migraciones SQL versionadas. |
| `supabase/functions` | Edge Functions escritas para Deno. |
| `tests/e2e` | Pruebas end-to-end con Playwright. |

## Modulos Funcionales

### Autenticacion

Archivos principales:

- `src/features/auth/Login.jsx`
- `src/features/auth/components/PasswordChangeModal.tsx`
- `src/schemas/auth.schema.ts`
- `src/services/supabaseClient.ts`

Incluye login con usuario/contrasena, validacion con Zod, cambio de contrasena y persistencia de sesion mediante Supabase Auth.

### Dashboard

Archivos principales:

- `src/features/dashboard/Dashboard.tsx`
- `src/features/dashboard/components/AiQueryWidget.tsx`
- `src/hooks/useDashboardData.ts`

Presenta informacion resumida del usuario y del equipo. El widget conversacional interpreta consultas mediante la Edge Function `chat-ai` y luego ejecuta consultas internas sobre asistencia, asignaciones y eventos.

### Calendario

Archivos principales:

- `src/features/calendar/ScheduleView.tsx`
- `src/features/calendar/CustomCalendar.tsx`
- `src/features/calendar/components/*`
- `src/features/calendar/hooks/*`

Permite visualizar servicios, asignaciones, uniformes, encargados y listas detalladas. Tambien incluye utilidades de exportacion de imagen.

### Planificacion

Archivos principales:

- `src/features/planning/PlanningWizard.tsx`
- `src/features/planning/context/PlanningContext.tsx`
- `src/features/planning/hooks/useAutoAssign.ts`
- `src/features/planning/components/*`

Implementa un wizard para planificar por departamento, mes, fechas de servicio, cuotas por posicion y revision final. La asignacion automatica usa reglas de disponibilidad, suspensiones, carga reciente, liderazgo, genero requerido, experiencia y prioridad reducida para servidores trimestrales.

### Asistencia

Archivos principales:

- `src/features/attendance/AttendanceManager.tsx`
- `src/features/attendance/AttendanceRegistry.tsx`
- `src/features/attendance/PersonalAttendance.tsx`
- `src/services/attendanceService.ts`
- `src/constants/attendance.ts`

Gestiona estados de asistencia:

- `Asistio`
- `Ausente`
- `Falto con Aviso`
- `Falto sin Aviso`

Tambien soporta tipos de justificacion como trabajo, salud, estudio, permiso pastoral, distancia u otro.

### Usuarios y suspensiones

Archivos principales:

- `src/features/users/UsersList.tsx`
- `src/features/users/SuspensionManager.tsx`
- `src/features/users/AvailabilityManager.tsx`
- `src/services/suspensionService.ts`

Permite administrar servidores, membresias, disponibilidad y periodos de suspension o inactividad.

### Departamentos

Archivos principales:

- `src/features/departments/DepartmentsList.tsx`
- `src/features/departments/PositionsManager.tsx`
- `src/features/departments/UniformsManager.tsx`

Permite gestionar departamentos, posiciones disponibles y uniformes asociados.

### Agenda

Archivos principales:

- `src/features/agenda/Agenda.tsx`
- `src/features/agenda/AgendaNotificationModal.tsx`
- `src/services/agendaService.ts`

Permite crear, listar y marcar eventos de agenda como vistos por usuario.

TODO: `agendaService.ts` usa las tablas `agenda_eventos` y `agenda_eventos_vistos`, pero estas no aparecen en `src/types/database.types.ts` dentro de la version inspeccionada. Conviene actualizar los tipos de Supabase y confirmar que las migraciones correspondientes esten versionadas.

### Analitica y reportes

Archivos principales:

- `src/features/analytics/AnalyticsDashboard.tsx`
- `src/features/analytics/AdminAnalytics.tsx`
- `src/features/analytics/components/ActivityHeatmap.tsx`
- `src/features/reports/*`
- `src/services/analyticsService.ts`
- `src/services/ImpactReportService.ts`

Incluye analitica departamental, analitica global para administradores y reportes exportables.

## Roles y Permisos

Los roles principales estan definidos en `src/constants/roles.ts`:

| Rol | Uso esperado |
| --- | --- |
| `Admin` | Administracion global del sistema. |
| `Lider` | Gestion de departamento y reportes. |
| `Sublider` | Gestion delegada de departamento. |
| `Encargado` / `Encargada` | Gestion operativa, especialmente asistencia en Servidores. |
| `Servidor` / `Servidora` | Usuario base con acceso personal. |

Los permisos se calculan en `src/hooks/usePermissions.ts` a partir de `membresias.rol_jerarquico` y el departamento asociado.

Permisos destacados:

- Gestion de departamentos.
- Gestion de usuarios.
- Creacion de planificaciones.
- Modificacion de asignaciones.
- Gestion de asistencia.
- Visualizacion de reportes.
- Visualizacion de calendarios globales.

## Base de Datos

La base de datos principal es PostgreSQL administrada por Supabase. El archivo `src/types/database.types.ts` muestra las tablas y RPCs utilizadas por el frontend.

### Tablas detectadas en tipos

| Tabla | Proposito |
| --- | --- |
| `usuarios` | Datos de servidores/personas. |
| `user_profiles` | Vinculo entre `auth.users` y `usuarios`. |
| `departamentos` | Departamentos disponibles. |
| `membresias` | Relacion usuario-departamento con rol jerarquico. |
| `posiciones_departamento` | Posiciones o funciones dentro de un departamento. |
| `uniformes_departamento` | Uniformes asociados a departamentos. |
| `configuracion_dia` | Configuracion de fechas de servicio. |
| `roles_cabecera` | Agrupacion de planificacion por departamento/configuracion. |
| `asignaciones` | Asignaciones de usuarios a posiciones en fechas de servicio. |
| `asistencias` | Registros de asistencia y justificaciones. |
| `horarios_no_disponibilidad` | Restricciones de disponibilidad por dia/turno. |
| `suspensiones` | Suspensiones temporales o inactividad. |
| `directorio_usuarios` | Vista/relacion usada por tipos generados. |

### RPCs detectadas

- `get_attendance_detailed`
- `get_weekly_attendance_trend`
- `get_churn_risk`
- `get_birthdays_today`
- `get_blocked_users`
- `get_current_month_stats`
- `get_demographic_stats`
- `get_global_attendance_health`
- `get_annual_attendance_heatmap`
- `get_punctuality_stats`
- `get_user_departments`
- `is_dept_leader`
- `is_global_admin`
- `is_servidores_leader`
- `search_users_fuzzy`
- `end_suspension`

### Seguridad de datos

El repositorio contiene migraciones para:

- Helpers de permisos en SQL.
- Politicas RLS.
- Indices de rendimiento.
- RPCs de analitica y busqueda.
- Control de suspensiones.
- Validacion de usuarios bloqueados por fecha/servicio.

La seguridad real debe validarse siempre en Supabase, no solo en el frontend.

## Edge Functions

Las funciones se encuentran en `supabase/functions`.

| Funcion | Proposito | Variables relevantes |
| --- | --- | --- |
| `chat-ai` | Interpreta consultas del dashboard y devuelve una intencion estructurada. | `GROQ_API_KEY`, `SENTRY_DSN` |
| `create-user-auth` | Crea usuarios en Supabase Auth y los vincula con `user_profiles`. | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| `auth-claims-admin` | Agrega claims de administrador mediante hook seguro. | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `HOOK_SECRET`, `SENTRY_DSN` |
| `check-birthdays` | Consulta cumpleanos del dia y envia correo. | `FUNCTION_SECRET`, `GMAIL_APP_PASSWORD`, `GMAIL_SENDER_EMAIL`, `SUPABASE_SERVICE_ROLE_KEY` |
| `notify-attendance` | Envia notificaciones de asistencia por correo y opcionalmente WhatsApp. | `FUNCTION_SECRET`, `GMAIL_*`, `TWILIO_*`, `SUPABASE_SERVICE_ROLE_KEY` |

TODO: En `supabase/config.toml` solo aparece configurada explicitamente la funcion `chat-ai`. Si las demas se despliegan, conviene documentar el flujo de despliegue o agregarlas a la configuracion si aplica.

## Variables de Entorno

El archivo `.env.example` define las variables requeridas para el frontend:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_SENTRY_DSN=https://your-sentry-dsn-here
```

### Variables para Edge Functions

Estas no aparecen en `.env.example`, pero se usan en las funciones Supabase:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SENTRY_DSN=
GROQ_API_KEY=
HOOK_SECRET=
FUNCTION_SECRET=
GMAIL_APP_PASSWORD=
GMAIL_SENDER_EMAIL=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=
```

Nunca expongas `SUPABASE_SERVICE_ROLE_KEY`, secretos de correo, Twilio o Groq en variables `VITE_*`, porque esas variables se empaquetan en el cliente.

## Requisitos Previos

- Node.js compatible con Vite 6 y TypeScript 5.9.
- npm.
- Proyecto Supabase configurado.
- Supabase CLI si se van a ejecutar migraciones o funciones localmente.
- Credenciales de servicios externos segun las funciones que se quieran usar: Groq, Sentry, Gmail SMTP y Twilio.

TODO: El repositorio no define `engines` en `package.json`. Se recomienda fijar una version minima de Node.js para evitar diferencias entre entornos.

## Instalacion

1. Clonar el repositorio:

```bash
git clone <url-del-repositorio>
cd ujieres-app
```

2. Instalar dependencias:

```bash
npm install
```

3. Crear archivo de entorno:

```bash
cp .env.example .env.development
```

En Windows PowerShell:

```powershell
Copy-Item .env.example .env.development
```

4. Completar las variables de Supabase y Sentry en `.env.development`.

## Ejecucion en Desarrollo

Iniciar Vite:

```bash
npm run dev
```

Por configuracion de `vite.config.ts`, el servidor local usa:

```text
http://127.0.0.1:3000
```

Vista previa de build:

```bash
npm run preview
```

## Scripts Disponibles

| Script | Comando | Descripcion |
| --- | --- | --- |
| Desarrollo | `npm run dev` | Inicia Vite en `127.0.0.1:3000`. |
| Build | `npm run build` | Ejecuta `tsc -b` y genera build con Vite. |
| Preview | `npm run preview` | Sirve el build generado localmente. |
| Lint | `npm run lint` | Ejecuta ESLint sobre el proyecto. |
| Tests unitarios | `npm run test` | Ejecuta Vitest. |
| Tests UI | `npm run test:ui` | Abre la interfaz de Vitest. |
| Tests E2E | `npm run test:e2e` | Ejecuta Playwright. |
| Tests E2E UI | `npm run test:e2e:ui` | Abre la interfaz de Playwright. |
| Tests seguridad | `npm run test:security` | Ejecuta pruebas bajo `src/test/security`. |

## Testing

El proyecto contiene pruebas en varias capas:

- Unitarias y componentes: `src/**/__tests__`.
- Hooks y servicios: `src/hooks`, `src/services`, `src/utils`.
- Seguridad/RLS: `src/test/security`.
- E2E: `tests/e2e`.

Ejecutar pruebas unitarias:

```bash
npm run test
```

Ejecutar pruebas E2E:

```bash
npm run test:e2e
```

Playwright levanta automaticamente `npm run dev` usando `playwright.config.ts`.

## Build y Produccion

Generar build de produccion:

```bash
npm run build
```

El build final se genera en `dist/`.

La configuracion de `vite.config.ts` incluye:

- React plugin.
- PWA con `autoUpdate`.
- Cache de Google Fonts.
- Cache de imagenes.
- Estrategia `NetworkFirst` para llamadas a Supabase.
- Separacion manual de chunks para frameworks, Supabase y utilidades.
- Limite de advertencia de chunks en `1600`.

### Despliegue en Vercel

El archivo `vercel.json` configura:

- Rewrites hacia `index.html` para soportar React Router en SPA.
- Headers de seguridad:
  - `X-Content-Type-Options`
  - `X-Frame-Options`
  - `X-XSS-Protection`
  - `Referrer-Policy`
  - `Permissions-Policy`
  - `Strict-Transport-Security`
  - `Content-Security-Policy`
- Cache-Control estricto para `sw.js` e `index.html`.

Checklist minimo para produccion:

- Configurar `VITE_SUPABASE_URL`.
- Configurar `VITE_SUPABASE_ANON_KEY`.
- Configurar `VITE_SENTRY_DSN` si se usara observabilidad frontend.
- Configurar secretos de Edge Functions en Supabase.
- Aplicar migraciones de Supabase.
- Verificar politicas RLS.
- Ejecutar `npm run lint`.
- Ejecutar `npm run test`.
- Ejecutar `npm run test:e2e` para flujos criticos.
- Ejecutar `npm run build`.

## Supabase Local

El repositorio incluye `supabase/config.toml`, migraciones y funciones. Si tienes Supabase CLI instalado, el flujo tipico es:

```bash
npx supabase start
npx supabase db reset
```

Para desplegar migraciones o funciones a un proyecto remoto se deben usar los comandos de Supabase CLI correspondientes y los secretos configurados en Supabase.

TODO: No se encontro un `seed.sql` en la lista de archivos inspeccionada, aunque `supabase/config.toml` referencia `./seed.sql`. Confirmar si el seed se mantiene fuera del repositorio o si debe agregarse.

## Convenciones de Desarrollo

- Mantener modulos nuevos dentro de `src/features/<modulo>`.
- Encapsular acceso a Supabase en `src/services` o hooks dedicados.
- Usar React Query para datos remotos reutilizados.
- Usar Zod para validar entradas de usuario.
- Reutilizar constantes de `src/constants` para roles, departamentos y estados.
- No duplicar reglas criticas de permisos solo en UI; deben existir tambien en RLS/RPCs.
- Agregar pruebas cuando se modifique logica compartida, permisos, planificacion, asistencia o servicios.
- Evitar exponer secretos en el cliente.

## Solucion de Problemas

### `Faltan las variables de entorno de Supabase`

El cliente Supabase lanza este error cuando faltan:

```env
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Revisa `.env.development` y reinicia `npm run dev`.

### Pantalla protegida redirige o muestra acceso restringido

Verifica:

- Que el usuario tenga un registro en `user_profiles`.
- Que `user_profiles.usuario_id` apunte a un registro valido en `usuarios`.
- Que existan membresias en `membresias`.
- Que `rol_jerarquico` coincida con los roles esperados por `parseRoles`.

### El asistente conversacional no responde

Verifica:

- Edge Function `chat-ai` desplegada.
- `GROQ_API_KEY` configurada como secret de Supabase.
- Usuario autenticado, ya que `chat-ai` requiere Authorization Bearer.
- Logs de Supabase Edge Functions y Sentry.

### Playwright no encuentra la app

`playwright.config.ts` espera la app en:

```text
http://127.0.0.1:3000
```

Si el puerto esta ocupado, libera el puerto o ajusta la configuracion.

### PWA o service worker sirve contenido viejo

El proyecto usa `vite-plugin-pwa` con `autoUpdate`. En problemas de cache:

- Recargar con cache deshabilitado desde DevTools.
- Borrar datos del sitio en el navegador.
- Verificar que `sw.js` no quede cacheado por CDN. `vercel.json` ya define `max-age=0, must-revalidate`.

### Error de CSP en produccion

`vercel.json` restringe conexiones a `self`, Supabase, Groq y Sentry. Si se agrega una integracion externa, actualizar `connect-src`, `img-src`, `font-src` o la directiva que corresponda.

## Estado y Pendientes

- TODO: Confirmar version minima oficial de Node.js y agregar `engines` a `package.json`.
- TODO: Confirmar y versionar migraciones de `agenda_eventos` y `agenda_eventos_vistos`, o regenerar `database.types.ts`.
- TODO: Confirmar si `supabase/seed.sql` debe existir en el repositorio, ya que `supabase/config.toml` lo referencia.
- TODO: Documentar comandos exactos de despliegue de Edge Functions si forman parte del flujo operativo del equipo.
- TODO: Revisar textos con caracteres corruptos en archivos fuente heredados y normalizar codificacion a UTF-8.

## Contribucion

1. Crear una rama descriptiva.
2. Instalar dependencias con `npm install`.
3. Configurar `.env.development`.
4. Implementar cambios siguiendo la organizacion por features.
5. Ejecutar lint y pruebas relevantes:

```bash
npm run lint
npm run test
npm run build
```

6. Para cambios de flujo completo, ejecutar:

```bash
npm run test:e2e
```

7. Abrir pull request describiendo alcance, pruebas realizadas y cualquier migracion o variable nueva requerida.

## Licencia

TODO: No se encontro un archivo de licencia en el repositorio. Definir licencia o politica de uso antes de distribuir el proyecto publicamente.
