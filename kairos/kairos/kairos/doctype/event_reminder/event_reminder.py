# Copyright (c) 2025, Kairos and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class EventReminder(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		event: DF.Link
		naming_series: DF.Literal["EREM-.#####"]
		recipients_count: DF.Int
		reminder_datetime: DF.Datetime
		reminder_type: DF.Literal["Email", "SMS", "Push", "All"]
		sent_at: DF.Datetime | None
		status: DF.Literal["Pending", "Sent", "Failed"]
	# end: auto-generated types

	pass
