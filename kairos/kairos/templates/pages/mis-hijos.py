import frappe
from frappe import _

def get_context(context):
    """Get context for My Children page."""
    context.no_cache = 1
    context.title = _("Mis Hijos")

    # Check if user is logged in
    if frappe.session.user == "Guest":
        frappe.throw(_("Please login to view this page"), frappe.PermissionError)

    # Get guardian linked to current user
    guardian = frappe.db.get_value("Guardian", {"user": frappe.session.user}, "name")

    if not guardian:
        context.children = []
        context.no_guardian = True
        return

    context.no_guardian = False
    context.guardian = frappe.get_doc("Guardian", guardian)

    # Get all students linked to this guardian
    student_links = frappe.get_all(
        "Student Guardian",
        filters={"guardian": guardian},
        fields=["student", "relation", "is_primary"]
    )

    children = []
    for link in student_links:
        student = frappe.get_doc("Student", link.student)

        # Get grade and section names
        grade_name = ""
        section_name = ""
        if student.current_grade:
            grade_name = frappe.db.get_value("Grade", student.current_grade, "grade_name") or student.current_grade
        if student.current_section:
            section_name = frappe.db.get_value("Section", student.current_section, "section_name") or student.current_section

        children.append({
            "name": student.name,
            "full_name": student.full_name,
            "first_name": student.first_name,
            "last_name": student.last_name,
            "photo": student.photo,
            "date_of_birth": student.date_of_birth,
            "gender": student.gender,
            "status": student.status,
            "grade": grade_name,
            "section": section_name,
            "relation": link.relation,
            "is_primary": link.is_primary
        })

    context.children = children
