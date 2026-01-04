# Copyright (c) 2024, Kairos and contributors
# For license information, please see license.txt

"""
Kairos CLI Commands

This module provides custom bench commands for Kairos app administration.

Usage:
    bench --site <site> kairos setup-demo
    bench --site <site> kairos cleanup-demo
"""

import click
import frappe
from frappe.commands import pass_context, get_site


@click.group()
def kairos():
    """Kairos app management commands."""
    pass


@click.command("setup-demo")
@click.option("--institution", default="demo", help="Institution identifier for demo data")
@pass_context
def setup_demo(context, institution):
    """
    Set up demo data for a trial tenant.

    Creates a complete school structure with sample data including:
    - 1 Institution
    - 1 Campus
    - 4 Grades
    - 8 Sections (2 per grade)
    - 8 Students (2 per grade)
    - 3 News articles
    - 2 School events

    Example:
        bench --site mysite.local kairos setup-demo
        bench --site mysite.local kairos setup-demo --institution mi_colegio
    """
    site = get_site(context)

    frappe.init(site=site)
    frappe.connect()

    try:
        from kairos.kairos.fixtures.demo_data import setup_demo_data
        result = setup_demo_data(institution_name=institution)
        click.echo(click.style("\nDemo data setup completed successfully!", fg="green"))
    except Exception as e:
        click.echo(click.style(f"\nError setting up demo data: {str(e)}", fg="red"))
        raise
    finally:
        frappe.destroy()


@click.command("cleanup-demo")
@click.option("--institution", default="Colegio Demo Kairos", help="Institution name to clean up")
@click.option("--force", is_flag=True, help="Skip confirmation prompt")
@pass_context
def cleanup_demo(context, institution, force):
    """
    Remove all demo data for a tenant.

    WARNING: This will permanently delete all data associated with the demo institution.

    Example:
        bench --site mysite.local kairos cleanup-demo
        bench --site mysite.local kairos cleanup-demo --force
        bench --site mysite.local kairos cleanup-demo --institution "Mi Colegio Demo"
    """
    site = get_site(context)

    if not force:
        click.confirm(
            f"\nThis will permanently delete all data for institution '{institution}'.\n"
            "Are you sure you want to continue?",
            abort=True
        )

    frappe.init(site=site)
    frappe.connect()

    try:
        from kairos.kairos.fixtures.demo_data import cleanup_demo_data
        result = cleanup_demo_data(institution_name=institution)
        click.echo(click.style("\nDemo data cleanup completed successfully!", fg="green"))
    except Exception as e:
        click.echo(click.style(f"\nError cleaning up demo data: {str(e)}", fg="red"))
        raise
    finally:
        frappe.destroy()


# Register commands with the group
kairos.add_command(setup_demo)
kairos.add_command(cleanup_demo)

# This is used by frappe to discover commands
commands = [kairos]
