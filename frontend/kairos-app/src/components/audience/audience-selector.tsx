/**
 * AudienceSelector Component
 *
 * A cascading selector for targeting audiences in News, Events, Field Trips, etc.
 * Supports hierarchy: All School > Campus > School Unit > Grade > Section
 * Optionally filters by shift (Morning/Afternoon)
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Control, Controller, FieldValues, Path, useWatch } from "react-hook-form";
import { Users, Loader2, AlertCircle, Check } from "lucide-react";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

export type AudienceType = "All School" | "Campus" | "School Unit" | "Grade" | "Section";

export interface AudienceValue {
  audience_type: AudienceType;
  audience_campus?: string;
  audience_school_unit?: string;
  audience_grade?: string;
  target_section?: string;
  audience_shift?: string;
}

interface CascadeOption {
  value: string;
  label: string;
}

interface AudiencePreview {
  count: number;
  can_send: boolean;
  message: string;
}

interface AudienceSelectorProps<T extends FieldValues> {
  /** Base field name prefix for the form fields */
  namePrefix?: string;
  /** react-hook-form control object */
  control: Control<T>;
  /** Whether the fields are read-only */
  readOnly?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Show recipient count preview */
  showPreview?: boolean;
}

// ============================================================================
// Hooks
// ============================================================================

function useCascadeOptions(parentType: string, parentValue: string | undefined) {
  const { call, loading, result } = useFrappePostCall<{ message: CascadeOption[] }>(
    "kairos.audience.get_cascade_options"
  );

  useEffect(() => {
    if (parentValue) {
      call({ parent_type: parentType, parent_value: parentValue });
    }
  }, [parentType, parentValue, call]);

  return {
    options: result?.message ?? [],
    loading,
  };
}

function useAudiencePreview(value: AudienceValue) {
  const { call, loading, result } = useFrappePostCall<{ message: AudiencePreview }>(
    "kairos.audience.get_audience_preview"
  );

  useEffect(() => {
    if (value.audience_type) {
      call({
        audience_type: value.audience_type,
        campus: value.audience_campus,
        school_unit: value.audience_school_unit,
        grade: value.audience_grade,
        section: value.target_section,
        shift: value.audience_shift,
      });
    }
  }, [
    value.audience_type,
    value.audience_campus,
    value.audience_school_unit,
    value.audience_grade,
    value.target_section,
    value.audience_shift,
    call,
  ]);

  return {
    preview: result?.message,
    loading,
  };
}

// ============================================================================
// Subcomponents
// ============================================================================

function CascadeSelect({
  label,
  value,
  onChange,
  options,
  loading,
  placeholder,
  disabled,
  required,
}: {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  options: CascadeOption[];
  loading: boolean;
  placeholder: string;
  disabled?: boolean;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Select
        value={value ?? ""}
        onValueChange={onChange}
        disabled={disabled || loading}
      >
        <SelectTrigger className={cn(loading && "opacity-50")}>
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading...</span>
            </div>
          ) : (
            <SelectValue placeholder={placeholder} />
          )}
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function PreviewBadge({
  preview,
  loading,
}: {
  preview?: AudiencePreview;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Calculating recipients...</span>
      </div>
    );
  }

  if (!preview) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm px-3 py-2 rounded-lg",
        preview.can_send
          ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
          : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
      )}
    >
      {preview.can_send ? (
        <Users className="h-4 w-4" />
      ) : (
        <AlertCircle className="h-4 w-4" />
      )}
      <span>{preview.message}</span>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AudienceSelector<T extends FieldValues>({
  namePrefix = "",
  control,
  readOnly = false,
  className,
  showPreview = true,
}: AudienceSelectorProps<T>) {
  const prefix = namePrefix ? `${namePrefix}.` : "";

  // Watch all audience fields
  const audienceType = useWatch({ control, name: `${prefix}audience_type` as Path<T> });
  const audienceCampus = useWatch({ control, name: `${prefix}audience_campus` as Path<T> });
  const audienceSchoolUnit = useWatch({ control, name: `${prefix}audience_school_unit` as Path<T> });
  const audienceGrade = useWatch({ control, name: `${prefix}audience_grade` as Path<T> });
  const targetSection = useWatch({ control, name: `${prefix}target_section` as Path<T> });
  const audienceShift = useWatch({ control, name: `${prefix}audience_shift` as Path<T> });

  // Fetch cascade options
  const { options: campusOptions, loading: campusLoading } = useCascadeOptions("", "");
  const { options: schoolUnitOptions, loading: schoolUnitLoading } = useCascadeOptions(
    "campus",
    audienceCampus as string
  );
  const { options: gradeOptions, loading: gradeLoading } = useCascadeOptions(
    "school_unit",
    audienceSchoolUnit as string
  );
  const { options: sectionOptions, loading: sectionLoading } = useCascadeOptions(
    "grade",
    audienceGrade as string
  );

  // Get preview
  const { preview, loading: previewLoading } = useAudiencePreview({
    audience_type: audienceType as AudienceType,
    audience_campus: audienceCampus as string,
    audience_school_unit: audienceSchoolUnit as string,
    audience_grade: audienceGrade as string,
    target_section: targetSection as string,
    audience_shift: audienceShift as string,
  });

  // Determine which fields to show based on audience type
  const showCampus = ["Campus", "School Unit", "Grade", "Section"].includes(audienceType as string);
  const showSchoolUnit = ["School Unit", "Grade", "Section"].includes(audienceType as string);
  const showGrade = ["Grade", "Section"].includes(audienceType as string);
  const showSection = audienceType === "Section";
  const showShift = ["School Unit", "Grade", "Section"].includes(audienceType as string);

  const audienceTypes: AudienceType[] = [
    "All School",
    "Campus",
    "School Unit",
    "Grade",
    "Section",
  ];

  const shiftOptions = [
    { value: "", label: "All Shifts" },
    { value: "Morning", label: "Morning" },
    { value: "Afternoon", label: "Afternoon" },
  ];

  // Fetch all campuses for the first level
  const { data: allCampuses } = useFrappeGetCall<{ message: CascadeOption[] }>(
    "frappe.client.get_list",
    {
      doctype: "Campus",
      fields: ["name", "campus_name"],
      filters: { is_active: 1 },
      limit_page_length: 0,
    }
  );

  const campusList: CascadeOption[] =
    allCampuses?.message?.map((c: { name: string; campus_name: string }) => ({
      value: c.name,
      label: c.campus_name,
    })) ?? [];

  return (
    <div className={cn("space-y-4", className)}>
      {/* Audience Type Selector */}
      <Controller
        name={`${prefix}audience_type` as Path<T>}
        control={control}
        render={({ field }) => (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Target Audience
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Select
              value={field.value ?? "All School"}
              onValueChange={field.onChange}
              disabled={readOnly}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select audience" />
              </SelectTrigger>
              <SelectContent>
                {audienceTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      />

      {/* Cascading Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Campus */}
        {showCampus && (
          <Controller
            name={`${prefix}audience_campus` as Path<T>}
            control={control}
            render={({ field }) => (
              <CascadeSelect
                label="Campus"
                value={field.value as string}
                onChange={field.onChange}
                options={campusList}
                loading={false}
                placeholder="Select campus"
                disabled={readOnly}
                required={showCampus}
              />
            )}
          />
        )}

        {/* School Unit */}
        {showSchoolUnit && (
          <Controller
            name={`${prefix}audience_school_unit` as Path<T>}
            control={control}
            render={({ field }) => (
              <CascadeSelect
                label="School Unit"
                value={field.value as string}
                onChange={field.onChange}
                options={schoolUnitOptions}
                loading={schoolUnitLoading}
                placeholder="Select school unit"
                disabled={readOnly || !audienceCampus}
                required={showSchoolUnit}
              />
            )}
          />
        )}

        {/* Grade */}
        {showGrade && (
          <Controller
            name={`${prefix}audience_grade` as Path<T>}
            control={control}
            render={({ field }) => (
              <CascadeSelect
                label="Grade"
                value={field.value as string}
                onChange={field.onChange}
                options={gradeOptions}
                loading={gradeLoading}
                placeholder="Select grade"
                disabled={readOnly || !audienceSchoolUnit}
                required={showGrade}
              />
            )}
          />
        )}

        {/* Section */}
        {showSection && (
          <Controller
            name={`${prefix}target_section` as Path<T>}
            control={control}
            render={({ field }) => (
              <CascadeSelect
                label="Section"
                value={field.value as string}
                onChange={field.onChange}
                options={sectionOptions}
                loading={sectionLoading}
                placeholder="Select section"
                disabled={readOnly || !audienceGrade}
                required={showSection}
              />
            )}
          />
        )}

        {/* Shift */}
        {showShift && (
          <Controller
            name={`${prefix}audience_shift` as Path<T>}
            control={control}
            render={({ field }) => (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Shift (Optional)</Label>
                <Select
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  disabled={readOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All shifts" />
                  </SelectTrigger>
                  <SelectContent>
                    {shiftOptions.map((option) => (
                      <SelectItem key={option.value || "all"} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          />
        )}
      </div>

      {/* Preview */}
      {showPreview && (
        <PreviewBadge preview={preview} loading={previewLoading} />
      )}
    </div>
  );
}

export default AudienceSelector;
