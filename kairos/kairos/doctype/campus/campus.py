# Copyright (c) 2024, Kairos and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class Campus(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		academic_levels: DF.Literal["", "Primary", "Secondary", "Both"]
		address_line_1: DF.Data | None
		address_line_2: DF.Data | None
		campus_code: DF.Data
		campus_name: DF.Data
		city: DF.Data | None
		country: DF.Link | None
		director: DF.Link | None
		email: DF.Data | None
		institution: DF.Link
		is_active: DF.Check
		latitude: DF.Float | None
		longitude: DF.Float | None
		max_capacity: DF.Int | None
		naming_series: DF.Literal["CAMP-.#####"]
		phone: DF.Data | None
		postal_code: DF.Data | None
		state: DF.Data | None
		timezone: DF.Literal[
			"",
			"America/New_York",
			"America/Chicago",
			"America/Denver",
			"America/Los_Angeles",
			"America/Anchorage",
			"America/Honolulu",
			"America/Mexico_City",
			"America/Bogota",
			"America/Lima",
			"America/Santiago",
			"America/Buenos_Aires",
			"America/Sao_Paulo",
			"Europe/London",
			"Europe/Paris",
			"Europe/Berlin",
			"Europe/Madrid",
			"Europe/Rome",
			"Europe/Moscow",
			"Asia/Dubai",
			"Asia/Kolkata",
			"Asia/Singapore",
			"Asia/Hong_Kong",
			"Asia/Tokyo",
			"Asia/Seoul",
			"Asia/Shanghai",
			"Australia/Sydney",
			"Australia/Melbourne",
			"Pacific/Auckland",
			"UTC"
		]
	# end: auto-generated types

	def validate(self):
		"""Validate the Campus document before saving."""
		self.validate_email()
		self.validate_campus_code()
		self.validate_coordinates()

	def validate_email(self):
		"""Validate email format if provided."""
		if self.email:
			frappe.utils.validate_email_address(self.email, throw=True)

	def validate_campus_code(self):
		"""Ensure campus code is uppercase."""
		if self.campus_code:
			self.campus_code = self.campus_code.upper().strip()

	def validate_coordinates(self):
		"""Validate latitude and longitude ranges."""
		if self.latitude is not None:
			if self.latitude < -90 or self.latitude > 90:
				frappe.throw("Latitude must be between -90 and 90 degrees")

		if self.longitude is not None:
			if self.longitude < -180 or self.longitude > 180:
				frappe.throw("Longitude must be between -180 and 180 degrees")
