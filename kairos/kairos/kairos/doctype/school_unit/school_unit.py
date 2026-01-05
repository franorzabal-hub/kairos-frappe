# Copyright (c) 2025, Kairos and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document


class SchoolUnit(Document):
    def validate(self):
        """Validate the School Unit document before saving."""
        self.validate_unique_campus_level()
        self.set_unit_name_if_empty()

    def validate_unique_campus_level(self):
        """Ensure only one School Unit exists per Campus + Level combination."""
        if self.campus and self.level:
            existing = frappe.db.exists(
                "School Unit",
                {
                    "campus": self.campus,
                    "level": self.level,
                    "name": ["!=", self.name]
                }
            )
            if existing:
                frappe.throw(
                    _("A School Unit for {0} - {1} already exists: {2}").format(
                        self.campus, self.level, existing
                    )
                )

    def set_unit_name_if_empty(self):
        """Auto-generate unit_name if not provided."""
        if not self.unit_name and self.campus and self.level:
            level_map = {
                "Kindergarten": "Jardín",
                "Primary": "Primaria",
                "Secondary": "Secundaria"
            }
            level_name = level_map.get(self.level, self.level)
            self.unit_name = f"{level_name} {self.campus}"

    def on_trash(self):
        """Prevent deletion if there are associated Grades."""
        grades = frappe.get_all(
            "Grade",
            filters={"school_unit": self.name},
            limit=1
        )
        if grades:
            frappe.throw(
                _("Cannot delete School Unit {0} as it has associated Grades. "
                  "Please delete or reassign the Grades first.").format(self.name)
            )
