# Copyright (c) 2024, Kairos and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class Student(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		address: DF.SmallText | None
		allergies: DF.SmallText | None
		blood_group: DF.Literal["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
		campus: DF.Link | None
		current_grade: DF.Link | None
		current_section: DF.Link | None
		date_of_birth: DF.Date | None
		emergency_contact_name: DF.Data | None
		emergency_contact_phone: DF.Data | None
		emergency_contact_relation: DF.Data | None
		enrollment_date: DF.Date | None
		first_name: DF.Data
		full_name: DF.Data | None
		gender: DF.Literal["", "Male", "Female", "Other"]
		institution: DF.Link | None
		last_name: DF.Data
		medical_conditions: DF.SmallText | None
		middle_name: DF.Data | None
		naming_series: DF.Literal["STU-.YYYY.-.#####"]
		nationality: DF.Data | None
		photo: DF.AttachImage | None
		special_needs: DF.SmallText | None
		status: DF.Literal["Active", "Inactive", "Graduated", "Transferred"]
		student_email: DF.Data | None
		student_mobile: DF.Data | None
	# end: auto-generated types

	def validate(self):
		"""Validate the Student document before saving."""
		self.set_full_name()
		self.validate_email()

	def set_full_name(self):
		"""Set full_name by combining first_name, middle_name, and last_name."""
		name_parts = [self.first_name]
		if self.middle_name:
			name_parts.append(self.middle_name)
		name_parts.append(self.last_name)
		self.full_name = " ".join(name_parts)

	def validate_email(self):
		"""Validate email format if provided."""
		if self.student_email:
			frappe.utils.validate_email_address(self.student_email, throw=True)
