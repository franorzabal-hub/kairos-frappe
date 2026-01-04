# Kairos UX/UI Customization Guide

> Guía completa para personalizar la interfaz de Kairos siguiendo las mejores prácticas de Frappe Framework, asegurando compatibilidad con futuras actualizaciones.

## Tabla de Contenidos

1. [Principios de Diseño](#principios-de-diseño)
2. [Métodos de Personalización](#métodos-de-personalización)
3. [Implementación Actual](#implementación-actual)
4. [Recursos y Documentación](#recursos-y-documentación)
5. [Troubleshooting](#troubleshooting)

---

## Principios de Diseño

### Filosofía de Kairos UI

Kairos adopta un estilo moderno inspirado en **Notion** y **Slack**:

- **Minimalismo**: Interfaces limpias sin elementos innecesarios
- **Espaciado generoso**: Breathing room entre elementos
- **Tipografía clara**: Jerarquía visual mediante tamaños y pesos
- **Colores suaves**: Paleta neutra con acentos de color para acciones
- **Microinteracciones**: Transiciones suaves y feedback visual
- **Modo oscuro ready**: Variables CSS para theming

### Paleta de Colores

```css
/* Colores principales */
--kairos-primary: #2563eb;      /* Azul principal */
--kairos-primary-light: #3b82f6;
--kairos-primary-dark: #1d4ed8;

/* Grises (estilo Notion) */
--kairos-gray-50: #fafafa;
--kairos-gray-100: #f4f4f5;
--kairos-gray-200: #e4e4e7;
--kairos-gray-500: #71717a;
--kairos-gray-900: #18181b;

/* Estados */
--kairos-success: #22c55e;
--kairos-warning: #f59e0b;
--kairos-error: #ef4444;
```

---

## Métodos de Personalización

### 1. Client Scripts (Via UI - Recomendado)

**Ubicación**: `Home > Customization > Client Script > New`

Los Client Scripts permiten agregar lógica JavaScript a formularios sin modificar código. Se almacenan en la base de datos y sobreviven updates.

**Documentación oficial**:
- https://frappeframework.com/docs/user/en/desk/scripting/client-script

**Ejemplo básico**:
```javascript
frappe.ui.form.on('Student', {
    refresh: function(frm) {
        // Agregar botón personalizado
        frm.add_custom_button(__('Ver Historial'), () => {
            frappe.set_route('List', 'Message Recipient', {
                recipient: frm.doc.name
            });
        });
    },
    validate: function(frm) {
        // Validación personalizada
        if (!frm.doc.email && !frm.doc.phone) {
            frappe.msgprint(__('Debe ingresar email o teléfono'));
            frappe.validated = false;
        }
    }
});
```

**Eventos disponibles**:
- `setup` - Una vez al crear el form
- `onload` - Al cargar datos
- `refresh` - Al refrescar (incluye después de guardar)
- `validate` - Antes de guardar (cliente)
- `before_save` - Justo antes de enviar al servidor
- `after_save` - Después de guardar exitosamente
- `{fieldname}` - Al cambiar valor de un campo

---

### 2. Server Scripts (Via UI)

**Ubicación**: `Home > Customization > Server Script > New`

Para lógica del lado del servidor sin modificar código Python.

**Documentación oficial**:
- https://frappeframework.com/docs/user/en/desk/scripting/server-script

**Tipos disponibles**:
- **Document Event**: Before/After Insert, Save, Submit, Cancel, Delete
- **API**: Crear endpoints personalizados
- **Permission Query**: Filtros de seguridad
- **Scheduled**: Tareas programadas

---

### 3. Custom CSS/JS via hooks.py

**Archivos**:
- `kairos/public/css/kairos.css` - Estilos globales
- `kairos/public/js/kairos.js` - JavaScript global

**Configuración en hooks.py**:
```python
app_include_css = "/assets/kairos/css/kairos.css"
app_include_js = "/assets/kairos/js/kairos.js"
```

**Ventajas**:
- Control total sobre estilos
- Versionado en git
- Se aplica a toda la aplicación

**Consideraciones**:
- Usar selectores específicos para no romper Frappe
- Preferir CSS custom properties para theming
- Evitar `!important` cuando sea posible

---

### 4. Custom Fields

**Ubicación**: `Home > Customization > Custom Field`

Agregar campos a DocTypes existentes (incluso de Frappe) sin modificar el código original.

**Documentación oficial**:
- https://frappeframework.com/docs/user/en/customize-erpnext/custom-field

---

### 5. Property Setters

**Ubicación**: `Home > Customization > Customize Form`

Modificar propiedades de campos existentes:
- Cambiar labels
- Hacer campos obligatorios/opcionales
- Cambiar opciones de select
- Ocultar campos
- Cambiar orden

---

### 6. Workspaces Personalizados

**Ubicación**: `Home > Customization > Workspace`

Crear dashboards personalizados por rol con:
- Shortcuts a doctypes
- Reportes embebidos
- Links rápidos
- Contadores

---

### 7. Portal Pages (www/)

Para crear páginas web públicas o portales para padres/estudiantes.

**Estructura**:
```
kairos/www/
├── guardian_portal.html
├── guardian_portal.py
└── guardian_portal.css
```

**Documentación oficial**:
- https://frappeframework.com/docs/user/en/portal-pages

---

### 8. Frappe UI (Vue 3 + Tailwind)

Para construir frontends completamente personalizados.

**Repositorio**: https://github.com/frappe/frappe-ui

**Documentación**: https://frappeui.com/

**Uso recomendado**:
- Apps móviles
- Portales avanzados
- Dashboards complejos

---

## Implementación Actual

### Estructura de Archivos

```
kairos/
├── public/
│   ├── css/
│   │   └── kairos.css      # Estilos modernos (Notion/Slack style)
│   └── js/
│       └── kairos.js       # Mejoras de UX
├── hooks.py                 # Configuración de assets
└── fixtures/
    └── client_script/       # Client scripts exportados
```

### Estilos Implementados

1. **Cards con sombras suaves** - Estilo Notion
2. **Sidebar mejorado** - Navegación clara
3. **Botones modernos** - Con hover states
4. **Inputs refinados** - Focus states claros
5. **Tablas limpias** - Sin bordes pesados
6. **Modals elegantes** - Con backdrop blur
7. **Transiciones suaves** - 200ms ease

### JavaScript Enhancements

1. **Keyboard shortcuts** - Navegación rápida
2. **Toast notifications** - Feedback no intrusivo
3. **Loading states** - Spinners modernos
4. **Empty states** - Mensajes amigables

---

## Recursos y Documentación

### Documentación Oficial de Frappe

| Tema | URL |
|------|-----|
| Client Scripts | https://frappeframework.com/docs/user/en/desk/scripting/client-script |
| Server Scripts | https://frappeframework.com/docs/user/en/desk/scripting/server-script |
| Form API | https://frappeframework.com/docs/user/en/api/form |
| Hooks | https://frappeframework.com/docs/user/en/python-api/hooks |
| Portal Pages | https://frappeframework.com/docs/user/en/portal-pages |
| Asset Bundling | https://frappeframework.com/docs/user/en/basics/asset-bundling |
| Custom Fields | https://frappeframework.com/docs/user/en/customize-erpnext/custom-field |
| Workspaces | https://frappeframework.com/docs/user/en/desk/workspace/customization |

### Frappe UI (Vue Components)

| Recurso | URL |
|---------|-----|
| Repositorio | https://github.com/frappe/frappe-ui |
| Documentación | https://frappeui.com/ |
| Storybook | https://ui.frappe.io/ |

### Inspiración de Diseño

| App | Aspectos a tomar |
|-----|------------------|
| Notion | Tipografía, espaciado, cards, sidebar |
| Slack | Colores, mensajería, estados |
| Linear | Minimalismo, shortcuts, velocidad |
| Figma | Colaboración, feedback visual |

### Recursos de CSS

| Recurso | URL |
|---------|-----|
| Tailwind CSS | https://tailwindcss.com/ |
| Open Props | https://open-props.style/ |
| Radix Colors | https://www.radix-ui.com/colors |

---

## Fixtures para Preservar Customizaciones

Agregar en `hooks.py`:

```python
fixtures = [
    "Role",
    "Client Script",
    "Server Script",
    "Custom Field",
    "Property Setter",
    "Workspace",
    {"dt": "Custom DocPerm", "filters": [
        ["role", "in", ["School Admin", "Teacher", "Parent"]]
    ]}
]
```

Para exportar fixtures:
```bash
bench --site your-site export-fixtures
```

---

## Troubleshooting

### CSS no se aplica

1. Verificar que `hooks.py` tiene `app_include_css` descomentado
2. Ejecutar `bench build` después de cambios
3. Limpiar caché: `bench clear-cache`
4. Hard refresh en browser: `Cmd+Shift+R`

### JavaScript no funciona

1. Verificar consola del browser por errores
2. Asegurar que `hooks.py` tiene `app_include_js`
3. Verificar que el archivo existe en `public/js/`
4. Ejecutar `bench build`

### Client Script no aparece

1. Verificar que está habilitado (checkbox "Enabled")
2. Verificar que el DocType es correcto
3. Refrescar la página del formulario

### Cambios no persisten después de update

1. Usar Client Scripts (UI) en lugar de archivos
2. Exportar customizaciones como fixtures
3. Evitar modificar archivos core de Frappe

---

## Comandos Útiles

```bash
# Rebuild assets
bench build

# Clear cache
bench clear-cache

# Export fixtures
bench --site sitename export-fixtures

# Migrate (después de cambios en doctypes)
bench --site sitename migrate

# Watch mode (desarrollo)
bench watch
```

---

## Contribuir

Para agregar nuevas customizaciones:

1. Crear Client Script via UI para lógica específica
2. Agregar CSS en `public/css/kairos.css` para estilos
3. Documentar cambios en este archivo
4. Exportar fixtures antes de commit

---

*Última actualización: Enero 2026*
