import frappe
from frappe import _
from frappe.utils import now_datetime

def get_context(context):
    """Get context for News page."""
    context.no_cache = 1
    context.title = _("Noticias")

    if frappe.session.user == "Guest":
        frappe.throw(_("Please login to view this page"), frappe.PermissionError)

    # Get guardian linked to current user
    guardian = frappe.db.get_value("Guardian", {"user": frappe.session.user}, "name")

    if not guardian:
        context.news_list = []
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

    # Get published news
    now = now_datetime()
    news_filters = [
        ["status", "=", "Published"],
        ["publish_date", "<=", now]
    ]

    all_news = frappe.get_all(
        "News",
        filters=news_filters,
        fields=[
            "name", "title", "slug", "summary", "content", "featured_image",
            "author_name", "publish_date", "category", "is_featured", "is_pinned",
            "audience_type", "audience_campus", "audience_grade", "target_section"
        ],
        order_by="is_pinned desc, is_featured desc, publish_date desc",
        limit=30
    )

    # Filter news by audience relevance
    news_list = []
    for news in all_news:
        # Check if news is relevant to this guardian's students
        if news.audience_type == "All School":
            news_list.append(news)
        elif news.audience_type == "Campus":
            if ("campus", news.audience_campus) in student_filters:
                news_list.append(news)
        elif news.audience_type == "Grade":
            if ("grade", news.audience_grade) in student_filters:
                news_list.append(news)
        elif news.audience_type == "Section":
            if ("section", news.target_section) in student_filters:
                news_list.append(news)
        else:
            # For other types, include by default
            news_list.append(news)

    # Get category names
    for news in news_list:
        if news.category:
            news["category_name"] = frappe.db.get_value("News Category", news.category, "category_name") or news.category

    context.news_list = news_list
    context.featured_news = [n for n in news_list if n.is_featured][:3]
