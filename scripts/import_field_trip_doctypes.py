import frappe
import json

frappe.connect('kairos.localhost')

# Import child tables first
doctypes = [
    'field_trip_section',
    'field_trip_staff',
    'field_trip',
    'field_trip_student'
]

for dt in doctypes:
    json_path = f'/home/frappe/frappe-bench/apps/kairos/kairos/doctype/{dt}/{dt}.json'
    with open(json_path) as f:
        doctype_data = json.load(f)

    doctype_name = doctype_data.get('name')

    # Delete if exists and recreate
    if frappe.db.exists('DocType', doctype_name):
        frappe.delete_doc('DocType', doctype_name, force=True)
        frappe.db.commit()
        print(f'Deleted existing: {doctype_name}')

    doc = frappe.get_doc(doctype_data)
    doc.insert(ignore_permissions=True)
    frappe.db.commit()
    print(f'Created: {doctype_name}')

print('All Field Trip DocTypes imported successfully!')
