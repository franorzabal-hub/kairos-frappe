/**
 * useFrappeDocMeta Hook
 *
 * React hook for fetching DocType metadata (field definitions, permissions, etc.)
 */

"use client";

import { useMemo } from "react";
import { useFrappeGetCall } from "frappe-react-sdk";
import { DocTypeMeta, DocTypeField } from "@/types/frappe";
import {
  calculateEffectivePermissions,
  applyFieldPermissions,
  EffectivePermissions,
} from "@/lib/field-permissions";

interface UseFrappeDocMetaOptions {
  doctype: string;
  enabled?: boolean;
  /** User's roles for permission calculation (optional - defaults to full access) */
  userRoles?: string[];
  /** Whether this is for a new document */
  isNewDoc?: boolean;
}

interface UseFrappeDocMetaResult {
  meta: DocTypeMeta | null;
  isLoading: boolean;
  isValidating: boolean;
  error: Error | null;
  mutate: () => void;
  /** Fields marked as in_list_view */
  listViewFields: DocTypeField[];
  /** All visible fields (hidden !== 1, with permissions applied) */
  visibleFields: DocTypeField[];
  /** Required fields (with permissions applied) */
  requiredFields: DocTypeField[];
  /** Title field name */
  titleField: string;
  /** User's effective permissions for this DocType */
  permissions: EffectivePermissions | null;
  /** Fields with permission states applied */
  permissionedFields: DocTypeField[];
}

const LAYOUT_FIELD_TYPES = [
  "Section Break",
  "Column Break", 
  "Tab Break",
  "HTML",
];

export function useFrappeDocMeta({
  doctype,
  enabled = true,
  userRoles,
  isNewDoc = false,
}: UseFrappeDocMetaOptions): UseFrappeDocMetaResult {
  // Use frappe.desk.form.load.getdoctype - the correct endpoint
  const { data, error, isLoading, isValidating, mutate } = useFrappeGetCall<{
    docs: DocTypeMeta[];
  }>(
    "frappe.desk.form.load.getdoctype",
    { doctype, with_parent: 0 },
    enabled ? "doctype_meta_" + doctype : null
  );

  // Extract meta from response - getdoctype returns { docs: [meta] }
  const meta = data?.docs?.[0] ?? null;
  const fields = meta?.fields ?? [];
  const docPermissions = meta?.permissions ?? [];

  // Calculate effective permissions
  const permissions = useMemo(() => {
    if (!meta) return null;
    return calculateEffectivePermissions(docPermissions, userRoles);
  }, [meta, docPermissions, userRoles]);

  // Apply permissions to fields
  const permissionedFields = useMemo(() => {
    if (!permissions) return fields;
    return applyFieldPermissions(fields, permissions, isNewDoc);
  }, [fields, permissions, isNewDoc]);

  // Filter fields based on permissions
  const listViewFields = useMemo(
    () =>
      permissionedFields.filter(
        (field) =>
          field.in_list_view === 1 &&
          field.hidden !== 1 &&
          !LAYOUT_FIELD_TYPES.includes(field.fieldtype)
      ),
    [permissionedFields]
  );

  const visibleFields = useMemo(
    () =>
      permissionedFields.filter(
        (field) =>
          field.hidden !== 1 && !LAYOUT_FIELD_TYPES.includes(field.fieldtype)
      ),
    [permissionedFields]
  );

  const requiredFields = useMemo(
    () =>
      permissionedFields.filter(
        (field) =>
          field.reqd === 1 && !LAYOUT_FIELD_TYPES.includes(field.fieldtype)
      ),
    [permissionedFields]
  );

  const titleField = meta?.title_field || "name";

  return {
    meta,
    isLoading,
    isValidating,
    error: error ? new Error(String(error)) : null,
    mutate,
    listViewFields,
    visibleFields,
    requiredFields,
    titleField,
    permissions,
    permissionedFields,
  };
}

export function getFieldDisplayValue(
  value: unknown,
  field: DocTypeField
): string {
  if (value === null || value === undefined) {
    return "";
  }

  switch (field.fieldtype) {
    case "Check":
      return value ? "Yes" : "No";
    case "Date":
      if (typeof value === "string" && value) {
        try {
          return new Date(value).toLocaleDateString();
        } catch {
          return String(value);
        }
      }
      return String(value);
    case "Datetime":
      if (typeof value === "string" && value) {
        try {
          return new Date(value).toLocaleString();
        } catch {
          return String(value);
        }
      }
      return String(value);
    case "Currency":
    case "Float":
      if (typeof value === "number") {
        return value.toLocaleString();
      }
      return String(value);
    case "Int":
      return String(value);
    default:
      return String(value);
  }
}

export function buildTableColumns(
  fields: DocTypeField[]
): Array<{
  accessorKey: string;
  header: string;
  fieldtype: string;
}> {
  return fields.map((field) => ({
    accessorKey: field.fieldname,
    header: field.label,
    fieldtype: field.fieldtype,
  }));
}
