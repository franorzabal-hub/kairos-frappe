app_name = "kairos"
app_title = "Kairos"
app_publisher = "Fran Orzabal"
app_description = "Comunicación colegio-padres"
app_email = "franorzabal@gmail.com"
app_license = "MIT"

# Apps to install for new sites
# required_apps = []

# CLI Commands
# ------------
# Custom bench commands for Kairos
# Usage: bench --site <site> kairos setup-demo
# Usage: bench --site <site> execute kairos.kairos.fixtures.demo_data.setup_demo_data

# Register custom commands (for bench kairos ...)
# Note: Commands are also accessible via bench execute

# Includes in <head>
# ------------------

# include js, css files in header of desk.html
app_include_css = "kairos.bundle.css"
app_include_js = "kairos.bundle.js"

# include js, css files in header of web template
# web_include_css = "/assets/kairos/css/kairos.css"
# web_include_js = "/assets/kairos/js/kairos.js"

# include custom scss in every website theme (without signing in)
# website_theme_scss = "kairos/public/scss/website"

# Home Pages
# ----------

# application home page (will override Website Settings)
# home_page = "login"

# website user home page (by Role)
role_home_page = {
    "Parent": "mis-hijos"
}

# Portal Menu Items
# -----------------
# Menu items visible in the portal sidebar for parents

portal_menu_items = [
    {"title": "Mis Hijos", "route": "/mis-hijos", "role": "Parent"},
    {"title": "Mensajes", "route": "/mensajes", "role": "Parent"},
    {"title": "Noticias", "route": "/noticias", "role": "Parent"},
    {"title": "Eventos", "route": "/eventos", "role": "Parent"},
]

# Generators
# ----------

# automatically create page for each record of this doctype
# website_generators = ["Web Page"]

# Fixtures
# --------

fixtures = [
    "Role",
    "Client Script",
    "Server Script",
    "Custom Field",
    "Property Setter",
    {"dt": "Workspace", "filters": [["module", "=", "Kairos"]]},
    {"dt": "Custom DocPerm", "filters": [
        ["role", "in", ["School Admin", "School Manager", "Teacher", "Secretary", "Parent", "Student"]]
    ]}
]

# Installation
# ------------

# before_install = "kairos.install.before_install"
# after_install = "kairos.install.after_install"

# Uninstallation
# --------------

# before_uninstall = "kairos.uninstall.before_uninstall"
# after_uninstall = "kairos.uninstall.after_uninstall"

# DocType Events
# ----------------

doc_events = {
    "*": {
        # Check trial access before any write operation
        "before_insert": "kairos.kairos.middleware.trial_access.check_trial_write_access",
        "before_save": "kairos.kairos.middleware.trial_access.check_trial_write_access",
        "before_submit": "kairos.kairos.middleware.trial_access.check_trial_write_access",
        "before_cancel": "kairos.kairos.middleware.trial_access.check_trial_write_access",
        "on_trash": "kairos.kairos.middleware.trial_access.check_trial_write_access",
    }
}

# Scheduled Tasks
# ---------------

scheduler_events = {
    "daily": [
        # Trial expiration checks - runs once per day
        "kairos.kairos.tasks.trial_expiration.check_trial_expirations",
        "kairos.kairos.tasks.trial_expiration.send_trial_warning_notifications"
    ],
}

# Testing
# -------

# before_tests = "kairos.install.before_tests"

# Override Methods
# ----------------

# override_whitelisted_methods = {
#     "frappe.desk.doctype.event.event.get_events": "kairos.event.get_events"
# }

# Override DocType Classes
# ------------------------

# override_doctype_class = {
#     "ToDo": "custom_app.overrides.CustomToDo"
# }

# User Data Protection
# --------------------

# user_data_fields = [
#     {
#         "doctype": "{doctype}",
#         "filter_by": "{field}",
#         "redact_fields": ["{field}"],
#         "partial": 1,
#     },
# ]

# Authentication and authorization
# --------------------------------

# auth_hooks = [
#     "kairos.auth.validate"
# ]

# Permission Query Conditions
# ---------------------------
# Filtros SQL para limitar registros visibles por rol

permission_query_conditions = {
    "Student": "kairos.permissions.student_query",
    "Message Recipient": "kairos.permissions.message_recipient_query",
    "Event RSVP": "kairos.permissions.event_rsvp_query",
    "News": "kairos.permissions.news_query",
    "School Event": "kairos.permissions.school_event_query",
}

# Has Permission
# --------------
# Validación de permisos a nivel de documento individual

has_permission = {
    "Student": "kairos.permissions.student_has_permission",
    "Guardian": "kairos.permissions.guardian_has_permission",
    "Message Recipient": "kairos.permissions.message_recipient_has_permission",
}
