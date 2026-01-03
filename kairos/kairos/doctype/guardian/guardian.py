# Copyright (c) 2024, Kairos and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class Guardian(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		address: DF.SmallText | None
		alternate_phone: DF.Data | None
		can_pickup: DF.Check
		city: DF.Data | None
		company: DF.Data | None
		country: DF.Data | None
		date_of_birth: DF.Date | None
		email: DF.Data
		first_name: DF.Data
		full_name: DF.Data | None
		gender: DF.Literal["", "Male", "Female", "Other"]
		is_primary_contact: DF.Check
		last_name: DF.Data
		middle_name: DF.Data | None
		mobile: DF.Data
		naming_series: DF.Literal["GRD-.#####"]
		notes: DF.SmallText | None
		occupation: DF.Data | None
		photo: DF.AttachImage | None
		postal_code: DF.Data | None
		relation: DF.Literal["", "Father", "Mother", "Guardian", "Grandparent", "Other"]
		state: DF.Data | None
		user: DF.Link | None
		work_phone: DF.Data | None
	# end: auto-generated types

	def validate(self):
		"""Validate the Guardian document before saving."""
		self.set_full_name()
		self.validate_email()

	def set_full_name(self):
		"""Set full_name by concatenating first_name, middle_name, and last_name."""
		name_parts = [self.first_name]
		if self.middle_name:
			name_parts.append(self.middle_name)
		name_parts.append(self.last_name)
		self.full_name = " ".join(name_parts)

	def validate_email(self):
		"""Validate email format."""
		if self.email:
			frappe.utils.validate_email_address(self.email, throw=True)
