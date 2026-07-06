# RECONSTRUCCION.md — Sistema de Soporte e Inventario TI (Hospital Rezola)

> **Documento maestro de reconstrucción enterprise**  
> Versión: 1.0 · Fecha: 2026-07-04  
> Estado: **Fase 3 en progreso — UX enterprise y accesibilidad**

---

## Tabla de contenidos

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Estado actual](#2-estado-actual)
3. [Problemas encontrados](#3-problemas-encontrados)
4. [Prioridades](#4-prioridades)
5. [Mejoras propuestas](#5-mejoras-propuestas)
6. [Nueva arquitectura](#6-nueva-arquitectura)
7. [Componentes reutilizables](#7-componentes-reutilizables)
8. [Sistema de diseño](#8-sistema-de-diseño)
9. [Decisiones técnicas](#9-decisiones-técnicas)
10. [Dependencias a instalar](#10-dependencias-a-instalar)
11. [Dependencias a eliminar](#11-dependencias-a-eliminar)
12. [Migraciones necesarias](#12-migraciones-necesarias)
13. [Riesgos](#13-riesgos)
14. [Checklist completo](#14-checklist-completo)
15. [Roadmap por fases](#15-roadmap-por-fases)
16. [Registro de progreso](#16-registro-de-progreso)

---

## 1. Resumen ejecutivo

**Proyecto:** `sistema-soporte-ti` — inventario, soporte técnico, fichas, bajas, reportes y configuración para área TI hospitalaria.

**Stack actual:** Next.js 16.2.6 · React 19 · TypeScript 5 (strict) · SQL Server (mssql) · Tailwind CSS 4 · shadcn/base-nova · React Query · React Hook Form · Zod (parcial).

**Diagnóstico:** El producto es **funcionalmente amplio** pero **arquitectónicamente inmaduro**. Existe deuda técnica significativa en seguridad, tipado, consistencia visual, UX (alertas nativas), duplicación de código y archivos monolíticos. No cumple estándares enterprise para producción sin intervención estructural.

**Decisión:** Reconstrucción **progresiva por fases**, no rewrite desde cero. Se preserva la capa de datos (SPs, SQL Server) y se refactoriza frontend, APIs, auth, design system y patrones.

**Objetivo final:** Producto con calidad Vercel/Linear/Stripe — minimalista, consistente, accesible, responsive, seguro y mantenible.

---

## 2. Estado actual

### 2.1 Métricas del codebase

| Métrica | Valor |
|---------|-------|
| Archivos en `src/` | ~94 |
| Páginas dashboard | 25 |
| Rutas API | 29 archivos (~45 handlers) |
| Componentes UI shadcn | 10 primitivos |
| Componentes inventario | 9 modals |
| Uso de `alert()` | ~45 llamadas en 15 archivos |
| Uso de `any` | ~350+ ocurrencias en ~50 archivos |
| `console.*` | ~120 en ~45 archivos |
| README | **Ausente** |
| `.env.example` | **Ausente** |
| Tests automatizados | **Ausentes** |

### 2.2 Archivos más críticos por tamaño

| Líneas | Archivo | Problema |
|--------|---------|----------|
| **1.922** | `src/app/(dashboard)/soporte/ficha/page.tsx` | Monolito: UI + form + tabla + print + export |
| 803 | `src/app/(dashboard)/soporte/baja/page.tsx` | Duplica patrones de ficha |
| 567 | `src/lib/export/ficha-baja-excel.ts` | Lógica duplicada con soporte |
| 557 | `src/app/(dashboard)/reportes/inventario/page.tsx` | Reporte monolítico |
| 498 | `src/components/inventory/ComponenteFormModal.tsx` | Form sin tipos estrictos |
| 458 | `src/app/(dashboard)/reportes/fichas/page.tsx` | — |
| 439 | `src/app/(dashboard)/usuarios/page.tsx` | — |
| 406 | `src/lib/export/ficha-soporte-excel.ts` | — |
| 399 | `src/app/api/soporte/ficha/route.ts` | Enriquecimiento manual |

### 2.3 Estructura actual

```
src/
├── app/
│   ├── (auth)/login/
│   ├── (dashboard)/          # 25 páginas
│   ├── actions/catalogs.ts   # Server Actions (217 líneas)
│   ├── api/                  # 29 rutas REST
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── inventory/            # 9 modals
│   ├── layout/Sidebar.tsx    # 296 líneas
│   ├── providers/QueryProvider.tsx
│   └── ui/                   # 10 shadcn
├── lib/
│   ├── auth/                 # jwt.ts, password.ts
│   ├── db.ts
│   ├── export/               # ExcelJS
│   ├── print/                # Templates HTML
│   └── utils.ts
├── store/ui.ts               # Zustand (solo sidebar)
├── proxy.ts                  # Auth gate (no middleware.ts)
└── scripts/create-user.ts
```

**Carpetas ausentes (requeridas):** `src/types/`, `src/hooks/`, `src/services/`, `src/constants/`, `src/features/`.

### 2.4 Stack y configuración

| Área | Estado |
|------|--------|
| Next.js | 16.2.6 (App Router, route groups) |
| Auth | JWT cookie (`jose`) + `proxy.ts`; APIs **sin protección** |
| DB | `mssql` pool singleton, SPs + SQL directo mezclados |
| Estado cliente | React Query + useState local + Zustand mínimo |
| Formularios | RHF en todas las páneas; Zod solo en 4 lugares |
| Estilos | Tailwind 4 + OKLCH tokens; **Geist** cargada pero CSS espera `--font-sans` |
| Metadata | `"Create Next App"` (placeholder) |
| Idioma HTML | `lang="en"` con UI en español |
| i18n | No implementado |

### 2.5 Módulos funcionales

| Módulo | Estado funcional | Estado técnico |
|--------|------------------|----------------|
| Login / sesión | Operativo | Secret JWT con fallback inseguro |
| Dashboard | Operativo | Charts OK, hardcoded colors |
| Inventario (bienes, componentes, software) | Operativo | Forms OK, tipos débiles |
| Redes | Operativo | API sin auth |
| Soporte — Ficha | Operativo | Monolito 1.922 líneas |
| Soporte — Baja | Operativo | Duplicación con ficha |
| Soporte — Mantenimiento | **Roto** | API inexistente |
| Usuarios | Operativo | POST/PATCH sin auth |
| Configuración (10 CRUDs) | Operativo | 80% código duplicado |
| Reportes | Operativo | Export mixto |
| Export Excel/PDF fichas | Operativo | 3 estrategias distintas |

### 2.6 Autenticación y autorización

```
Login → POST /api/auth/login → sp_LoginUsuario → bcrypt → JWT cookie (8h)
Páginas → proxy.ts redirige a /login si no hay cookie
APIs    → proxy.ts NO valida (return next() para /api/*)
Roles   → Solo UI (Sidebar, layout); servidor no enforce en mayoría de rutas
```

**Roles inferidos:** Administrador, Usuario (y posiblemente más en tabla `Roles`).

### 2.7 Capa de datos

- **Driver:** `mssql` con pool global en `globalThis.mssqlPool`.
- **Patrones:** Stored procedures (`sp_*`, `pro_*`) + INSERT/UPDATE directo.
- **Dual path:** Server Actions (`catalogs.ts`) y REST APIs duplican lecturas.
- **Enriquecimiento:** Map manual en `ficha/route.ts` y `baja/route.ts`.
- **Riesgo SQL:** `encrypt: false`, `trustServerCertificate: true`, TLSv1 mínimo.

---

## 3. Problemas encontrados

### 3.1 Seguridad — CRÍTICO

| ID | Problema | Ubicación |
|----|----------|-----------|
| SEC-01 | JWT secret hardcodeado: `"super-secret-key-change-me-in-production"` | `src/lib/auth/jwt.ts` |
| SEC-02 | Todas las APIs bypass auth en proxy | `src/proxy.ts:12-14` |
| SEC-03 | POST/PATCH usuarios sin autenticación | `src/app/api/usuarios/route.ts` |
| SEC-04 | Endpoints dev en árbol producción: `/api/schema_dump`, `/api/scratch` | `src/app/api/` |
| SEC-05 | `scratch` ejecuta DDL (`ALTER TABLE`) | `src/app/api/scratch/route.ts` |
| SEC-06 | Autorización por rol solo en cliente | Sidebar, layout, pages |
| SEC-07 | SQL sin cifrado en tránsito (dev config en prod) | `src/lib/db.ts` |
| SEC-08 | Sin rate limiting en login | `src/app/api/auth/login/route.ts` |
| SEC-09 | Sin `.env.example`; variables no documentadas | raíz |
| SEC-10 | Errores SQL expuestos al cliente | varias APIs |

### 3.2 Arquitectura — ALTO

| ID | Problema | Impacto |
|----|----------|---------|
| ARCH-01 | Monolito `ficha/page.tsx` (1.922 líneas) | Imposible mantener/testear |
| ARCH-02 | Triple vía de datos: fetch API + Server Actions + SQL en page | Inconsistencia |
| ARCH-03 | Sin capa `services/` ni `types/` compartidos | Duplicación masiva |
| ARCH-04 | 10 páginas configuración ~80% idénticas | DRY violado |
| ARCH-05 | Export: ExcelJS + xlsx + CSV server-side | 3 estrategias |
| ARCH-06 | Print inline en ficha vs template en baja | Inconsistencia |
| ARCH-07 | Sin error boundary global | Crashes no manejados |
| ARCH-08 | Sin middleware de auth unificado para APIs | Seguridad |

### 3.3 UX / UI — MEDIO-ALTO

| ID | Problema | Detalle |
|----|----------|---------|
| UX-01 | ~45 `alert()` nativos | Anti-patrón enterprise |
| UX-02 | Sin sistema de toasts | Sin feedback profesional |
| UX-03 | Sin skeletons consistentes | Loading states ad hoc |
| UX-04 | Empty states ausentes o mínimos | — |
| UX-05 | Tipografía Geist vs requisito Montserrat | Incumple spec |
| UX-06 | `--font-sans` no conectado a layout | Font rota |
| UX-07 | Mezcla `slate-*` hardcoded + tokens | Inconsistencia visual |
| UX-08 | Metadata placeholder "Create Next App" | No profesional |
| UX-09 | `lang="en"` con UI español | Accesibilidad/i18n |
| UX-10 | Sidebar items no funcionales (perfil, clave) | UX rota |

### 3.4 TypeScript — MEDIO

| ID | Problema |
|----|----------|
| TS-01 | ~350+ usos de `any` |
| TS-02 | Sin `src/types/` centralizado |
| TS-03 | Zod solo en cliente (4 forms); servidor sin validación |
| TS-04 | `executeQuery<T = any>` en db.ts |
| TS-05 | Formularios baja/ficha con `useForm<any>()` |
| TS-06 | Errores TS conocidos en baja/page (Responsable, Ambiente no en schema) |

### 3.5 Código muerto y dependencias — MEDIO

| ID | Item |
|----|------|
| DEAD-01 | `LoginInventarioTI.jsx` — no importado |
| DEAD-02 | `jsonwebtoken` — no usado (`jose` sí) |
| DEAD-03 | `pdf.js`, `pdfjs` — cero imports |
| DEAD-04 | `file-saver` — no usado |
| DEAD-05 | `[module]/page.tsx` — stub placeholder |
| DEAD-06 | `tmp-inspect-mssql.*` en raíz |

### 3.6 Funcionalidad rota

| ID | Problema |
|----|----------|
| BUG-01 | `/soporte/mantenimiento` llama API inexistente |
| BUG-02 | Búsqueda ficha calcula resultados pero tabla muestra todas |
| BUG-03 | Remember-me checkbox no funcional |
| BUG-04 | Logos `/logo1.png`, `/logo2.png` pueden faltar en algunos entornos |

### 3.7 Operaciones y documentación — MEDIO

| ID | Problema |
|----|----------|
| OPS-01 | README vacío/ausente |
| OPS-02 | Sin tests (unit, integration, e2e) |
| OPS-03 | Sin CI/CD documentado |
| OPS-04 | `npm run lint` no incluye typecheck |
| OPS-05 | Scripts DB duplicados en raíz |

---

## 4. Prioridades

### P0 — Bloqueantes de producción (Semana 1-2)

1. Eliminar endpoints dev (`schema_dump`, `scratch`).
2. Forzar `JWT_SECRET` obligatorio; eliminar fallback.
3. Middleware/auth helper en **todas** las APIs excepto login/logout.
4. Autorización por rol en servidor (usuarios, configuración, soporte).
5. Documentar `.env.example` + README mínimo operativo.

### P1 — Fundamentos (Semana 2-4)

1. Design System con Montserrat + tokens completos.
2. Sonner/toast system; eliminar todos los `alert()`.
3. Estructura de carpetas nueva (`types`, `hooks`, `services`, `features`).
4. Auth layer unificado (`lib/auth/session.ts`, `lib/auth/guards.ts`).
5. Validación Zod en servidor para todas las APIs.

### P2 — Refactor estructural (Semana 4-8)

1. Descomponer `ficha/page.tsx` en feature module.
2. Unificar export (ExcelJS shared lib).
3. Generic `CatalogCrudPage` para configuración.
4. Extraer print template ficha (como baja).
5. Tipos de dominio compartidos.

### P3 — Pulido enterprise (Semana 8-12)

1. Tests críticos (auth, APIs, forms).
2. Accesibilidad WCAG audit.
3. Performance (lazy routes, memo, bundle analysis).
4. Animaciones sutiles (framer-motion acotado).
5. Responsive audit por breakpoint.
6. Implementar o eliminar mantenimiento stub.

### P4 — Escalabilidad (Semana 12+)

1. i18n preparación (es-PE primero).
2. Observabilidad (logging estructurado).
3. Rate limiting login.
4. SQL encryption prod config.
5. E2E con Playwright.

---

## 5. Mejoras propuestas

### 5.1 Seguridad

- `createApiHandler()` wrapper con auth + role + Zod + error format estándar.
- Eliminar SQL interpolado en IN clauses; usar TVPs o queries parametrizadas.
- Headers de seguridad vía `next.config.ts` (CSP, X-Frame-Options, etc.).
- Sanitizar outputs; nunca retornar `err.message` de SQL al cliente.

### 5.2 Arquitectura

- **Feature-based folders:** `src/features/soporte/ficha/`, `src/features/inventario/bienes/`.
- **Services layer:** `src/services/api/bienes.service.ts` encapsula fetch + tipos.
- **Hooks layer:** `useFichas()`, `useBienes()` con query keys factory.
- **Single data path:** APIs REST como única fuente; deprecar Server Actions duplicados gradualmente.

### 5.3 UX

- Toast para éxito/error/warning/info.
- Skeleton loaders en tablas y cards.
- Empty states con CTA (ej. "Crear primera ficha").
- Confirm dialogs shadcn en lugar de `window.confirm`.
- Optimistic UI en toggles simples (activar/desactivar catálogo).

### 5.4 UI / Design

- Montserrat como única familia (400, 500, 600, 700).
- Paleta neutra inspirada Linear/Vercel (grises OKLCH refinados).
- Sidebar colapsable con estados claros.
- Tablas con `@tanstack/react-table` + componente `DataTable` unificado.
- Breadcrumbs en páginas profundas.

### 5.5 Código

- Max 300 líneas por archivo de page (excepto generated).
- ESLint rules: `no-console`, `@typescript-eslint/no-explicit-any`.
- Pre-commit: lint + typecheck.
- Shared `src/lib/export/excel-base.ts` para ExcelJS común.

---

## 6. Nueva arquitectura

### 6.1 Diagrama de capas

```
┌─────────────────────────────────────────────────────────────┐
│  PRESENTATION (app/, components/)                           │
│  Pages · Layouts · Feature components · Design System       │
├─────────────────────────────────────────────────────────────┤
│  APPLICATION (features/, hooks/)                            │
│  useFichas · useAuth · Form schemas · View models           │
├─────────────────────────────────────────────────────────────┤
│  DOMAIN (types/, constants/)                                │
│  Ficha · Bien · Usuario · Role · Catalog entities           │
├─────────────────────────────────────────────────────────────┤
│  INFRASTRUCTURE (services/, lib/)                           │
│  API clients · db · auth · export · print                   │
├─────────────────────────────────────────────────────────────┤
│  DATA (app/api/, SQL Server SPs)                            │
│  Route handlers · executeQuery · Stored Procedures          │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Estructura de carpetas objetivo

```
src/
├── app/                          # Solo routing y layouts delgados
│   ├── (auth)/
│   ├── (dashboard)/
│   └── api/
├── features/                     # Lógica por dominio
│   ├── auth/
│   ├── dashboard/
│   ├── inventario/
│   │   ├── bienes/
│   │   ├── componentes/
│   │   └── software/
│   ├── soporte/
│   │   ├── ficha/
│   │   ├── baja/
│   │   └── mantenimiento/
│   ├── configuracion/
│   ├── reportes/
│   └── usuarios/
├── components/
│   ├── ui/                       # shadcn + extensions
│   ├── layout/                   # AppShell, Sidebar, Header
│   ├── feedback/                 # Toast, EmptyState, ErrorState
│   └── data-display/             # DataTable, StatCard, PageHeader
├── hooks/                        # useMediaQuery, useDebounce, etc.
├── services/                     # API clients tipados
├── types/                        # Domain types + API DTOs
├── constants/                    # Roles, routes, query keys
├── lib/
│   ├── auth/
│   ├── db.ts
│   ├── export/
│   ├── print/
│   ├── validations/              # Zod schemas compartidos
│   └── utils.ts
├── store/                        # Zustand (auth UI, sidebar)
└── proxy.ts
```

### 6.3 Patrón de página objetivo

```tsx
// app/(dashboard)/soporte/ficha/page.tsx — MÁX ~50 líneas
export default function FichaPage() {
  return <FichaPageView />;
}

// features/soporte/ficha/components/FichaPageView.tsx
// features/soporte/ficha/hooks/useFichaForm.ts
// features/soporte/ficha/hooks/useFichaList.ts
// features/soporte/ficha/types/ficha.types.ts
```

### 6.4 Patrón API objetivo

```typescript
// lib/api/create-handler.ts
export function createApiHandler<TBody>({
  schema,
  roles,
  handler,
}) {
  return async (req: NextRequest) => {
    const session = await requireAuth(req);
    requireRole(session, roles);
    const body = schema ? schema.parse(await req.json()) : undefined;
    try {
      const data = await handler({ session, body, req });
      return NextResponse.json(data);
    } catch (error) {
      return handleApiError(error);
    }
  };
}
```

### 6.5 Flujo de autenticación objetivo

```
Request → proxy.ts (pages) / requireAuth (APIs)
        → verify JWT → load user from DB → attach session
        → requireRole(['Administrador']) si aplica
        → handler
```

---

## 7. Componentes reutilizables

### 7.1 Design System (`components/ui/`)

| Componente | Estado actual | Acción |
|------------|---------------|--------|
| Button | ✓ Existe | Extender variants (ghost, link, destructive) |
| Input | ✓ Existe | Agregar InputGroup, error state |
| Textarea | ✓ Existe | Error state |
| Select | ✓ Existe | — |
| Checkbox | ✓ Existe | — |
| Dialog | ✓ Existe | ConfirmDialog wrapper |
| Card | ✓ Existe | StatCard variant |
| Avatar | ✓ Existe | — |
| Dropdown | ✓ Existe | — |
| **Toast/Sonner** | ✗ | **Instalar** |
| **Form** | ✗ | shadcn Form + RHF |
| **Table** | ✗ | DataTable base |
| **Badge** | ✗ | Instalar |
| **Sheet** | ✗ | Mobile sidebar |
| **Tabs** | ✗ | Reportes, detalle |
| **Skeleton** | ✗ | Loading states |
| **Alert** | ✗ | Inline alerts (no modal) |
| **Breadcrumb** | ✗ | Navegación |
| **Pagination** | ✗ | Tablas largas |
| **Tooltip** | ✗ | Icon buttons |

### 7.2 Layout

| Componente | Descripción |
|------------|-------------|
| `AppShell` | Sidebar + header + main + footer opcional |
| `PageHeader` | Título, descripción, acciones (breadcrumb + buttons) |
| `Sidebar` | Refactor: collapsible, role-aware, mobile sheet |
| `UserMenu` | Avatar + logout + perfil (futuro) |

### 7.3 Feedback

| Componente | Reemplaza |
|------------|-----------|
| `toast.success/error/warning/info` | `alert()` |
| `ConfirmDialog` | `window.confirm()` |
| `EmptyState` | páginas vacías ad hoc |
| `ErrorState` | errores de query |
| `LoadingSkeleton` | spinners inconsistentes |

### 7.4 Data display

| Componente | Uso |
|------------|-----|
| `DataTable` | Todas las tablas (TanStack Table) |
| `SearchInput` | Búsquedas con debounce |
| `FilterBar` | Filtros de listados |
| `ExportMenu` | PDF/Excel/CSV unificado |
| `StatusBadge` | Condición, estado, rol |

### 7.5 Forms

| Componente | Uso |
|------------|-----|
| `FormField` | Label + Input + error + hint |
| `FormSelect` | Select integrado RHF |
| `FormCheckboxGroup` | Tipo bien, causal baja |
| `CatalogCrudForm` | CRUD configuración genérico |

### 7.6 Feature-specific (extraídos de monolitos)

| Componente | Origen |
|------------|--------|
| `FichaForm` | ficha/page.tsx |
| `FichaTable` | ficha/page.tsx |
| `FichaPrintDialog` | ficha/page.tsx |
| `FichaExportDialog` | ficha/page.tsx |
| `BajaForm` | baja/page.tsx |
| `BienLookupDialog` | ficha + baja |
| `SignatureBlock` | export Excel (shared) |

---

## 8. Sistema de diseño

### 8.1 Tipografía — Montserrat (obligatorio)

```typescript
// app/layout.tsx
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
```

**Escala tipográfica:**

| Token | Size | Weight | Line-height | Uso |
|-------|------|--------|-------------|-----|
| `text-display` | 2.25rem / 36px | 700 | 1.2 | Títulos hero |
| `text-h1` | 1.875rem / 30px | 700 | 1.25 | Page titles |
| `text-h2` | 1.5rem / 24px | 600 | 1.3 | Section headers |
| `text-h3` | 1.25rem / 20px | 600 | 1.4 | Card titles |
| `text-body` | 0.875rem / 14px | 400 | 1.5 | Body default |
| `text-body-lg` | 1rem / 16px | 400 | 1.5 | Emphasis body |
| `text-small` | 0.75rem / 12px | 500 | 1.4 | Captions, labels |
| `text-table` | 0.8125rem / 13px | 400 | 1.45 | Dense tables |

**Responsive:** Reducir display/h1 en mobile (`sm:`, `md:` breakpoints).

### 8.2 Colores (tokens OKLCH — inspiración Linear/Vercel)

```css
:root {
  /* Base neutrals */
  --background: oklch(0.99 0 0);
  --foreground: oklch(0.13 0 0);
  --muted: oklch(0.96 0 0);
  --muted-foreground: oklch(0.45 0 0);
  --border: oklch(0.91 0 0);

  /* Brand — hospitalario sobrio (azul institucional suave) */
  --primary: oklch(0.45 0.12 250);
  --primary-foreground: oklch(0.99 0 0);

  /* Semantic */
  --success: oklch(0.55 0.15 145);
  --warning: oklch(0.75 0.15 85);
  --destructive: oklch(0.55 0.2 25);
  --info: oklch(0.55 0.12 250);

  /* Sidebar */
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.25 0 0);
  --sidebar-accent: oklch(0.94 0.01 250);
}
```

### 8.3 Espaciado

Base unit: **4px**. Escala: 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24 (Tailwind default).

**Layout:**
- Page padding: `px-4 md:px-6 lg:px-8`
- Section gap: `space-y-6`
- Card padding: `p-4 md:p-6`

### 8.4 Radios y sombras

| Token | Valor | Uso |
|-------|-------|-----|
| `--radius-sm` | 6px | Badges, inputs |
| `--radius-md` | 8px | Buttons, cards |
| `--radius-lg` | 12px | Modals, panels |
| `--shadow-sm` | sutil | Cards |
| `--shadow-md` | media | Dropdowns, popovers |
| `--shadow-lg` | pronunciada | Modals |

### 8.5 Breakpoints

| Nombre | Ancho | Diseño |
|--------|-------|--------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Laptop |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Wide desktop |

**Mobile-first:** Sidebar → Sheet drawer. Tablas → scroll horizontal o card list.

### 8.6 Iconografía

- **Única librería:** Lucide React
- Tamaños: 16px (inline), 20px (buttons), 24px (empty states)
- Stroke width: 1.75 default
- **Prohibido:** emojis en UI

### 8.7 Animaciones

| Tipo | Duración | Easing |
|------|----------|--------|
| Micro (hover) | 150ms | ease-out |
| Transición UI | 200ms | ease-in-out |
| Modal/sheet | 250ms | ease-out |
| Page enter | 300ms | ease-out |

**Regla:** Solo `opacity`, `transform`. No animar `width/height` en listas grandes.

### 8.8 Estados de componentes

Todo input/button debe definir: `default`, `hover`, `focus-visible`, `active`, `disabled`, `error`, `loading`.

---

## 9. Decisiones técnicas

| # | Decisión | Alternativa descartada | Justificación |
|---|----------|------------------------|---------------|
| D-01 | Reconstrucción incremental | Rewrite total | Preserva SPs y datos; menor riesgo |
| D-02 | Mantener Next.js 16 App Router | Migrar a Pages | Ya adoptado; proxy pattern Next 16 |
| D-03 | Montserrat via next/font | CDN Google Fonts | Performance, no layout shift |
| D-04 | Sonner para toasts | react-hot-toast | Integración shadcn oficial |
| D-05 | Zod en cliente Y servidor | Solo manual validation | Single source of truth schemas |
| D-06 | APIs REST como data layer | Solo Server Actions | Mejor para export, auth, caching |
| D-07 | ExcelJS único para Excel formateado | xlsx + ExcelJS | Una estrategia; xlsx solo si bulk simple |
| D-08 | Feature folders | Flat components | Escalabilidad, ownership claro |
| D-09 | `@tanstack/react-table` DataTable | Tablas HTML ad hoc | Sort, filter, pagination consistente |
| D-10 | Lucide único | Mezcla icon sets | Consistencia |
| D-11 | OKLCH tokens | Hex hardcoded | shadcn v4 + dark mode ready |
| D-12 | `jose` para JWT | jsonwebtoken | Edge-compatible, ya en uso |
| D-13 | Framer-motion acotado | CSS only | Solo page transitions y sidebar |
| D-14 | Strict TS + gradual any removal | Permissive | Calidad long-term |
| D-15 | No i18n library Fase 1 | next-intl | UI ya en español; preparar strings |

---

## 10. Dependencias a instalar

### 10.1 Producción

| Paquete | Versión objetivo | Propósito |
|---------|------------------|-----------|
| `sonner` | latest stable | Toast system |
| `@radix-ui/react-*` | via shadcn CLI | Componentes faltantes |
| `next-themes` | latest | Dark mode (opcional Fase 3) |
| `date-fns` | latest | Formateo fechas consistente |

### 10.2 shadcn components a añadir (via CLI)

```
toast (sonner), form, table, badge, sheet, tabs, skeleton,
alert, breadcrumb, pagination, tooltip, separator, scroll-area
```

### 10.3 Desarrollo

| Paquete | Propósito |
|---------|-----------|
| `@typescript-eslint/eslint-plugin` | no-explicit-any, no-console |
| `eslint-plugin-jsx-a11y` | Accesibilidad |
| `prettier` + `prettier-plugin-tailwindcss` | Formato consistente |
| `vitest` + `@testing-library/react` | Tests unitarios |
| `@playwright/test` | E2E (Fase 4) |
| `husky` + `lint-staged` | Pre-commit hooks |

### 10.4 Actualizaciones (patch/minor seguras Fase 1)

- `next` → 16.2.10
- `eslint-config-next` → 16.2.10
- `lucide-react` → latest 1.x
- `@tanstack/react-query` → latest 5.x
- `mssql` → 12.7.x

**Posponer majors:** TypeScript 6, ESLint 10, @types/node 26 (evaluar Fase 4).

---

## 11. Dependencias a eliminar

| Paquete | Razón |
|---------|-------|
| `jsonwebtoken` | Duplicado; se usa `jose` |
| `@types/jsonwebtoken` | Ya no necesario |
| `pdf.js` | Sin uso en src |
| `pdfjs` | Sin uso en src |
| `file-saver` | Downloads via Blob + anchor |
| `@types/file-saver` | Ya no necesario |
| `xlsx` | Consolidar en ExcelJS (migrar usuarios + bulk ficha) |

**Evaluar post-migración:** `framer-motion` — reducir scope o reemplazar con CSS si bundle impact alto.

---

## 12. Migraciones necesarias

### 12.1 Migración de fuentes

```
Geist → Montserrat
Actualizar layout.tsx, globals.css (--font-sans)
Eliminar --font-geist-sans references
```

### 12.2 Migración alert → toast

```
~45 alert() en 15 archivos
Patrón: toast.error("Mensaje claro en español")
Prioridad: baja/page (12), usuarios (5), ficha (4)
```

### 12.3 Migración any → types

```
1. Crear src/types/domain/*.ts
2. Tipar API responses en services/
3. Tipar forms con Zod infer
4. Habilitar eslint no-explicit-any gradualmente
```

### 12.4 Migración Server Actions → API

```
catalogs.ts reads → fetch desde /api/* en cliente
Mantener Server Actions solo si SSR necesario (evaluar)
Fase 2-3; no bloqueante Fase 1
```

### 12.5 Migración xlsx → ExcelJS

```
usuarios/page.tsx export
ficha/page.tsx bulk export
Unificar en lib/export/
```

### 12.6 Migración ficha/page.tsx

```
Extraer:
  - features/soporte/ficha/components/FichaList.tsx
  - features/soporte/ficha/components/FichaFormDialog.tsx
  - features/soporte/ficha/components/FichaPrintDialog.tsx
  - features/soporte/ficha/hooks/useFichaMutations.ts
  - lib/print/ficha-print-template.ts (nuevo, como baja)
```

### 12.7 Migración configuración CRUD

```
10 pages → CatalogCrudPage<T> generic
Config por entidad en constants/catalogs.ts
```

### 12.8 Migración auth APIs

```
Cada route.ts:
  import { withAuth, withRole } from '@/lib/auth/guards'
  export const GET = withAuth(handler)
  export const POST = withAuth(withRole(['Administrador'], handler))
```

### 12.9 Eliminación código muerto

```
Delete: LoginInventarioTI.jsx
Delete: api/schema_dump, api/scratch
Delete or implement: soporte/mantenimiento
Delete: [module]/page.tsx stub o implementar
```

### 12.10 Configuración entorno

```
Crear .env.example con todas las variables
Documentar en README
Validar JWT_SECRET al startup (fail fast)
```

---

## 13. Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Regresión funcional en refactor ficha | Alta | Alto | Feature flags; QA manual checklist; commits pequeños |
| Breaking auth bloquea usuarios | Media | Crítico | Rollout gradual; whitelist rutas públicas explícita |
| SPs SQL no documentados | Alta | Medio | Inventariar SPs antes de tocar APIs |
| Resistencia a cambio UX (toasts) | Baja | Bajo | Mensajes en español claro |
| Bundle size post shadcn | Media | Medio | Tree shaking; lazy imports |
| Excel export regression | Media | Medio | Snapshots manuales; test descarga |
| TypeScript strict breaks build | Alta | Medio | Migración incremental por módulo |
| Tiempo subestimado (1.922 líneas ficha) | Alta | Alto | Ficha es Fase 2 dedicada; no mezclar con P0 |
| DB encrypt change breaks dev | Media | Medio | Env-specific db config |
| Dependencia mssql + webpack | Baja | Medio | Ya resuelto con serverExternalPackages |

---

## 14. Checklist completo

### 14.1 Seguridad

- [ ] Eliminar `/api/schema_dump` y `/api/scratch`
- [ ] JWT_SECRET obligatorio sin fallback
- [ ] Auth middleware en todas las APIs
- [ ] Role guards en servidor
- [ ] Eliminar SQL error messages al cliente
- [ ] Rate limit login
- [ ] `.env.example` creado
- [ ] Security headers en next.config
- [ ] Auditar endpoints GET abiertos (bienes, exportar)
- [ ] Parametrizar IN clauses SQL

### 14.2 Design System

- [ ] Montserrat configurada globalmente
- [ ] Tokens completos en globals.css
- [ ] shadcn components faltantes instalados
- [ ] Sonner integrado en layout
- [ ] PageHeader, AppShell, DataTable base
- [ ] EmptyState, ErrorState, Skeleton
- [ ] ConfirmDialog
- [ ] Dark mode tokens (opcional)
- [ ] Metadata y favicon hospital
- [ ] lang="es" en html

### 14.3 Arquitectura

- [ ] Carpetas features/, types/, hooks/, services/
- [ ] createApiHandler utility
- [ ] Query keys factory
- [ ] Error handler centralizado
- [ ] Zod schemas en lib/validations/
- [ ] Deprecar duplicación catalogs.ts

### 14.4 Código / Calidad

- [ ] Eliminar todos los alert()
- [ ] Eliminar console.log de producción
- [ ] Eliminar código muerto listado
- [ ] Max file size lint rule (opcional)
- [ ] typecheck en CI
- [ ] README completo
- [ ] Build verde
- [ ] Lint verde
- [ ] Typecheck verde

### 14.5 Features / Bugs

- [ ] Fix búsqueda ficha (mostrar buscarResultados)
- [ ] Implementar o remover mantenimiento
- [ ] Logos en public/ verificados
- [ ] Remember-me o remover checkbox
- [ ] Sidebar items funcionales o ocultos

### 14.6 Accesibilidad

- [ ] aria-label en icon buttons
- [ ] focus-visible en todos los interactivos
- [ ] Contraste WCAG AA verificado
- [ ] Form labels asociados
- [ ] Keyboard nav sidebar
- [ ] Screen reader test básico

### 14.7 Responsive

- [ ] Mobile sidebar sheet
- [ ] Tablas responsive
- [ ] Forms mobile layout
- [ ] Dashboard charts mobile
- [ ] Print/export dialogs mobile

### 14.8 Performance

- [ ] Lazy load feature routes pesadas
- [ ] Memo en DataTable rows
- [ ] Image optimization logos
- [ ] Bundle analyzer run
- [ ] React Query staleTime por entidad

### 14.9 Export / Print

- [ ] excel-base.ts compartido
- [ ] ficha-print-template.ts extraído
- [ ] Unificar estrategia Excel
- [ ] A4 single page ambas fichas

### 14.10 Tests (Fase 4)

- [ ] Auth login/logout unit
- [ ] API guards integration
- [ ] Zod schemas unit
- [ ] Critical forms e2e

---

## 15. Roadmap por fases

### Fase 0 — Auditoría ✅ (actual)

**Entregable:** Este documento `RECONSTRUCCION.md`  
**Duración:** 1-2 días  
**Estado:** COMPLETADO — pendiente aprobación stakeholder

---

### Fase 1 — Fundamentos y seguridad (Semanas 1-3)

**Objetivo:** Base segura, design system mínimo viable, feedback profesional.

| Semana | Tareas |
|--------|--------|
| 1.1 | Eliminar endpoints dev; JWT_SECRET fail-fast; `.env.example`; README |
| 1.2 | `lib/auth/guards.ts`; proteger APIs P0 (usuarios, soporte, dashboard) |
| 1.3 | Montserrat + tokens; Sonner; metadata; lang es |
| 1.4 | AppShell + PageHeader; ConfirmDialog |
| 1.5 | Migrar alert() en login, usuarios, baja (top offenders) |
| 1.6 | Instalar shadcn: form, badge, skeleton, sheet |
| 1.7 | Crear `src/types/` base; eslint no-console |
| 1.8 | Verificar build + lint + smoke test manual |

**Criterio de salida Fase 1:**
- Build verde
- Cero endpoints dev
- APIs críticas autenticadas
- Toasts operativos
- Montserrat visible en toda la app
- README + .env.example

---

### Fase 2 — Refactor estructural (Semanas 4-7)

**Objetivo:** Eliminar monolitos; componentes reutilizables; tipos estrictos.

| Semana | Tareas |
|--------|--------|
| 2.1 | `DataTable` + migrar usuarios, bienes |
| 2.2 | `CatalogCrudPage` + migrar 3 configuraciones piloto |
| 2.3 | `services/` layer + query keys factory |
| 2.4 | Descomponer ficha/page (50% — list + form) |
| 2.5 | Descomponer ficha/page (50% — print + export) |
| 2.6 | `ficha-print-template.ts`; excel-base.ts |
| 2.7 | Refactor baja/page usando shared components |
| 2.8 | Zod validation en APIs soporte + inventario |

**Criterio de salida Fase 2:**
- ficha/page.tsx < 200 líneas (orchestrator)
- 10 configuraciones en CatalogCrudPage
- excel-base compartido
- Typecheck errores reducidos 70%

---

### Fase 3 — UX enterprise y accesibilidad (Semanas 8-10)

**Objetivo:** Pulido visual; responsive; a11y; performance.

| Semana | Tareas |
|--------|--------|
| 3.1 | Empty states + skeletons en todos los listados |
| 3.2 | Mobile sidebar sheet; responsive tables |
| 3.3 | Breadcrumbs; tabs en reportes |
| 3.4 | WCAG audit + fixes |
| 3.5 | Lazy routes; bundle optimization |
| 3.6 | Animaciones sutiles (page transitions) |
| 3.7 | Fix mantenimiento o remove route |
| 3.8 | Migrar configuración restante; eliminar xlsx |

**Criterio de salida Fase 3:**
- Lighthouse a11y > 90 en login + dashboard
- Responsive verificado 4 breakpoints
- Cero alert(), cero console.log prod
- Bundle analizado y optimizado

---

### Fase 4 — Producción y escalabilidad (Semanas 11-14)

**Objetivo:** Tests, observabilidad, hardening prod.

| Semana | Tareas |
|--------|--------|
| 4.1 | Vitest setup; auth + validation tests |
| 4.2 | Playwright smoke e2e |
| 4.3 | SQL prod config (encrypt); logging estructurado |
| 4.4 | Rate limiting; security headers |
| 4.5 | CI pipeline (lint, typecheck, test, build) |
| 4.6 | Documentación arquitectura + SP inventory |
| 4.7 | Performance regression test |
| 4.8 | Release checklist + handoff |

**Criterio de salida Fase 4:**
- CI verde
- Tests críticos passing
- Documentación completa
- Security review passed
- Stakeholder sign-off

---

## 16. Registro de progreso

| Fase | Estado | Fecha inicio | Fecha fin | Notas |
|------|--------|--------------|-----------|-------|
| Fase 0 — Auditoría | ✅ Completada | 2026-07-04 | 2026-07-04 | Documento generado |
| Fase 1 — Fundamentos | ✅ Completada | 2026-07-04 | 2026-07-04 | Guards en 27 APIs; cero alert(); utilidades compartidas |
| Fase 2 — Refactor | ✅ Completada | 2026-07-04 | 2026-07-04 | 10/10 catálogos en CatalogCrudPage; Zod APIs; ficha/baja modulares |
| Fase 3 — UX/A11y | ✅ Completada | 2026-07-04 | 2026-07-04 | 3.1–3.8 incl. page transitions (3.6) |
| Fase 4 — Producción | 🔄 En progreso | 2026-07-04 | — | 4.1 Vitest + 36 tests auth/validación |

### Log de cambios del documento

| Versión | Fecha | Cambio |
|---------|-------|--------|
| 1.0 | 2026-07-04 | Creación inicial post-auditoría completa |
| 1.1 | 2026-07-04 | Fase 1 iniciada: seguridad, guards, Sonner, AppShell, build verde |
| 1.2 | 2026-07-04 | Migración alert→toast; openPrintWindow; fetchSessionClient; notify.fromError |
| 1.3 | 2026-07-04 | Guards por rol en todas las APIs; auth duplicada eliminada en bienes/componentes/software |
| 2.1 | 2026-07-04 | DataTable, StatusBadge; migrados usuarios y bienes; PageHeader |
| 2.2 | 2026-07-04 | CatalogCrudPage; migrados marcas, modelos y áreas |
| 2.3 | 2026-07-04 | services/ + query-keys; migrados bienes, usuarios, catálogos |
| 2.4 | 2026-07-04 | ficha/page descompuesta: FichaList, FichaFormDialog, hooks, ficha.service; bug búsqueda corregido |
| 2.5 | 2026-07-04 | FichaPrintSection simplificado; export list extraído; DialogPrintStyles para vista |
| 2.6 | 2026-07-04 | excel-base.ts compartido; refactor ficha-soporte/baja excel; 4 catálogos migrados |
| 2.7 | 2026-07-04 | baja/page descompuesta: BajaList, BajaFormDialog, hooks, baja.service; vista corregida |
| 2.8 | 2026-07-04 | Zod en APIs ficha/baja/bienes/buscar; schemas compartidos en lib/validations; BienFormModal unificado |
| 2.9 | 2026-07-04 | Migrados tipos-licencia, tipos-software y software-catalogo a CatalogCrudPage (10/10) |
| 3.1 | 2026-07-04 | EmptyState + DashboardSkeleton; DataTable mejorado; componentes/software/redes/dashboard migrados |
| 3.2 | 2026-07-04 | SidebarNav extraído; navegación mobile con Sheet en AppShell |
| 3.3 | 2026-07-04 | Breadcrumbs globales en AppShell; tabs en reportes; layout reportes |
| 3.4 | 2026-07-04 | Skip link, login accesible, focus-visible, ConfirmDialog catálogos, scope tablas |
| 3.5 | 2026-07-04 | Lazy recharts/modales/features; optimizePackageImports; mantenimiento placeholder |
| 3.7 | 2026-07-04 | /soporte/mantenimiento reemplazado por EmptyState (API inexistente) |
| 3.8 | 2026-07-04 | tipos-asignacion-software migrado a CatalogCrudPage (11/11 catálogos) |
| 3.6 | 2026-07-04 | PageTransition en AppShell; fade+translate 300ms; respeta prefers-reduced-motion |
| 4.1 | 2026-07-04 | Vitest configurado; 36 tests (jwt, password, guards, schemas Zod) |

---

> **Fase 3 completada.** Deuda menor: migrar `confirm()` restantes a ConfirmDialog; consolidar export usuarios de xlsx → ExcelJS.

## Apéndice A — Inventario de rutas

### Dashboard

| Ruta | Archivo | Líneas aprox. |
|------|---------|---------------|
| `/` | `page.tsx` | 293 |
| `/inventario/bienes` | bienes/page.tsx | ~350 |
| `/inventario/componentes` | componentes/page.tsx | ~400 |
| `/inventario/software` | software/page.tsx | ~300 |
| `/redes` | redes/page.tsx | 299 |
| `/soporte/ficha` | ficha/page.tsx | **7** (orchestrator → `features/soporte/ficha/`) |
| `/soporte/baja` | baja/page.tsx | **7** (orchestrator → `features/soporte/baja/`) |
| `/soporte/mantenimiento` | mantenimiento/page.tsx | 255 |
| `/usuarios` | usuarios/page.tsx | 439 |
| `/configuracion/*` | 10 pages | ~150-280 c/u |
| `/reportes/*` | 3 pages | ~200-557 |

### API (auth requerido post-Fase 1)

Ver sección 2.6 del audit — 29 route files.

---

## Apéndice B — Variables de entorno requeridas

```env
# Base de datos
DB_SERVER=
DB_PORT=1433
DB_NAME=
DB_USER=
DB_PASS=

# Auth (OBLIGATORIO en producción)
JWT_SECRET=

# Entorno
NODE_ENV=development

# Opcional
ALLOWED_DEV_ORIGINS=
```

---

## Apéndice C — Matriz de roles (a confirmar con negocio)

| Acción | Administrador | Usuario estándar |
|--------|:-------------:|:----------------:|
| Ver dashboard | ✓ | ✓ |
| CRUD inventario | ✓ | ? |
| Fichas soporte | ✓ | ✓ |
| Fichas baja | ✓ | ? |
| CRUD usuarios | ✓ | ✗ |
| Configuración catálogos | ✓ | ✗ |
| Reportes | ✓ | ? |
| Exportar datos | ✓ | ? |

> **Acción requerida:** Validar matriz con equipo TI hospital antes de Fase 1.2.

---

**FIN DEL DOCUMENTO**
