# Copyright (c) 2025, Kairos and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class MessageTemplate(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		category: DF.Link | None
		content: DF.TextEditor | None
		is_active: DF.Check
		message_type: DF.Literal["Announcement", "Notice", "Alert", "General"]
		subject: DF.Data
		template_name: DF.Data

	# end: auto-generated types
	pass
