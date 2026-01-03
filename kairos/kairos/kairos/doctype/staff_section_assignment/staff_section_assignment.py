# Copyright (c) 2024, Kairos and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document


class StaffSectionAssignment(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		academic_year: DF.Link
		instructor: DF.Link
		is_active: DF.Check
		naming_series: DF.Literal["SSA-.#####"]
		role: DF.Literal["", "Homeroom", "Subject", "Assistant"]
		section: DF.Link
		subject: DF.Link | None
	# end: auto-generated types

	def validate(self):
		"""Validate the Staff Section Assignment document before saving."""
		self.validate_subject_for_role()
		self.validate_duplicate_assignment()

	def validate_subject_for_role(self):
		"""Ensure subject is provided when role is 'Subject'."""
		if self.role == "Subject" and not self.subject:
			frappe.throw(_("Subject is required when Role is 'Subject'"))

	def validate_duplicate_assignment(self):
		"""Check for duplicate assignments of the same instructor to the same section."""
		if self.is_new():
			filters = {
				"instructor": self.instructor,
				"section": self.section,
				"academic_year": self.academic_year,
				"role": self.role,
				"is_active": 1
			}
			if self.role == "Subject":
				filters["subject"] = self.subject

			existing = frappe.db.exists("Staff Section Assignment", filters)
			if existing:
				frappe.throw(
					_("An active assignment already exists for this instructor, section, academic year, and role combination.")
				)
