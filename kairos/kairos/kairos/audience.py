# Copyright (c) 2025, Kairos and contributors
# For license information, please see license.txt

"""
Audience System - Cross-cutting module for targeting communications.

This module provides functions to resolve audience parameters to actual
recipients (students and guardians) for News, Events, Field Trips, etc.
"""

import frappe
from frappe import _
from typing import List, Optional, Dict, Any


def get_current_academic_year() -> Optional[str]:
    """Get the currently active Academic Year."""
    academic_year = frappe.db.get_value(
        "Academic Year",
        {"is_current": 1},
        "name"
    )
    return academic_year


def resolve_audience_to_students(
    audience_type: str,
    campus: Optional[str] = None,
    school_unit: Optional[str] = None,
    grade: Optional[str] = None,
    section: Optional[str] = None,
    shift: Optional[str] = None,
    academic_year: Optional[str] = None
) -> List[str]:
    """
    Resolves audience parameters to a list of Student names (IDs).

    Args:
        audience_type: One of "All School", "Campus", "School Unit", "Grade", "Section", "Custom"
        campus: Campus name (required for Campus level and below)
        school_unit: School Unit name (required for School Unit level and below)
        grade: Grade name (required for Grade level and below)
        section: Section name (required for Section level)
        shift: Optional shift filter ("Morning", "Afternoon")
        academic_year: Academic year to filter enrollments (defaults to current)

    Returns:
        List of Student document names
    """
    if not academic_year:
        academic_year = get_current_academic_year()

    if not academic_year:
        frappe.throw(_("No active Academic Year found"))

    # Build section filter based on audience type
    section_filters = {"academic_year": academic_year}

    if audience_type == "All School":
        # No additional section filters - get all sections
        pass

    elif audience_type == "Campus":
        if not campus:
            frappe.throw(_("Campus is required for Campus audience type"))
        # Get all school units in this campus
        school_units = frappe.get_all(
            "School Unit",
            filters={"campus": campus, "is_active": 1},
            pluck="name"
        )
        if not school_units:
            return []
        # Get all grades in these school units
        grades = frappe.get_all(
            "Grade",
            filters={"school_unit": ["in", school_units], "is_active": 1},
            pluck="name"
        )
        if not grades:
            return []
        section_filters["grade"] = ["in", grades]

    elif audience_type == "School Unit":
        if not school_unit:
            frappe.throw(_("School Unit is required for School Unit audience type"))
        # Get all grades in this school unit
        grades = frappe.get_all(
            "Grade",
            filters={"school_unit": school_unit, "is_active": 1},
            pluck="name"
        )
        if not grades:
            return []
        section_filters["grade"] = ["in", grades]

    elif audience_type == "Grade":
        if not grade:
            frappe.throw(_("Grade is required for Grade audience type"))
        section_filters["grade"] = grade

    elif audience_type == "Section":
        if not section:
            frappe.throw(_("Section is required for Section audience type"))
        section_filters["name"] = section

    elif audience_type == "Custom":
        # Custom audience - return empty, caller should handle recipients manually
        return []

    else:
        frappe.throw(_("Invalid audience type: {0}").format(audience_type))

    # Apply shift filter if specified
    if shift and shift != "All" and audience_type not in ["All School", "Custom"]:
        section_filters["shift"] = shift

    # Get sections matching filters
    if "name" in section_filters:
        # Single section
        sections = [section_filters["name"]]
    else:
        sections = frappe.get_all(
            "Section",
            filters=section_filters,
            pluck="name"
        )

    if not sections:
        return []

    # Get active student enrollments for these sections
    enrollments = frappe.get_all(
        "Student Enrollment",
        filters={
            "section": ["in", sections],
            "academic_year": academic_year,
            "status": "Active"
        },
        pluck="student"
    )

    # Remove duplicates (in case student is enrolled in multiple sections)
    return list(set(enrollments))


def resolve_audience_to_guardians(
    students: List[str],
    respect_preferences: bool = True
) -> List[str]:
    """
    Given a list of students, return their guardians who should receive communications.

    Args:
        students: List of Student document names
        respect_preferences: If True, only include guardians with receives_communications=1

    Returns:
        List of Guardian document names
    """
    if not students:
        return []

    guardians = set()

    # Get student-guardian relationships
    filters = {"student": ["in", students]}
    if respect_preferences:
        filters["receives_communications"] = 1

    student_guardians = frappe.get_all(
        "Student Guardian",
        filters=filters,
        fields=["guardian"]
    )

    for sg in student_guardians:
        guardians.add(sg.guardian)

    return list(guardians)


def resolve_audience(
    audience_type: str,
    campus: Optional[str] = None,
    school_unit: Optional[str] = None,
    grade: Optional[str] = None,
    section: Optional[str] = None,
    shift: Optional[str] = None,
    academic_year: Optional[str] = None,
    include_students: bool = False
) -> Dict[str, List[str]]:
    """
    Full audience resolution - returns both students and guardians.

    Args:
        audience_type: Audience targeting level
        campus: Campus filter
        school_unit: School Unit filter
        grade: Grade filter
        section: Section filter
        shift: Shift filter
        academic_year: Academic year (defaults to current)
        include_students: If True, also return student list

    Returns:
        Dict with "guardians" (always) and "students" (if include_students=True)
    """
    students = resolve_audience_to_students(
        audience_type=audience_type,
        campus=campus,
        school_unit=school_unit,
        grade=grade,
        section=section,
        shift=shift,
        academic_year=academic_year
    )

    guardians = resolve_audience_to_guardians(students)

    result = {"guardians": guardians}
    if include_students:
        result["students"] = students

    return result


def get_audience_count(
    audience_type: str,
    campus: Optional[str] = None,
    school_unit: Optional[str] = None,
    grade: Optional[str] = None,
    section: Optional[str] = None,
    shift: Optional[str] = None,
    academic_year: Optional[str] = None,
    count_type: str = "guardians"
) -> int:
    """
    Get count of recipients for preview (without fetching all records).
    More efficient than resolve_audience when you just need counts.

    Args:
        audience_type: Audience targeting level
        campus: Campus filter
        school_unit: School Unit filter
        grade: Grade filter
        section: Section filter
        shift: Shift filter
        academic_year: Academic year (defaults to current)
        count_type: "students" or "guardians"

    Returns:
        Count of recipients
    """
    if not academic_year:
        academic_year = get_current_academic_year()

    if not academic_year:
        return 0

    # For simplicity, we use the full resolution
    # In production, this could be optimized with COUNT queries
    if count_type == "students":
        students = resolve_audience_to_students(
            audience_type=audience_type,
            campus=campus,
            school_unit=school_unit,
            grade=grade,
            section=section,
            shift=shift,
            academic_year=academic_year
        )
        return len(students)
    else:
        result = resolve_audience(
            audience_type=audience_type,
            campus=campus,
            school_unit=school_unit,
            grade=grade,
            section=section,
            shift=shift,
            academic_year=academic_year
        )
        return len(result["guardians"])


def validate_audience_permission(
    user: str,
    audience_type: str,
    campus: Optional[str] = None,
    school_unit: Optional[str] = None,
    grade: Optional[str] = None,
    section: Optional[str] = None
) -> bool:
    """
    Check if user can send to the specified audience.

    Permission rules:
    - System Manager: Can send to any audience
    - School Admin (Director): Can send to their school unit and below
    - Teacher: Can only send to their assigned sections

    Args:
        user: User email or name
        audience_type: Audience targeting level
        campus: Campus filter
        school_unit: School Unit filter
        grade: Grade filter
        section: Section filter

    Returns:
        True if user has permission, False otherwise
    """
    # System Manager can send to anyone
    if "System Manager" in frappe.get_roles(user):
        return True

    # School Admin can send to their school units and below
    if "School Admin" in frappe.get_roles(user):
        if audience_type == "All School":
            return False  # Can't send to all school

        # Get user's staff record
        staff = frappe.db.get_value("Staff", {"user": user}, "name")
        if not staff:
            return False

        # Get school units where this staff is director
        user_school_units = frappe.get_all(
            "School Unit",
            filters=[
                ["director", "=", staff],
            ],
            pluck="name"
        )

        # Also get school units where staff is vice_director or coordinator
        vice_units = frappe.get_all(
            "School Unit",
            filters={"vice_director": staff},
            pluck="name"
        )
        coord_units = frappe.get_all(
            "School Unit",
            filters={"coordinator": staff},
            pluck="name"
        )

        user_school_units = list(set(user_school_units + vice_units + coord_units))

        if not user_school_units:
            return False

        # Check if target is within user's school units
        if audience_type in ["School Unit", "Grade", "Section"]:
            if school_unit:
                return school_unit in user_school_units
            elif grade:
                grade_school_unit = frappe.db.get_value("Grade", grade, "school_unit")
                return grade_school_unit in user_school_units
            elif section:
                section_grade = frappe.db.get_value("Section", section, "grade")
                if section_grade:
                    grade_school_unit = frappe.db.get_value("Grade", section_grade, "school_unit")
                    return grade_school_unit in user_school_units

        if audience_type == "Campus":
            if campus:
                # Check if any of user's school units are in this campus
                campus_school_units = frappe.get_all(
                    "School Unit",
                    filters={"campus": campus},
                    pluck="name"
                )
                return any(su in user_school_units for su in campus_school_units)

        return False

    # Teacher can only send to their sections
    # Get user's staff record
    staff = frappe.db.get_value("Staff", {"user": user}, "name")
    if not staff:
        return False

    # Get teacher's assigned sections for current academic year
    academic_year = get_current_academic_year()
    if not academic_year:
        return False

    teacher_sections = frappe.get_all(
        "Staff Section Assignment",
        filters={
            "staff": staff,
            "academic_year": academic_year
        },
        pluck="section"
    )

    if not teacher_sections:
        return False

    if audience_type == "Section":
        return section in teacher_sections

    # Teachers can't send to higher audience levels
    return False


# Whitelisted methods for client-side calls
@frappe.whitelist()
def get_audience_preview(
    audience_type: str,
    campus: Optional[str] = None,
    school_unit: Optional[str] = None,
    grade: Optional[str] = None,
    section: Optional[str] = None,
    shift: Optional[str] = None
) -> Dict[str, Any]:
    """
    Get audience preview for the UI - shows count and can_send status.

    Returns:
        Dict with "count", "can_send", and "message"
    """
    user = frappe.session.user

    can_send = validate_audience_permission(
        user=user,
        audience_type=audience_type,
        campus=campus,
        school_unit=school_unit,
        grade=grade,
        section=section
    )

    count = 0
    if can_send:
        count = get_audience_count(
            audience_type=audience_type,
            campus=campus,
            school_unit=school_unit,
            grade=grade,
            section=section,
            shift=shift,
            count_type="guardians"
        )

    if not can_send:
        message = _("You don't have permission to send to this audience")
    elif count == 0:
        message = _("No recipients found for this audience")
    elif count == 1:
        message = _("This will reach 1 family")
    else:
        message = _("This will reach {0} families").format(count)

    return {
        "count": count,
        "can_send": can_send,
        "message": message
    }


@frappe.whitelist()
def get_cascade_options(
    parent_type: str,
    parent_value: str
) -> List[Dict[str, str]]:
    """
    Get cascade filter options for the audience selector UI.

    Args:
        parent_type: "campus", "school_unit", or "grade"
        parent_value: The selected parent value

    Returns:
        List of options for the next level
    """
    if parent_type == "campus":
        # Get school units in this campus
        options = frappe.get_all(
            "School Unit",
            filters={"campus": parent_value, "is_active": 1},
            fields=["name", "unit_name"],
            order_by="unit_name"
        )
        return [{"value": o.name, "label": o.unit_name} for o in options]

    elif parent_type == "school_unit":
        # Get grades in this school unit
        options = frappe.get_all(
            "Grade",
            filters={"school_unit": parent_value, "is_active": 1},
            fields=["name", "grade_name"],
            order_by="sequence"
        )
        return [{"value": o.name, "label": o.grade_name} for o in options]

    elif parent_type == "grade":
        # Get sections in this grade
        academic_year = get_current_academic_year()
        filters = {"grade": parent_value}
        if academic_year:
            filters["academic_year"] = academic_year

        options = frappe.get_all(
            "Section",
            filters=filters,
            fields=["name", "section_name"],
            order_by="section_name"
        )
        return [{"value": o.name, "label": o.section_name} for o in options]

    return []
