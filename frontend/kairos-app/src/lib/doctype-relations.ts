/**
 * DocType Relations Configuration
 *
 * Defines the reverse relationships between DocTypes
 * These are used to show related records in tabs
 */

export interface DisplayField {
  /** Field name in the DocType */
  fieldname: string;
  /** Column header label */
  label: string;
  /** Whether this is a link field (to show as clickable) */
  isLink?: boolean;
  /** Target DocType for link fields */
  linkDoctype?: string;
}

export interface RelatedDocTypeConfig {
  /** The related DocType name */
  doctype: string;
  /** Display label for the tab */
  label: string;
  /** The field in the related DocType that links back to this DocType */
  linkField: string;
  /** Icon name from lucide-react */
  icon?: string;
  /** Fields to display in the table */
  displayFields?: DisplayField[];
}

/**
 * Map of DocType -> Related DocTypes
 * Key: DocType name
 * Value: Array of related DocTypes that have Link fields pointing to this DocType
 */
export const DOCTYPE_RELATIONS: Record<string, RelatedDocTypeConfig[]> = {
  Institution: [
    {
      doctype: "Campus",
      label: "Campuses",
      linkField: "institution",
      icon: "building",
      displayFields: [
        { fieldname: "campus_name", label: "Name" },
        { fieldname: "address", label: "Address" },
      ],
    },
    {
      doctype: "Student",
      label: "Students",
      linkField: "institution",
      icon: "users",
      displayFields: [
        { fieldname: "full_name", label: "Name" },
        { fieldname: "current_grade", label: "Grade", isLink: true, linkDoctype: "Grade" },
        { fieldname: "current_section", label: "Section", isLink: true, linkDoctype: "Section" },
      ],
    },
    {
      doctype: "Message",
      label: "Messages",
      linkField: "institution",
      icon: "message-square",
      displayFields: [
        { fieldname: "subject", label: "Subject" },
        { fieldname: "message_type", label: "Type" },
        { fieldname: "status", label: "Status" },
      ],
    },
    {
      doctype: "News",
      label: "News",
      linkField: "institution",
      icon: "newspaper",
      displayFields: [
        { fieldname: "title", label: "Title" },
        { fieldname: "publish_date", label: "Date" },
        { fieldname: "status", label: "Status" },
      ],
    },
    {
      doctype: "School Event",
      label: "Events",
      linkField: "institution",
      icon: "calendar",
      displayFields: [
        { fieldname: "event_name", label: "Event" },
        { fieldname: "event_date", label: "Date" },
        { fieldname: "event_type", label: "Type" },
      ],
    },
  ],
  Campus: [
    {
      doctype: "Grade",
      label: "Grades",
      linkField: "campus",
      icon: "graduation-cap",
      displayFields: [
        { fieldname: "grade_name", label: "Name" },
        { fieldname: "grade_level", label: "Level" },
      ],
    },
    {
      doctype: "Student",
      label: "Students",
      linkField: "campus",
      icon: "users",
      displayFields: [
        { fieldname: "full_name", label: "Name" },
        { fieldname: "current_grade", label: "Grade", isLink: true, linkDoctype: "Grade" },
        { fieldname: "current_section", label: "Section", isLink: true, linkDoctype: "Section" },
      ],
    },
    {
      doctype: "Staff Campus Assignment",
      label: "Staff",
      linkField: "campus",
      icon: "user-check",
      displayFields: [
        { fieldname: "staff", label: "Staff", isLink: true, linkDoctype: "User" },
        { fieldname: "role", label: "Role" },
      ],
    },
    {
      doctype: "News",
      label: "News",
      linkField: "campus",
      icon: "newspaper",
      displayFields: [
        { fieldname: "title", label: "Title" },
        { fieldname: "publish_date", label: "Date" },
      ],
    },
    {
      doctype: "School Event",
      label: "Events",
      linkField: "campus",
      icon: "calendar",
      displayFields: [
        { fieldname: "event_name", label: "Event" },
        { fieldname: "event_date", label: "Date" },
      ],
    },
  ],
  Grade: [
    {
      doctype: "Section",
      label: "Sections",
      linkField: "grade",
      icon: "layers",
      displayFields: [
        { fieldname: "section_name", label: "Name" },
        { fieldname: "capacity", label: "Capacity" },
      ],
    },
    {
      doctype: "Student",
      label: "Students",
      linkField: "current_grade",
      icon: "users",
      displayFields: [
        { fieldname: "full_name", label: "Name" },
        { fieldname: "current_section", label: "Section", isLink: true, linkDoctype: "Section" },
      ],
    },
    {
      doctype: "School Event",
      label: "Events",
      linkField: "grade",
      icon: "calendar",
      displayFields: [
        { fieldname: "event_name", label: "Event" },
        { fieldname: "event_date", label: "Date" },
      ],
    },
  ],
  Section: [
    {
      doctype: "Student",
      label: "Students",
      linkField: "current_section",
      icon: "users",
      displayFields: [
        { fieldname: "full_name", label: "Name" },
        { fieldname: "student_id", label: "ID" },
      ],
    },
    {
      doctype: "Staff Section Assignment",
      label: "Staff",
      linkField: "section",
      icon: "user-check",
      displayFields: [
        { fieldname: "staff", label: "Staff", isLink: true, linkDoctype: "User" },
        { fieldname: "role", label: "Role" },
      ],
    },
    {
      doctype: "School Event",
      label: "Events",
      linkField: "section",
      icon: "calendar",
      displayFields: [
        { fieldname: "event_name", label: "Event" },
        { fieldname: "event_date", label: "Date" },
      ],
    },
  ],
  Student: [
    {
      doctype: "Student Guardian",
      label: "Guardians",
      linkField: "student",
      icon: "user-check",
      displayFields: [
        { fieldname: "guardian", label: "Guardian", isLink: true, linkDoctype: "Guardian" },
        { fieldname: "relationship", label: "Relationship" },
        { fieldname: "is_primary", label: "Primary" },
      ],
    },
    {
      doctype: "Student Campus Assignment",
      label: "Assignments",
      linkField: "student",
      icon: "clipboard-list",
      displayFields: [
        { fieldname: "campus", label: "Campus", isLink: true, linkDoctype: "Campus" },
        { fieldname: "academic_year", label: "Year" },
        { fieldname: "status", label: "Status" },
      ],
    },
    {
      doctype: "Message Recipient",
      label: "Messages",
      linkField: "student",
      icon: "message-square",
      displayFields: [
        { fieldname: "message", label: "Message", isLink: true, linkDoctype: "Message" },
        { fieldname: "read_status", label: "Status" },
      ],
    },
    {
      doctype: "Event RSVP",
      label: "RSVPs",
      linkField: "student",
      icon: "calendar-check",
      displayFields: [
        { fieldname: "event", label: "Event", isLink: true, linkDoctype: "School Event" },
        { fieldname: "response", label: "Response" },
      ],
    },
  ],
  Guardian: [
    {
      doctype: "Student Guardian",
      label: "Students",
      linkField: "guardian",
      icon: "users",
      displayFields: [
        { fieldname: "student", label: "Student", isLink: true, linkDoctype: "Student" },
        { fieldname: "relationship", label: "Relationship" },
        { fieldname: "is_primary", label: "Primary" },
      ],
    },
    {
      doctype: "Message Recipient",
      label: "Messages",
      linkField: "guardian",
      icon: "message-square",
      displayFields: [
        { fieldname: "message", label: "Message", isLink: true, linkDoctype: "Message" },
        { fieldname: "read_status", label: "Status" },
      ],
    },
    {
      doctype: "Message Reply",
      label: "Replies",
      linkField: "guardian",
      icon: "reply",
      displayFields: [
        { fieldname: "message", label: "Message", isLink: true, linkDoctype: "Message" },
        { fieldname: "reply_text", label: "Reply" },
      ],
    },
    {
      doctype: "Event RSVP",
      label: "RSVPs",
      linkField: "guardian",
      icon: "calendar-check",
      displayFields: [
        { fieldname: "event", label: "Event", isLink: true, linkDoctype: "School Event" },
        { fieldname: "response", label: "Response" },
      ],
    },
  ],
  Message: [
    {
      doctype: "Message Recipient",
      label: "Recipients",
      linkField: "message",
      icon: "users",
      displayFields: [
        { fieldname: "student", label: "Student", isLink: true, linkDoctype: "Student" },
        { fieldname: "guardian", label: "Guardian", isLink: true, linkDoctype: "Guardian" },
        { fieldname: "read_status", label: "Status" },
      ],
    },
    {
      doctype: "Message Reply",
      label: "Replies",
      linkField: "message",
      icon: "reply",
      displayFields: [
        { fieldname: "guardian", label: "Guardian", isLink: true, linkDoctype: "Guardian" },
        { fieldname: "reply_text", label: "Reply" },
        { fieldname: "creation", label: "Date" },
      ],
    },
  ],
  News: [
    {
      doctype: "News Comment",
      label: "Comments",
      linkField: "news",
      icon: "message-square",
      displayFields: [
        { fieldname: "comment_by", label: "By" },
        { fieldname: "comment", label: "Comment" },
        { fieldname: "creation", label: "Date" },
      ],
    },
  ],
  "School Event": [
    {
      doctype: "Event RSVP",
      label: "RSVPs",
      linkField: "event",
      icon: "calendar-check",
      displayFields: [
        { fieldname: "student", label: "Student", isLink: true, linkDoctype: "Student" },
        { fieldname: "guardian", label: "Guardian", isLink: true, linkDoctype: "Guardian" },
        { fieldname: "response", label: "Response" },
      ],
    },
    {
      doctype: "Event Reminder",
      label: "Reminders",
      linkField: "event",
      icon: "bell",
      displayFields: [
        { fieldname: "reminder_date", label: "Date" },
        { fieldname: "reminder_type", label: "Type" },
        { fieldname: "status", label: "Status" },
      ],
    },
  ],
};

/**
 * Get related DocTypes for a given DocType
 */
export function getRelatedDocTypes(doctype: string): RelatedDocTypeConfig[] {
  return DOCTYPE_RELATIONS[doctype] ?? [];
}
