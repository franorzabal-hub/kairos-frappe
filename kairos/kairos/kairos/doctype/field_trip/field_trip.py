# Copyright (c) 2025, Kairos and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document


class FieldTrip(Document):
    def validate(self):
        """Validate the Field Trip document before saving."""
        self.validate_dates()
        self.set_end_date_if_day_trip()
        self.validate_sections()

    def validate_dates(self):
        """Ensure end_date is not before start_date."""
        if self.start_date and self.end_date:
            if self.end_date < self.start_date:
                frappe.throw(
                    _("End Date cannot be before Start Date")
                )

    def set_end_date_if_day_trip(self):
        """For short trips and day trips, end_date equals start_date."""
        if self.trip_type in ["Short Trip", "Day Trip"]:
            if self.start_date and not self.end_date:
                self.end_date = self.start_date

    def validate_sections(self):
        """Ensure at least one section is selected."""
        if not self.sections or len(self.sections) == 0:
            frappe.throw(
                _("At least one section must be selected for the field trip")
            )

    def before_submit(self):
        """Actions before submitting the field trip."""
        if self.requires_approval and self.status != "Approved":
            frappe.throw(
                _("Field Trip must be approved before it can be submitted")
            )

    def on_update(self):
        """Actions when the field trip is updated."""
        # Generate Field Trip Student records when trip is approved
        if self.status == "Approved" and self.has_value_changed("status"):
            self.generate_student_records()

    def generate_student_records(self):
        """Create Field Trip Student records for all students in the selected sections."""
        from frappe.utils import now_datetime

        # Check if Field Trip Student DocType exists
        if not frappe.db.exists("DocType", "Field Trip Student"):
            return

        for section_row in self.sections:
            # Get all enrolled students in this section
            students = frappe.get_all(
                "Student Enrollment",
                filters={
                    "section": section_row.section,
                    "academic_year": self.academic_year,
                    "status": "Active"
                },
                fields=["student"]
            )

            for student in students:
                # Check if record already exists
                existing = frappe.db.exists(
                    "Field Trip Student",
                    {
                        "field_trip": self.name,
                        "student": student.student
                    }
                )

                if not existing:
                    doc = frappe.get_doc({
                        "doctype": "Field Trip Student",
                        "field_trip": self.name,
                        "student": student.student,
                        "section": section_row.section,
                        "authorization_status": "Pending",
                        "payment_status": "Pending" if self.cost_per_student > 0 else "Not Required"
                    })
                    doc.insert(ignore_permissions=True)

    def on_trash(self):
        """Prevent deletion if there are associated Field Trip Student records."""
        if frappe.db.exists("DocType", "Field Trip Student"):
            students = frappe.get_all(
                "Field Trip Student",
                filters={"field_trip": self.name},
                limit=1
            )
            if students:
                frappe.throw(
                    _("Cannot delete Field Trip {0} as it has associated student records. "
                      "Please delete the student records first.").format(self.name)
                )
