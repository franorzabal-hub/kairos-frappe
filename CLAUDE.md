# Backend Kairos (kairos-frappe)

## Qué es este repo

Backend de Kairos construido sobre Frappe Framework v15. Incluye:
- **kairos/** - App Frappe con DocTypes, API, lógica de negocio
- **Portal para padres** - Frappe Portal customizado en `/portal`
- **API REST** - Endpoints para apps móviles nativas

## Arquitectura Multi-Tenant

Cada colegio = un Frappe site con DB separada:
```
sites/
├── colegio1.1kairos.com/    # Tenant 1
├── colegio2.1kairos.com/    # Tenant 2
└── demo.1kairos.com/        # Demo
```

**Releases vs Customizaciones:**
- Tu código (apps/kairos/) se actualiza con cada release
- Customizaciones de colegios (Custom Fields, Property Setters) se preservan
- `bench migrate --site all` aplica cambios sin romper customizaciones

---

## Desarrollo y Deploy

> **Documentación completa**: Ver [infra/docs/DEVELOPMENT.md](https://github.com/franorzabal-hub/frappe-saas-platform/blob/main/docs/DEVELOPMENT.md)

### Ambientes e Interfaces

| Ambiente | URL | Trigger |
|----------|-----|---------|
| **Dev** | `dev.1kairos.com` | Desarrollo directo en Desk |
| **Prod** | `{tenant}.1kairos.com` | Tag `v*` |

| Interfaz | Ruta | Usuario |
|----------|------|---------|
| Frappe Desk | `/app` | Staff (admin, docentes) |
| Portal Padres | `/portal` | Padres/Tutores |
| API REST | `/api` | Apps móviles nativas |

### Desarrollo en Desk (sin Docker local)

La mayoría del desarrollo se hace **directo en el Desk** de `dev.1kairos.com`:

| Tipo de cambio | Cómo hacerlo |
|----------------|--------------|
| Crear/modificar DocTypes | Directo en Desk |
| Configurar formularios | Customize Form |
| Workflows | Workflow Builder |
| Print Formats | Print Format Builder |
| Reports | Report Builder |
| Roles y permisos | Role Permissions Manager |

```bash
# Acceso al Desk de desarrollo
URL: https://dev.1kairos.com
User: developer@kairos.com
Pass: (solicitar a admin)
```

### Exportar cambios

```bash
# Exportar fixtures después de hacer cambios en Desk
bench --site dev.1kairos.com export-fixtures

# Commit y push
git add . && git commit -m "feat: nuevo doctype X" && git push
```

### Deploy a Producción

```bash
# Deploy a todos los tenants
git tag v1.0.0 -m "Release 1.0.0"
git push origin v1.0.0
# → Cloud Build: build image → deploy GKE → migrate all sites
```

### Desarrollo con código Python (raro)

Solo si necesitas escribir código custom:

```bash
# Opción 1: Docker local
docker compose up -d
# Frappe en http://localhost:8000

# Opción 2: Editar en servidor dev (SSH)
ssh dev-server
cd frappe-bench/apps/kairos
# editar, bench restart
```

---

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

## Roles y Permisos

| Rol | Acceso | Interfaz |
|-----|--------|----------|
| School Admin | Todo el tenant | Frappe Desk (`/app`) |
| School Manager | Gestión operativa | Frappe Desk (`/app`) |
| Teacher | Sus secciones y alumnos | Frappe Desk (`/app`) |
| Secretary | Comunicaciones | Frappe Desk (`/app`) |
| Parent | Solo sus hijos | Portal (`/portal`) + App móvil |

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
