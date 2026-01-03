# Copyright (c) 2024, Kairos and contributors
# For license information, please see license.txt

import re
import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import now_datetime, get_datetime


def slugify(text: str) -> str:
	"""Convert text to URL-friendly slug."""
	text = text.lower().strip()
	text = re.sub(r'[^\w\s-]', '', text)
	text = re.sub(r'[\s_-]+', '-', text)
	text = re.sub(r'^-+|-+$', '', text)
	return text


class News(Document):
	# begin: auto-generated types
	# This code is auto-generated. Do not modify anything in this block.

	from typing import TYPE_CHECKING

	if TYPE_CHECKING:
		from frappe.types import DF

		allow_comments: DF.Check
		author: DF.Link
		author_name: DF.Data | None
		campus: DF.Link | None
		category: DF.Link | None
		content: DF.TextEditor | None
		featured_image: DF.AttachImage | None
		grade: DF.Link | None
		institution: DF.Link | None
		is_featured: DF.Check
		is_pinned: DF.Check
		meta_description: DF.SmallText | None
		meta_title: DF.Data | None
		naming_series: DF.Literal["NEWS-.YYYY.-.#####"]
		publish_date: DF.Datetime | None
		scope_type: DF.Literal["Institution", "Campus", "Grade"]
		slug: DF.Data | None
		status: DF.Literal["Draft", "Scheduled", "Published", "Archived"]
		summary: DF.SmallText | None
		title: DF.Data
		unpublish_date: DF.Datetime | None
		views_count: DF.Int
	# end: auto-generated types

	def validate(self):
		"""Validate the News document before saving."""
		self.generate_slug()
		self.validate_dates()
		self.validate_scope()

	def generate_slug(self):
		"""Generate URL-friendly slug from title if not provided."""
		if not self.slug and self.title:
			self.slug = slugify(self.title)
		elif self.slug:
			self.slug = slugify(self.slug)

	def validate_dates(self):
		"""Validate publish and unpublish dates."""
		if self.publish_date and self.unpublish_date:
			if get_datetime(self.unpublish_date) <= get_datetime(self.publish_date):
				frappe.throw(_("Unpublish Date must be after Publish Date"))

	def validate_scope(self):
		"""Validate scope fields based on scope_type."""
		if self.scope_type == "Campus" and not self.campus:
			frappe.throw(_("Campus is required when Scope Type is Campus"))
		if self.scope_type == "Grade":
			if not self.campus:
				frappe.throw(_("Campus is required when Scope Type is Grade"))
			if not self.grade:
				frappe.throw(_("Grade is required when Scope Type is Grade"))

	def before_save(self):
		"""Actions before saving the document."""
		self.update_status_based_on_dates()

	def update_status_based_on_dates(self):
		"""Update status based on publish/unpublish dates."""
		now = now_datetime()

		if self.status == "Draft":
			return

		if self.publish_date and self.status == "Scheduled":
			if get_datetime(self.publish_date) <= now:
				self.status = "Published"

		if self.unpublish_date and self.status == "Published":
			if get_datetime(self.unpublish_date) <= now:
				self.status = "Archived"

	def increment_views(self):
		"""Increment the views count."""
		frappe.db.set_value("News", self.name, "views_count", self.views_count + 1, update_modified=False)
