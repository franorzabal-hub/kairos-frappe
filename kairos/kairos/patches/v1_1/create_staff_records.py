# Copyright (c) 2025, Kairos and contributors
# For license information, please see license.txt

"""
Patch: Create Staff Records

This patch:
1. Creates demo Staff records if none exist
2. Migrates existing Staff Campus Assignment records from User to Staff
"""

import frappe


def execute():
    """Create Staff records and migrate assignments."""

    # Check if Staff table exists (it should after migrate creates it)
    if not frappe.db.table_exists("Staff"):
        frappe.log_error("Staff table does not exist yet. Run migrate first.")
        return

    # Get first institution for demo data
    institution = frappe.db.get_value("Institution", {}, "name")
    if not institution:
        frappe.log_error("No Institution found. Cannot create Staff demo data.")
        return

    # Check if we already have Staff records
    existing_staff = frappe.db.count("Staff")
    if existing_staff > 0:
        frappe.log_error(f"Staff records already exist ({existing_staff}). Skipping demo data creation.")
        return

    # Create demo Staff records
    staff_data = [
        {
            "first_name": "Juan",
            "last_name": "Pérez",
            "email": "juan.perez@kairos.edu",
            "mobile": "+54 11 5555-0001",
            "position": "Director",
            "hire_date": "2020-01-15",
        },
        {
            "first_name": "María",
            "last_name": "González",
            "email": "maria.gonzalez@kairos.edu",
            "mobile": "+54 11 5555-0002",
            "position": "Coordinator",
            "hire_date": "2021-03-01",
        },
        {
            "first_name": "Carlos",
            "last_name": "Rodríguez",
            "email": "carlos.rodriguez@kairos.edu",
            "mobile": "+54 11 5555-0003",
            "position": "Teacher",
            "hire_date": "2022-02-15",
        },
        {
            "first_name": "Ana",
            "last_name": "Martínez",
            "email": "ana.martinez@kairos.edu",
            "mobile": "+54 11 5555-0004",
            "position": "Teacher",
            "hire_date": "2021-08-01",
        },
        {
            "first_name": "Roberto",
            "last_name": "Sánchez",
            "email": "roberto.sanchez@kairos.edu",
            "mobile": "+54 11 5555-0005",
            "position": "Admin",
            "hire_date": "2019-06-01",
        },
        {
            "first_name": "Laura",
            "last_name": "Fernández",
            "email": "laura.fernandez@kairos.edu",
            "mobile": "+54 11 5555-0006",
            "position": "Support",
            "hire_date": "2023-01-10",
        },
    ]

    created_staff = []
    for data in staff_data:
        try:
            staff = frappe.get_doc({
                "doctype": "Staff",
                "institution": institution,
                "is_active": 1,
                **data
            })
            staff.insert(ignore_permissions=True)
            created_staff.append(staff.name)
            frappe.db.commit()
        except Exception as e:
            frappe.log_error(f"Error creating Staff {data['first_name']} {data['last_name']}: {e}")

    if created_staff:
        print(f"Created {len(created_staff)} Staff records: {created_staff}")

    # Now try to migrate existing Staff Campus Assignments
    # Check if there are assignments with old 'user' field
    try:
        # Check if the old 'user' column exists
        if frappe.db.has_column("Staff Campus Assignment", "user"):
            old_assignments = frappe.db.sql("""
                SELECT name, user, campus, role_at_campus, start_date, end_date, is_active
                FROM `tabStaff Campus Assignment`
                WHERE user IS NOT NULL AND (staff IS NULL OR staff = '')
            """, as_dict=True)

            if old_assignments:
                print(f"Found {len(old_assignments)} assignments to migrate...")

                for assignment in old_assignments:
                    # Try to find or create a Staff record for this user
                    user_doc = frappe.get_doc("User", assignment.user)

                    # Check if we already have a Staff with this email
                    existing_staff = frappe.db.get_value("Staff", {"email": user_doc.email}, "name")

                    if not existing_staff:
                        # Create a new Staff record
                        name_parts = (user_doc.full_name or user_doc.email.split("@")[0]).split(" ", 1)
                        staff = frappe.get_doc({
                            "doctype": "Staff",
                            "first_name": name_parts[0],
                            "last_name": name_parts[1] if len(name_parts) > 1 else "",
                            "email": user_doc.email,
                            "institution": institution,
                            "position": assignment.role_at_campus or "Other",
                            "user": assignment.user,  # Link to the User
                            "is_active": 1,
                        })
                        staff.insert(ignore_permissions=True)
                        existing_staff = staff.name
                        frappe.db.commit()

                    # Update the assignment
                    frappe.db.set_value("Staff Campus Assignment", assignment.name, "staff", existing_staff)
                    frappe.db.commit()
                    print(f"Migrated assignment {assignment.name} to Staff {existing_staff}")
    except Exception as e:
        frappe.log_error(f"Error migrating Staff Campus Assignments: {e}")
        print(f"Warning: Could not migrate old assignments: {e}")

    frappe.db.commit()
    print("Staff patch completed successfully!")
