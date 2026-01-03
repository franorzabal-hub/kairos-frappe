# Copyright (c) 2025, Kairos and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime


class EventRSVP(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		check_in_time: DF.Datetime | None
		checked_in: DF.Check
		checked_in_guests: DF.Int
		dietary_restrictions: DF.Data | None
		event: DF.Link
		guardian: DF.Link
		guest_names: DF.SmallText | None
		naming_series: DF.Literal["RSVP-.#####"]
		notes: DF.SmallText | None
		number_of_guests: DF.Int
		promoted_at: DF.Datetime | None
		promoted_from_waitlist: DF.Check
		response: DF.Literal["Yes", "No", "Maybe"]
		response_datetime: DF.Datetime | None
		status: DF.Literal["Confirmed", "Waitlisted", "Cancelled"]
		student: DF.Link | None
		user: DF.Link | None
		waitlist_position: DF.Int
	# end: auto-generated types

	def validate(self):
		"""Validate the Event RSVP document before saving."""
		self.validate_unique_rsvp()
		self.validate_guest_count()
		self.validate_waitlist_position()

	def validate_unique_rsvp(self):
		"""Ensure only one RSVP per guardian per event."""
		if self.is_new():
			existing = frappe.db.exists(
				"Event RSVP",
				{
					"event": self.event,
					"guardian": self.guardian,
					"name": ("!=", self.name or "")
				}
			)
			if existing:
				frappe.throw(
					_("An RSVP already exists for this guardian and event")
				)

	def validate_guest_count(self):
		"""Validate that checked-in guests do not exceed total guests."""
		if self.checked_in_guests > self.number_of_guests:
			frappe.throw(
				_("Checked-in guests ({0}) cannot exceed total guests ({1})").format(
					self.checked_in_guests, self.number_of_guests
				)
			)

	def validate_waitlist_position(self):
		"""Clear waitlist position if status is not Waitlisted."""
		if self.status != "Waitlisted":
			self.waitlist_position = 0

	def before_save(self):
		"""Actions before saving the RSVP."""
		if not self.response_datetime:
			self.response_datetime = now_datetime()

	def on_update(self):
		"""Actions after updating the RSVP."""
		self.update_event_rsvp_count()

	def on_trash(self):
		"""Actions when RSVP is deleted."""
		self.update_event_rsvp_count()

	def update_event_rsvp_count(self):
		"""Update the RSVP count on the related Event."""
		# Placeholder for updating event statistics
		# This would be implemented when Event DocType has RSVP count fields
		pass

	def check_in(self, guests_count=0):
		"""Mark the RSVP as checked in."""
		if self.status == "Cancelled":
			frappe.throw(_("Cannot check in a cancelled RSVP"))

		self.checked_in = 1
		self.check_in_time = now_datetime()
		self.checked_in_guests = min(guests_count, self.number_of_guests)
		self.save(ignore_permissions=True)

	def promote_from_waitlist(self):
		"""Promote this RSVP from waitlist to confirmed."""
		if self.status != "Waitlisted":
			frappe.throw(_("Only waitlisted RSVPs can be promoted"))

		self.status = "Confirmed"
		self.promoted_from_waitlist = 1
		self.promoted_at = now_datetime()
		self.waitlist_position = 0
		self.save(ignore_permissions=True)

	def cancel_rsvp(self):
		"""Cancel this RSVP."""
		if self.status == "Cancelled":
			frappe.throw(_("RSVP is already cancelled"))

		self.status = "Cancelled"
		self.save(ignore_permissions=True)
