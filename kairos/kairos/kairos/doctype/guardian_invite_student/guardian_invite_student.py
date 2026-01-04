# Copyright (c) 2025, Kairos and contributors
# For license information, please see license.txt

from frappe.model.document import Document


class GuardianInviteStudent(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		student: DF.Link
		student_name: DF.Data | None
		parent: DF.Data
		parentfield: DF.Data
		parenttype: DF.Data

	# end: auto-generated types
	pass
