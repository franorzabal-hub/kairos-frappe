/**
 * Link Field Component
 *
 * Autocomplete input for Frappe "Link" field type
 * Links to another DocType document
 * Integrates with react-hook-form via Controller
 */

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { Search, X, Loader2, ChevronDown, ExternalLink } from "lucide-react";
import { LinkSelectDialog } from "@/components/dialogs/link-select-dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLinkSearch } from "@/hooks/use-link-search";

// ============================================================================
// Types
// ============================================================================

interface LinkFieldProps<T extends FieldValues> {
  /** Field name for react-hook-form */
  name: Path<T>;
  /** react-hook-form control object */
  control: Control<T>;
  /** Field label */
  label: string;
  /** The DocType to link to */
  doctype: string;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the field is read-only */
  readOnly?: boolean;
  /** Field description/help text */
  description?: string;
  /** Additional CSS classes */
  className?: string;
  /** Additional filters for the search */
  filters?: Record<string, unknown>;
  /** Error message (external) */
  error?: string;
  /** Placeholder text */
  placeholder?: string;
}

// ============================================================================
// Component
// ============================================================================

export function LinkField<T extends FieldValues>({
  name,
  control,
  label,
  doctype,
  required = false,
  readOnly = false,
  description,
  className,
  filters = {},
  error: externalError,
  placeholder,
}: LinkFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error: fieldError } }) => {
        const error = externalError || fieldError?.message;

        return (
          <LinkFieldInner
            value={field.value ?? ""}
            onChange={field.onChange}
            onBlur={field.onBlur}
            name={name}
            label={label}
            doctype={doctype}
            required={required}
            readOnly={readOnly}
            description={description}
            className={className}
            filters={filters}
            error={error}
            placeholder={placeholder}
          />
        );
      }}
    />
  );
}

// ============================================================================
// Inner Component (handles the actual autocomplete logic)
// ============================================================================

interface LinkFieldInnerProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  name: string;
  label: string;
  doctype: string;
  required?: boolean;
  readOnly?: boolean;
  description?: string;
  className?: string;
  filters?: Record<string, unknown>;
  error?: string;
  placeholder?: string;
}

function LinkFieldInner({
  value,
  onChange,
  onBlur,
  name,
  label,
  doctype,
  required = false,
  readOnly = false,
  description,
  className,
  filters = {},
  error,
  placeholder,
}: LinkFieldInnerProps) {
  // State - use value directly for inputValue when form value changes externally
  const [isOpen, setIsOpen] = useState(false);
  const [localInputValue, setLocalInputValue] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showModal, setShowModal] = useState(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Derive inputValue: use local value when user is typing, otherwise use form value
  const inputValue = localInputValue !== null ? localInputValue : (value || "");

  // Search hook
  const { results, isLoading, hasSearched } = useLinkSearch({
    doctype,
    searchText: inputValue,
    filters,
    debounceMs: 300,
    limit: 10,
    enabled: isOpen && !readOnly,
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        // Reset to form value by clearing local input value
        setLocalInputValue(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle selection (defined before handleKeyDown to avoid hoisting issues)
  const handleSelect = useCallback(
    (selectedValue: string) => {
      setLocalInputValue(null); // Clear local value so form value takes over
      onChange(selectedValue);
      setIsOpen(false);
      setHighlightedIndex(-1);
      inputRef.current?.blur();
    },
    [onChange]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen) {
        if (event.key === "ArrowDown" || event.key === "Enter") {
          event.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setHighlightedIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          event.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          event.preventDefault();
          if (highlightedIndex >= 0 && results[highlightedIndex]) {
            handleSelect(results[highlightedIndex].value);
          }
          break;
        case "Escape":
          event.preventDefault();
          setIsOpen(false);
          setLocalInputValue(null); // Reset to form value
          break;
        case "Tab":
          setIsOpen(false);
          // If there's exactly one result, select it
          if (results.length === 1) {
            handleSelect(results[0].value);
          } else {
            setLocalInputValue(null); // Reset to form value
          }
          break;
      }
    },
    [isOpen, results, highlightedIndex, handleSelect]
  );

  // Handle input change
  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      setLocalInputValue(newValue);
      setIsOpen(true);
      // Reset highlighted index when typing
      setHighlightedIndex(-1);

      // Clear the form value if input is cleared
      if (!newValue) {
        onChange("");
      }
    },
    [onChange]
  );

  // Handle clear button
  const handleClear = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      setLocalInputValue(null);
      onChange("");
      setIsOpen(false);
      inputRef.current?.focus();
    },
    [onChange]
  );

  // Handle input focus
  const handleFocus = useCallback(() => {
    if (!readOnly) {
      setIsOpen(true);
    }
  }, [readOnly]);

  // Handle input blur
  const handleBlur = useCallback(() => {
    onBlur();
    // Note: We don't close dropdown here as it's handled by click outside
    // This allows clicking on dropdown items
  }, [onBlur]);

  // Scroll highlighted item into view
  const scrollHighlightedIntoView = useCallback((index: number) => {
    if (index >= 0 && listRef.current) {
      const highlightedItem = listRef.current.children[index] as HTMLLIElement;
      if (highlightedItem) {
        highlightedItem.scrollIntoView({ block: "nearest" });
      }
    }
  }, []);

  // Handle mouse enter on result item
  const handleResultMouseEnter = useCallback((index: number) => {
    setHighlightedIndex(index);
    scrollHighlightedIntoView(index);
  }, [scrollHighlightedIntoView]);

  // Determine what to show in dropdown
  const showResults = results.length > 0;
  const showNoResults = hasSearched && inputValue.length > 0 && results.length === 0 && !isLoading;
  const showEmptyState = !inputValue && isOpen;

  return (
    <div ref={containerRef} className={cn("space-y-2 relative", className)}>
      {/* Label */}
      <Label htmlFor={name} className={cn(error && "text-destructive")}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
        <span className="text-xs text-muted-foreground ml-2">({doctype})</span>
      </Label>

      {/* Input container */}
      <div className="relative">
        {/* Search icon */}
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />

        {/* Input */}
        <Input
          ref={inputRef}
          id={name}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder || `Search ${doctype}...`}
          readOnly={readOnly}
          disabled={readOnly}
          aria-invalid={!!error}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={`${name}-listbox`}
          aria-autocomplete="list"
          role="combobox"
          autoComplete="off"
          className={cn(
            "pl-10 pr-16",
            error && "border-destructive",
            readOnly && "bg-muted"
          )}
        />

        {/* Right side buttons */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {/* Loading indicator */}
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}

          {/* Clear button */}
          {value && !readOnly && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleClear}
              className="h-6 w-6"
              aria-label="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}

          {/* Expand/Modal button */}
          {!readOnly && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                setShowModal(true);
              }}
              className="h-6 w-6"
              aria-label={`Browse ${doctype}`}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          )}

          {/* Dropdown indicator */}
          {!readOnly && (
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                isOpen && "rotate-180"
              )}
            />
          )}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && !readOnly && (
        <div
          className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg"
          style={{ top: "calc(100% - 0.5rem)" }}
        >
          <ul
            ref={listRef}
            id={`${name}-listbox`}
            role="listbox"
            aria-label={`${doctype} options`}
            className="max-h-60 overflow-auto py-1"
          >
            {/* Loading state */}
            {isLoading && results.length === 0 && (
              <li className="px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching...
              </li>
            )}

            {/* Results */}
            {showResults &&
              results.map((result, index) => (
                <li
                  key={result.value}
                  role="option"
                  aria-selected={highlightedIndex === index}
                  className={cn(
                    "px-3 py-2 text-sm cursor-pointer transition-colors",
                    highlightedIndex === index
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted",
                    result.value === value && "font-medium"
                  )}
                  onClick={() => handleSelect(result.value)}
                  onMouseEnter={() => handleResultMouseEnter(index)}
                >
                  {result.value}
                  {result.description && (
                    <span className="text-muted-foreground ml-2">
                      - {result.description}
                    </span>
                  )}
                </li>
              ))}

            {/* No results */}
            {showNoResults && (
              <li className="px-3 py-2 text-sm text-muted-foreground">
                No results found for &quot;{inputValue}&quot;
              </li>
            )}

            {/* Empty state */}
            {showEmptyState && !isLoading && (
              <li className="px-3 py-2 text-sm text-muted-foreground">
                Type to search {doctype}...
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Description */}
      {description && !error && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {/* Error message */}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Link Select Dialog */}
      <LinkSelectDialog
        open={showModal}
        onOpenChange={setShowModal}
        doctype={doctype}
        value={value}
        onSelect={(selectedValue) => {
          onChange(selectedValue);
          setShowModal(false);
        }}
        filters={filters}
        allowCreate={!readOnly}
      />
    </div>
  );
}
