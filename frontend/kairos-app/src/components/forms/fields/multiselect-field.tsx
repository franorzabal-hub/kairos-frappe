/**
 * MultiSelect Field Component
 *
 * Multi-select dropdown for selecting multiple values
 * Supports both static options (from field.options) and Link-based options
 * Shows selected items as pills/badges with remove functionality
 * Integrates with react-hook-form via Controller
 */

"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { X, ChevronDown, Check, Search, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useLinkSearch } from "@/hooks/use-link-search";

// ============================================================================
// Types
// ============================================================================

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectFieldProps<T extends FieldValues> {
  /** Field name for react-hook-form */
  name: Path<T>;
  /** react-hook-form control object */
  control: Control<T>;
  /** Field label */
  label: string;
  /** Static options for selection (mutually exclusive with doctype) */
  options?: MultiSelectOption[];
  /** DocType for Link-based options (mutually exclusive with options) */
  doctype?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Whether the field is read-only */
  readOnly?: boolean;
  /** Field description/help text */
  description?: string;
  /** Additional CSS classes */
  className?: string;
  /** Placeholder text for the search input */
  placeholder?: string;
  /** Maximum number of items that can be selected */
  maxItems?: number;
  /** Additional filters for Link-based search */
  filters?: Record<string, unknown>;
}

// ============================================================================
// Component
// ============================================================================

export function MultiSelectField<T extends FieldValues>({
  name,
  control,
  label,
  options = [],
  doctype,
  required = false,
  readOnly = false,
  description,
  className,
  placeholder,
  maxItems,
  filters = {},
}: MultiSelectFieldProps<T>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        // Ensure value is always an array
        const selectedValues: string[] = Array.isArray(field.value)
          ? field.value
          : field.value
            ? [field.value]
            : [];

        return (
          <MultiSelectFieldInner
            value={selectedValues}
            onChange={field.onChange}
            name={name}
            label={label}
            options={options}
            doctype={doctype}
            required={required}
            readOnly={readOnly}
            description={description}
            className={className}
            placeholder={placeholder}
            maxItems={maxItems}
            filters={filters}
            error={error?.message}
          />
        );
      }}
    />
  );
}

// ============================================================================
// Inner Component
// ============================================================================

interface MultiSelectFieldInnerProps {
  value: string[];
  onChange: (value: string[]) => void;
  name: string;
  label: string;
  options?: MultiSelectOption[];
  doctype?: string;
  required?: boolean;
  readOnly?: boolean;
  description?: string;
  className?: string;
  placeholder?: string;
  maxItems?: number;
  filters?: Record<string, unknown>;
  error?: string;
}

function MultiSelectFieldInner({
  value,
  onChange,
  name,
  label,
  options = [],
  doctype,
  required = false,
  readOnly = false,
  description,
  className,
  placeholder,
  maxItems,
  filters = {},
  error,
}: MultiSelectFieldInnerProps) {
  // State
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Determine if using Link-based options
  const isLinkBased = Boolean(doctype);

  // Link search hook (only active when using Link-based options)
  const {
    results: linkResults,
    isLoading: isLinkLoading,
    hasSearched,
  } = useLinkSearch({
    doctype: doctype || "",
    searchText,
    filters,
    debounceMs: 300,
    limit: 20,
    enabled: isLinkBased && isOpen && !readOnly,
  });

  // Filter static options based on search text
  const filteredStaticOptions = useMemo(() => {
    if (isLinkBased) return [];

    if (!searchText) return options;

    const lowerSearch = searchText.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(lowerSearch) ||
        opt.value.toLowerCase().includes(lowerSearch)
    );
  }, [options, searchText, isLinkBased]);

  // Combine options for display
  const displayOptions: MultiSelectOption[] = useMemo(() => {
    if (isLinkBased) {
      return linkResults.map((result) => ({
        value: result.value,
        label: result.description || result.value,
      }));
    }
    return filteredStaticOptions;
  }, [isLinkBased, linkResults, filteredStaticOptions]);

  // Filter out already selected options
  const availableOptions = useMemo(() => {
    return displayOptions.filter((opt) => !value.includes(opt.value));
  }, [displayOptions, value]);

  // Check if max items reached
  const isMaxReached = maxItems !== undefined && value.length >= maxItems;

  // Get label for a selected value
  const getOptionLabel = useCallback(
    (val: string): string => {
      const option = options.find((opt) => opt.value === val);
      return option?.label || val;
    },
    [options]
  );

  // Handle selecting an option
  const handleSelect = useCallback(
    (optionValue: string) => {
      if (isMaxReached || value.includes(optionValue)) return;

      const newValue = [...value, optionValue];
      onChange(newValue);
      setSearchText("");
      setHighlightedIndex(-1);

      // Keep popover open unless max reached
      if (maxItems !== undefined && newValue.length >= maxItems) {
        setIsOpen(false);
      } else {
        // Focus back on input for continued selection
        inputRef.current?.focus();
      }
    },
    [value, onChange, isMaxReached, maxItems]
  );

  // Handle removing a selected item
  const handleRemove = useCallback(
    (optionValue: string) => {
      if (readOnly) return;
      const newValue = value.filter((v) => v !== optionValue);
      onChange(newValue);
    },
    [value, onChange, readOnly]
  );

  // Handle clearing all selected items
  const handleClearAll = useCallback(() => {
    if (readOnly) return;
    onChange([]);
    setSearchText("");
  }, [onChange, readOnly]);

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
            prev < availableOptions.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          event.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          event.preventDefault();
          if (highlightedIndex >= 0 && availableOptions[highlightedIndex]) {
            handleSelect(availableOptions[highlightedIndex].value);
          }
          break;
        case "Escape":
          event.preventDefault();
          setIsOpen(false);
          setSearchText("");
          break;
        case "Backspace":
          // Remove last selected item if search is empty
          if (!searchText && value.length > 0) {
            handleRemove(value[value.length - 1]);
          }
          break;
      }
    },
    [
      isOpen,
      availableOptions,
      highlightedIndex,
      handleSelect,
      searchText,
      value,
      handleRemove,
    ]
  );

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[data-option]");
      const highlightedItem = items[highlightedIndex] as HTMLElement;
      if (highlightedItem) {
        highlightedItem.scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightedIndex]);

  // Reset highlighted index when options change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [availableOptions.length]);

  // Loading state
  const isLoading = isLinkBased && isLinkLoading;

  // Show states
  const showNoResults =
    !isLoading &&
    availableOptions.length === 0 &&
    (isLinkBased ? hasSearched && searchText.length > 0 : searchText.length > 0);
  const showEmptyState =
    !isLoading &&
    !searchText &&
    availableOptions.length === 0 &&
    !isLinkBased;

  // Build placeholder text
  const inputPlaceholder = useMemo(() => {
    if (value.length > 0) return "";
    if (placeholder) return placeholder;
    if (isLinkBased) return "Search " + doctype + "...";
    return "Select options...";
  }, [value.length, placeholder, isLinkBased, doctype]);

  // Build search hint text
  const searchHintText = useMemo(() => {
    return "Type to search " + doctype + "...";
  }, [doctype]);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Label */}
      <div className="flex items-center justify-between">
        <Label htmlFor={name} className={cn(error && "text-destructive")}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
          {isLinkBased && (
            <span className="text-xs text-muted-foreground ml-2">
              ({doctype})
            </span>
          )}
        </Label>
        {value.length > 0 && !readOnly && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Main input area */}
      <Popover open={isOpen && !readOnly} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div
            className={cn(
              "relative flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm",
              "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
              "transition-[color,box-shadow]",
              error && "border-destructive",
              readOnly && "bg-muted cursor-not-allowed",
              !readOnly && "cursor-text bg-transparent"
            )}
            onClick={() => {
              if (!readOnly) {
                inputRef.current?.focus();
                setIsOpen(true);
              }
            }}
          >
            {/* Selected items as badges */}
            {value.map((val) => (
              <Badge
                key={val}
                variant="secondary"
                className="gap-1 pr-1"
              >
                <span className="max-w-[150px] truncate">
                  {getOptionLabel(val)}
                </span>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(val);
                    }}
                    className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 focus:outline-none focus:ring-1 focus:ring-ring"
                    aria-label={"Remove " + getOptionLabel(val)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}

            {/* Search input (hidden when read-only or max reached) */}
            {!readOnly && !isMaxReached && (
              <Input
                ref={inputRef}
                id={name}
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsOpen(true)}
                placeholder={inputPlaceholder}
                className="h-6 min-w-[120px] flex-1 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 placeholder:text-muted-foreground"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                aria-controls={name + "-listbox"}
                autoComplete="off"
              />
            )}

            {/* Max items indicator */}
            {isMaxReached && (
              <span className="text-xs text-muted-foreground">
                Max {maxItems} items
              </span>
            )}

            {/* Right side indicators */}
            <div className="ml-auto flex items-center gap-1 pl-2">
              {isLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
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
        </PopoverTrigger>

        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
          sideOffset={4}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {/* Search box for Link-based (already has input above for static) */}
          {isLinkBased && (
            <div className="flex items-center border-b px-3 py-2">
              <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={"Search " + doctype + "..."}
                className="flex h-7 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                autoComplete="off"
              />
            </div>
          )}

          {/* Options list */}
          <ScrollArea className="max-h-60">
            <div
              ref={listRef}
              id={name + "-listbox"}
              role="listbox"
              aria-label={label + " options"}
              aria-multiselectable="true"
              className="p-1"
            >
              {/* Loading state */}
              {isLoading && availableOptions.length === 0 && (
                <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching...
                </div>
              )}

              {/* Options */}
              {availableOptions.map((option, index) => (
                <div
                  key={option.value}
                  data-option
                  role="option"
                  aria-selected={value.includes(option.value)}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                    highlightedIndex === index
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted",
                    value.includes(option.value) && "font-medium"
                  )}
                  onClick={() => handleSelect(option.value)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value.includes(option.value)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  <span className="truncate">{option.label}</span>
                </div>
              ))}

              {/* No results */}
              {showNoResults && (
                <div className="px-2 py-3 text-center text-sm text-muted-foreground">
                  No results found for "{searchText}"
                </div>
              )}

              {/* Empty state for static options */}
              {showEmptyState && (
                <div className="px-2 py-3 text-center text-sm text-muted-foreground">
                  No options available
                </div>
              )}

              {/* Type to search hint for Link-based */}
              {isLinkBased && !searchText && !isLoading && availableOptions.length === 0 && (
                <div className="px-2 py-3 text-center text-sm text-muted-foreground">
                  {searchHintText}
                </div>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Selection count and max items info */}
      {(maxItems !== undefined || value.length > 0) && (
        <p className="text-xs text-muted-foreground">
          {value.length} selected
          {maxItems !== undefined && " (max " + maxItems + ")"}
        </p>
      )}

      {/* Description */}
      {description && !error && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {/* Error message */}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
