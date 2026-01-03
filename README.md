# Kairos

**Comunicación colegio-padres** - Frappe App

## Descripción

Kairos es una plataforma de comunicación entre colegios y padres. Permite:

- Enviar comunicados a padres
- Gestionar autorizaciones y permisos
- Coordinar eventos escolares
- Administrar información de alumnos y familias

## Desarrollo Local

### Prerequisitos

- Python 3.10+
- Node.js 18+
- MariaDB 10.6+
- Redis 6+

### Setup con Docker (Recomendado)

```bash
# 1. Clonar este repo
git clone https://github.com/franorzabal-hub/kairos-frappe
cd kairos-frappe

# 2. Iniciar servicios (MariaDB + Redis)
docker compose up -d

# 3. Instalar Frappe bench
pip install frappe-bench

# 4. Crear bench con Frappe oficial
bench init --frappe-branch version-15 frappe-bench
cd frappe-bench

# 5. Crear site
bench new-site kairos.localhost --db-root-password root --admin-password admin

# 6. Agregar app Kairos (desde el repo local)
bench get-app ../kairos-frappe

# 7. Instalar app en el site
bench --site kairos.localhost install-app kairos

# 8. Iniciar servidor de desarrollo
bench start
```

Acceder a: http://kairos.localhost:8000

### Setup Manual (sin Docker)

Si ya tenés MariaDB y Redis instalados:

```bash
# 1. Instalar bench
pip install frappe-bench

# 2. Crear bench
bench init --frappe-branch version-15 frappe-bench
cd frappe-bench

# 3. Crear site
bench new-site kairos.localhost --admin-password admin

# 4. Agregar y instalar app
bench get-app https://github.com/franorzabal-hub/kairos-frappe
bench --site kairos.localhost install-app kairos

# 5. Iniciar
bench start
```

## Estructura del Proyecto

```
kairos-frappe/
├── kairos/                    # Frappe App
│   ├── __init__.py
│   ├── hooks.py               # Configuración de la app
│   ├── modules.txt            # Módulos
│   └── kairos/                # Módulo principal
│       ├── doctype/           # DocTypes (modelos)
│       └── api/               # APIs REST
├── docker-compose.yml         # Servicios locales
├── pyproject.toml             # Configuración Python
└── README.md
```

## Comandos Útiles

```bash
# Crear nuevo DocType
bench --site kairos.localhost new-doctype "Nombre DocType"

# Migrar base de datos
bench --site kairos.localhost migrate

# Consola de Frappe
bench --site kairos.localhost console

# Ejecutar tests
bench --site kairos.localhost run-tests --app kairos

# Build assets
bench build --app kairos
```

## Repositorios Relacionados

| Repo | Descripción |
|------|-------------|
| [kairos-platform](https://github.com/franorzabal-hub/kairos-platform) | Infraestructura GCloud |
| [kairos-control-plane](https://github.com/franorzabal-hub/kairos-control-plane) | API gestión de tenants |
| [kairos-landing](https://github.com/franorzabal-hub/kairos-landing) | Landing page |

## Licencia

MIT
