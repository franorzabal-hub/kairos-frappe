/**
 * Field-Level Permissions
 *
 * Utilities for calculating and applying field-level permissions
 * based on Frappe's permission system.
 *
 * In Frappe:
 * - Each field has a perm_level (default 0)
 * - Each role has read/write permissions for different perm_levels
 * - If user can't read a perm_level, field is hidden
 * - If user can read but not write a perm_level, field is read_only
 */

import { DocTypeField, DocTypePermission } from "@/types/frappe";

/**
 * User's effective permission levels
 */
export interface EffectivePermissions {
  /** Permission levels the user can read */
  readLevels: Set<number>;
  /** Permission levels the user can write */
  writeLevels: Set<number>;
  /** Can create new documents */
  canCreate: boolean;
  /** Can delete documents */
  canDelete: boolean;
  /** Can submit documents */
  canSubmit: boolean;
  /** Can cancel documents */
  canCancel: boolean;
  /** Can amend documents */
  canAmend: boolean;
}

/**
 * Field permission state
 */
export interface FieldPermissionState {
  /** Can the user see this field */
  canRead: boolean;
  /** Can the user edit this field */
  canWrite: boolean;
  /** Is the field required (considering permissions) */
  isRequired: boolean;
}

/**
 * Calculate effective permissions from DocType permissions and user roles
 *
 * @param permissions - DocType permissions array
 * @param userRoles - User's roles (if not provided, assumes full access)
 * @returns Effective permissions for the user
 */
export function calculateEffectivePermissions(
  permissions: DocTypePermission[],
  userRoles?: string[]
): EffectivePermissions {
  const readLevels = new Set<number>();
  const writeLevels = new Set<number>();
  let canCreate = false;
  let canDelete = false;
  let canSubmit = false;
  let canCancel = false;
  let canAmend = false;

  // If no user roles provided, assume Administrator with full access
  const hasRole = (role: string) => !userRoles || userRoles.includes(role);

  for (const perm of permissions) {
    if (!hasRole(perm.role)) continue;

    const level = perm.permlevel ?? 0;

    if (perm.read === 1) {
      readLevels.add(level);
    }
    if (perm.write === 1) {
      writeLevels.add(level);
    }
    if (perm.create === 1) {
      canCreate = true;
    }
    if (perm.delete === 1) {
      canDelete = true;
    }
    if (perm.submit === 1) {
      canSubmit = true;
    }
    if (perm.cancel === 1) {
      canCancel = true;
    }
    if (perm.amend === 1) {
      canAmend = true;
    }
  }

  // Default: if no permissions found, allow level 0
  if (readLevels.size === 0) {
    readLevels.add(0);
  }
  if (writeLevels.size === 0) {
    writeLevels.add(0);
  }

  return {
    readLevels,
    writeLevels,
    canCreate,
    canDelete,
    canSubmit,
    canCancel,
    canAmend,
  };
}

/**
 * Get permission state for a single field
 *
 * @param field - The field to check
 * @param permissions - User's effective permissions
 * @param isNewDoc - Whether this is a new document (affects required logic)
 * @returns Permission state for the field
 */
export function getFieldPermissionState(
  field: DocTypeField,
  permissions: EffectivePermissions,
  isNewDoc: boolean = false
): FieldPermissionState {
  const permLevel = field.perm_level ?? 0;

  // Check if user can read this permission level
  const canRead = permissions.readLevels.has(permLevel);

  // Check if user can write this permission level
  // Also consider field's own read_only flag
  const canWrite =
    canRead &&
    permissions.writeLevels.has(permLevel) &&
    field.read_only !== 1;

  // Field is required only if user can write it
  const isRequired = canWrite && field.reqd === 1;

  return {
    canRead,
    canWrite,
    isRequired,
  };
}

/**
 * Apply permission states to fields array
 * Returns a new array with _perms populated on each field
 *
 * @param fields - Original fields array
 * @param permissions - User's effective permissions
 * @param isNewDoc - Whether this is a new document
 * @returns Fields with permission states applied
 */
export function applyFieldPermissions(
  fields: DocTypeField[],
  permissions: EffectivePermissions,
  isNewDoc: boolean = false
): DocTypeField[] {
  return fields.map((field) => {
    const permState = getFieldPermissionState(field, permissions, isNewDoc);

    return {
      ...field,
      _perms: {
        read: permState.canRead,
        write: permState.canWrite,
      },
      // Update hidden/read_only based on permissions
      hidden: permState.canRead ? field.hidden : 1,
      read_only: permState.canWrite ? field.read_only : 1,
      // Update required based on write permission
      reqd: permState.isRequired ? 1 : 0,
    };
  });
}

/**
 * Filter fields to only those the user can read
 *
 * @param fields - Original fields array
 * @param permissions - User's effective permissions
 * @returns Filtered fields array
 */
export function filterReadableFields(
  fields: DocTypeField[],
  permissions: EffectivePermissions
): DocTypeField[] {
  return fields.filter((field) => {
    const permLevel = field.perm_level ?? 0;
    return permissions.readLevels.has(permLevel);
  });
}

/**
 * Check if user has write permission for any field at a given perm_level
 *
 * @param permissions - User's effective permissions
 * @param permLevel - Permission level to check
 * @returns Whether user can write fields at this level
 */
export function canWriteLevel(
  permissions: EffectivePermissions,
  permLevel: number = 0
): boolean {
  return permissions.writeLevels.has(permLevel);
}
