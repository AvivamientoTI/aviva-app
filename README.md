# 📖 Ujieres App — Documentación Completa

> **Portal de Gestión para Servidores y Ujieres — Avivamiento y Poder (AYP)**

---

## Tabla de Contenidos

1. [Descripción General](#1-descripción-general)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Arquitectura](#3-arquitectura)
4. [Estructura de Directorios](#4-estructura-de-directorios)
5. [Modelo de Datos (Base de Datos)](#5-modelo-de-datos-base-de-datos)
6. [Sistema de Roles y Permisos](#6-sistema-de-roles-y-permisos)
7. [Módulos y Funcionalidades](#7-módulos-y-funcionalidades)
8. [Edge Functions (Backend Serverless)](#8-edge-functions-backend-serverless)
9. [RPCs de Base de Datos](#9-rpcs-de-base-de-datos)
10. [Configuración e Instalación](#10-configuración-e-instalación)
11. [Variables de Entorno](#11-variables-de-entorno)
12. [Guía de Desarrollo](#12-guía-de-desarrollo)
13. [Testing](#13-testing)
14. [Despliegue](#14-despliegue)
15. [Convenciones de Código](#15-convenciones-de-código)

---

## 1. Descripción General

**Ujieres App** es una Progressive Web App (PWA) de gestión interna para el ministerio de Servidores y Ujieres de la iglesia **Avivamiento y Poder**. Permite a líderes, encargados y servidores gestionar:

- Planificación mensual de roles y asignaciones de servicio.
- Registro y seguimiento de asistencia.
- Calendario compartido de servicios con exportación.
- Estadísticas e indicadores de salud del equipo.
- Consultas conversacionales impulsadas por IA (OpenAI).
- Gestión de usuarios, suspensiones y membresías departamentales.

La aplicación está diseñada para ser **mobile-first**, instalable como PWA, y con soporte completo de modo oscuro/claro.

---

## 2. Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** | React 18, TypeScript, Vite 6 |
| **UI Framework** | Mantine 8.x (componentes + temas) |
| **Iconos** | Tabler Icons React |
| **Gráficos** | Mantine Charts (Recharts) |
| **Calendario** | React Big Calendar |
| **Routing** | React Router DOM v6 |
| **Data Fetching** | TanStack React Query v5 |
| **Backend / BaaS** | Supabase (Auth, Database, Edge Functions, Storage) |
| **IA Conversacional** | OpenAI GPT (via Supabase Edge Function) |
| **Exportación** | html-to-image, jsPDF, jspdf-autotable, XLSX |
| **Fecha/Hora** | Day.js |
| **PWA** | vite-plugin-pwa (Workbox) |
| **Testing (Unit)** | Vitest + Testing Library |
| **Testing (E2E)** | Playwright |
| **Linting** | ESLint 9 + TypeScript ESLint |
| **Deploy** | Vercel |

---

## 3. Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND (Vite/React)             │
│                                                     │
│  ┌───────────┐  ┌────────────┐  ┌───────────────┐  │
│  │  Auth     │  │  Dashboard │  │  Calendar     │  │
│  │  Login    │  │  Stats/AI  │  │  Scheduling   │  │
│  └───────────┘  └────────────┘  └───────────────┘  │
│  ┌───────────┐  ┌────────────┐  ┌───────────────┐  │
│  │ Planning  │  │ Attendance │  │  Analytics    │  │
│  │  Wizard   │  │  Manager   │  │  Dashboard    │  │
│  └───────────┘  └────────────┘  └───────────────┘  │
│                                                     │
│  React Query Cache ⟷ UserContext ⟷ usePermissions  │
└───────────────────────┬─────────────────────────────┘
                        │ HTTPS / REST / Realtime
┌───────────────────────▼─────────────────────────────┐
│                  SUPABASE BACKEND                   │
│                                                     │
│  ┌─────────────────┐  ┌──────────────────────────┐  │
│  │  PostgreSQL DB  │  │  Edge Functions (Deno)   │  │
│  │  + Row Level    │  │  - chat-ai (OpenAI)      │  │
│  │    Security     │  │  - auth-claims-admin     │  │
│  │  + RPCs         │  │  - check-birthdays       │  │
│  └─────────────────┘  └──────────────────────────┘  │
│  ┌─────────────────┐                                │
│  │  Supabase Auth  │                                │
│  │  (JWT + session)│                                │
│  └─────────────────┘                                │
└─────────────────────────────────────────────────────┘
                        │ Deploy
┌───────────────────────▼──────────┐
│            Vercel (CDN)          │
│  SPA + PWA + Service Worker      │
└──────────────────────────────────┘
```

### Flujo de Autenticación

1. El usuario ingresa su **nombre de usuario** (ej. `juan.perez`).
2. La app construye un **email virtual** (`juan.perez@ayp.com`) y lo envía a Supabase Auth.
3. Si es válido, Supabase retorna un JWT que se persiste en `localStorage`.
4. `UserContext` carga el perfil (`user_profiles`) y las membresías departamentales (`membresias`) del usuario.
5. `usePermissions` deriva todos los permisos funcionales a partir de las membresías.

---

## 4. Estructura de Directorios

```
ujieres-app/
├── src/
│   ├── assets/               # Imágenes estáticas
│   ├── components/           # Componentes UI reutilizables globales
│   │   ├── FullScreenLoader.tsx
│   │   ├── RestrictedAccess.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── SkeletonLoaders.tsx
│   │   └── __tests__/        # Tests de componentes
│   ├── constants/            # Constantes tipadas de la app
│   │   ├── roles.ts          # Roles del sistema
│   │   ├── departments.ts    # Nombres de departamentos
│   │   └── attendance.ts     # Estados de asistencia
│   ├── contexts/
│   │   └── UserContext.tsx   # Estado global del usuario autenticado
│   ├── features/             # Módulos por funcionalidad
│   │   ├── admin/
│   │   ├── analytics/        # Dashboard de estadísticas avanzadas
│   │   ├── attendance/       # Registro de asistencia
│   │   ├── auth/             # Login + PasswordChangeModal
│   │   ├── calendar/         # Calendario de servicios + ScheduleView
│   │   ├── dashboard/        # Panel principal + IA conversacional
│   │   ├── departments/      # Gestión de departamentos y posiciones
│   │   ├── planning/         # Wizard de planificación mensual
│   │   ├── reports/          # Templates de reportes exportables
│   │   └── users/            # Gestión de servidores y suspensiones
│   ├── hooks/
│   │   ├── usePermissions.ts # Hook de permisos funcionales
│   │   ├── useDashboardData.ts
│   │   └── queries/          # Hooks React Query especializados
│   ├── layouts/
│   │   └── DashboardLayout.tsx  # Layout principal con sidebar
│   ├── services/             # Capa de acceso a Supabase
│   │   ├── supabaseClient.ts
│   │   ├── attendanceService.ts
│   │   ├── analyticsService.ts
│   │   ├── assignmentsService.ts
│   │   ├── conversationalService.ts
│   │   ├── recommendationService.ts
│   │   ├── suspensionService.ts
│   │   └── ImpactReportService.ts
│   ├── test/
│   │   └── setup.ts          # Setup global de Vitest (mocks de Supabase)
│   ├── types/
│   │   ├── index.ts          # Interfaces de dominio
│   │   └── database.types.ts # Tipos autogenerados desde Supabase
│   └── utils/
│       ├── exclusionLogic.ts # Lógica de conflictos de asignación
│       ├── exportHelper.ts   # Utilidades para exportar PDF/Excel
│       ├── notificationsHelper.tsx
│       ├── roleUtils.ts      # Parseo de roles jerárquicos
│       └── calendar/         # Utilidades de calendario y colores
├── tests/
│   └── e2e/
│       └── auth.spec.ts      # Tests E2E de Playwright
├── supabase/
│   ├── config.toml           # Configuración de Supabase CLI
│   ├── functions/            # Edge Functions (Deno)
│   │   ├── chat-ai/
│   │   ├── auth-claims-admin/
│   │   └── check-birthdays/
│   └── migrations/           # Migraciones SQL versionadas
├── public/                   # Assets públicos (logo, favicon)
├── playwright.config.ts      # Configuración de Playwright E2E
├── vite.config.ts            # Configuración de Vite + Vitest + PWA
├── vercel.json               # Configuración de despliegue Vercel
└── package.json
```

---

## 5. Modelo de Datos (Base de Datos)

### Tablas Principales

| Tabla | Descripción |
|---|---|
| `usuarios` | Perfil público de cada servidor (nombre, apellido, género, fecha_nacimiento) |
| `user_profiles` | Vincula el usuario de Supabase Auth (`auth.users`) con la tabla `usuarios` |
| `departamentos` | Departamentos de la iglesia (Servidores, Consolidación, etc.) |
| `membresias` | Membresía de un usuario en un departamento con su `rol_jerarquico` |
| `posiciones_departamento` | Posiciones disponibles en cada departamento (Ujier, Encargado de Puerta, etc.) |
| `configuracion_dia` | Configuración de cada día de servicio (fecha, tipo_servicio, uniforme) |
| `roles_cabecera` | Vincula un `configuracion_dia` con un `departamento` para el mes/año |
| `asignaciones` | Asignación de un usuario a una posición en un día de servicio |
| `asistencias` | Registro de asistencia de un usuario en un día específico |
| `suspensiones` | Registro de suspensiones temporales de servidores |

### Relaciones Clave

```
usuarios ──< membresias >── departamentos
usuarios ──< asignaciones >── posiciones_departamento
asignaciones >── configuracion_dia ──< roles_cabecera >── departamentos
asistencias >── configuracion_dia
asistencias >── usuarios
suspensiones >── usuarios
user_profiles ── usuarios
```

### Estados de Asistencia

| Constante | Valor |
|---|---|
| `ATTENDANCE_STATES.ASISTIO` | `"Asistió"` |
| `ATTENDANCE_STATES.CON_JUSTIFICACION` | `"Faltó con Aviso"` |
| `ATTENDANCE_STATES.SIN_JUSTIFICACION` | `"Faltó sin Aviso"` |
| `ATTENDANCE_STATES.AUSENTE` | `"Ausente"` |

---

## 6. Sistema de Roles y Permisos

### Roles Jerárquicos (por `membresias.rol_jerarquico`)

| Rol | Descripción |
|---|---|
| `Admin` | Administrador del sistema. Acceso total. Solo en dept. `Administración`. |
| `Líder` | Líder de departamento. Gestión completa de su dept. |
| `Sublíder` | Sublíder de departamento. Mismos permisos que Líder. |
| `Encargado` / `Encargada` | Encargado de área. Puede registrar asistencia. |
| `Servidor` / `Servidora` | Miembro estándar. Solo puede ver su propio rol. |

### Hook `usePermissions`

Centraliza toda la lógica de permisos. Se llama en cualquier componente que necesite controlar visibilidad o acciones.

```typescript
const {
  isSystemAdmin,             // true si tiene rol 'Admin' en 'Administración'
  canManageDepartment(deptId), // Líder/Sublíder/Admin del departamento
  canManageUsers,            // Cualquier líder o Admin
  canCreateSchedule(deptId), // Puede crear planificación mensual
  canModifyAssignments(deptId), // Puede editar asignaciones
  canManageAttendance(deptId), // Puede registrar asistencia (solo Servidores)
  canViewReports(deptId),    // Puede ver reportes e indicadores
  canViewAllSchedules,       // Puede ver calendarios de todos los deptos
  isServidoresMember,        // Es miembro de cualquier rol en Servidores
  isLiderOrSublider,         // Es Líder o Sublíder en cualquier depto
  isLiderSubliderEncargadoServidores, // Para acceso a Asistencia
  isLiderOrSubliderServidores, // Para acceso a Servidores y Suspensiones
} = usePermissions();
```

### Visibilidad de Menú por Rol

| Sección | Miembro | Encargado | Líder/Sublíder | Admin |
|---|---|---|---|---|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Calendario | ✅ | ✅ | ✅ | ✅ |
| Planificación | ❌ | ❌ | ✅ | ✅ |
| Departamentos | ❌ | ❌ | ✅ | ✅ |
| Estadísticas | ❌ | ❌ | ✅ | ✅ |
| Analítica Global | ❌ | ❌ | ❌ | ✅ |
| Servidores | ❌ | ❌ | ✅ (Serv.) | ✅ |
| Suspensiones | ❌ | ❌ | ✅ (Serv.) | ✅ |
| Asistencia | ❌ | ✅ (Serv.) | ✅ (Serv.) | ✅ |

---

## 7. Módulos y Funcionalidades

### 7.1 Dashboard (`/`)

Panel principal personalizado para cada usuario.

**Para todos los usuarios:**
- Tarjeta de bienvenida con el nombre del servidor.
- Lista de **próximos servicios** asignados (máx. 5) con fecha, tipo, uniforme y posición.
- Recordatorio automático si hay un servicio en las próximas 48 horas.
- Estadísticas de asistencia personal (tasa de asistencia, mes anterior).
- Botones: **Exportar PDF** del rol mensual y **Compartir** via Web Share API.

**Para Encargados/Líderes adicionalmente:**
- Selector de departamento para ver estadísticas del equipo.
- Gráfico de donut: distribución de asistencia vs. faltas del departamento.
- Gráfico de barras: tendencia mensual de asistencia.
- Widget de **IA Conversacional** para consultas en lenguaje natural.

### 7.2 IA Conversacional (`AiQueryWidget`)

Widget en el Dashboard que permite consultas en lenguaje natural.

**Cómo funciona:**
1. El usuario escribe una pregunta (ej. *"¿Cómo va la asistencia este mes?"*).
2. La app envía la consulta a la Edge Function `chat-ai`.
3. La función llama a OpenAI para interpretar la **intención** (`intent`) y extraer entidades.
4. El `conversationalService` ejecuta la consulta real en Supabase.
5. La respuesta se presenta como texto, gráfico (donut/barra) o lista.

**Intenciones soportadas:**

| Intent | Ejemplo de consulta | Respuesta |
|---|---|---|
| `attendance_summary` | "Resumen de asistencia" | Gráfico donut |
| `top_servers` | "Top servidores del mes" | Gráfico de barras |
| `absentees` | "¿Quién ha faltado?" | Lista de ausentes |
| `upcoming_events` | "¿Cuándo es el próximo servicio?" | Lista de eventos |
| `discipline_alerts` | "Alertas de disciplina" | Lista de usuarios en riesgo |
| `specific_user` | "¿Cómo va Juan Pérez?" | Informe textual del usuario |

### 7.3 Calendario (`/calendar`)

Vista de calendario interactiva de los servicios del departamento.

- Vista mensual con color por tipo de uniforme.
- Click en un día para ver/editar asignaciones.
- Soporte para **intercambio de roles** entre servidores (swap).
- Validación de conflictos: un servidor no puede estar asignado dos veces en el mismo día.
- La lógica de exclusión usa el RPC `get_blocked_users` para detectar conflictos globales entre departamentos.
- **Exportación** del calendario completo como imagen de alta resolución.

### 7.4 Planificación (`/planning`)

Wizard paso a paso para crear el rol mensual.

**Pasos del Wizard:**
1. **Seleccionar Departamento** — Departamentos que el usuario puede gestionar.
2. **Configurar Mes** — Mes y año objetivo.
3. **Agregar Días** — Seleccionar fechas, tipo de servicio y color de uniforme.
4. **Asignar Usuarios** — Para cada día y posición, seleccionar servidores disponibles. El sistema filtra automáticamente usuarios ya asignados, bloqueados por suspensión, o que no cumplen requisitos de género de la posición.
5. **Revisar y Confirmar** — Vista previa del rol antes de guardar.

### 7.5 Asistencia (`/attendance`)

Pantalla para registrar la asistencia de los servidores en un día de servicio.

- Selección de día de servicio del departamento.
- Lista de todos los miembros del departamento con estados: `Asistió`, `Faltó con Aviso`, `Faltó sin Aviso`.
- Campo de justificación para ausencias con aviso.
- Registro de hora de llegada opcional.
- Guardado masivo con upsert (crea o actualiza registros).

### 7.6 Estadísticas (`/analytics`)

Dashboard de análisis para líderes.

**Métricas disponibles:**
- Resumen de asistencia (total, tasa, comparativa mes anterior).
- **Gráfico de tendencia semanal** (últimas 12 semanas).
- **Heatmap anual** de asistencia.
- **Detección de riesgo de baja** (`churnRisk`): servidores con >50% de faltas en 4 semanas.
- **Distribución demográfica**: género y rangos etarios.
- **Tendencias de puntualidad**: temprano, a tiempo, tarde.

### 7.7 Analítica Global (`/admin/analytics`)

Panel exclusivo para Administradores del sistema.

- Vista de salud de **todos los departamentos** simultáneamente.
- Ranking de departamentos por tasa de asistencia (últimos 3 meses).
- Total de servidores activos por departamento.

### 7.8 Servidores (`/servers`)

Gestión completa de los miembros del departamento.

- Listado con búsqueda, filtros de género, rol y estado.
- Crear y editar perfiles de usuarios.
- Vincular usuarios a cuentas de autenticación.
- Gestionar membresías y roles jerárquicos.
- Ver historial de asistencia y asignaciones.
- **Importación masiva desde Excel/CSV**.

### 7.9 Suspensiones (`/suspensions`)

Gestión de suspensiones temporales de servidores.

- Listar suspensiones activas e históricas.
- Crear suspensiones por fecha de inicio/fin y motivo.
- Los servidores suspendidos quedan excluidos automáticamente de la planificación.

### 7.10 Departamentos (`/departments`)

Gestión de la estructura departamental.

- Configurar posiciones disponibles (nombre, género requerido, orden).
- Administrar colores y configuración por departamento.

---

## 8. Edge Functions (Backend Serverless)

Ubicadas en `supabase/functions/`, se ejecutan en el runtime **Deno** de Supabase.

### `chat-ai`

Puente entre la app y OpenAI GPT.

**Request:**
```json
{ "query": "¿Cómo va la asistencia este mes?" }
```

**Response:**
```json
{
  "intent": "attendance_summary",
  "startDate": "2026-04-01",
  "nameFragment": null
}
```

Requiere la variable de entorno `OPENAI_API_KEY` configurada en Supabase.

### `auth-claims-admin`

Gestiona los custom claims JWT del usuario (ej. rol de admin). Se invoca al asignar o quitar el rol de Administrador.

### `check-birthdays`

Scheduled function que detecta cumpleaños de servidores y puede enviar notificaciones.

---

## 9. RPCs de Base de Datos

Funciones PostgreSQL expuestas como RPCs de Supabase:

| RPC | Descripción |
|---|---|
| `get_blocked_users(p_date, p_exclude_role_id)` | Retorna IDs de usuarios con conflictos de asignación para una fecha |
| `get_attendance_detailed(p_config_dia_id, p_dept_id)` | Vista detallada de asistencia con usuario y posición |
| `get_weekly_attendance_trend(p_dept_id, p_weeks)` | Tendencia semanal de asistencia |
| `get_annual_attendance_heatmap(p_dept_id, p_start_date)` | Datos para heatmap anual |
| `get_churn_risk(p_dept_id, p_weeks)` | Usuarios con alto riesgo de abandono |
| `get_global_attendance_health(p_start_date)` | Salud de asistencia global por departamento |
| `search_users_fuzzy(p_dept_id, p_search_query)` | Búsqueda de usuarios por nombre con pg_trgm |
| `get_birthdays_today()` | Servidores que cumplen años hoy |
| `get_is_servidores_leader(p_user_id)` | Verifica si el usuario es líder de Servidores |

---

## 10. Configuración e Instalación

### Prerrequisitos

- Node.js ≥ 20.x
- npm ≥ 10.x
- Cuenta en [Supabase](https://supabase.com)
- Supabase CLI (`npm i -g supabase`)

### Instalación

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd ujieres-app

# 2. Instalar dependencias
npm install

# 3. Instalar navegadores para Playwright (pruebas E2E)
npx playwright install chromium

# 4. Configurar variables de entorno
cp .env.example .env.development
# Editar .env.development con tus credenciales de Supabase

# 5. Iniciar el servidor de desarrollo
npm run dev
```

---

## 11. Variables de Entorno

Crear un archivo `.env.development` en la raíz:

```env
VITE_SUPABASE_URL=https://<tu-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key>
```

> **Nota:** Para producción, estas variables deben configurarse en el panel de Vercel bajo _Settings → Environment Variables_.

### Variables de Supabase (Edge Functions)

En el panel de Supabase, bajo _Project Settings → Edge Functions → Secrets_:

```
OPENAI_API_KEY=sk-...  # Requerida para el módulo de IA conversacional
```

---

## 12. Guía de Desarrollo

### Scripts Disponibles

```bash
npm run dev          # Inicia servidor local en http://127.0.0.1:3000
npm run build        # Compila TypeScript y genera el bundle de producción
npm run preview      # Previsualiza el bundle de producción localmente
npm run lint         # Ejecuta ESLint en todo el proyecto

# Testing
npm test             # Vitest en modo watch (unit tests)
npx vitest run       # Vitest una sola corrida (para CI)
npx playwright test  # Pruebas E2E en Chromium
npx playwright test --ui  # Pruebas E2E con interfaz visual interactiva
```

### Agregar un Nuevo Módulo

1. Crear la carpeta `src/features/<nombre-modulo>/`.
2. Crear el componente principal `<NombreModulo>.tsx`.
3. Registrar la ruta en `src/App.tsx` con el guard de permisos correspondiente.
4. Agregar el link al menú lateral en `src/layouts/DashboardLayout.tsx`.
5. Si necesita datos de Supabase, crear el service en `src/services/<nombreService>.ts`.
6. Si los datos se reutilizan en múltiples vistas, crear un hook en `src/hooks/`.

### Actualizar Tipos de Base de Datos

Cuando cambia el esquema en Supabase, regenerar los tipos:

```bash
node save_types.cjs
```

Esto actualiza `src/types/database.types.ts` con los tipos más recientes.

---

## 13. Testing

La suite de testing cubre dos niveles:

### 13.1 Unit Tests (Vitest)

Ubicados en carpetas `__tests__/` junto a los módulos que prueban.

```
src/
  utils/__tests__/exclusionLogic.test.ts        # Lógica de conflictos de asignación
  components/__tests__/FullScreenLoader.test.tsx # Componente de carga
  components/__tests__/RestrictedAccess.test.tsx # Componente de acceso restringido
  features/calendar/hooks/useAvailableUsersForSwap.test.ts # Hook de filtrado de usuarios
```

**Ejecución:**
```bash
npx vitest run --reporter=verbose
# Expected: 4 test files, 11 tests passed ✅
```

**Mocks disponibles globalmente (via `src/test/setup.ts`):**
- `supabase.from()` — mock de consultas a tablas.
- `supabase.rpc()` — mock de llamadas RPC.
- `supabase.auth` — mock de sesión, signIn, signOut.
- `window.matchMedia` — requerido por Mantine.

### 13.2 E2E Tests (Playwright)

Ubicados en `tests/e2e/`.

```
tests/e2e/
  auth.spec.ts  # Flujos de autenticación
```

**Pruebas incluidas:**

| Prueba | Descripción |
|---|---|
| Redirect sin sesión | La app redirige a `/login` al acceder a `/` sin sesión |
| Error de contraseña corta | Muestra error JS cuando la contraseña es < 6 caracteres |
| Error de usuario vacío | Dispara validación de campo requerido vía JS submit |
| Branding de la página | Verifica título y texto de bienvenida |

**Ejecución:**
```bash
npx playwright test
# Expected: 4 tests passed, 1 passed (34.9s) ✅

npx playwright test --ui  # Modo visual interactivo
npx playwright show-report  # Ver reporte HTML de última ejecución
```

> El servidor de desarrollo (`npm run dev`) se inicia automáticamente antes de las pruebas E2E gracias a la directiva `webServer` en `playwright.config.ts`.

---

## 14. Despliegue

La app se despliega en **Vercel** con CI/CD automático desde el branch principal.

### Configuración de Vercel (`vercel.json`)

El archivo `vercel.json` incluye rewrites para que React Router funcione correctamente en producción (SPA routing):

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Pasos de Despliegue Manual

```bash
# Compilar
npm run build

# Previsualizar localmente antes de subir
npm run preview
```

Vercel detecta los cambios en el repositorio y despliega automáticamente.

### Migraciones de Base de Datos

Las migraciones se aplican con la CLI de Supabase:

```bash
supabase db push  # Aplica migraciones pendientes a producción
supabase migration new <nombre>  # Crea una nueva migración
```

---

## 15. Convenciones de Código

### Nomenclatura

- **Componentes React:** PascalCase (`DepartmentsList.tsx`)
- **Hooks:** camelCase con prefijo `use` (`usePermissions.ts`)
- **Services:** camelCase con sufijo `Service` (`attendanceService.ts`)
- **Constantes:** UPPER_SNAKE_CASE (`ATTENDANCE_STATES`)
- **Archivos de test:** `<Componente>.test.tsx` o `<Componente>.test.ts`

### Estructura de un Feature Module

```
features/mi-modulo/
├── MiModulo.tsx          # Componente principal / página
├── components/           # Sub-componentes específicos del módulo
├── hooks/                # Hooks locales del módulo
├── context/              # Contexto local si aplica
└── mi-modulo.css         # Estilos específicos (si aplica)
```

### Acceso a Supabase

- **Nunca** llamar a Supabase directamente desde un componente. Siempre usar la capa `services/`.
- En componentes, usar **React Query** para cachear y gestionar el estado de las peticiones.
- Para mutaciones (INSERT/UPDATE/DELETE), usar `useMutation` de React Query.

### Permisos

- **Nunca** ocultar funcionalidades basándose en strings de rol directamente. Siempre usar `usePermissions()`.
- Las rutas protegidas se configuran en `App.tsx`.

---

## Contacto y Soporte

Para reportar problemas o solicitar nuevas funcionalidades, contactar al equipo de desarrollo de AYP.

> *Documentación generada el 14 de abril de 2026.*
