# Copyright (c) 2025, Kairos and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class StudentCampusAssignment(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		academic_year: DF.Link
		campus: DF.Link
		end_date: DF.Date | None
		enrollment_date: DF.Date
		grade: DF.Link
		is_current: DF.Check
		naming_series: DF.Literal["SCA-.#####"]
		notes: DF.SmallText | None
		section: DF.Link
		status: DF.Literal["Active", "Transferred", "Graduated", "Withdrawn"]
		student: DF.Link
		student_name: DF.Data | None
	# end: auto-generated types

	pass
