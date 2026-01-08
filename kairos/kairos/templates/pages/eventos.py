import frappe
from frappe import _
from frappe.utils import now_datetime, getdate

def get_context(context):
    """Get context for Events page."""
    context.no_cache = 1
    context.title = _("Eventos")

    if frappe.session.user == "Guest":
        frappe.throw(_("Please login to view this page"), frappe.PermissionError)

    # Get guardian linked to current user
    guardian = frappe.db.get_value("Guardian", {"user": frappe.session.user}, "name")

    if not guardian:
        context.events = []
        context.no_guardian = True
        return

    context.no_guardian = False

    # Get the students for this guardian to determine their campuses/grades/sections
    student_links = frappe.get_all(
        "Student Guardian",
        filters={"guardian": guardian},
        fields=["student"]
    )

    student_filters = set()
    for link in student_links:
        student = frappe.get_doc("Student", link.student)
        if student.campus:
            student_filters.add(("campus", student.campus))
        if student.current_grade:
            student_filters.add(("grade", student.current_grade))
        if student.current_section:
            student_filters.add(("section", student.current_section))

    # Get upcoming and recent events
    now = now_datetime()
    all_events = frappe.get_all(
        "School Event",
        filters=[
            ["status", "=", "Published"],
            ["start_datetime", ">=", frappe.utils.add_days(now, -7)]  # Include events from last 7 days
        ],
        fields=[
            "name", "event_name", "slug", "summary", "featured_image",
            "start_datetime", "end_datetime", "all_day",
            "location_type", "venue_name", "venue_address", "room", "virtual_link",
            "organizer_name", "category", "is_featured",
            "rsvp_enabled", "rsvp_deadline",
            "audience_type", "audience_campus", "audience_grade", "target_section"
        ],
        order_by="start_datetime asc",
        limit=50
    )

    # Filter events by audience relevance
    events = []
    for event in all_events:
        if event.audience_type == "All School":
            events.append(event)
        elif event.audience_type == "Campus":
            if ("campus", event.audience_campus) in student_filters:
                events.append(event)
        elif event.audience_type == "Grade":
            if ("grade", event.audience_grade) in student_filters:
                events.append(event)
        elif event.audience_type == "Section":
            if ("section", event.target_section) in student_filters:
                events.append(event)
        else:
            events.append(event)

    # Get category names and check user's RSVP status
    for event in events:
        if event.category:
            event["category_name"] = frappe.db.get_value("Event Category", event.category, "category_name") or event.category

        # Check if this event is upcoming
        event["is_upcoming"] = event.start_datetime > now

        # Check if this event is today
        event["is_today"] = getdate(event.start_datetime) == getdate(now)

        # Check user's RSVP if enabled
        if event.rsvp_enabled:
            rsvp = frappe.db.get_value(
                "Event RSVP",
                {"event": event.name, "guardian": guardian},
                ["response", "name"],
                as_dict=True
            )
            event["user_rsvp"] = rsvp.response if rsvp else None
            event["user_rsvp_name"] = rsvp.name if rsvp else None

    # Separate into upcoming and past
    context.upcoming_events = [e for e in events if e["is_upcoming"] or e["is_today"]]
    context.past_events = [e for e in events if not e["is_upcoming"] and not e["is_today"]]
    context.events = events
