# Copyright (c) 2025, Kairos and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime


class MessageRecipient(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		acknowledged: DF.Check
		acknowledged_at: DF.Datetime | None
		acknowledgment_note: DF.Data | None
		email_delivered_at: DF.Datetime | None
		email_error: DF.Data | None
		email_sent_at: DF.Datetime | None
		email_status: DF.Literal["Pending", "Sent", "Delivered", "Failed", "Bounced"]
		guardian: DF.Link
		is_read: DF.Check
		message: DF.Link
		naming_series: DF.Literal["MRCP-.#####"]
		push_sent_at: DF.Datetime | None
		push_status: DF.Literal["Pending", "Sent", "Delivered", "Failed"]
		read_at: DF.Datetime | None
		read_count: DF.Int
		sms_error: DF.Data | None
		sms_sent_at: DF.Datetime | None
		sms_status: DF.Literal["Pending", "Sent", "Delivered", "Failed"]
		student: DF.Link | None
		user: DF.Link | None

	# end: auto-generated types

	def validate(self):
		self.validate_guardian_student_relationship()

	def validate_guardian_student_relationship(self):
		"""Validate that the guardian is actually related to the student if both are specified."""
		if self.guardian and self.student:
			# Check if guardian is linked to this student
			student_guardians = frappe.get_all(
				"Student Guardian",
				filters={"parent": self.student, "guardian": self.guardian},
				limit=1
			)
			if not student_guardians:
				frappe.msgprint(
					frappe._("Guardian {0} may not be linked to Student {1}").format(
						self.guardian, self.student
					),
					indicator="orange",
					alert=True
				)

	def mark_as_read(self):
		"""Mark the message as read for this recipient."""
		self.is_read = 1
		self.read_at = now_datetime()
		self.read_count = (self.read_count or 0) + 1
		self.save(ignore_permissions=True)

	def mark_as_acknowledged(self, note=None):
		"""Mark the message as acknowledged by this recipient."""
		self.acknowledged = 1
		self.acknowledged_at = now_datetime()
		if note:
			self.acknowledgment_note = note
		self.save(ignore_permissions=True)

	def update_email_status(self, status, error=None):
		"""Update email delivery status."""
		self.email_status = status
		if status == "Sent":
			self.email_sent_at = now_datetime()
		elif status == "Delivered":
			self.email_delivered_at = now_datetime()
		elif status in ("Failed", "Bounced") and error:
			self.email_error = error
		self.save(ignore_permissions=True)

	def update_sms_status(self, status, error=None):
		"""Update SMS delivery status."""
		self.sms_status = status
		if status == "Sent":
			self.sms_sent_at = now_datetime()
		elif status in ("Failed",) and error:
			self.sms_error = error
		self.save(ignore_permissions=True)

	def update_push_status(self, status):
		"""Update push notification delivery status."""
		self.push_status = status
		if status == "Sent":
			self.push_sent_at = now_datetime()
		self.save(ignore_permissions=True)
