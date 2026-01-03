# Copyright (c) 2024, Kairos and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class Section(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		academic_year: DF.Link | None
		assistant_teacher: DF.Link | None
		classroom: DF.Data | None
		grade: DF.Link
		homeroom_teacher: DF.Link | None
		is_active: DF.Check
		max_students: DF.Int
		naming_series: DF.Literal["SEC-.#####"]
		schedule_type: DF.Literal["", "Morning", "Afternoon", "Full Day"]
		section_code: DF.Data | None
		section_name: DF.Data
		student_group: DF.Link | None
	# end: auto-generated types

	def validate(self):
		"""Validate the Section document before saving."""
		self.validate_max_students()
		self.validate_teachers()

	def validate_max_students(self):
		"""Ensure max_students is a positive number if provided."""
		if self.max_students and self.max_students < 0:
			frappe.throw("Max Students cannot be negative")

	def validate_teachers(self):
		"""Ensure homeroom and assistant teachers are different if both are set."""
		if self.homeroom_teacher and self.assistant_teacher:
			if self.homeroom_teacher == self.assistant_teacher:
				frappe.throw("Homeroom Teacher and Assistant Teacher cannot be the same person")
