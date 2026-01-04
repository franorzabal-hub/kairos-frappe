# Copyright (c) 2024, Fran Orzabal and contributors
# For license information, please see license.txt

"""
Trial Expiration Tasks

This module handles automated trial expiration checks and notifications
for Kairos institutional accounts.
"""

import frappe
from frappe import _
from frappe.utils import now_datetime, add_days, getdate, get_datetime

# Trial configuration constants
TRIAL_DURATION_DAYS = 14
TRIAL_WARNING_DAYS = 3


def check_trial_expirations():
    """
    Scheduled task to check and process trial expirations.

    This function:
    1. Finds all active trial institutions with expired trial periods
    2. Updates their trial_status to "Expired"
    3. Sends notification to institution admins
    4. Logs the expiration event

    Called daily via scheduler_events in hooks.py
    """
    frappe.logger().info("Starting trial expiration check...")

    # Get current datetime
    current_time = now_datetime()

    # Find institutions with expired trials
    expired_institutions = frappe.get_all(
        "Institution",
        filters={
            "is_trial": 1,
            "trial_status": "Active",
            "trial_expires_at": ["<", current_time]
        },
        fields=["name", "institution_name", "primary_contact_email", "trial_expires_at"]
    )

    expired_count = 0

    for institution in expired_institutions:
        try:
            # Update trial status to Expired
            frappe.db.set_value(
                "Institution",
                institution.name,
                "trial_status",
                "Expired",
                update_modified=True
            )

            # Send expiration notification
            _send_trial_expired_notification(institution)

            # Log the expiration
            frappe.logger().info(
                f"Trial expired for institution: {institution.institution_name} ({institution.name})"
            )

            expired_count += 1

        except Exception as e:
            frappe.log_error(
                message=f"Error processing trial expiration for {institution.name}: {str(e)}",
                title="Trial Expiration Error"
            )

    frappe.db.commit()

    frappe.logger().info(f"Trial expiration check completed. {expired_count} trials expired.")

    return {"expired_count": expired_count}


def send_trial_warning_notifications():
    """
    Scheduled task to send warning notifications before trial expires.

    Sends notifications to institutions whose trial will expire within
    TRIAL_WARNING_DAYS days.

    Called daily via scheduler_events in hooks.py
    """
    frappe.logger().info("Starting trial warning notifications...")

    current_time = now_datetime()
    warning_threshold = add_days(current_time, TRIAL_WARNING_DAYS)

    # Find institutions approaching expiration
    expiring_soon = frappe.get_all(
        "Institution",
        filters={
            "is_trial": 1,
            "trial_status": "Active",
            "trial_expires_at": ["between", [current_time, warning_threshold]]
        },
        fields=["name", "institution_name", "primary_contact_email", "trial_expires_at"]
    )

    notified_count = 0

    for institution in expiring_soon:
        try:
            days_remaining = (get_datetime(institution.trial_expires_at) - current_time).days

            # Send warning notification
            _send_trial_warning_notification(institution, days_remaining)

            frappe.logger().info(
                f"Trial warning sent to: {institution.institution_name} - {days_remaining} days remaining"
            )

            notified_count += 1

        except Exception as e:
            frappe.log_error(
                message=f"Error sending trial warning for {institution.name}: {str(e)}",
                title="Trial Warning Notification Error"
            )

    frappe.logger().info(f"Trial warning notifications completed. {notified_count} notifications sent.")

    return {"notified_count": notified_count}


def _send_trial_expired_notification(institution):
    """
    Send notification email when trial expires.

    Args:
        institution: Dict with institution data including name, institution_name, primary_contact_email
    """
    if not institution.get("primary_contact_email"):
        frappe.logger().warning(
            f"No primary contact email for institution {institution.name}, skipping notification"
        )
        return

    subject = _("Your Kairos Trial Has Expired - {0}").format(institution.institution_name)

    message = _("""
    <h3>Trial Period Expired</h3>

    <p>Dear {institution_name} Administrator,</p>

    <p>Your free trial period for Kairos has ended on {expiry_date}.</p>

    <p>Your account now has limited access. To continue using all features of Kairos,
    please upgrade to a paid subscription.</p>

    <p><strong>What happens now:</strong></p>
    <ul>
        <li>Your data is safely preserved</li>
        <li>Access is limited to read-only mode</li>
        <li>You can upgrade anytime to restore full functionality</li>
    </ul>

    <p>To upgrade your account, please contact our sales team or visit your account settings.</p>

    <p>Thank you for trying Kairos!</p>

    <p>Best regards,<br>The Kairos Team</p>
    """).format(
        institution_name=institution.institution_name,
        expiry_date=frappe.format(institution.trial_expires_at, "Datetime")
    )

    try:
        frappe.sendmail(
            recipients=[institution.primary_contact_email],
            subject=subject,
            message=message,
            now=True
        )
    except Exception as e:
        frappe.log_error(
            message=f"Failed to send trial expired email to {institution.primary_contact_email}: {str(e)}",
            title="Trial Email Error"
        )


def _send_trial_warning_notification(institution, days_remaining):
    """
    Send warning notification email before trial expires.

    Args:
        institution: Dict with institution data
        days_remaining: Number of days until trial expires
    """
    if not institution.get("primary_contact_email"):
        frappe.logger().warning(
            f"No primary contact email for institution {institution.name}, skipping warning"
        )
        return

    subject = _("Your Kairos Trial Expires in {0} Days - {1}").format(
        days_remaining,
        institution.institution_name
    )

    message = _("""
    <h3>Trial Period Ending Soon</h3>

    <p>Dear {institution_name} Administrator,</p>

    <p>Your free trial period for Kairos will expire in <strong>{days_remaining} days</strong>
    (on {expiry_date}).</p>

    <p>To continue enjoying all the features of Kairos without interruption,
    we recommend upgrading to a paid subscription before your trial ends.</p>

    <p><strong>Benefits of upgrading:</strong></p>
    <ul>
        <li>Uninterrupted access to all features</li>
        <li>Priority support</li>
        <li>Data preservation and backup</li>
        <li>Advanced analytics and reporting</li>
    </ul>

    <p>To upgrade your account, please contact our sales team or visit your account settings.</p>

    <p>If you have any questions, feel free to reach out to our support team.</p>

    <p>Best regards,<br>The Kairos Team</p>
    """).format(
        institution_name=institution.institution_name,
        days_remaining=days_remaining,
        expiry_date=frappe.format(institution.trial_expires_at, "Datetime")
    )

    try:
        frappe.sendmail(
            recipients=[institution.primary_contact_email],
            subject=subject,
            message=message,
            now=True
        )
    except Exception as e:
        frappe.log_error(
            message=f"Failed to send trial warning email to {institution.primary_contact_email}: {str(e)}",
            title="Trial Warning Email Error"
        )


def initialize_trial(institution_name, duration_days=None):
    """
    Initialize trial period for a new institution.

    This function should be called when creating a new trial institution.

    Args:
        institution_name: Name (ID) of the Institution document
        duration_days: Optional custom trial duration (defaults to TRIAL_DURATION_DAYS)

    Returns:
        dict: Trial information including start and end dates
    """
    if duration_days is None:
        duration_days = TRIAL_DURATION_DAYS

    start_time = now_datetime()
    end_time = add_days(start_time, duration_days)

    frappe.db.set_value(
        "Institution",
        institution_name,
        {
            "is_trial": 1,
            "trial_status": "Active",
            "trial_started_at": start_time,
            "trial_expires_at": end_time
        },
        update_modified=True
    )

    frappe.db.commit()

    return {
        "institution": institution_name,
        "trial_started_at": start_time,
        "trial_expires_at": end_time,
        "duration_days": duration_days
    }
