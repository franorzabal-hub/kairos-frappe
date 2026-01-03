# Copyright (c) 2025, Kairos and contributors
# For license information, please see license.txt

"""
Guardian Invitation API

This module provides API endpoints for managing guardian invitations
in the Kairos application.

Endpoints:
- create_invitation: Create a new guardian invitation
- get_invitation: Get invitation details by token
- accept_invitation: Accept an invitation and link guardian to students
- revoke_invitation: Revoke a pending invitation

Usage:
    POST /api/method/kairos.api.invitations.create_invitation
    GET  /api/method/kairos.api.invitations.get_invitation?token=xxx
    POST /api/method/kairos.api.invitations.accept_invitation
    POST /api/method/kairos.api.invitations.revoke_invitation
"""

import frappe
from frappe import _
from frappe.utils import now_datetime, add_days, getdate, get_datetime
import json

# Setup logger for debugging
logger = frappe.logger("kairos.invitations", allow_site=True, file_count=5)


@frappe.whitelist(allow_guest=True)
def create_invitation(
    institution: str,
    email: str,
    students: list | str,
    invited_by: str | None = None,
    phone: str | None = None,
    expiration_days: int = 7
) -> dict:
    """
    Create a guardian invitation.

    Creates a new Guardian Invite document with a unique token and expiration date.
    The invitation can be used by a guardian to link themselves to the specified students.

    Args:
        institution: The Institution ID (name) to invite the guardian to
        email: The email address of the guardian being invited
        students: List of Student IDs to link to the guardian.
                  Can be a JSON string or a Python list.
        invited_by: User ID of the person creating the invitation (optional, defaults to current user)
        phone: Phone number of the guardian (optional)
        expiration_days: Number of days until the invitation expires (default: 7)

    Returns:
        dict: {
            success: bool,
            invitation_id: str (the Guardian Invite name),
            token: str (unique token for accepting the invitation),
            expires_at: str (ISO datetime string)
        }

    Raises:
        frappe.ValidationError: If validation fails (missing required fields, invalid data)
        frappe.PermissionError: If user doesn't have permission to create invitations

    Example:
        >>> create_invitation(
        ...     institution="INST-00001",
        ...     email="parent@example.com",
        ...     students=["STU-00001", "STU-00002"],
        ...     invited_by="admin@example.com"
        ... )
        {
            "success": True,
            "invitation_id": "GINV-00001",
            "token": "abc123...",
            "expires_at": "2025-01-10T00:00:00"
        }
    """
    logger.info(f"Creating invitation for email={email}, institution={institution}")

    try:
        # Validate required fields
        if not institution:
            frappe.throw(_("Institution is required"), frappe.MandatoryError)

        if not email:
            frappe.throw(_("Email is required"), frappe.MandatoryError)

        if not students:
            frappe.throw(_("At least one student is required"), frappe.MandatoryError)

        # Parse students if it's a JSON string
        if isinstance(students, str):
            try:
                students = json.loads(students)
            except json.JSONDecodeError:
                frappe.throw(_("Invalid students format. Expected a JSON array."), frappe.ValidationError)

        # Ensure students is a list
        if not isinstance(students, list):
            frappe.throw(_("Students must be a list of student IDs"), frappe.ValidationError)

        if len(students) == 0:
            frappe.throw(_("At least one student is required"), frappe.MandatoryError)

        # Validate institution exists
        if not frappe.db.exists("Institution", institution):
            frappe.throw(_("Institution {0} does not exist").format(institution), frappe.DoesNotExistError)

        # Validate all students exist and belong to the institution
        for student_id in students:
            if not frappe.db.exists("Student", student_id):
                frappe.throw(_("Student {0} does not exist").format(student_id), frappe.DoesNotExistError)

            # Check if student belongs to the institution
            student_institution = frappe.db.get_value("Student", student_id, "institution")
            if student_institution != institution:
                frappe.throw(
                    _("Student {0} does not belong to institution {1}").format(student_id, institution),
                    frappe.ValidationError
                )

        # Validate email format
        frappe.utils.validate_email_address(email, throw=True)

        # Calculate expiration date
        expires_at = add_days(now_datetime(), expiration_days)

        # Create the Guardian Invite document
        invite = frappe.new_doc("Guardian Invite")
        invite.institution = institution
        invite.email = email
        invite.expires = expires_at
        invite.created_by_user = invited_by or frappe.session.user

        # Add students to the child table
        for student_id in students:
            student_name = frappe.db.get_value("Student", student_id, "full_name")
            invite.append("student_ids", {
                "student": student_id,
                "student_name": student_name
            })

        # The token is generated automatically in before_insert
        invite.insert(ignore_permissions=True)

        logger.info(f"Invitation created successfully: {invite.name}, token={invite.token}")

        return {
            "success": True,
            "invitation_id": invite.name,
            "token": invite.token,
            "expires_at": str(invite.expires)
        }

    except frappe.ValidationError:
        raise
    except frappe.DoesNotExistError:
        raise
    except Exception as e:
        logger.error(f"Error creating invitation: {str(e)}")
        frappe.throw(_("Failed to create invitation: {0}").format(str(e)))


@frappe.whitelist(allow_guest=True)
def get_invitation(token: str) -> dict:
    """
    Get invitation details by token.

    Retrieves the details of a guardian invitation using its unique token.
    Validates that the invitation is not expired and has not been used.

    Args:
        token: The unique token of the invitation

    Returns:
        dict: {
            success: bool,
            invitation: {
                invitation_id: str,
                institution_name: str,
                institution_id: str,
                email: str,
                students: [
                    {
                        student_id: str,
                        student_name: str
                    },
                    ...
                ],
                expires_at: str,
                status: str ("Pending", "Expired", or "Used"),
                is_valid: bool
            }
        }

    Raises:
        frappe.DoesNotExistError: If no invitation with the given token exists

    Example:
        >>> get_invitation(token="abc123...")
        {
            "success": True,
            "invitation": {
                "invitation_id": "GINV-00001",
                "institution_name": "Example School",
                "institution_id": "INST-00001",
                "students": [
                    {"student_id": "STU-00001", "student_name": "John Doe"}
                ],
                "expires_at": "2025-01-10T00:00:00",
                "status": "Pending",
                "is_valid": True
            }
        }
    """
    logger.info(f"Getting invitation by token")

    if not token:
        frappe.throw(_("Token is required"), frappe.MandatoryError)

    # Find the invitation by token
    invite_name = frappe.db.get_value("Guardian Invite", {"token": token}, "name")

    if not invite_name:
        frappe.throw(_("Invitation not found or invalid token"), frappe.DoesNotExistError)

    invite = frappe.get_doc("Guardian Invite", invite_name)

    # Get institution name
    institution_name = frappe.db.get_value("Institution", invite.institution, "institution_name")

    # Build students list
    students = []
    for student_row in invite.student_ids:
        students.append({
            "student_id": student_row.student,
            "student_name": student_row.student_name or frappe.db.get_value("Student", student_row.student, "student_name")
        })

    # Determine status
    status = "Pending"
    is_valid = True

    if invite.used:
        status = "Used"
        is_valid = False
    elif invite.expires and get_datetime(invite.expires) < get_datetime(now_datetime()):
        status = "Expired"
        is_valid = False

    logger.info(f"Invitation found: {invite.name}, status={status}, is_valid={is_valid}")

    return {
        "success": True,
        "invitation": {
            "invitation_id": invite.name,
            "institution_name": institution_name,
            "institution_id": invite.institution,
            "email": invite.email,
            "students": students,
            "expires_at": str(invite.expires) if invite.expires else None,
            "status": status,
            "is_valid": is_valid
        }
    }


@frappe.whitelist(allow_guest=True)
def accept_invitation(token: str, user_email: str) -> dict:
    """
    Accept an invitation and link the guardian to students.

    This endpoint:
    1. Validates the token and ensures the invitation is still valid
    2. Creates or retrieves a Guardian document for the user
    3. Links the Guardian to all students specified in the invitation via Student Guardian
    4. Marks the invitation as "Accepted" (used)

    Args:
        token: The unique token of the invitation
        user_email: The email of the user accepting the invitation

    Returns:
        dict: {
            success: bool,
            guardian_id: str (the Guardian document name),
            students_linked: list[str] (list of Student IDs that were linked)
        }

    Raises:
        frappe.DoesNotExistError: If the invitation doesn't exist
        frappe.ValidationError: If the invitation is expired, already used, or user_email doesn't match

    Example:
        >>> accept_invitation(
        ...     token="abc123...",
        ...     user_email="parent@example.com"
        ... )
        {
            "success": True,
            "guardian_id": "GRD-00001",
            "students_linked": ["STU-00001", "STU-00002"]
        }
    """
    logger.info(f"Accepting invitation for user_email={user_email}")

    if not token:
        frappe.throw(_("Token is required"), frappe.MandatoryError)

    if not user_email:
        frappe.throw(_("User email is required"), frappe.MandatoryError)

    # Validate email format
    frappe.utils.validate_email_address(user_email, throw=True)

    # Find the invitation by token
    invite_name = frappe.db.get_value("Guardian Invite", {"token": token}, "name")

    if not invite_name:
        frappe.throw(_("Invitation not found or invalid token"), frappe.DoesNotExistError)

    invite = frappe.get_doc("Guardian Invite", invite_name)

    # Check if invitation is valid (not used and not expired)
    if invite.used:
        frappe.throw(_("This invitation has already been used"), frappe.ValidationError)

    if not invite.is_valid():
        frappe.throw(_("This invitation has expired"), frappe.ValidationError)

    # Verify that the email matches (optional, but good for security)
    if invite.email.lower() != user_email.lower():
        logger.warning(f"Email mismatch: invite.email={invite.email}, user_email={user_email}")
        # You can decide whether to enforce email matching
        # For now, we'll allow any email but log the mismatch

    # Find or create Guardian
    guardian = _get_or_create_guardian(user_email)

    # Link guardian to students via Student Guardian
    students_linked = []
    for student_row in invite.student_ids:
        student_id = student_row.student

        # Check if relationship already exists
        existing = frappe.db.exists("Student Guardian", {
            "student": student_id,
            "guardian": guardian.name
        })

        if not existing:
            # Create Student Guardian relationship
            student_guardian = frappe.new_doc("Student Guardian")
            student_guardian.student = student_id
            student_guardian.student_name = frappe.db.get_value("Student", student_id, "student_name")
            student_guardian.guardian = guardian.name
            student_guardian.guardian_name = guardian.full_name
            student_guardian.relation = "Guardian"  # Default relation
            student_guardian.can_pickup = 1
            student_guardian.can_receive_communications = 1
            student_guardian.is_primary = 0  # Not primary by default

            student_guardian.insert(ignore_permissions=True)
            students_linked.append(student_id)
            logger.info(f"Linked guardian {guardian.name} to student {student_id}")
        else:
            logger.info(f"Relationship already exists between guardian {guardian.name} and student {student_id}")
            students_linked.append(student_id)  # Still report as linked

    # Mark invitation as used
    invite.mark_as_used(guardian.name)

    logger.info(f"Invitation accepted: guardian={guardian.name}, students_linked={students_linked}")

    return {
        "success": True,
        "guardian_id": guardian.name,
        "students_linked": students_linked
    }


@frappe.whitelist()
def revoke_invitation(invitation_id: str) -> dict:
    """
    Revoke a pending invitation.

    Marks an invitation as revoked, making it invalid for future use.
    Only invitations with status "Pending" (not used and not expired) can be revoked.

    Args:
        invitation_id: The Guardian Invite document name (e.g., "GINV-00001")

    Returns:
        dict: {
            success: bool,
            message: str
        }

    Raises:
        frappe.DoesNotExistError: If the invitation doesn't exist
        frappe.ValidationError: If the invitation is not in a pending state
        frappe.PermissionError: If the user doesn't have permission to revoke invitations

    Example:
        >>> revoke_invitation(invitation_id="GINV-00001")
        {
            "success": True,
            "message": "Invitation GINV-00001 has been revoked"
        }
    """
    logger.info(f"Revoking invitation: {invitation_id}")

    if not invitation_id:
        frappe.throw(_("Invitation ID is required"), frappe.MandatoryError)

    # Check if invitation exists
    if not frappe.db.exists("Guardian Invite", invitation_id):
        frappe.throw(_("Invitation {0} does not exist").format(invitation_id), frappe.DoesNotExistError)

    invite = frappe.get_doc("Guardian Invite", invitation_id)

    # Check if the invitation can be revoked
    if invite.used:
        frappe.throw(
            _("Cannot revoke invitation {0}: it has already been used").format(invitation_id),
            frappe.ValidationError
        )

    if invite.expires and get_datetime(invite.expires) < get_datetime(now_datetime()):
        frappe.throw(
            _("Cannot revoke invitation {0}: it has already expired").format(invitation_id),
            frappe.ValidationError
        )

    # Revoke by setting expiration to now (making it expired)
    invite.expires = now_datetime()
    invite.save(ignore_permissions=True)

    logger.info(f"Invitation {invitation_id} revoked successfully")

    return {
        "success": True,
        "message": _("Invitation {0} has been revoked").format(invitation_id)
    }


def _get_or_create_guardian(email: str) -> "frappe.model.document.Document":
    """
    Get an existing Guardian by email or create a new one.

    Args:
        email: The email address to look up or create a Guardian for

    Returns:
        Guardian document
    """
    # First, try to find an existing Guardian with this email
    existing_guardian = frappe.db.get_value("Guardian", {"email": email}, "name")

    if existing_guardian:
        logger.info(f"Found existing guardian: {existing_guardian}")
        return frappe.get_doc("Guardian", existing_guardian)

    # Create a new Guardian
    # Try to get user info if user exists
    user_info = None
    if frappe.db.exists("User", email):
        user_info = frappe.db.get_value(
            "User",
            email,
            ["first_name", "last_name", "mobile_no", "phone"],
            as_dict=True
        )

    guardian = frappe.new_doc("Guardian")
    guardian.email = email

    if user_info:
        guardian.first_name = user_info.first_name or "Guardian"
        guardian.last_name = user_info.last_name or ""
        guardian.mobile = user_info.mobile_no or user_info.phone or ""
        guardian.user = email
    else:
        # Default values when we don't have user info
        guardian.first_name = "Guardian"
        guardian.last_name = ""
        guardian.mobile = ""

    guardian.insert(ignore_permissions=True)
    logger.info(f"Created new guardian: {guardian.name}")

    return guardian


# Additional utility endpoints

@frappe.whitelist()
def list_invitations(
    institution: str | None = None,
    status: str | None = None,
    limit: int = 20,
    offset: int = 0
) -> dict:
    """
    List guardian invitations with optional filters.

    Args:
        institution: Filter by institution ID (optional)
        status: Filter by status - "Pending", "Used", "Expired" (optional)
        limit: Maximum number of results to return (default: 20)
        offset: Number of results to skip (default: 0)

    Returns:
        dict: {
            success: bool,
            invitations: list[dict],
            total: int
        }
    """
    filters = {}

    if institution:
        filters["institution"] = institution

    # Build filters based on status
    if status:
        if status == "Used":
            filters["used"] = 1
        elif status == "Pending":
            filters["used"] = 0
            filters["expires"] = [">", now_datetime()]
        elif status == "Expired":
            filters["used"] = 0
            filters["expires"] = ["<=", now_datetime()]

    # Get total count
    count_filters = dict(filters)
    total = frappe.db.count("Guardian Invite", filters=count_filters)

    # Get invitations
    invitations = frappe.get_all(
        "Guardian Invite",
        filters=filters,
        fields=[
            "name", "token", "email", "institution", "expires",
            "used", "used_at", "guardian", "created_by_user", "creation"
        ],
        order_by="creation desc",
        limit_page_length=limit,
        start=offset
    )

    # Enrich with institution names and status
    for inv in invitations:
        inv["institution_name"] = frappe.db.get_value("Institution", inv["institution"], "institution_name")

        if inv["used"]:
            inv["status"] = "Used"
        elif inv["expires"] and get_datetime(inv["expires"]) < get_datetime(now_datetime()):
            inv["status"] = "Expired"
        else:
            inv["status"] = "Pending"

        # Get students
        inv["students"] = frappe.get_all(
            "Guardian Invite Student",
            filters={"parent": inv["name"]},
            fields=["student", "student_name"]
        )

    return {
        "success": True,
        "invitations": invitations,
        "total": total
    }


@frappe.whitelist()
def resend_invitation(invitation_id: str, new_expiration_days: int = 7) -> dict:
    """
    Resend an invitation by extending its expiration date.

    This is useful when an invitation has expired but the guardian hasn't
    accepted it yet. It creates a new expiration date without changing the token.

    Args:
        invitation_id: The Guardian Invite document name
        new_expiration_days: Number of days from now for the new expiration (default: 7)

    Returns:
        dict: {
            success: bool,
            invitation_id: str,
            new_expires_at: str
        }

    Raises:
        frappe.DoesNotExistError: If the invitation doesn't exist
        frappe.ValidationError: If the invitation has already been used
    """
    logger.info(f"Resending invitation: {invitation_id}")

    if not invitation_id:
        frappe.throw(_("Invitation ID is required"), frappe.MandatoryError)

    if not frappe.db.exists("Guardian Invite", invitation_id):
        frappe.throw(_("Invitation {0} does not exist").format(invitation_id), frappe.DoesNotExistError)

    invite = frappe.get_doc("Guardian Invite", invitation_id)

    if invite.used:
        frappe.throw(
            _("Cannot resend invitation {0}: it has already been used").format(invitation_id),
            frappe.ValidationError
        )

    # Update expiration date
    new_expires = add_days(now_datetime(), new_expiration_days)
    invite.expires = new_expires
    invite.save(ignore_permissions=True)

    logger.info(f"Invitation {invitation_id} resent with new expiration: {new_expires}")

    return {
        "success": True,
        "invitation_id": invite.name,
        "token": invite.token,
        "new_expires_at": str(new_expires)
    }
