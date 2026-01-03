# Copyright (c) 2026, Kairos and contributors
# For license information, please see license.txt

from frappe.model.document import Document


class NewsCategory(Document):
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
		parent_category: DF.Link | None
		sequence: DF.Int
	# end: auto-generated types
	pass
