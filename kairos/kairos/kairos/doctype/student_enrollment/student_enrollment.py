# Copyright (c) 2025, Kairos and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document


class StudentEnrollment(Document):
    def validate(self):
        """Validate the Student Enrollment document before saving."""
        self.validate_duplicate_enrollment()
        self.validate_withdrawal_fields()

    def validate_duplicate_enrollment(self):
        """Check for duplicate active enrollments for the same student in the same year."""
        if self.status == "Active":
            existing = frappe.db.exists(
                "Student Enrollment",
                {
                    "student": self.student,
                    "academic_year": self.academic_year,
                    "status": "Active",
                    "name": ["!=", self.name]
                }
            )
            if existing:
                frappe.throw(
                    _("Student already has an active enrollment for academic year {0}").format(
                        self.academic_year
                    )
                )

    def validate_withdrawal_fields(self):
        """Ensure withdrawal fields are filled when status is Withdrawn."""
        if self.status == "Withdrawn" and not self.withdrawal_date:
            frappe.throw(_("Withdrawal Date is required when status is 'Withdrawn'"))
