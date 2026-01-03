# Copyright (c) 2025, Kairos and contributors
# For license information, please see license.txt

from frappe.model.document import Document


class MessageAttachment(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		file: DF.Attach
		file_name: DF.Data | None
		file_size: DF.Int
		parent: DF.Data
		parentfield: DF.Data
		parenttype: DF.Data

	# end: auto-generated types
	pass
