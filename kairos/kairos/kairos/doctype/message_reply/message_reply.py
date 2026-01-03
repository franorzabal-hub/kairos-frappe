# Copyright (c) 2025, Kairos and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class MessageReply(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		content: DF.Text
		guardian: DF.Link
		message: DF.Link
		naming_series: DF.Literal["MRPL-.#####"]
		read_at: DF.Datetime | None
		read_by_sender: DF.Check
		reply_datetime: DF.Datetime | None
		student: DF.Link | None

	# end: auto-generated types
	pass
