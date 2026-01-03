# Copyright (c) 2024, Kairos and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document


class StaffCampusAssignment(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		campus: DF.Link
		end_date: DF.Date | None
		instructor: DF.Link | None
		is_active: DF.Check
		is_primary: DF.Check
		naming_series: DF.Literal["STCA-.#####"]
		role_at_campus: DF.Literal["", "Director", "Coordinator", "Teacher", "Admin", "Support"]
		start_date: DF.Date
		user: DF.Link
	# end: auto-generated types

	def validate(self):
		"""Validate the Staff Campus Assignment document before saving."""
		self.validate_dates()
		self.validate_primary_assignment()
		self.validate_instructor_role()

	def validate_dates(self):
		"""Ensure end_date is after start_date if provided."""
		if self.end_date and self.start_date:
			if self.end_date < self.start_date:
				frappe.throw(_("End Date cannot be before Start Date"))

	def validate_primary_assignment(self):
		"""Ensure only one primary campus assignment per user."""
		if self.is_primary and self.is_active:
			existing_primary = frappe.db.exists(
				"Staff Campus Assignment",
				{
					"user": self.user,
					"is_primary": 1,
					"is_active": 1,
					"name": ("!=", self.name or ""),
				},
			)
			if existing_primary:
				frappe.throw(
					_("User {0} already has a primary campus assignment. Please unmark the existing primary assignment first.").format(
						self.user
					)
				)

	def validate_instructor_role(self):
		"""Warn if instructor is linked but role is not Teacher."""
		if self.instructor and self.role_at_campus and self.role_at_campus != "Teacher":
			frappe.msgprint(
				_("Note: An Instructor is linked but the role is set to {0}, not Teacher.").format(
					self.role_at_campus
				),
				indicator="orange",
				alert=True,
			)
