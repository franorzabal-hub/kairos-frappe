# Copyright (c) 2024, Kairos and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document


class Grade(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		age_range_max: DF.Int
		age_range_min: DF.Int
		campus: DF.Link
		coordinator: DF.Link | None
		description: DF.SmallText | None
		grade_code: DF.Data
		grade_name: DF.Data
		is_active: DF.Check
		naming_series: DF.Literal["GRD-.#####"]
		program: DF.Link | None
		sequence: DF.Int
	# end: auto-generated types

	def validate(self):
		"""Validate the Grade document before saving."""
		self.validate_age_range()
		self.validate_unique_grade_code_per_campus()

	def validate_age_range(self):
		"""Validate that minimum age is less than or equal to maximum age."""
		if self.age_range_min and self.age_range_max:
			if self.age_range_min > self.age_range_max:
				frappe.throw(
					_("Minimum Age ({0}) cannot be greater than Maximum Age ({1})").format(
						self.age_range_min, self.age_range_max
					)
				)

	def validate_unique_grade_code_per_campus(self):
		"""Validate that grade code is unique within the same campus."""
		if self.campus and self.grade_code:
			existing = frappe.db.exists(
				"Grade",
				{
					"campus": self.campus,
					"grade_code": self.grade_code,
					"name": ("!=", self.name or ""),
				},
			)
			if existing:
				frappe.throw(
					_("Grade Code '{0}' already exists for Campus '{1}'").format(
						self.grade_code, self.campus
					)
				)
