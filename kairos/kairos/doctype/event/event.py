# Copyright (c) 2024, Kairos and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import nowdatetime, get_datetime, slugify


class Event(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		all_day: DF.Check
		campus: DF.Link | None
		category: DF.Link | None
		description: DF.TextEditor | None
		end_datetime: DF.Datetime
		event_name: DF.Data
		featured_image: DF.AttachImage | None
		grade: DF.Link | None
		guests_allowed: DF.Check
		institution: DF.Link | None
		is_featured: DF.Check
		latitude: DF.Float | None
		location_type: DF.Literal["In-Person", "Virtual", "Hybrid"]
		longitude: DF.Float | None
		max_attendees: DF.Int
		max_guests_per_rsvp: DF.Int
		naming_series: DF.Literal["EVT-.YYYY.-.#####"]
		notify_on_publish: DF.Check
		organizer: DF.Link
		organizer_email: DF.Data | None
		organizer_name: DF.Data | None
		organizer_phone: DF.Data | None
		publish_date: DF.Datetime | None
		reminder_days_before: DF.Int
		room: DF.Data | None
		rsvp_deadline: DF.Datetime | None
		rsvp_enabled: DF.Check
		rsvp_maybe_count: DF.Int
		rsvp_no_count: DF.Int
		rsvp_options: DF.Literal["Yes-No", "Yes-No-Maybe"]
		rsvp_yes_count: DF.Int
		scope_type: DF.Literal["Institution", "Campus", "Grade", "Section"]
		section: DF.Link | None
		send_reminder: DF.Check
		slug: DF.Data | None
		start_datetime: DF.Datetime
		status: DF.Literal["Draft", "Published", "Cancelled", "Completed"]
		summary: DF.SmallText | None
		timezone: DF.Data | None
		venue_address: DF.SmallText | None
		venue_name: DF.Data | None
		views_count: DF.Int
		virtual_link: DF.Data | None
		virtual_password: DF.Data | None
		waitlist_enabled: DF.Check
	# end: auto-generated types

	def validate(self):
		"""Validate the Event document before saving."""
		self.validate_dates()
		self.validate_coordinates()
		self.validate_scope()
		self.validate_rsvp_settings()
		self.generate_slug()
		self.set_publish_date()

	def validate_dates(self):
		"""Validate that end datetime is after start datetime."""
		if self.start_datetime and self.end_datetime:
			if get_datetime(self.end_datetime) < get_datetime(self.start_datetime):
				frappe.throw(_("End Date/Time cannot be before Start Date/Time"))

		if self.rsvp_enabled and self.rsvp_deadline:
			if get_datetime(self.rsvp_deadline) > get_datetime(self.start_datetime):
				frappe.throw(_("RSVP Deadline must be before the event starts"))

	def validate_coordinates(self):
		"""Validate latitude and longitude ranges."""
		if self.latitude is not None and self.latitude != 0:
			if self.latitude < -90 or self.latitude > 90:
				frappe.throw(_("Latitude must be between -90 and 90 degrees"))

		if self.longitude is not None and self.longitude != 0:
			if self.longitude < -180 or self.longitude > 180:
				frappe.throw(_("Longitude must be between -180 and 180 degrees"))

	def validate_scope(self):
		"""Validate scope fields based on scope_type."""
		if self.scope_type == "Institution" and not self.institution:
			frappe.throw(_("Institution is required when Scope Type is Institution"))
		elif self.scope_type == "Campus" and not self.campus:
			frappe.throw(_("Campus is required when Scope Type is Campus"))
		elif self.scope_type == "Grade" and not self.grade:
			frappe.throw(_("Grade is required when Scope Type is Grade"))
		elif self.scope_type == "Section" and not self.section:
			frappe.throw(_("Section is required when Scope Type is Section"))

	def validate_rsvp_settings(self):
		"""Validate RSVP settings."""
		if self.rsvp_enabled:
			if self.max_attendees and self.max_attendees < 0:
				frappe.throw(_("Max Attendees cannot be negative"))
			if self.max_guests_per_rsvp and self.max_guests_per_rsvp < 0:
				frappe.throw(_("Max Guests per RSVP cannot be negative"))
			if self.reminder_days_before and self.reminder_days_before < 0:
				frappe.throw(_("Reminder Days Before cannot be negative"))

	def generate_slug(self):
		"""Generate URL-friendly slug from event name if not provided."""
		if not self.slug and self.event_name:
			base_slug = slugify(self.event_name)
			self.slug = self._get_unique_slug(base_slug)

	def _get_unique_slug(self, base_slug):
		"""Ensure slug is unique by appending a number if necessary."""
		slug = base_slug
		counter = 1
		while frappe.db.exists("Event", {"slug": slug, "name": ("!=", self.name or "")}):
			slug = f"{base_slug}-{counter}"
			counter += 1
		return slug

	def set_publish_date(self):
		"""Set publish date when status changes to Published."""
		if self.status == "Published" and not self.publish_date:
			self.publish_date = nowdatetime()

	def before_save(self):
		"""Actions before saving the document."""
		# Validate organizer email format if provided
		if self.organizer_email:
			frappe.utils.validate_email_address(self.organizer_email, throw=True)

	def increment_views(self):
		"""Increment the views count for the event."""
		frappe.db.set_value("Event", self.name, "views_count", self.views_count + 1, update_modified=False)

	def update_rsvp_counts(self):
		"""Update RSVP counts from the RSVP child table or related doctype."""
		# This method can be called when RSVP responses are updated
		# Implementation depends on how RSVPs are stored
		pass

	def get_attendees(self, status=None):
		"""Get list of attendees for the event."""
		# Implementation depends on how RSVPs are stored
		pass

	def is_past_event(self):
		"""Check if the event has already ended."""
		return get_datetime(self.end_datetime) < nowdatetime()

	def is_ongoing(self):
		"""Check if the event is currently ongoing."""
		now = nowdatetime()
		return get_datetime(self.start_datetime) <= now <= get_datetime(self.end_datetime)

	def can_rsvp(self):
		"""Check if RSVP is still possible for this event."""
		if not self.rsvp_enabled:
			return False
		if self.status != "Published":
			return False
		if self.rsvp_deadline and get_datetime(self.rsvp_deadline) < nowdatetime():
			return False
		if self.is_past_event():
			return False
		return True

	def is_at_capacity(self):
		"""Check if the event has reached maximum capacity."""
		if not self.max_attendees or self.max_attendees == 0:
			return False
		return self.rsvp_yes_count >= self.max_attendees
