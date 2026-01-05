/**
 * Selection Checkbox Component
 *
 * Checkbox component for bulk selection in list views.
 * Supports:
 * - Individual row selection
 * - Header "Select All" checkbox with indeterminate state
 * - Shift+click range selection
 */

"use client";

import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface SelectionCheckboxProps {
  /** Whether the checkbox is checked */
  checked: boolean;
  /** Callback when checkbox state changes */
  onCheckedChange: (checked: boolean) => void;
  /** Whether to show indeterminate state (for header checkbox) */
  indeterminate?: boolean;
  /** Aria label for accessibility */
  "aria-label"?: string;
  /** Additional class names */
  className?: string;
  /** Whether the checkbox is disabled */
  disabled?: boolean;
  /** Click handler for shift+click support */
  onClick?: (event: React.MouseEvent) => void;
}

interface HeaderCheckboxProps {
  /** Whether all items on the page are selected */
  isAllSelected: boolean;
  /** Whether some (but not all) items are selected */
  isPartiallySelected: boolean;
  /** Callback to toggle select all */
  onToggleSelectAll: () => void;
  /** Whether the checkbox is disabled */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
}

interface RowCheckboxProps {
  /** The unique identifier for this row */
  rowId: string;
  /** Whether this row is selected */
  isSelected: boolean;
  /** Callback when selection changes */
  onSelectionChange: (id: string, event: React.MouseEvent) => void;
  /** Whether the checkbox is disabled */
  disabled?: boolean;
  /** Additional class names */
  className?: string;
}

// ============================================================================
// Base Selection Checkbox
// ============================================================================

export function SelectionCheckbox({
  checked,
  onCheckedChange,
  indeterminate = false,
  "aria-label": ariaLabel,
  className,
  disabled = false,
  onClick,
}: SelectionCheckboxProps) {
  const checkboxRef = React.useRef<HTMLButtonElement>(null);

  // Set indeterminate state via ref (not directly supported by Radix)
  React.useEffect(() => {
    if (checkboxRef.current) {
      const input = checkboxRef.current.querySelector('input[type="checkbox"]');
      if (input) {
        (input as HTMLInputElement).indeterminate = indeterminate;
      }
    }
  }, [indeterminate]);

  const handleClick = React.useCallback(
    (event: React.MouseEvent) => {
      // Prevent row click from firing
      event.stopPropagation();
      onClick?.(event);
    },
    [onClick]
  );

  return (
    <Checkbox
      ref={checkboxRef}
      checked={indeterminate ? "indeterminate" : checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={handleClick}
      className={cn(
        "data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground",
        className
      )}
    />
  );
}

// ============================================================================
// Header Checkbox (Select All)
// ============================================================================

export function HeaderCheckbox({
  isAllSelected,
  isPartiallySelected,
  onToggleSelectAll,
  disabled = false,
  className,
}: HeaderCheckboxProps) {
  const handleCheckedChange = React.useCallback(() => {
    onToggleSelectAll();
  }, [onToggleSelectAll]);

  return (
    <SelectionCheckbox
      checked={isAllSelected}
      indeterminate={isPartiallySelected}
      onCheckedChange={handleCheckedChange}
      disabled={disabled}
      aria-label={
        isAllSelected
          ? "Deselect all items"
          : isPartiallySelected
            ? "Select all items"
            : "Select all items"
      }
      className={className}
    />
  );
}

// ============================================================================
// Row Checkbox
// ============================================================================

export function RowCheckbox({
  rowId,
  isSelected,
  onSelectionChange,
  disabled = false,
  className,
}: RowCheckboxProps) {
  const handleClick = React.useCallback(
    (event: React.MouseEvent) => {
      onSelectionChange(rowId, event);
    },
    [rowId, onSelectionChange]
  );

  const handleCheckedChange = React.useCallback(
    (checked: boolean) => {
      // Create a synthetic event for consistency
      const syntheticEvent = {
        shiftKey: false,
        stopPropagation: () => {},
      } as React.MouseEvent;
      onSelectionChange(rowId, syntheticEvent);
    },
    [rowId, onSelectionChange]
  );

  return (
    <SelectionCheckbox
      checked={isSelected}
      onCheckedChange={handleCheckedChange}
      onClick={handleClick}
      disabled={disabled}
      aria-label={isSelected ? `Deselect row ${rowId}` : `Select row ${rowId}`}
      className={className}
    />
  );
}

// ============================================================================
// Exports
// ============================================================================

export default SelectionCheckbox;
