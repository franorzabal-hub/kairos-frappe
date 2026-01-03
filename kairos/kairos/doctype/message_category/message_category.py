# Copyright (c) 2025, Kairos and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class MessageCategory(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		category_name: DF.Data
		color: DF.Color | None
		description: DF.SmallText | None
		icon: DF.Data | None
		is_active: DF.Check
		requires_approval: DF.Check

	# end: auto-generated types
	pass
