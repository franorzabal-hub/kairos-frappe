# Kairos

**Comunicación colegio-padres** - App de Frappe Framework

## Descripción

Kairos es una plataforma de comunicación entre colegios y padres, construida sobre Frappe Framework. Permite a los colegios:

- Enviar comunicados a padres
- Gestionar autorizaciones y permisos
- Coordinar eventos escolares
- Administrar información de alumnos y familias

## Instalación

```bash
# En tu Frappe bench
bench get-app https://github.com/franorzabal-hub/kairos-frappe
bench --site tu-site install-app kairos
```

## Desarrollo

```bash
# Clonar el repo
git clone https://github.com/franorzabal-hub/kairos-frappe
cd kairos-frappe

# Instalar dependencias de desarrollo
pip install -e ".[dev]"

# Pre-commit hooks
pre-commit install
```

## Estructura

```
kairos/
├── kairos/
│   ├── __init__.py
│   ├── hooks.py              # Configuración de la app
│   ├── modules.txt           # Módulos de la app
│   └── kairos/               # Módulo principal
│       ├── __init__.py
│       └── doctype/          # DocTypes (tablas)
├── public/                   # Assets públicos
│   ├── css/
│   └── js/
├── templates/                # Templates HTML
├── www/                      # Páginas web públicas
├── pyproject.toml
└── README.md
```

## Licencia

MIT
