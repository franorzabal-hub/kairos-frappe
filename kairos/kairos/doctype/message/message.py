# Copyright (c) 2025, Kairos and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime, strip_html


class Message(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		allow_replies: DF.Check
		campus: DF.Link | None
		category: DF.Link | None
		content: DF.TextEditor | None
		content_plain: DF.LongText | None
		delivered_count: DF.Int
		expires_on: DF.Date | None
		failed_count: DF.Int
		grade: DF.Link | None
		institution: DF.Link | None
		message_type: DF.Literal["Announcement", "Notice", "Alert", "General"]
		naming_series: DF.Literal["MSG-.YYYY.-.#####"]
		priority: DF.Literal["Normal", "High", "Urgent"]
		read_count: DF.Int
		requires_acknowledgment: DF.Check
		scheduled_time: DF.Datetime | None
		scope_type: DF.Literal["Institution", "Campus", "Grade", "Section", "Group", "Individual"]
		section: DF.Link | None
		send_datetime: DF.Datetime | None
		send_email: DF.Check
		send_in_app: DF.Check
		send_push: DF.Check
		send_sms: DF.Check
		sender: DF.Link
		sender_name: DF.Data | None
		status: DF.Literal["Draft", "Scheduled", "Sent", "Cancelled"]
		student_group: DF.Link | None
		subject: DF.Data
		total_recipients: DF.Int
	# end: auto-generated types

	def validate(self):
		"""Validate the Message document before saving."""
		self.validate_scope_fields()
		self.validate_scheduled_time()
		self.generate_plain_text_content()

	def validate_scope_fields(self):
		"""Validate that required scope fields are set based on scope_type."""
		scope_requirements = {
			"Institution": ["institution"],
			"Campus": ["institution", "campus"],
			"Grade": ["institution", "campus", "grade"],
			"Section": ["institution", "campus", "grade", "section"],
			"Group": ["student_group"],
			"Individual": []
		}

		required_fields = scope_requirements.get(self.scope_type, [])
		for field in required_fields:
			if not self.get(field):
				frappe.throw(
					_("{0} is required when Scope Type is {1}").format(
						frappe.unscrub(field), self.scope_type
					)
				)

	def validate_scheduled_time(self):
		"""Validate scheduled time is in the future if status is Scheduled."""
		if self.status == "Scheduled":
			if not self.scheduled_time:
				frappe.throw(_("Scheduled Time is required when status is Scheduled"))
			if self.scheduled_time <= now_datetime():
				frappe.throw(_("Scheduled Time must be in the future"))

	def generate_plain_text_content(self):
		"""Generate plain text version of content if not provided."""
		if self.content and not self.content_plain:
			self.content_plain = strip_html(self.content)

	def before_submit(self):
		"""Actions before submitting the message."""
		if self.status == "Draft":
			self.status = "Sent"
			self.send_datetime = now_datetime()

	def on_update(self):
		"""Actions after updating the message."""
		pass

	def send_message(self):
		"""Send the message through configured delivery channels."""
		if self.status != "Sent":
			frappe.throw(_("Only sent messages can be delivered"))

		# Placeholder for delivery logic
		# This would be implemented based on the delivery options selected
		if self.send_email:
			self.send_via_email()
		if self.send_sms:
			self.send_via_sms()
		if self.send_push:
			self.send_via_push()
		if self.send_in_app:
			self.send_via_in_app()

	def send_via_email(self):
		"""Send message via email."""
		# TODO: Implement email delivery
		pass

	def send_via_sms(self):
		"""Send message via SMS."""
		# TODO: Implement SMS delivery
		pass

	def send_via_push(self):
		"""Send message via push notification."""
		# TODO: Implement push notification delivery
		pass

	def send_via_in_app(self):
		"""Send message via in-app notification."""
		# TODO: Implement in-app notification delivery
		pass

	def update_tracking_counts(self, delivered=0, read=0, failed=0):
		"""Update delivery tracking counts."""
		if delivered:
			self.delivered_count = (self.delivered_count or 0) + delivered
		if read:
			self.read_count = (self.read_count or 0) + read
		if failed:
			self.failed_count = (self.failed_count or 0) + failed
		self.save(ignore_permissions=True)
