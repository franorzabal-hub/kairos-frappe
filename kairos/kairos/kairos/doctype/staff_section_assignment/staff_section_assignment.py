# Copyright (c) 2025, Kairos and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document


class StaffSectionAssignment(Document):
    def validate(self):
        """Validate the Staff Section Assignment document before saving."""
        self.validate_subject_for_type()
        self.validate_duplicate_assignment()

    def validate_subject_for_type(self):
        """Ensure subject is provided when assignment_type is 'Subject Teacher'."""
        if self.assignment_type == "Subject Teacher" and not self.subject:
            frappe.throw(_("Subject is required when Assignment Type is 'Subject Teacher'"))

    def validate_duplicate_assignment(self):
        """Check for duplicate assignments of the same staff to the same section."""
        if self.is_new():
            filters = {
                "staff": self.staff,
                "section": self.section,
                "academic_year": self.academic_year,
                "assignment_type": self.assignment_type,
                "is_active": 1
            }
            if self.assignment_type == "Subject Teacher":
                filters["subject"] = self.subject

            existing = frappe.db.exists("Staff Section Assignment", filters)
            if existing:
                frappe.throw(
                    _("An active assignment already exists for this staff, section, academic year, and assignment type combination.")
                )
