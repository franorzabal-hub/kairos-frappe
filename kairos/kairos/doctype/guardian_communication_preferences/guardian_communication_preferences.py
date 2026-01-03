# Copyright (c) 2024, Kairos and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class GuardianCommunicationPreferences(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		email_verified: DF.Check
		guardian: DF.Link | None
		last_app_login: DF.Datetime | None
		mobile_verified: DF.Check
		preferred_channel: DF.Literal["Email", "SMS", "Push", "All"]
		preferred_language: DF.Link | None
		push_token: DF.Data | None
		quiet_hours_end: DF.Time | None
		quiet_hours_start: DF.Time | None
		receives_announcements: DF.Check
		receives_attendance_alerts: DF.Check
		receives_fee_reminders: DF.Check
		receives_grade_alerts: DF.Check
		receives_messages: DF.Check
	# end: auto-generated types

	def validate(self):
		self.validate_quiet_hours()

	def validate_quiet_hours(self):
		"""Validate that quiet hours end is after quiet hours start if both are set."""
		if self.quiet_hours_start and self.quiet_hours_end:
			if self.quiet_hours_start >= self.quiet_hours_end:
				frappe.throw(
					frappe._("Quiet Hours End must be after Quiet Hours Start")
				)
