# Copyright (c) 2025, Kairos and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document


class StudentGuardian(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		can_pickup: DF.Check
		can_receive_communications: DF.Check
		guardian: DF.Link
		guardian_name: DF.Data | None
		is_primary: DF.Check
		notes: DF.SmallText | None
		relation: DF.Literal["Father", "Mother", "Guardian", "Grandparent", "Other"]
		student: DF.Link
		student_name: DF.Data | None
	# end: auto-generated types

	def validate(self):
		self.validate_duplicate()
		self.validate_primary_guardian()

	def validate_duplicate(self):
		"""Ensure the same student-guardian combination doesn't exist twice."""
		if self.is_new():
			existing = frappe.db.exists(
				"Student Guardian",
				{
					"student": self.student,
					"guardian": self.guardian,
				},
			)
		else:
			existing = frappe.db.exists(
				"Student Guardian",
				{
					"student": self.student,
					"guardian": self.guardian,
					"name": ("!=", self.name),
				},
			)

		if existing:
			frappe.throw(
				_("A relationship between Student {0} and Guardian {1} already exists.").format(
					frappe.bold(self.student), frappe.bold(self.guardian)
				)
			)

	def validate_primary_guardian(self):
		"""Ensure only one primary guardian per student."""
		if self.is_primary:
			# Check if another primary guardian exists for this student
			if self.is_new():
				existing_primary = frappe.db.exists(
					"Student Guardian",
					{
						"student": self.student,
						"is_primary": 1,
					},
				)
			else:
				existing_primary = frappe.db.exists(
					"Student Guardian",
					{
						"student": self.student,
						"is_primary": 1,
						"name": ("!=", self.name),
					},
				)

			if existing_primary:
				# Unset the previous primary guardian
				frappe.db.set_value("Student Guardian", existing_primary, "is_primary", 0)
				frappe.msgprint(
					_("Previous primary guardian {0} has been unmarked as primary.").format(
						frappe.bold(existing_primary)
					),
					alert=True,
				)
