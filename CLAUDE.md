# Backend Kairos (kairos-frappe)

## Qué es este repo

Backend de Kairos construido sobre Frappe Framework v15. Incluye:
- **kairos/** - App Frappe con DocTypes, API, lógica de negocio
- **frontend/kairos-app/** - Kairos Desk (admin UI para colegios) en Next.js

## Arquitectura Multi-Tenant

Cada colegio = un Frappe site con DB separada:
```
sites/
├── colegio1.1kairos.com/    # Tenant 1
├── colegio2.1kairos.com/    # Tenant 2
└── demo.1kairos.com/        # Demo
```

**Releases vs Customizaciones:**
- Tu código (apps/kairos/) se actualiza con cada release (~4 meses)
- Customizaciones de colegios (Custom Fields, Property Setters) se preservan
- `bench migrate --site all` aplica cambios sin romper customizaciones

## Estructura

```
backend/
├── kairos/kairos/kairos/         # App Frappe
│   ├── doctype/                  # DocTypes (modelos)
│   ├── api/                      # Endpoints REST
│   ├── hooks.py                  # Configuración app
│   ├── permissions.py            # Row-level security
│   ├── middleware/               # Trial access, etc.
│   └── tasks/                    # Scheduled tasks
├── frontend/kairos-app/          # Kairos Desk (Next.js)
│   ├── src/pages/                # Páginas admin
│   ├── src/components/           # UI components
│   └── package.json
├── docker-compose.yml            # Dev local
└── Dockerfile                    # Producción
```

## DocTypes Principales

| DocType | Propósito |
|---------|-----------|
| Institution | Colegio/tenant |
| Campus | Sedes |
| Grade | Grados (1°, 2°...) |
| Section | Divisiones (A, B, C) |
| Student | Alumnos |
| Guardian | Padres/tutores |
| Staff | Personal |
| Message | Comunicados |
| News | Noticias |
| School Event | Eventos |

Ver modelo completo en `/infra/docs/DATA_MODEL.md`

## API Endpoints

```bash
# Auth
POST /api/method/frappe.auth.get_logged_user

# CRUD genérico (cualquier DocType)
GET    /api/resource/{DocType}
POST   /api/resource/{DocType}
GET    /api/resource/{DocType}/{name}
PUT    /api/resource/{DocType}/{name}
DELETE /api/resource/{DocType}/{name}

# Custom endpoints
POST /api/method/kairos.api.invitations.create_invitation
POST /api/method/kairos.api.invitations.accept_invitation
GET  /api/method/kairos.api.trial.get_trial_status
```

## Desarrollo Local

```bash
# Opción 1: Docker (recomendado)
docker compose up -d
# Frappe en http://localhost:8000

# Opción 2: Bench nativo
bench start
# En otra terminal:
cd frontend/kairos-app && npm run dev
```

## Roles y Permisos

| Rol | Acceso |
|-----|--------|
| School Admin | Todo el tenant |
| School Manager | Gestión operativa |
| Teacher | Sus secciones y alumnos |
| Secretary | Comunicaciones |
| Parent | Solo sus hijos (via app) |

## Comandos Útiles

```bash
# Frappe bench
bench --site {site} migrate          # Aplicar cambios de schema
bench --site {site} console          # Python REPL con contexto
bench --site {site} mariadb          # MySQL CLI
bench --site all list-apps           # Ver apps instaladas

# Crear nuevo DocType
bench --site {site} new-doctype "My DocType"

# Tests
bench --site {site} run-tests --app kairos
```

## Kairos Desk (frontend/kairos-app/)

Admin UI custom para colegios, construido con Next.js sobre Frappe.

```bash
cd frontend/kairos-app
npm install
npm run dev     # http://localhost:3000
```

**Stack:**
- Next.js 16
- Frappe React SDK
- TanStack Query + Table
- Tailwind CSS
- Radix UI
