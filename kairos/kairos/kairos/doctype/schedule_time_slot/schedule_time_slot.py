# Copyright (c) 2025, Kairos and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import time_diff_in_seconds


class ScheduleTimeSlot(Document):
    def validate(self):
        self.validate_times()
        self.calculate_duration()

    def validate_times(self):
        """Ensure end_time is after start_time."""
        if self.start_time and self.end_time:
            if self.end_time <= self.start_time:
                frappe.throw("End Time must be after Start Time")

    def calculate_duration(self):
        """Calculate duration in minutes from start and end times."""
        if self.start_time and self.end_time:
            # Convert time strings to seconds and calculate difference
            start_seconds = self._time_to_seconds(self.start_time)
            end_seconds = self._time_to_seconds(self.end_time)
            duration_seconds = end_seconds - start_seconds
            self.duration_minutes = duration_seconds // 60

    def _time_to_seconds(self, time_str):
        """Convert time string (HH:MM:SS or HH:MM) to seconds."""
        if isinstance(time_str, str):
            parts = time_str.split(":")
            hours = int(parts[0])
            minutes = int(parts[1]) if len(parts) > 1 else 0
            seconds = int(parts[2]) if len(parts) > 2 else 0
            return hours * 3600 + minutes * 60 + seconds
        return 0
