# Copyright (c) 2025, Kairos and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document


class SectionScheduleEntry(Document):
    def validate(self):
        """Validate the Section Schedule Entry document before saving."""
        self.validate_duplicate_entry()
        self.validate_staff_conflict()

    def validate_duplicate_entry(self):
        """Check for duplicate schedule entries (same section, day, time slot, year)."""
        existing = frappe.db.exists(
            "Section Schedule Entry",
            {
                "section": self.section,
                "academic_year": self.academic_year,
                "day_of_week": self.day_of_week,
                "time_slot": self.time_slot,
                "name": ["!=", self.name]
            }
        )
        if existing:
            frappe.throw(
                _("A schedule entry already exists for {0} on {1} at {2}").format(
                    self.section, self.day_of_week, self.time_slot
                )
            )

    def validate_staff_conflict(self):
        """Check if staff is already assigned to another section at the same time."""
        if self.staff:
            existing = frappe.db.exists(
                "Section Schedule Entry",
                {
                    "staff": self.staff,
                    "academic_year": self.academic_year,
                    "day_of_week": self.day_of_week,
                    "time_slot": self.time_slot,
                    "name": ["!=", self.name]
                }
            )
            if existing:
                existing_doc = frappe.get_doc("Section Schedule Entry", existing)
                frappe.throw(
                    _("Staff {0} is already scheduled for {1} on {2} at {3}").format(
                        self.staff_name or self.staff,
                        existing_doc.section,
                        self.day_of_week,
                        self.time_slot
                    )
                )
