# Copyright (c) 2024, Fran Orzabal and contributors
# For license information, please see license.txt

"""
Trial Management API

This module provides API endpoints for managing trial accounts,
including status verification, trial extension, and conversion.
"""

import frappe
from frappe import _
from frappe.utils import now_datetime, add_days, get_datetime, time_diff_in_seconds

# Import constants from tasks module
from kairos.kairos.tasks.trial_expiration import TRIAL_DURATION_DAYS, TRIAL_WARNING_DAYS


@frappe.whitelist()
def get_trial_status(institution=None):
    """
    Get the trial status for an institution.

    Returns trial information including status, days remaining,
    and expiration date.

    Args:
        institution: Institution name/ID. If not provided, attempts to get
                    the institution from the current user's context.

    Returns:
        dict: Trial status information
            - is_trial: Whether the institution is on trial
            - trial_status: Current status (Active/Expired/Converted)
            - trial_started_at: When the trial started
            - trial_expires_at: When the trial expires/expired
            - days_remaining: Days remaining (can be negative if expired)
            - is_expired: Boolean indicating if trial has expired
            - is_warning_period: Boolean indicating if within warning period

    Raises:
        frappe.PermissionError: If user doesn't have permission to view institution
        frappe.DoesNotExistError: If institution doesn't exist
    """
    # If no institution provided, try to get from current user context
    if not institution:
        institution = _get_user_institution()

    if not institution:
        frappe.throw(_("Institution not specified"), frappe.MandatoryError)

    # Check permission
    if not frappe.has_permission("Institution", "read", institution):
        frappe.throw(_("You don't have permission to view this institution"), frappe.PermissionError)

    # Get institution data
    inst = frappe.get_doc("Institution", institution)

    if not inst.is_trial:
        return {
            "is_trial": False,
            "trial_status": None,
            "message": _("This institution is not on a trial plan")
        }

    current_time = now_datetime()
    expires_at = get_datetime(inst.trial_expires_at) if inst.trial_expires_at else None

    if expires_at:
        time_diff = time_diff_in_seconds(expires_at, current_time)
        days_remaining = int(time_diff / 86400)  # 86400 seconds in a day
    else:
        days_remaining = 0

    is_expired = inst.trial_status == "Expired" or (expires_at and expires_at < current_time)
    is_warning_period = not is_expired and days_remaining <= TRIAL_WARNING_DAYS

    return {
        "is_trial": True,
        "trial_status": inst.trial_status,
        "trial_started_at": inst.trial_started_at,
        "trial_expires_at": inst.trial_expires_at,
        "days_remaining": max(0, days_remaining) if not is_expired else 0,
        "is_expired": is_expired,
        "is_warning_period": is_warning_period,
        "warning_days_threshold": TRIAL_WARNING_DAYS,
        "institution": institution,
        "institution_name": inst.institution_name
    }


@frappe.whitelist()
def extend_trial(institution, days=7):
    """
    Extend the trial period for an institution.

    Only System Manager or administrators can extend trials.

    Args:
        institution: Institution name/ID
        days: Number of days to extend (default: 7, max: 30)

    Returns:
        dict: Updated trial information
            - success: Boolean indicating success
            - new_expires_at: New expiration datetime
            - days_added: Number of days added
            - total_days_remaining: Total days remaining after extension

    Raises:
        frappe.PermissionError: If user doesn't have admin permission
        frappe.ValidationError: If days is invalid or institution not on trial
    """
    # Validate permission - only System Manager can extend trials
    if not frappe.has_permission("Institution", "write"):
        frappe.throw(_("You don't have permission to extend trials"), frappe.PermissionError)

    # Additional role check for security
    if "System Manager" not in frappe.get_roles():
        frappe.throw(
            _("Only System Managers can extend trial periods"),
            frappe.PermissionError
        )

    # Validate days parameter
    try:
        days = int(days)
    except (ValueError, TypeError):
        frappe.throw(_("Days must be a valid number"), frappe.ValidationError)

    if days < 1 or days > 30:
        frappe.throw(_("Days must be between 1 and 30"), frappe.ValidationError)

    # Get institution
    inst = frappe.get_doc("Institution", institution)

    if not inst.is_trial:
        frappe.throw(
            _("Institution {0} is not on a trial plan").format(inst.institution_name),
            frappe.ValidationError
        )

    if inst.trial_status == "Converted":
        frappe.throw(
            _("Cannot extend trial - institution has already converted to paid plan"),
            frappe.ValidationError
        )

    # Calculate new expiration date
    current_time = now_datetime()
    current_expires = get_datetime(inst.trial_expires_at) if inst.trial_expires_at else current_time

    # If already expired, extend from now; otherwise extend from current expiration
    base_time = max(current_expires, current_time)
    new_expires_at = add_days(base_time, days)

    # Update institution
    inst.trial_expires_at = new_expires_at
    inst.trial_status = "Active"  # Reactivate if was expired
    inst.save(ignore_permissions=True)

    # Calculate total days remaining
    time_diff = time_diff_in_seconds(new_expires_at, current_time)
    total_days_remaining = int(time_diff / 86400)

    # Log the extension
    frappe.logger().info(
        f"Trial extended for {institution} by {days} days. New expiration: {new_expires_at}"
    )

    # Create activity log
    frappe.get_doc({
        "doctype": "Comment",
        "comment_type": "Info",
        "reference_doctype": "Institution",
        "reference_name": institution,
        "content": _("Trial extended by {0} days. New expiration: {1}").format(
            days, frappe.format(new_expires_at, "Datetime")
        )
    }).insert(ignore_permissions=True)

    return {
        "success": True,
        "institution": institution,
        "institution_name": inst.institution_name,
        "new_expires_at": new_expires_at,
        "days_added": days,
        "total_days_remaining": total_days_remaining,
        "trial_status": "Active"
    }


@frappe.whitelist()
def convert_trial_to_paid(institution, plan_type="Standard"):
    """
    Convert a trial institution to a paid subscription.

    Args:
        institution: Institution name/ID
        plan_type: Type of paid plan (for logging purposes)

    Returns:
        dict: Conversion result
            - success: Boolean indicating success
            - message: Status message

    Raises:
        frappe.PermissionError: If user doesn't have admin permission
        frappe.ValidationError: If institution not on trial
    """
    # Validate permission
    if not frappe.has_permission("Institution", "write"):
        frappe.throw(_("You don't have permission to convert trials"), frappe.PermissionError)

    if "System Manager" not in frappe.get_roles():
        frappe.throw(
            _("Only System Managers can convert trial accounts"),
            frappe.PermissionError
        )

    # Get institution
    inst = frappe.get_doc("Institution", institution)

    if not inst.is_trial:
        frappe.throw(
            _("Institution {0} is not on a trial plan").format(inst.institution_name),
            frappe.ValidationError
        )

    if inst.trial_status == "Converted":
        frappe.throw(
            _("Institution has already been converted to a paid plan"),
            frappe.ValidationError
        )

    # Update trial status
    inst.trial_status = "Converted"
    inst.save(ignore_permissions=True)

    # Log the conversion
    frappe.logger().info(
        f"Trial converted to paid for {institution}. Plan: {plan_type}"
    )

    # Create activity log
    frappe.get_doc({
        "doctype": "Comment",
        "comment_type": "Info",
        "reference_doctype": "Institution",
        "reference_name": institution,
        "content": _("Trial converted to paid subscription. Plan: {0}").format(plan_type)
    }).insert(ignore_permissions=True)

    return {
        "success": True,
        "institution": institution,
        "institution_name": inst.institution_name,
        "message": _("Trial successfully converted to {0} plan").format(plan_type),
        "trial_status": "Converted"
    }


@frappe.whitelist()
def start_trial(institution, duration_days=None):
    """
    Start a trial period for an institution.

    Args:
        institution: Institution name/ID
        duration_days: Custom trial duration (optional, defaults to TRIAL_DURATION_DAYS)

    Returns:
        dict: Trial start information

    Raises:
        frappe.PermissionError: If user doesn't have admin permission
        frappe.ValidationError: If institution already has active trial
    """
    # Validate permission
    if not frappe.has_permission("Institution", "write"):
        frappe.throw(_("You don't have permission to start trials"), frappe.PermissionError)

    if "System Manager" not in frappe.get_roles():
        frappe.throw(
            _("Only System Managers can start trial periods"),
            frappe.PermissionError
        )

    # Get institution
    inst = frappe.get_doc("Institution", institution)

    if inst.is_trial and inst.trial_status == "Active":
        frappe.throw(
            _("Institution {0} already has an active trial").format(inst.institution_name),
            frappe.ValidationError
        )

    # Use default duration if not specified
    if duration_days is None:
        duration_days = TRIAL_DURATION_DAYS
    else:
        try:
            duration_days = int(duration_days)
            if duration_days < 1 or duration_days > 90:
                frappe.throw(_("Duration must be between 1 and 90 days"), frappe.ValidationError)
        except (ValueError, TypeError):
            frappe.throw(_("Duration must be a valid number"), frappe.ValidationError)

    # Set trial fields
    start_time = now_datetime()
    expires_at = add_days(start_time, duration_days)

    inst.is_trial = 1
    inst.trial_status = "Active"
    inst.trial_started_at = start_time
    inst.trial_expires_at = expires_at
    inst.save(ignore_permissions=True)

    # Log the trial start
    frappe.logger().info(
        f"Trial started for {institution}. Duration: {duration_days} days. Expires: {expires_at}"
    )

    # Create activity log
    frappe.get_doc({
        "doctype": "Comment",
        "comment_type": "Info",
        "reference_doctype": "Institution",
        "reference_name": institution,
        "content": _("Trial period started. Duration: {0} days. Expires: {1}").format(
            duration_days, frappe.format(expires_at, "Datetime")
        )
    }).insert(ignore_permissions=True)

    return {
        "success": True,
        "institution": institution,
        "institution_name": inst.institution_name,
        "trial_started_at": start_time,
        "trial_expires_at": expires_at,
        "duration_days": duration_days,
        "trial_status": "Active"
    }


@frappe.whitelist(allow_guest=True)
def check_trial_access(institution=None):
    """
    Check if the current user's institution has trial access restrictions.

    This is a lightweight endpoint that can be called frequently to check
    access status without heavy database queries.

    Args:
        institution: Optional institution name. If not provided, uses current user's institution.

    Returns:
        dict: Access status
            - has_access: Boolean indicating full access
            - is_trial: Whether on trial
            - is_expired: Whether trial is expired
            - read_only: Whether access is read-only
            - message: Status message for UI display
    """
    if frappe.session.user == "Guest":
        return {
            "has_access": False,
            "is_trial": False,
            "is_expired": False,
            "read_only": True,
            "message": _("Please log in to access the system")
        }

    if not institution:
        institution = _get_user_institution()

    if not institution:
        # User not associated with any institution - allow access (might be admin)
        return {
            "has_access": True,
            "is_trial": False,
            "is_expired": False,
            "read_only": False,
            "message": None
        }

    # Get trial status using cached method for performance
    cache_key = f"trial_status_{institution}"
    cached_status = frappe.cache().get_value(cache_key)

    if cached_status is None:
        # Fetch from database
        inst_data = frappe.db.get_value(
            "Institution",
            institution,
            ["is_trial", "trial_status", "trial_expires_at"],
            as_dict=True
        )

        if not inst_data:
            return {
                "has_access": False,
                "is_trial": False,
                "is_expired": False,
                "read_only": True,
                "message": _("Institution not found")
            }

        is_trial = inst_data.is_trial
        is_expired = inst_data.trial_status == "Expired"

        cached_status = {
            "is_trial": is_trial,
            "is_expired": is_expired,
            "trial_status": inst_data.trial_status
        }

        # Cache for 5 minutes
        frappe.cache().set_value(cache_key, cached_status, expires_in_sec=300)

    is_trial = cached_status.get("is_trial")
    is_expired = cached_status.get("is_expired")

    if is_trial and is_expired:
        return {
            "has_access": False,
            "is_trial": True,
            "is_expired": True,
            "read_only": True,
            "message": _("Your trial period has expired. Please upgrade to continue using all features.")
        }

    return {
        "has_access": True,
        "is_trial": is_trial,
        "is_expired": False,
        "read_only": False,
        "message": None
    }


def _get_user_institution():
    """
    Get the institution associated with the current user.

    Returns:
        str or None: Institution name or None if not found
    """
    if frappe.session.user == "Guest":
        return None

    # Try to get institution from User document (if linked)
    user_institution = frappe.db.get_value("User", frappe.session.user, "institution")
    if user_institution:
        return user_institution

    # Alternative: Try to get from custom user field or linked document
    # This depends on how user-institution relationship is set up in Kairos
    # For now, return None and let calling code handle it
    return None


def clear_trial_cache(institution):
    """
    Clear the cached trial status for an institution.

    Should be called whenever trial status is updated.

    Args:
        institution: Institution name/ID
    """
    cache_key = f"trial_status_{institution}"
    frappe.cache().delete_value(cache_key)
