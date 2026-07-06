# Sistema de Soporte e Inventario TI — Hospital Rezola

Aplicación web para gestión de inventario TI, soporte técnico, fichas de soporte, bajas de bienes, reportes y configuración institucional.

## Stack

- **Next.js 16** (App Router)
- **React 19** + **TypeScript**
- **SQL Server** (`mssql`)
- **Tailwind CSS 4** + **shadcn/ui**
- **TanStack React Query**
- **React Hook Form** + **Zod**

## Requisitos

- Node.js 20+
- SQL Server accesible con stored procedures del proyecto
- Variables de entorno configuradas (ver `.env.example`)

## Configuración

1. Clonar el repositorio e instalar dependencias:

```bash
npm install
```

2. Copiar variables de entorno:

```bash
cp .env.example .env
```

3. Completar `.env` con credenciales de base de datos y `JWT_SECRET`.

4. Iniciar en desarrollo:

```bash
npm run dev
```

La app estará disponible en `http://localhost:3000`.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo (webpack) |
| `npm run dev:turbo` | Desarrollo con Turbopack |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | ESLint |
| `npm run typecheck` | Verificación TypeScript |

## Estructura principal

```
src/
├── app/              # Rutas, layouts, APIs
├── components/       # UI reutilizable
├── lib/              # Auth, DB, export, print
├── types/            # Tipos de dominio
└── proxy.ts          # Protección de rutas y sesión
```

## Seguridad

- Autenticación JWT en cookie httpOnly
- APIs protegidas (excepto login/logout)
- `JWT_SECRET` obligatorio en producción
- Validación de roles en operaciones sensibles

## Documentación de reconstrucción

Ver `RECONSTRUCCION.md` para el plan de modernización enterprise, arquitectura objetivo y roadmap por fases.

## Licencia

Uso interno — Hospital Rezola / Área de Estadística e Informática.
