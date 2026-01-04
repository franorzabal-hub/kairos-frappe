/**
 * Export Button Component
 *
 * Dropdown button for exporting list view data to CSV or Excel format.
 * Supports exporting current view, selected items, or all items.
 */

"use client";

import { useState } from "react";
import {
  Download,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExportFormat } from "@/lib/export";

// ============================================================================
// Types
// ============================================================================

export interface ExportButtonProps {
  /** Current page data to export */
  currentData: Record<string, unknown>[];
  /** Selected rows data (if row selection is enabled) */
  selectedData?: Record<string, unknown>[];
  /** Total count for "export all" functionality */
  totalCount: number;
  /** Whether export is in progress */
  isExporting: boolean;
  /** Export progress (0-100) */
  progress?: number;
  /** Export error */
  error?: Error | null;
  /** Handler for exporting current view */
  onExportCurrentView: (format: ExportFormat) => void;
  /** Handler for exporting selected items */
  onExportSelected?: (format: ExportFormat) => void;
  /** Handler for exporting all items */
  onExportAll: (format: ExportFormat) => void;
  /** Whether the button is disabled */
  disabled?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function ExportButton({
  currentData,
  selectedData = [],
  totalCount,
  isExporting,
  progress = 0,
  error,
  onExportCurrentView,
  onExportSelected,
  onExportAll,
  disabled = false,
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasCurrentData = currentData.length > 0;
  const hasSelectedData = selectedData.length > 0;
  const hasMoreData = totalCount > currentData.length;

  // Show progress in button when exporting
  const buttonContent = isExporting ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      {progress > 0 ? `${progress}%` : "Exporting..."}
    </>
  ) : (
    <>
      <Download className="mr-2 h-4 w-4" />
      Export
      <ChevronDown className="ml-2 h-4 w-4" />
    </>
  );

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled || isExporting || !hasCurrentData}
          aria-label="Export data"
        >
          {buttonContent}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Current View Section */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Current View ({currentData.length} items)
          </DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => {
              onExportCurrentView("csv");
              setIsOpen(false);
            }}
            disabled={!hasCurrentData}
          >
            <FileText className="mr-2 h-4 w-4" />
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              onExportCurrentView("xlsx");
              setIsOpen(false);
            }}
            disabled={!hasCurrentData}
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export as Excel
          </DropdownMenuItem>
        </DropdownMenuGroup>

        {/* Selected Items Section */}
        {onExportSelected && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Selected ({selectedData.length} items)
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  onExportSelected("csv");
                  setIsOpen(false);
                }}
                disabled={!hasSelectedData}
              >
                <FileText className="mr-2 h-4 w-4" />
                Export Selected as CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  onExportSelected("xlsx");
                  setIsOpen(false);
                }}
                disabled={!hasSelectedData}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export Selected as Excel
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}

        {/* All Data Section */}
        {hasMoreData && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                All Data ({totalCount.toLocaleString()} items)
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => {
                  onExportAll("csv");
                  setIsOpen(false);
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                Export All as CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  onExportAll("xlsx");
                  setIsOpen(false);
                }}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export All as Excel
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}

        {/* Error Display */}
        {error && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error.message}
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default ExportButton;
