# Copyright (c) 2025, Kairos and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime


class FieldTripStudent(Document):
    def validate(self):
        """Validate the Field Trip Student document before saving."""
        self.validate_unique_student_trip()
        self.set_authorization_date()

    def validate_unique_student_trip(self):
        """Ensure a student can only be enrolled once per field trip."""
        if self.student and self.field_trip:
            existing = frappe.db.exists(
                "Field Trip Student",
                {
                    "field_trip": self.field_trip,
                    "student": self.student,
                    "name": ["!=", self.name]
                }
            )
            if existing:
                frappe.throw(
                    _("Student {0} is already registered for this field trip").format(
                        self.student_name or self.student
                    )
                )

    def set_authorization_date(self):
        """Set authorization date when status changes to Authorized."""
        if self.authorization_status == "Authorized" and not self.authorization_date:
            self.authorization_date = now_datetime()

    def on_update(self):
        """Actions when the record is updated."""
        # Update field trip authorization counts (for dashboard stats)
        pass
