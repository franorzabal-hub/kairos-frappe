# Copyright (c) 2025, Kairos and contributors
# For license information, please see license.txt

"""
Patch: Create School Unit Sample Data

This patch creates School Units (Campus + Level combinations) for
existing campuses. Each School Unit represents an operational unit
with its own administration (e.g., "Primaria Sede Central").
"""

import frappe


def execute():
    """Create School Unit sample data based on existing campuses."""

    # Skip if School Units already exist
    if frappe.db.count("School Unit") > 0:
        print("School Unit records already exist. Skipping.")
        return

    # Get all campuses
    campuses = frappe.get_all("Campus", fields=["name", "campus_name"])

    if not campuses:
        print("No campuses found. Please create campuses first.")
        return

    levels = ["Kindergarten", "Primary", "Secondary"]
    level_names = {
        "Kindergarten": "Jardín",
        "Primary": "Primaria",
        "Secondary": "Secundaria"
    }

    created = 0
    for campus in campuses:
        # Create a School Unit for each level at each campus
        for level in levels:
            unit_name = f"{level_names[level]} {campus.campus_name}"

            try:
                school_unit = frappe.get_doc({
                    "doctype": "School Unit",
                    "unit_name": unit_name,
                    "campus": campus.name,
                    "level": level,
                    "is_active": 1,
                    "shift_support": "Both Shifts"
                })
                school_unit.insert(ignore_permissions=True)
                created += 1
                print(f"Created School Unit: {unit_name}")
            except frappe.exceptions.DuplicateEntryError:
                print(f"School Unit {unit_name} already exists. Skipping.")
            except Exception as e:
                frappe.log_error(f"Error creating School Unit {unit_name}: {e}")

    frappe.db.commit()
    print(f"Created {created} School Unit records")


def update_grades_with_school_units():
    """
    Helper function to update existing Grades with School Units.
    Run manually if needed: bench execute kairos.patches.v1_1.create_school_units.update_grades_with_school_units
    """
    grades = frappe.get_all(
        "Grade",
        filters={"school_unit": ["is", "not set"]},
        fields=["name", "campus", "level"]
    )

    updated = 0
    for grade in grades:
        if grade.campus and grade.level:
            # Find the matching School Unit
            school_unit = frappe.db.get_value(
                "School Unit",
                {"campus": grade.campus, "level": grade.level},
                "name"
            )
            if school_unit:
                frappe.db.set_value("Grade", grade.name, "school_unit", school_unit)
                updated += 1
                print(f"Updated Grade {grade.name} with School Unit {school_unit}")

    frappe.db.commit()
    print(f"Updated {updated} Grade records with School Units")
