"""
Kairos Permission Hooks

Este módulo implementa la lógica de permisos a nivel de fila (row-level security)
para los diferentes roles de Kairos.

- Teacher: Solo ve estudiantes de sus secciones asignadas
- Parent: Solo ve sus hijos (via Student Guardian)
- Scope filtering: Messages/News/Events filtrados por scope del usuario
"""

import frappe


def get_current_guardian():
    """Obtiene el Guardian del usuario actual."""
    user = frappe.session.user
    if user == "Administrator" or user == "Guest":
        return None
    return frappe.db.get_value("Guardian", {"user": user}, "name")


def get_teacher_sections(user):
    """Obtiene las secciones asignadas a un docente."""
    return frappe.get_all(
        "Staff Section Assignment",
        filters={"staff": user, "is_active": 1},
        pluck="section"
    )


def get_guardian_students(guardian):
    """Obtiene los estudiantes vinculados a un guardian."""
    return frappe.get_all(
        "Student Guardian",
        filters={"guardian": guardian},
        pluck="student"
    )


# =============================================================================
# Permission Query Conditions
# Estas funciones retornan condiciones SQL que filtran los registros visibles
# =============================================================================

def student_query(user):
    """
    Query condition para Student.
    - Teacher: Solo ve estudiantes de sus secciones
    - Parent: Solo ve sus hijos
    """
    if not user:
        user = frappe.session.user

    roles = frappe.get_roles(user)

    # Admins ven todo
    if "School Admin" in roles or "Administrator" in roles or "System Manager" in roles:
        return ""

    if "School Manager" in roles or "Secretary" in roles:
        return ""

    # Teacher: solo estudiantes de sus secciones
    if "Teacher" in roles:
        sections = get_teacher_sections(user)
        if sections:
            sections_str = ", ".join([frappe.db.escape(s) for s in sections])
            return f"`tabStudent`.current_section IN ({sections_str})"
        return "1=0"  # No sections = no students

    # Parent: solo sus hijos
    if "Parent" in roles:
        guardian = get_current_guardian()
        if guardian:
            students = get_guardian_students(guardian)
            if students:
                students_str = ", ".join([frappe.db.escape(s) for s in students])
                return f"`tabStudent`.name IN ({students_str})"
        return "1=0"  # No guardian link = no students

    return "1=0"  # Default: no access


def message_recipient_query(user):
    """
    Query condition para Message Recipient.
    - Parent: Solo ve mensajes donde es el guardian destinatario
    """
    if not user:
        user = frappe.session.user

    roles = frappe.get_roles(user)

    # Admins y staff ven todo
    if any(role in roles for role in ["School Admin", "Administrator", "System Manager",
                                        "School Manager", "Secretary", "Teacher"]):
        return ""

    # Parent: solo sus mensajes
    if "Parent" in roles:
        guardian = get_current_guardian()
        if guardian:
            return f"`tabMessage Recipient`.guardian = {frappe.db.escape(guardian)}"
        return "1=0"

    return "1=0"


def event_rsvp_query(user):
    """
    Query condition para Event RSVP.
    - Parent: Solo ve sus propios RSVPs
    - Teacher: Solo ve sus propios RSVPs
    """
    if not user:
        user = frappe.session.user

    roles = frappe.get_roles(user)

    # Admins y staff ven todo
    if any(role in roles for role in ["School Admin", "Administrator", "System Manager",
                                        "School Manager", "Secretary"]):
        return ""

    # Teacher: solo sus RSVPs (owner)
    if "Teacher" in roles:
        return f"`tabEvent RSVP`.owner = {frappe.db.escape(user)}"

    # Parent: solo sus RSVPs
    if "Parent" in roles:
        guardian = get_current_guardian()
        if guardian:
            return f"`tabEvent RSVP`.guardian = {frappe.db.escape(guardian)}"
        return "1=0"

    return "1=0"


def news_query(user):
    """
    Query condition para News.
    - Parent: Ve noticias del scope de sus hijos
    """
    if not user:
        user = frappe.session.user

    roles = frappe.get_roles(user)

    # Staff ve todo
    if any(role in roles for role in ["School Admin", "Administrator", "System Manager",
                                        "School Manager", "Secretary", "Teacher"]):
        return ""

    # Parent: noticias publicadas del scope de sus hijos
    if "Parent" in roles:
        guardian = get_current_guardian()
        if guardian:
            students = get_guardian_students(guardian)
            if students:
                # Obtener los scopes de los estudiantes
                student_data = frappe.get_all(
                    "Student",
                    filters={"name": ["in", students]},
                    fields=["institution", "campus", "current_grade", "current_section"]
                )

                if student_data:
                    conditions = ["`tabNews`.status = 'Published'"]

                    # Noticias a nivel institución
                    institutions = list(set([s.institution for s in student_data if s.institution]))
                    campuses = list(set([s.campus for s in student_data if s.campus]))
                    grades = list(set([s.current_grade for s in student_data if s.current_grade]))
                    sections = list(set([s.current_section for s in student_data if s.current_section]))

                    scope_conditions = []

                    if institutions:
                        inst_str = ", ".join([frappe.db.escape(i) for i in institutions])
                        scope_conditions.append(f"(`tabNews`.scope_type = 'Institution' AND `tabNews`.institution IN ({inst_str}))")

                    if campuses:
                        camp_str = ", ".join([frappe.db.escape(c) for c in campuses])
                        scope_conditions.append(f"(`tabNews`.scope_type = 'Campus' AND `tabNews`.campus IN ({camp_str}))")

                    if grades:
                        grade_str = ", ".join([frappe.db.escape(g) for g in grades])
                        scope_conditions.append(f"(`tabNews`.scope_type = 'Grade' AND `tabNews`.grade IN ({grade_str}))")

                    if sections:
                        sec_str = ", ".join([frappe.db.escape(s) for s in sections])
                        scope_conditions.append(f"(`tabNews`.scope_type = 'Section' AND `tabNews`.section IN ({sec_str}))")

                    if scope_conditions:
                        return f"({' OR '.join(scope_conditions)})"

        return "1=0"

    return "1=0"


def school_event_query(user):
    """
    Query condition para School Event.
    - Parent: Ve eventos del scope de sus hijos
    """
    if not user:
        user = frappe.session.user

    roles = frappe.get_roles(user)

    # Staff ve todo
    if any(role in roles for role in ["School Admin", "Administrator", "System Manager",
                                        "School Manager", "Secretary", "Teacher"]):
        return ""

    # Parent: eventos publicados del scope de sus hijos
    if "Parent" in roles:
        guardian = get_current_guardian()
        if guardian:
            students = get_guardian_students(guardian)
            if students:
                student_data = frappe.get_all(
                    "Student",
                    filters={"name": ["in", students]},
                    fields=["institution", "campus", "current_grade", "current_section"]
                )

                if student_data:
                    conditions = ["`tabSchool Event`.status = 'Published'"]

                    institutions = list(set([s.institution for s in student_data if s.institution]))
                    campuses = list(set([s.campus for s in student_data if s.campus]))
                    grades = list(set([s.current_grade for s in student_data if s.current_grade]))
                    sections = list(set([s.current_section for s in student_data if s.current_section]))

                    scope_conditions = []

                    if institutions:
                        inst_str = ", ".join([frappe.db.escape(i) for i in institutions])
                        scope_conditions.append(f"(`tabSchool Event`.scope_type = 'Institution' AND `tabSchool Event`.institution IN ({inst_str}))")

                    if campuses:
                        camp_str = ", ".join([frappe.db.escape(c) for c in campuses])
                        scope_conditions.append(f"(`tabSchool Event`.scope_type = 'Campus' AND `tabSchool Event`.campus IN ({camp_str}))")

                    if grades:
                        grade_str = ", ".join([frappe.db.escape(g) for g in grades])
                        scope_conditions.append(f"(`tabSchool Event`.scope_type = 'Grade' AND `tabSchool Event`.grade IN ({grade_str}))")

                    if sections:
                        sec_str = ", ".join([frappe.db.escape(s) for s in sections])
                        scope_conditions.append(f"(`tabSchool Event`.scope_type = 'Section' AND `tabSchool Event`.section IN ({sec_str}))")

                    if scope_conditions:
                        return f"({' OR '.join(scope_conditions)})"

        return "1=0"

    return "1=0"


# =============================================================================
# Has Permission Hooks
# Estas funciones validan permisos a nivel de documento individual
# =============================================================================

def student_has_permission(doc, ptype, user):
    """
    Valida si el usuario tiene permiso sobre un Student específico.
    """
    if not user:
        user = frappe.session.user

    roles = frappe.get_roles(user)

    # Admins tienen acceso total
    if any(role in roles for role in ["School Admin", "Administrator", "System Manager",
                                        "School Manager", "Secretary"]):
        return True

    # Teacher: solo si el estudiante está en sus secciones
    if "Teacher" in roles:
        sections = get_teacher_sections(user)
        if doc.current_section in sections:
            return True
        return False

    # Parent: solo si es su hijo
    if "Parent" in roles:
        guardian = get_current_guardian()
        if guardian:
            students = get_guardian_students(guardian)
            if doc.name in students:
                return True
        return False

    return False


def guardian_has_permission(doc, ptype, user):
    """
    Valida si el usuario tiene permiso sobre un Guardian específico.
    """
    if not user:
        user = frappe.session.user

    roles = frappe.get_roles(user)

    # Admins tienen acceso total
    if any(role in roles for role in ["School Admin", "Administrator", "System Manager",
                                        "School Manager", "Secretary", "Teacher"]):
        return True

    # Parent: solo puede ver/editar su propio perfil
    if "Parent" in roles:
        if doc.user == user:
            return True
        return False

    return False


def message_recipient_has_permission(doc, ptype, user):
    """
    Valida si el usuario tiene permiso sobre un Message Recipient específico.
    """
    if not user:
        user = frappe.session.user

    roles = frappe.get_roles(user)

    # Staff tiene acceso total
    if any(role in roles for role in ["School Admin", "Administrator", "System Manager",
                                        "School Manager", "Secretary", "Teacher"]):
        return True

    # Parent: solo sus propios mensajes
    if "Parent" in roles:
        guardian = get_current_guardian()
        if guardian and doc.guardian == guardian:
            return True
        return False

    return False
