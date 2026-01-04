# Copyright (c) 2024, Fran Orzabal and contributors
# For license information, please see license.txt

"""
Trial Access Middleware

This module provides middleware functions to enforce trial access restrictions.
When a trial expires, users are restricted to read-only access.
"""

import frappe
from frappe import _
from frappe.utils import now_datetime, get_datetime

# DocTypes that are always allowed even when trial is expired
# These are essential for system operation and user management
ALWAYS_ALLOWED_DOCTYPES = [
    # System DocTypes
    "User",
    "Role",
    "Role Profile",
    "User Permission",
    "Session Default Settings",
    "Error Log",
    "Activity Log",
    "Comment",
    "Communication",
    "File",
    "Version",
    "DocShare",

    # Frappe Core
    "System Settings",
    "Website Settings",
    "Email Account",
    "Email Queue",
    "Notification Log",
    "ToDo",
    "Event",

    # Allow payment/subscription related (so users can upgrade)
    "Payment Entry",
    "Subscription",

    # Allow Institution to be viewed (for checking trial status)
    "Institution",
]

# DocTypes that should trigger trial check (main application data)
# If empty, all non-allowed doctypes will be checked
TRIAL_PROTECTED_DOCTYPES = [
    # Core Kairos DocTypes
    "Student",
    "Guardian",
    "Teacher",
    "Academic Year",
    "School Level",
    "Grade",
    "Section",
    "Enrollment",

    # Communication DocTypes
    "Message",
    "Message Recipient",
    "News",
    "School Event",
    "Event RSVP",

    # Add other application-specific DocTypes here
]


def check_trial_write_access(doc, method=None):
    """
    DocType event hook to check if write operations are allowed.

    This function is called before insert, save, submit, cancel, and trash
    operations to verify that the user's institution has an active trial
    or paid subscription.

    Args:
        doc: The document being modified
        method: The event method name (e.g., "before_save")

    Raises:
        frappe.PermissionError: If trial is expired and write is not allowed
    """
    # Skip for Guest or Administrator
    if frappe.session.user in ("Guest", "Administrator"):
        return

    # Skip for System Manager role (admins can always modify)
    if "System Manager" in frappe.get_roles():
        return

    # Get the doctype name
    doctype = doc.doctype if hasattr(doc, "doctype") else doc.get("doctype")

    if not doctype:
        return

    # Skip always-allowed doctypes
    if doctype in ALWAYS_ALLOWED_DOCTYPES:
        return

    # If we have a specific list of protected doctypes, only check those
    if TRIAL_PROTECTED_DOCTYPES and doctype not in TRIAL_PROTECTED_DOCTYPES:
        return

    # Check if trial is expired for user's institution
    if is_trial_expired_for_user():
        frappe.throw(
            _(
                "Your trial period has expired. You cannot create or modify records. "
                "Please upgrade to a paid subscription to continue using Kairos."
            ),
            frappe.PermissionError,
            title=_("Trial Expired")
        )


def is_trial_expired_for_user():
    """
    Check if the current user's institution has an expired trial.

    Uses caching for performance.

    Returns:
        bool: True if trial is expired, False otherwise
    """
    if frappe.session.user in ("Guest", "Administrator"):
        return False

    # Get user's institution
    institution = get_user_institution()

    if not institution:
        # User not associated with any institution - allow access
        return False

    return is_trial_expired(institution)


def is_trial_expired(institution):
    """
    Check if a specific institution has an expired trial.

    Args:
        institution: Institution name/ID

    Returns:
        bool: True if trial is expired, False otherwise
    """
    # Check cache first
    cache_key = f"trial_expired_{institution}"
    cached_result = frappe.cache().get_value(cache_key)

    if cached_result is not None:
        return cached_result

    # Query database
    inst_data = frappe.db.get_value(
        "Institution",
        institution,
        ["is_trial", "trial_status", "trial_expires_at"],
        as_dict=True
    )

    if not inst_data:
        # Institution not found - don't block
        frappe.cache().set_value(cache_key, False, expires_in_sec=300)
        return False

    # Not a trial account - allow access
    if not inst_data.is_trial:
        frappe.cache().set_value(cache_key, False, expires_in_sec=300)
        return False

    # Check if trial status is explicitly expired
    if inst_data.trial_status == "Expired":
        frappe.cache().set_value(cache_key, True, expires_in_sec=300)
        return True

    # Converted trials are not expired
    if inst_data.trial_status == "Converted":
        frappe.cache().set_value(cache_key, False, expires_in_sec=300)
        return False

    # Check expiration datetime
    if inst_data.trial_expires_at:
        expires_at = get_datetime(inst_data.trial_expires_at)
        current_time = now_datetime()

        if expires_at < current_time:
            # Trial has expired but status not updated yet
            # Update status asynchronously
            frappe.enqueue(
                "kairos.kairos.middleware.trial_access._update_expired_status",
                institution=institution,
                queue="short"
            )
            frappe.cache().set_value(cache_key, True, expires_in_sec=300)
            return True

    # Trial is active
    frappe.cache().set_value(cache_key, False, expires_in_sec=300)
    return False


def _update_expired_status(institution):
    """
    Update institution trial status to Expired.

    Called asynchronously when a trial is detected as expired.

    Args:
        institution: Institution name/ID
    """
    try:
        frappe.db.set_value(
            "Institution",
            institution,
            "trial_status",
            "Expired",
            update_modified=True
        )
        frappe.db.commit()

        # Clear cache
        clear_trial_cache(institution)

        frappe.logger().info(f"Updated trial status to Expired for {institution}")
    except Exception as e:
        frappe.log_error(
            message=f"Failed to update trial status for {institution}: {str(e)}",
            title="Trial Status Update Error"
        )


def get_user_institution():
    """
    Get the institution associated with the current user.

    Returns:
        str or None: Institution name or None if not found
    """
    if frappe.session.user == "Guest":
        return None

    # Check cache
    cache_key = f"user_institution_{frappe.session.user}"
    cached_institution = frappe.cache().get_value(cache_key)

    if cached_institution is not None:
        return cached_institution if cached_institution != "__NONE__" else None

    # Try to get institution from User document
    institution = frappe.db.get_value("User", frappe.session.user, "institution")

    if institution:
        frappe.cache().set_value(cache_key, institution, expires_in_sec=3600)
        return institution

    # Try to get from Guardian link
    guardian = frappe.db.get_value(
        "Guardian",
        {"user": frappe.session.user},
        ["institution"],
        as_dict=True
    )
    if guardian and guardian.get("institution"):
        frappe.cache().set_value(cache_key, guardian.institution, expires_in_sec=3600)
        return guardian.institution

    # Try to get from Teacher link
    teacher = frappe.db.get_value(
        "Teacher",
        {"user": frappe.session.user},
        ["institution"],
        as_dict=True
    )
    if teacher and teacher.get("institution"):
        frappe.cache().set_value(cache_key, teacher.institution, expires_in_sec=3600)
        return teacher.institution

    # No institution found - cache as None
    frappe.cache().set_value(cache_key, "__NONE__", expires_in_sec=3600)
    return None


def clear_trial_cache(institution):
    """
    Clear all trial-related caches for an institution.

    Should be called whenever trial status changes.

    Args:
        institution: Institution name/ID
    """
    frappe.cache().delete_value(f"trial_expired_{institution}")
    frappe.cache().delete_value(f"trial_status_{institution}")


def clear_user_institution_cache(user=None):
    """
    Clear the user-institution cache.

    Args:
        user: Optional user email. If not provided, clears for current user.
    """
    if not user:
        user = frappe.session.user
    frappe.cache().delete_value(f"user_institution_{user}")


def get_trial_access_info():
    """
    Get detailed trial access information for the current user.

    Returns:
        dict: Trial access information
            - has_full_access: Boolean indicating unrestricted access
            - is_trial: Whether the institution is on trial
            - is_expired: Whether trial is expired
            - institution: Institution name
            - message: Status message
    """
    if frappe.session.user in ("Guest", "Administrator"):
        return {
            "has_full_access": frappe.session.user == "Administrator",
            "is_trial": False,
            "is_expired": False,
            "institution": None,
            "message": None
        }

    if "System Manager" in frappe.get_roles():
        return {
            "has_full_access": True,
            "is_trial": False,
            "is_expired": False,
            "institution": None,
            "message": None
        }

    institution = get_user_institution()

    if not institution:
        return {
            "has_full_access": True,
            "is_trial": False,
            "is_expired": False,
            "institution": None,
            "message": _("Not associated with any institution")
        }

    inst_data = frappe.db.get_value(
        "Institution",
        institution,
        ["is_trial", "trial_status", "trial_expires_at", "institution_name"],
        as_dict=True
    )

    if not inst_data:
        return {
            "has_full_access": True,
            "is_trial": False,
            "is_expired": False,
            "institution": institution,
            "message": _("Institution not found")
        }

    is_expired = is_trial_expired(institution)

    return {
        "has_full_access": not is_expired,
        "is_trial": inst_data.is_trial,
        "is_expired": is_expired,
        "trial_status": inst_data.trial_status,
        "institution": institution,
        "institution_name": inst_data.institution_name,
        "trial_expires_at": inst_data.trial_expires_at,
        "message": _("Trial expired - read-only access") if is_expired else None
    }
