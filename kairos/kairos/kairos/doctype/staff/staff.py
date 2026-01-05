# Copyright (c) 2025, Kairos and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class Staff(Document):
	def before_save(self):
		self.set_full_name()

	def set_full_name(self):
		"""Calculate full_name from first_name, middle_name, and last_name"""
		parts = [self.first_name]
		if self.middle_name:
			parts.append(self.middle_name)
		if self.last_name:
			parts.append(self.last_name)
		self.full_name = " ".join(parts)
