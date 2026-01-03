# Copyright (c) 2026, Kairos and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime


class NewsComment(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		comment: DF.Text
		edited_at: DF.Datetime | None
		is_edited: DF.Check
		naming_series: DF.Literal["NCMT-.#####"]
		news: DF.Link
		parent_comment: DF.Link | None
		posted_at: DF.Datetime | None
		status: DF.Literal["Pending", "Approved", "Rejected", "Spam"]
		user: DF.Link
		user_name: DF.Data | None
	# end: auto-generated types

	def before_save(self):
		"""Track edits to the comment."""
		if not self.is_new() and self.has_value_changed("comment"):
			self.is_edited = 1
			self.edited_at = now_datetime()

	def validate(self):
		"""Validate the comment before saving."""
		self.validate_parent_comment()

	def validate_parent_comment(self):
		"""Ensure parent comment belongs to the same news article."""
		if self.parent_comment:
			parent_news = frappe.db.get_value("News Comment", self.parent_comment, "news")
			if parent_news and parent_news != self.news:
				frappe.throw("Parent comment must belong to the same news article.")
