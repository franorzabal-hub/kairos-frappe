# Copyright (c) 2024, Kairos and contributors
# For license information, please see license.txt

"""
Demo Data Setup for Kairos

This module creates demo data for new trial tenants.
It sets up a complete school structure with sample data
to showcase the application's features.

Usage:
    bench --site <site> execute kairos.kairos.fixtures.demo_data.setup_demo_data

    Or with custom institution name:
    bench --site <site> execute kairos.kairos.fixtures.demo_data.setup_demo_data --kwargs '{"institution_name": "mi_colegio"}'
"""

import frappe
from frappe import _
from frappe.utils import nowdate, add_days, add_months, getdate, now_datetime
from datetime import datetime, timedelta


# Demo data configuration
DEMO_INSTITUTION = {
    "institution_name": "Colegio Demo Kairos",
    "short_name": "CDK",
    "institution_type": "Private",
    "is_active": 1,
    "address": "Av. Principal 123, Ciudad Demo",
    "primary_contact_email": "info@colegiodemokarios.edu",
    "primary_contact_phone": "+1 555-0100",
    "website": "https://colegiodemokarios.edu",
}

DEMO_CAMPUS = {
    "campus_name": "Campus Principal",
    "campus_code": "MAIN",
    "is_active": 1,
    "academic_levels": "Both",
    "address_line_1": "Av. Principal 123",
    "city": "Ciudad Demo",
    "state": "Estado Demo",
    "postal_code": "12345",
    "email": "campus.principal@colegiodemokarios.edu",
    "phone": "+1 555-0101",
    "timezone": "America/Mexico_City",
    "max_capacity": 500,
}

DEMO_GRADES = [
    {
        "grade_name": "1er Grado",
        "grade_code": "G1",
        "sequence": 1,
        "age_range_min": 6,
        "age_range_max": 7,
        "description": "Primer grado de primaria",
        "is_active": 1,
    },
    {
        "grade_name": "2do Grado",
        "grade_code": "G2",
        "sequence": 2,
        "age_range_min": 7,
        "age_range_max": 8,
        "description": "Segundo grado de primaria",
        "is_active": 1,
    },
    {
        "grade_name": "3er Grado",
        "grade_code": "G3",
        "sequence": 3,
        "age_range_min": 8,
        "age_range_max": 9,
        "description": "Tercer grado de primaria",
        "is_active": 1,
    },
    {
        "grade_name": "4to Grado",
        "grade_code": "G4",
        "sequence": 4,
        "age_range_min": 9,
        "age_range_max": 10,
        "description": "Cuarto grado de primaria",
        "is_active": 1,
    },
]

DEMO_SECTIONS = ["A", "B"]  # 2 sections per grade

DEMO_STUDENTS = [
    # Grade 1 students
    {"first_name": "Maria", "last_name": "Garcia", "gender": "Female", "grade_index": 0, "section": "A"},
    {"first_name": "Juan", "last_name": "Perez", "gender": "Male", "grade_index": 0, "section": "B"},
    # Grade 2 students
    {"first_name": "Sofia", "last_name": "Rodriguez", "gender": "Female", "grade_index": 1, "section": "A"},
    {"first_name": "Carlos", "last_name": "Martinez", "gender": "Male", "grade_index": 1, "section": "B"},
    # Grade 3 students
    {"first_name": "Valentina", "last_name": "Lopez", "gender": "Female", "grade_index": 2, "section": "A"},
    {"first_name": "Miguel", "last_name": "Hernandez", "gender": "Male", "grade_index": 2, "section": "B"},
    # Grade 4 students
    {"first_name": "Isabella", "last_name": "Gonzalez", "gender": "Female", "grade_index": 3, "section": "A"},
    {"first_name": "Daniel", "last_name": "Sanchez", "gender": "Male", "grade_index": 3, "section": "B"},
]

DEMO_NEWS = [
    {
        "title": "Bienvenidos al nuevo ciclo escolar",
        "summary": "Estamos emocionados de dar inicio a un nuevo ciclo escolar lleno de aprendizaje y experiencias.",
        "content": """
            <h3>Bienvenidos a todos!</h3>
            <p>Es un placer darles la bienvenida a este nuevo ciclo escolar en el Colegio Demo Kairos.</p>
            <p>Este ano hemos preparado muchas actividades y mejoras para ofrecer la mejor experiencia educativa:</p>
            <ul>
                <li>Nuevos laboratorios de ciencias</li>
                <li>Programa de lectura ampliado</li>
                <li>Actividades deportivas adicionales</li>
                <li>Talleres de arte y musica</li>
            </ul>
            <p>Esperamos contar con su apoyo y participacion durante todo el ciclo escolar.</p>
            <p><strong>Juntos hacemos la diferencia!</strong></p>
        """,
        "status": "Published",
        "is_pinned": 1,
        "is_featured": 1,
        "allow_comments": 1,
        "scope_type": "Institution",
    },
    {
        "title": "Reunion de padres - Viernes",
        "summary": "Invitamos a todos los padres de familia a nuestra primera reunion del ciclo escolar.",
        "content": """
            <h3>Primera Reunion de Padres de Familia</h3>
            <p>Los invitamos cordialmente a la primera reunion de padres de familia del ciclo escolar.</p>
            <p><strong>Fecha:</strong> Viernes proximo</p>
            <p><strong>Hora:</strong> 5:00 PM</p>
            <p><strong>Lugar:</strong> Auditorio principal del campus</p>
            <h4>Agenda:</h4>
            <ol>
                <li>Presentacion del equipo docente</li>
                <li>Objetivos academicos del ciclo</li>
                <li>Calendario de actividades</li>
                <li>Sesion de preguntas y respuestas</li>
            </ol>
            <p>Su asistencia es muy importante para nosotros.</p>
        """,
        "status": "Published",
        "is_pinned": 0,
        "is_featured": 0,
        "allow_comments": 1,
        "scope_type": "Institution",
    },
    {
        "title": "Actividades extracurriculares disponibles",
        "summary": "Conoce las actividades extracurriculares disponibles para este ciclo escolar.",
        "content": """
            <h3>Actividades Extracurriculares 2024-2025</h3>
            <p>Este ciclo escolar ofrecemos una variedad de actividades extracurriculares para el desarrollo integral de nuestros estudiantes:</p>
            <h4>Deportes:</h4>
            <ul>
                <li>Futbol - Lunes y Miercoles</li>
                <li>Basquetbol - Martes y Jueves</li>
                <li>Natacion - Viernes</li>
            </ul>
            <h4>Arte y Cultura:</h4>
            <ul>
                <li>Pintura y Dibujo - Lunes</li>
                <li>Musica - Martes</li>
                <li>Teatro - Miercoles</li>
                <li>Danza - Jueves</li>
            </ul>
            <h4>Academicas:</h4>
            <ul>
                <li>Club de Ciencias - Lunes</li>
                <li>Club de Lectura - Martes</li>
                <li>Robotica - Miercoles</li>
                <li>Idiomas - Jueves</li>
            </ul>
            <p>Las inscripciones estan abiertas. Consulte con la coordinacion del campus.</p>
        """,
        "status": "Published",
        "is_pinned": 0,
        "is_featured": 1,
        "allow_comments": 0,
        "scope_type": "Institution",
    },
]

DEMO_EVENTS = [
    {
        "event_name": "Dia de la Familia",
        "summary": "Un dia especial para celebrar a nuestras familias con actividades divertidas.",
        "description": """
            <h3>Celebremos juntos el Dia de la Familia</h3>
            <p>Invitamos a todas las familias de nuestra comunidad escolar a celebrar este dia especial.</p>
            <h4>Actividades programadas:</h4>
            <ul>
                <li>9:00 AM - Ceremonia de bienvenida</li>
                <li>9:30 AM - Juegos familiares</li>
                <li>11:00 AM - Presentacion artistica de alumnos</li>
                <li>12:00 PM - Convivio familiar</li>
                <li>2:00 PM - Clausura</li>
            </ul>
            <p><strong>Lugar:</strong> Explanada principal del campus</p>
            <p>Esperamos contar con la presencia de toda la familia!</p>
        """,
        "status": "Published",
        "location_type": "In-Person",
        "venue_name": "Explanada Principal",
        "venue_address": "Campus Principal - Colegio Demo Kairos",
        "all_day": 0,
        "is_featured": 1,
        "rsvp_enabled": 1,
        "rsvp_options": "Yes-No-Maybe",
        "max_attendees": 200,
        "guests_allowed": 1,
        "max_guests_per_rsvp": 3,
        "scope_type": "Institution",
        "days_from_now": 30,  # 30 days in the future
        "duration_hours": 6,
        "start_hour": 9,
    },
    {
        "event_name": "Feria de Ciencias",
        "summary": "Exhibicion de proyectos cientificos realizados por nuestros estudiantes.",
        "description": """
            <h3>Feria de Ciencias 2024</h3>
            <p>Ven a conocer los increibles proyectos cientificos de nuestros estudiantes.</p>
            <h4>Categorias:</h4>
            <ul>
                <li>Ciencias Naturales</li>
                <li>Fisica y Quimica</li>
                <li>Tecnologia e Innovacion</li>
                <li>Medio Ambiente</li>
            </ul>
            <h4>Premiacion:</h4>
            <p>Se otorgaran reconocimientos a los mejores proyectos de cada categoria.</p>
            <p><strong>Jurado:</strong> Profesores y expertos invitados</p>
            <p>Entrada libre para padres de familia y publico en general.</p>
        """,
        "status": "Published",
        "location_type": "In-Person",
        "venue_name": "Gimnasio Escolar",
        "venue_address": "Campus Principal - Colegio Demo Kairos",
        "all_day": 0,
        "is_featured": 1,
        "rsvp_enabled": 1,
        "rsvp_options": "Yes-No",
        "max_attendees": 300,
        "guests_allowed": 1,
        "max_guests_per_rsvp": 2,
        "scope_type": "Institution",
        "days_from_now": 45,  # 45 days in the future
        "duration_hours": 4,
        "start_hour": 10,
    },
]


def setup_demo_data(institution_name="demo"):
    """
    Create all demo data for a tenant.

    Args:
        institution_name: Identifier for the demo institution (used for naming)

    Returns:
        dict: Summary of created records
    """
    frappe.flags.ignore_permissions = True

    summary = {
        "institution": None,
        "campus": None,
        "grades": [],
        "sections": [],
        "students": [],
        "news": [],
        "events": [],
    }

    try:
        # Create Institution
        institution = create_institution(institution_name)
        summary["institution"] = institution.name
        frappe.db.commit()

        # Create Campus
        campus = create_campus(institution.name)
        summary["campus"] = campus.name
        frappe.db.commit()

        # Create Grades
        grades = create_grades(campus.name)
        summary["grades"] = [g.name for g in grades]
        frappe.db.commit()

        # Create Sections
        sections = create_sections(grades)
        summary["sections"] = [s.name for s in sections]
        frappe.db.commit()

        # Create Students
        students = create_students(institution.name, campus.name, grades, sections)
        summary["students"] = [s.name for s in students]
        frappe.db.commit()

        # Create News
        news_list = create_news(institution.name, campus.name)
        summary["news"] = [n.name for n in news_list]
        frappe.db.commit()

        # Create Events
        events = create_events(institution.name, campus.name)
        summary["events"] = [e.name for e in events]
        frappe.db.commit()

        print_summary(summary)

    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(f"Error creating demo data: {str(e)}")
        raise
    finally:
        frappe.flags.ignore_permissions = False

    return summary


def create_institution(identifier):
    """Create the demo institution."""
    # Check if demo institution already exists
    existing = frappe.db.get_value(
        "Institution",
        {"institution_name": DEMO_INSTITUTION["institution_name"]},
        "name"
    )

    if existing:
        print(f"Institution already exists: {existing}")
        return frappe.get_doc("Institution", existing)

    institution = frappe.get_doc({
        "doctype": "Institution",
        **DEMO_INSTITUTION
    })
    institution.insert()
    print(f"Created Institution: {institution.name}")
    return institution


def create_campus(institution_name):
    """Create the demo campus."""
    # Check if campus already exists
    existing = frappe.db.get_value(
        "Campus",
        {
            "institution": institution_name,
            "campus_name": DEMO_CAMPUS["campus_name"]
        },
        "name"
    )

    if existing:
        print(f"Campus already exists: {existing}")
        return frappe.get_doc("Campus", existing)

    campus = frappe.get_doc({
        "doctype": "Campus",
        "institution": institution_name,
        **DEMO_CAMPUS
    })
    campus.insert()
    print(f"Created Campus: {campus.name}")
    return campus


def create_grades(campus_name):
    """Create the demo grades."""
    grades = []

    for grade_data in DEMO_GRADES:
        # Check if grade already exists
        existing = frappe.db.get_value(
            "Grade",
            {
                "campus": campus_name,
                "grade_code": grade_data["grade_code"]
            },
            "name"
        )

        if existing:
            print(f"Grade already exists: {existing}")
            grades.append(frappe.get_doc("Grade", existing))
            continue

        grade = frappe.get_doc({
            "doctype": "Grade",
            "campus": campus_name,
            **grade_data
        })
        grade.insert()
        grades.append(grade)
        print(f"Created Grade: {grade.name} ({grade.grade_name})")

    return grades


def create_sections(grades):
    """Create sections for each grade."""
    sections = []

    for grade in grades:
        for section_name in DEMO_SECTIONS:
            # Check if section already exists
            existing = frappe.db.get_value(
                "Section",
                {
                    "grade": grade.name,
                    "section_name": section_name
                },
                "name"
            )

            if existing:
                print(f"Section already exists: {existing}")
                sections.append(frappe.get_doc("Section", existing))
                continue

            section = frappe.get_doc({
                "doctype": "Section",
                "grade": grade.name,
                "section_name": section_name,
                "section_code": f"{grade.grade_code}-{section_name}",
                "max_students": 30,
                "schedule_type": "Full Day",
                "is_active": 1,
            })
            section.insert()
            sections.append(section)
            print(f"Created Section: {section.name} ({grade.grade_name} - {section_name})")

    return sections


def create_students(institution_name, campus_name, grades, sections):
    """Create demo students."""
    students = []

    # Create a map of sections by grade and section name
    section_map = {}
    for section in sections:
        grade_name = section.grade
        sec_name = section.section_name
        section_map[(grade_name, sec_name)] = section

    for student_data in DEMO_STUDENTS:
        grade_index = student_data["grade_index"]
        section_name = student_data["section"]
        grade = grades[grade_index]
        section = section_map.get((grade.name, section_name))

        # Check if student already exists
        existing = frappe.db.get_value(
            "Student",
            {
                "first_name": student_data["first_name"],
                "last_name": student_data["last_name"],
                "institution": institution_name
            },
            "name"
        )

        if existing:
            print(f"Student already exists: {existing}")
            students.append(frappe.get_doc("Student", existing))
            continue

        # Calculate date of birth based on grade age range
        today = getdate(nowdate())
        birth_year = today.year - grade.age_range_min - 1
        date_of_birth = f"{birth_year}-06-15"  # June 15 of calculated year

        student = frappe.get_doc({
            "doctype": "Student",
            "first_name": student_data["first_name"],
            "last_name": student_data["last_name"],
            "gender": student_data["gender"],
            "date_of_birth": date_of_birth,
            "institution": institution_name,
            "campus": campus_name,
            "current_grade": grade.name,
            "current_section": section.name if section else None,
            "status": "Active",
            "enrollment_date": add_months(nowdate(), -6),  # 6 months ago
        })
        student.insert()
        students.append(student)
        print(f"Created Student: {student.name} ({student.full_name})")

    return students


def create_news(institution_name, campus_name):
    """Create demo news articles."""
    news_list = []

    # Get current user as author
    author = frappe.session.user

    for i, news_data in enumerate(DEMO_NEWS):
        # Check if news already exists by title
        existing = frappe.db.get_value(
            "News",
            {
                "title": news_data["title"],
                "institution": institution_name
            },
            "name"
        )

        if existing:
            print(f"News already exists: {existing}")
            news_list.append(frappe.get_doc("News", existing))
            continue

        # Calculate publish date (staggered: today, yesterday, 2 days ago)
        publish_date = add_days(now_datetime(), -i)

        news = frappe.get_doc({
            "doctype": "News",
            "title": news_data["title"],
            "summary": news_data["summary"],
            "content": news_data["content"],
            "status": news_data["status"],
            "is_pinned": news_data["is_pinned"],
            "is_featured": news_data["is_featured"],
            "allow_comments": news_data["allow_comments"],
            "scope_type": news_data["scope_type"],
            "institution": institution_name,
            "campus": campus_name if news_data["scope_type"] != "Institution" else None,
            "author": author,
            "publish_date": publish_date,
            "views_count": (3 - i) * 25,  # Simulated view counts
        })
        news.insert()
        news_list.append(news)
        print(f"Created News: {news.name} ({news.title})")

    return news_list


def create_events(institution_name, campus_name):
    """Create demo school events."""
    events = []

    # Get current user as organizer
    organizer = frappe.session.user

    for event_data in DEMO_EVENTS:
        # Check if event already exists
        existing = frappe.db.get_value(
            "School Event",
            {
                "event_name": event_data["event_name"],
                "institution": institution_name
            },
            "name"
        )

        if existing:
            print(f"Event already exists: {existing}")
            events.append(frappe.get_doc("School Event", existing))
            continue

        # Calculate event dates
        days_from_now = event_data.get("days_from_now", 30)
        duration_hours = event_data.get("duration_hours", 4)
        start_hour = event_data.get("start_hour", 9)

        event_date = add_days(nowdate(), days_from_now)
        start_datetime = f"{event_date} {start_hour:02d}:00:00"
        end_datetime = f"{event_date} {start_hour + duration_hours:02d}:00:00"

        # RSVP deadline is 2 days before the event
        rsvp_deadline = f"{add_days(event_date, -2)} 23:59:59"

        event = frappe.get_doc({
            "doctype": "School Event",
            "event_name": event_data["event_name"],
            "summary": event_data["summary"],
            "description": event_data["description"],
            "status": event_data["status"],
            "location_type": event_data["location_type"],
            "venue_name": event_data["venue_name"],
            "venue_address": event_data["venue_address"],
            "all_day": event_data["all_day"],
            "is_featured": event_data["is_featured"],
            "rsvp_enabled": event_data["rsvp_enabled"],
            "rsvp_options": event_data["rsvp_options"],
            "max_attendees": event_data["max_attendees"],
            "guests_allowed": event_data["guests_allowed"],
            "max_guests_per_rsvp": event_data["max_guests_per_rsvp"],
            "scope_type": event_data["scope_type"],
            "institution": institution_name,
            "campus": campus_name if event_data["scope_type"] != "Institution" else None,
            "organizer": organizer,
            "start_datetime": start_datetime,
            "end_datetime": end_datetime,
            "rsvp_deadline": rsvp_deadline,
            "publish_date": now_datetime(),
            "views_count": 15,
        })
        event.insert()
        events.append(event)
        print(f"Created Event: {event.name} ({event.event_name})")

    return events


def print_summary(summary):
    """Print a summary of created records."""
    print("\n" + "=" * 50)
    print("DEMO DATA SETUP COMPLETE")
    print("=" * 50)
    print(f"\nInstitution: {summary['institution']}")
    print(f"Campus: {summary['campus']}")
    print(f"Grades: {len(summary['grades'])}")
    print(f"Sections: {len(summary['sections'])}")
    print(f"Students: {len(summary['students'])}")
    print(f"News: {len(summary['news'])}")
    print(f"Events: {len(summary['events'])}")
    print("\n" + "=" * 50)
    print("\nDemo data is ready for use!")
    print("=" * 50 + "\n")


def cleanup_demo_data(institution_name="Colegio Demo Kairos"):
    """
    Remove all demo data for a tenant.

    Use with caution! This will delete all records associated with the demo institution.

    Args:
        institution_name: Name of the institution to clean up

    Returns:
        dict: Summary of deleted records
    """
    frappe.flags.ignore_permissions = True

    summary = {
        "events_deleted": 0,
        "news_deleted": 0,
        "students_deleted": 0,
        "sections_deleted": 0,
        "grades_deleted": 0,
        "campus_deleted": 0,
        "institution_deleted": 0,
    }

    try:
        institution = frappe.db.get_value("Institution", {"institution_name": institution_name}, "name")

        if not institution:
            print(f"Institution '{institution_name}' not found")
            return summary

        # Delete in reverse order of dependencies

        # Delete Events
        events = frappe.get_all("School Event", filters={"institution": institution})
        for event in events:
            frappe.delete_doc("School Event", event.name, force=True)
            summary["events_deleted"] += 1

        # Delete News
        news_list = frappe.get_all("News", filters={"institution": institution})
        for news in news_list:
            frappe.delete_doc("News", news.name, force=True)
            summary["news_deleted"] += 1

        # Delete Students
        students = frappe.get_all("Student", filters={"institution": institution})
        for student in students:
            frappe.delete_doc("Student", student.name, force=True)
            summary["students_deleted"] += 1

        # Get campus
        campus = frappe.db.get_value("Campus", {"institution": institution}, "name")

        if campus:
            # Delete Sections
            grades = frappe.get_all("Grade", filters={"campus": campus})
            for grade in grades:
                sections = frappe.get_all("Section", filters={"grade": grade.name})
                for section in sections:
                    frappe.delete_doc("Section", section.name, force=True)
                    summary["sections_deleted"] += 1

            # Delete Grades
            for grade in grades:
                frappe.delete_doc("Grade", grade.name, force=True)
                summary["grades_deleted"] += 1

            # Delete Campus
            frappe.delete_doc("Campus", campus, force=True)
            summary["campus_deleted"] = 1

        # Delete Institution
        frappe.delete_doc("Institution", institution, force=True)
        summary["institution_deleted"] = 1

        frappe.db.commit()

        print("\n" + "=" * 50)
        print("DEMO DATA CLEANUP COMPLETE")
        print("=" * 50)
        print(f"\nInstitution deleted: {summary['institution_deleted']}")
        print(f"Campus deleted: {summary['campus_deleted']}")
        print(f"Grades deleted: {summary['grades_deleted']}")
        print(f"Sections deleted: {summary['sections_deleted']}")
        print(f"Students deleted: {summary['students_deleted']}")
        print(f"News deleted: {summary['news_deleted']}")
        print(f"Events deleted: {summary['events_deleted']}")
        print("=" * 50 + "\n")

    except Exception as e:
        frappe.db.rollback()
        frappe.log_error(f"Error cleaning up demo data: {str(e)}")
        raise
    finally:
        frappe.flags.ignore_permissions = False

    return summary
