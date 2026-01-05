# Copyright (c) 2025, Kairos and contributors
# For license information, please see license.txt

"""
Patch: Create Academic Structure Sample Data

This patch creates:
1. Academic Year (current year)
2. Sample Subjects
3. Sample Schedule Time Slots
"""

import frappe


def execute():
    """Create academic structure sample data."""

    create_academic_year()
    create_subjects()
    create_schedule_time_slots()

    frappe.db.commit()
    print("Academic structure sample data created successfully!")


def create_academic_year():
    """Create the current academic year."""
    if frappe.db.count("Academic Year") > 0:
        print("Academic Year records already exist. Skipping.")
        return

    try:
        academic_year = frappe.get_doc({
            "doctype": "Academic Year",
            "year_name": "2024-2025",
            "start_date": "2024-03-01",
            "end_date": "2025-02-28",
            "status": "Active",
            "is_current": 1
        })
        academic_year.insert(ignore_permissions=True)
        print(f"Created Academic Year: {academic_year.year_name}")
    except Exception as e:
        frappe.log_error(f"Error creating Academic Year: {e}")


def create_subjects():
    """Create sample subjects."""
    if frappe.db.count("Subject") > 0:
        print("Subject records already exist. Skipping.")
        return

    subjects = [
        {"subject_name": "Matemáticas", "subject_code": "MAT", "for_level": "All"},
        {"subject_name": "Lengua", "subject_code": "LEN", "for_level": "All"},
        {"subject_name": "Inglés", "subject_code": "ENG", "for_level": "All"},
        {"subject_name": "Ciencias Naturales", "subject_code": "NAT", "for_level": "All"},
        {"subject_name": "Ciencias Sociales", "subject_code": "SOC", "for_level": "All"},
        {"subject_name": "Educación Física", "subject_code": "PE", "for_level": "All"},
        {"subject_name": "Música", "subject_code": "MUS", "for_level": "All"},
        {"subject_name": "Plástica", "subject_code": "ART", "for_level": "All"},
        {"subject_name": "Tecnología", "subject_code": "TEC", "for_level": "Secondary"},
        {"subject_name": "Física", "subject_code": "FIS", "for_level": "Secondary"},
        {"subject_name": "Química", "subject_code": "QUI", "for_level": "Secondary"},
        {"subject_name": "Historia", "subject_code": "HIS", "for_level": "Secondary"},
        {"subject_name": "Geografía", "subject_code": "GEO", "for_level": "Secondary"},
    ]

    created = 0
    for data in subjects:
        try:
            subject = frappe.get_doc({
                "doctype": "Subject",
                "is_active": 1,
                **data
            })
            subject.insert(ignore_permissions=True)
            created += 1
        except Exception as e:
            frappe.log_error(f"Error creating Subject {data['subject_name']}: {e}")

    print(f"Created {created} Subject records")


def create_schedule_time_slots():
    """Create sample schedule time slots for a typical school day."""
    if frappe.db.count("Schedule Time Slot") > 0:
        print("Schedule Time Slot records already exist. Skipping.")
        return

    # Primary school schedule (8:00 - 16:15)
    slots = [
        {"slot_name": "Entrada", "start_time": "07:45:00", "end_time": "08:00:00", "slot_type": "Entry", "sequence": 1},
        {"slot_name": "1° Hora", "start_time": "08:00:00", "end_time": "08:45:00", "slot_type": "Class", "sequence": 2},
        {"slot_name": "2° Hora", "start_time": "08:45:00", "end_time": "09:30:00", "slot_type": "Class", "sequence": 3},
        {"slot_name": "Recreo 1", "start_time": "09:30:00", "end_time": "09:45:00", "slot_type": "Break", "sequence": 4},
        {"slot_name": "3° Hora", "start_time": "09:45:00", "end_time": "10:30:00", "slot_type": "Class", "sequence": 5},
        {"slot_name": "4° Hora", "start_time": "10:30:00", "end_time": "11:15:00", "slot_type": "Class", "sequence": 6},
        {"slot_name": "Almuerzo", "start_time": "11:15:00", "end_time": "12:00:00", "slot_type": "Lunch", "sequence": 7},
        {"slot_name": "5° Hora", "start_time": "12:00:00", "end_time": "12:45:00", "slot_type": "Class", "sequence": 8},
        {"slot_name": "6° Hora", "start_time": "12:45:00", "end_time": "13:30:00", "slot_type": "Class", "sequence": 9},
        {"slot_name": "Recreo 2", "start_time": "13:30:00", "end_time": "13:45:00", "slot_type": "Break", "sequence": 10},
        {"slot_name": "7° Hora", "start_time": "13:45:00", "end_time": "14:30:00", "slot_type": "Class", "sequence": 11},
        {"slot_name": "8° Hora", "start_time": "14:30:00", "end_time": "15:15:00", "slot_type": "Class", "sequence": 12},
        {"slot_name": "Merienda", "start_time": "15:15:00", "end_time": "15:30:00", "slot_type": "Break", "sequence": 13},
        {"slot_name": "9° Hora", "start_time": "15:30:00", "end_time": "16:15:00", "slot_type": "Class", "sequence": 14},
        {"slot_name": "Salida", "start_time": "16:15:00", "end_time": "16:30:00", "slot_type": "Exit", "sequence": 15},
    ]

    created = 0
    for data in slots:
        try:
            slot = frappe.get_doc({
                "doctype": "Schedule Time Slot",
                "for_level": "All",
                "is_active": 1,
                **data
            })
            slot.insert(ignore_permissions=True)
            created += 1
        except Exception as e:
            frappe.log_error(f"Error creating Schedule Time Slot {data['slot_name']}: {e}")

    print(f"Created {created} Schedule Time Slot records")
