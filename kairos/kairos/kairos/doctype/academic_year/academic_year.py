# Copyright (c) 2025, Kairos and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class AcademicYear(Document):
    def validate(self):
        self.validate_dates()
        self.validate_single_current()

    def validate_dates(self):
        """Ensure end_date is after start_date."""
        if self.start_date and self.end_date:
            if self.end_date <= self.start_date:
                frappe.throw("End Date must be after Start Date")

    def validate_single_current(self):
        """Ensure only one Academic Year is marked as current."""
        if self.is_current:
            # Check if another year is already current
            existing_current = frappe.db.get_value(
                "Academic Year",
                {"is_current": 1, "name": ["!=", self.name]},
                "name"
            )
            if existing_current:
                frappe.throw(
                    f"Academic Year '{existing_current}' is already marked as current. "
                    "Please unmark it first before setting this year as current."
                )

    def on_update(self):
        """Clear cache when academic year is updated."""
        frappe.cache().delete_key("current_academic_year")

    @staticmethod
    def get_current():
        """Get the current academic year."""
        cached = frappe.cache().get_value("current_academic_year")
        if cached:
            return cached

        current = frappe.db.get_value(
            "Academic Year",
            {"is_current": 1},
            ["name", "year_name", "start_date", "end_date"],
            as_dict=True
        )

        if current:
            frappe.cache().set_value("current_academic_year", current)

        return current
