# Copyright (c) 2025, Kairos and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class SavedView(Document):
	def validate(self):
		# Ensure only one default view per doctype per user
		if self.is_default:
			frappe.db.set_value(
				"Saved View",
				{
					"for_doctype": self.for_doctype,
					"owner": self.owner,
					"is_default": 1,
					"name": ("!=", self.name)
				},
				"is_default",
				0
			)

	def before_save(self):
		# Clear favorite_folder if not a favorite
		if not self.is_favorite:
			self.favorite_folder = None
