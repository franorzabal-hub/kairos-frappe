/**
 * Frappe Types
 *
 * TypeScript type definitions for Frappe framework entities
 */

/**
 * Base document interface - all Frappe documents have these fields
 */
export interface FrappeDoc {
  name: string;
  owner: string;
  creation: string;
  modified: string;
  modified_by: string;
  docstatus: 0 | 1 | 2; // 0: Draft, 1: Submitted, 2: Cancelled
  doctype: string;
}

/**
 * DocType field definition
 */
export interface DocTypeField {
  fieldname: string;
  fieldtype: FieldType;
  label: string;
  options?: string; // For Select: options list; For Link: linked DocType
  reqd?: 0 | 1;
  read_only?: 0 | 1;
  hidden?: 0 | 1;
  in_list_view?: 0 | 1;
  in_standard_filter?: 0 | 1;
  default?: string;
  description?: string;
  depends_on?: string;
  mandatory_depends_on?: string;
  read_only_depends_on?: string;
  // Permission level - fields with higher perm_level require additional permissions
  perm_level?: number;
  // Computed permission state (set by permission calculation)
  _perms?: {
    read: boolean;
    write: boolean;
  };
}

/**
 * Frappe field types
 */
export type FieldType =
  | "Data"
  | "Select"
  | "Link"
  | "Date"
  | "Datetime"
  | "Time"
  | "Int"
  | "Float"
  | "Currency"
  | "Check"
  | "Text"
  | "Small Text"
  | "Long Text"
  | "Text Editor"
  | "HTML"
  | "Password"
  | "Read Only"
  | "Attach"
  | "Attach Image"
  | "Table"
  | "Section Break"
  | "Column Break"
  | "Tab Break"
  | "Table MultiSelect"
  | "MultiSelect";

/**
 * DocType metadata
 */
export interface DocTypeMeta {
  name: string;
  module: string;
  fields: DocTypeField[];
  is_submittable: 0 | 1;
  is_tree: 0 | 1;
  is_single: 0 | 1;
  quick_entry: 0 | 1;
  title_field?: string;
  image_field?: string;
  search_fields?: string;
  permissions: DocTypePermission[];
}

/**
 * DocType permission
 */
export interface DocTypePermission {
  role: string;
  permlevel?: number; // Permission level this applies to (default 0)
  read: 0 | 1;
  write: 0 | 1;
  create: 0 | 1;
  delete: 0 | 1;
  submit: 0 | 1;
  cancel: 0 | 1;
  amend: 0 | 1;
  // If owner restriction applies
  if_owner?: 0 | 1;
}

/**
 * User's effective permissions for a DocType
 * This comes from frappe.desk.form.load.getdoctype response
 */
export interface UserDocTypePermissions {
  // Permission levels the user can read
  read?: number[];
  // Permission levels the user can write
  write?: number[];
  // Standard permissions
  create?: boolean;
  delete?: boolean;
  submit?: boolean;
  cancel?: boolean;
  amend?: boolean;
}

/**
 * API response wrapper
 */
export interface FrappeResponse<T> {
  data: T;
  message?: string;
}

/**
 * List API response
 */
export interface FrappeListResponse<T> {
  data: T[];
}

/**
 * Error response
 */
export interface FrappeError {
  message: string;
  exc_type?: string;
  exc?: string;
  _server_messages?: string;
}
