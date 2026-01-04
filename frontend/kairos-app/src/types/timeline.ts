/**
 * Timeline Types
 *
 * TypeScript type definitions for the timeline/comments system
 */

/**
 * Timeline item types - different kinds of activity that can appear
 */
export type TimelineItemType =
  | "Comment"
  | "Edit"
  | "Creation"
  | "Assignment"
  | "Share"
  | "Attachment"
  | "Email"
  | "Workflow"
  | "Like"
  | "Info";

/**
 * Base timeline item interface
 */
export interface TimelineItem {
  name: string;
  type: TimelineItemType;
  owner: string;
  owner_name?: string;
  user_image?: string;
  creation: string;
  content?: string;
}

/**
 * Comment timeline item
 */
export interface CommentItem extends TimelineItem {
  type: "Comment";
  comment_type: "Comment" | "Like" | "Info" | "Edit" | "Created" | "Workflow" | "Shared" | "Assigned" | "Attachment";
  content: string;
  comment_email?: string;
}

/**
 * Edit/Version timeline item
 */
export interface EditItem extends TimelineItem {
  type: "Edit";
  changes: FieldChange[];
}

/**
 * Field change in an edit
 */
export interface FieldChange {
  fieldname: string;
  label: string;
  old_value: string | number | null;
  new_value: string | number | null;
}

/**
 * Assignment timeline item
 */
export interface AssignmentItem extends TimelineItem {
  type: "Assignment";
  assigned_to: string;
  assigned_to_name?: string;
}

/**
 * Share timeline item
 */
export interface ShareItem extends TimelineItem {
  type: "Share";
  shared_with: string;
  shared_with_name?: string;
}

/**
 * Attachment timeline item
 */
export interface AttachmentItem extends TimelineItem {
  type: "Attachment";
  file_name: string;
  file_url: string;
}

/**
 * Email timeline item
 */
export interface EmailItem extends TimelineItem {
  type: "Email";
  sender: string;
  recipients: string;
  subject: string;
  sent: boolean;
}

/**
 * Communication data from Frappe API
 */
export interface CommunicationData {
  name: string;
  communication_type: string;
  comment_type?: string;
  reference_doctype: string;
  reference_name: string;
  subject?: string;
  content: string;
  sender?: string;
  recipients?: string;
  creation: string;
  owner: string;
  owner_name?: string;
  user_image?: string;
}

/**
 * Version data from Frappe API
 */
export interface VersionData {
  name: string;
  owner: string;
  owner_name?: string;
  user_image?: string;
  creation: string;
  data: string; // JSON string containing changes
}

/**
 * Parsed version change
 */
export interface ParsedVersionChange {
  changed: Array<[string, unknown, unknown]>;
  added: Array<[string, Record<string, unknown>[]]>;
  removed: Array<[string, Record<string, unknown>[]]>;
}

/**
 * Timeline API response structure
 */
export interface TimelineResponse {
  communications: CommunicationData[];
  versions: VersionData[];
}

/**
 * User mention for @mentions feature
 */
export interface UserMention {
  name: string;
  full_name: string;
  user_image?: string;
  email?: string;
}

/**
 * Comment creation payload
 */
export interface CreateCommentPayload {
  doctype: "Comment";
  comment_type: "Comment";
  reference_doctype: string;
  reference_name: string;
  content: string;
}
