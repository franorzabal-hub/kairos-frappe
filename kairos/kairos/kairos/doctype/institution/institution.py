# Copyright (c) 2024, Kairos and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class Institution(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		accreditation_info: DF.Text | None
		address: DF.SmallText | None
		country: DF.Link | None
		founded_date: DF.Date | None
		institution_name: DF.Data
		institution_type: DF.Literal["", "Private", "Public", "Charter", "Religious"]
		is_active: DF.Check
		legal_name: DF.Data | None
		logo: DF.AttachImage | None
		naming_series: DF.Literal["INST-.#####"]
		primary_contact_email: DF.Data | None
		primary_contact_phone: DF.Data | None
		short_name: DF.Data | None
		tax_id: DF.Data | None
		website: DF.Data | None
	# end: auto-generated types

	def validate(self):
		"""Validate the Institution document before saving."""
		self.validate_email()
		self.validate_website()

	def validate_email(self):
		"""Validate email format if provided."""
		if self.primary_contact_email:
			frappe.utils.validate_email_address(self.primary_contact_email, throw=True)

	def validate_website(self):
		"""Validate and format website URL if provided."""
		if self.website:
			if not self.website.startswith(("http://", "https://")):
				self.website = "https://" + self.website
