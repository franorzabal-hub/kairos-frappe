import frappe
from frappe import _

def get_context(context):
    """Get context for Messages page."""
    context.no_cache = 1
    context.title = _("Mensajes")

    if frappe.session.user == "Guest":
        frappe.throw(_("Please login to view this page"), frappe.PermissionError)

    # Get guardian linked to current user
    guardian = frappe.db.get_value("Guardian", {"user": frappe.session.user}, "name")

    if not guardian:
        context.messages = []
        context.no_guardian = True
        return

    context.no_guardian = False

    # Get all messages for this guardian
    recipients = frappe.get_all(
        "Message Recipient",
        filters={"guardian": guardian},
        fields=["name", "message", "student", "is_read", "read_at", "acknowledged", "acknowledged_at"],
        order_by="creation desc",
        limit=50
    )

    messages = []
    for recipient in recipients:
        message = frappe.get_doc("Message", recipient.message)

        # Only show sent messages
        if message.status != "Sent":
            continue

        # Get student name if applicable
        student_name = ""
        if recipient.student:
            student_name = frappe.db.get_value("Student", recipient.student, "full_name")

        messages.append({
            "recipient_name": recipient.name,
            "message_name": message.name,
            "subject": message.subject,
            "content": message.content,
            "content_plain": message.content_plain,
            "message_type": message.message_type,
            "priority": message.priority,
            "sender_name": message.sender_name,
            "send_datetime": message.send_datetime,
            "is_read": recipient.is_read,
            "read_at": recipient.read_at,
            "requires_acknowledgment": message.requires_acknowledgment,
            "acknowledged": recipient.acknowledged,
            "acknowledged_at": recipient.acknowledged_at,
            "student_name": student_name
        })

    context.messages = messages
    context.unread_count = len([m for m in messages if not m["is_read"]])
