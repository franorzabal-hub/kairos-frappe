# Copyright (c) 2025, Kairos and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime, add_days, get_datetime


class GuardianInvite(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF
		from kairos.kairos.doctype.guardian_invite_student.guardian_invite_student import GuardianInviteStudent

		created_by_user: DF.Link | None
		email: DF.Data
		expires: DF.Datetime | None
		guardian: DF.Link | None
		institution: DF.Link
		naming_series: DF.Literal["GINV-.#####"]
		student_ids: DF.Table[GuardianInviteStudent]
		token: DF.Data | None
		used: DF.Check
		used_at: DF.Datetime | None

	# end: auto-generated types

	def before_insert(self):
		"""Generate unique token and set defaults before inserting."""
		self.token = frappe.generate_hash(length=32)

		# Set expiration to 14 days from now if not set
		if not self.expires:
			self.expires = add_days(now_datetime(), 14)

		# Set created_by_user to current user
		if not self.created_by_user:
			self.created_by_user = frappe.session.user

	def validate(self):
		"""Validate the Guardian Invite document."""
		self.validate_email()
		self.validate_expiration_on_used()

	def validate_email(self):
		"""Validate email format."""
		if self.email:
			frappe.utils.validate_email_address(self.email, throw=True)

	def validate_expiration_on_used(self):
		"""Verify that the invite is not expired if marking as used."""
		if self.used and not self.is_new():
			# Get the old value to check if used is being changed
			old_doc = self.get_doc_before_save()
			if old_doc and not old_doc.used:
				# Being marked as used now, check expiration
				if self.expires and now_datetime() > get_datetime(self.expires):
					frappe.throw(_("Cannot mark an expired invite as used."))

	def is_valid(self) -> bool:
		"""
		Check if the invite is valid.

		Returns:
			bool: True if the invite is not expired and not used, False otherwise.
		"""
		if self.used:
			return False

		if self.expires and now_datetime() > get_datetime(self.expires):
			return False

		return True

	def mark_as_used(self, guardian_name: str) -> None:
		"""
		Mark the invite as used and link it to the guardian.

		Args:
			guardian_name: The name (ID) of the Guardian document.

		Raises:
			frappe.ValidationError: If the invite is already used or expired.
		"""
		if self.used:
			frappe.throw(_("This invite has already been used."))

		if not self.is_valid():
			frappe.throw(_("This invite is no longer valid (expired or already used)."))

		self.used = 1
		self.used_at = now_datetime()
		self.guardian = guardian_name
		self.save(ignore_permissions=True)
