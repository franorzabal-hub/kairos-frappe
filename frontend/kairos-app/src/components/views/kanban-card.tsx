/**
 * Kanban Card Component
 *
 * Draggable card that displays a document in the Kanban board.
 * Shows title and key fields with status indicator.
 */

"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { KanbanCard as KanbanCardType } from "@/hooks/use-kanban-data";
import { DocTypeField } from "@/types/frappe";
import { getFieldDisplayValue } from "@/hooks/use-frappe-meta";
import { formatDate } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface KanbanCardProps {
  card: KanbanCardType;
  previewFields: DocTypeField[];
  columnColor?: string;
  onClick?: (name: string) => void;
  isDragging?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function KanbanCard({
  card,
  previewFields,
  columnColor,
  onClick,
  isDragging: externalDragging,
}: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.name,
    data: {
      type: "card",
      card,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isCurrentlyDragging = isDragging || externalDragging;

  // Get the first 2-3 preview fields (excluding title)
  const displayFields = previewFields.slice(0, 3);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative bg-white rounded-lg border shadow-sm",
        "hover:shadow-md hover:border-gray-300",
        "transition-all duration-200 ease-out",
        "cursor-pointer select-none",
        isCurrentlyDragging && "opacity-50 shadow-lg scale-105 rotate-2 z-50"
      )}
      onClick={() => onClick?.(card.name)}
    >
      {/* Color indicator bar */}
      {columnColor && (
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg",
            columnColor.replace("bg-", "bg-").replace("border-", "")
          )}
          style={{
            backgroundColor: columnColor.includes("border-")
              ? undefined
              : undefined,
          }}
        />
      )}

      <div className="p-3 pl-4">
        {/* Drag Handle & Title Row */}
        <div className="flex items-start gap-2">
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className={cn(
              "flex-shrink-0 mt-0.5 p-1 -ml-2",
              "text-gray-400 hover:text-gray-600",
              "opacity-0 group-hover:opacity-100",
              "transition-opacity duration-150",
              "cursor-grab active:cursor-grabbing",
              "focus:outline-none focus:ring-2 focus:ring-primary/50 rounded"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm text-gray-900 truncate">
              {card.title}
            </h4>
            
            {/* Document ID if different from title */}
            {card.name !== card.title && (
              <p className="text-xs text-gray-400 truncate mt-0.5">
                {card.name}
              </p>
            )}
          </div>
        </div>

        {/* Preview Fields */}
        {displayFields.length > 0 && (
          <div className="mt-2 space-y-1 ml-5">
            {displayFields.map((field) => {
              const value = card.fields[field.fieldname];
              if (value === null || value === undefined || value === "") {
                return null;
              }

              const displayValue = getFieldDisplayValue(value, field);

              return (
                <div
                  key={field.fieldname}
                  className="flex items-center text-xs text-gray-600"
                >
                  <span className="text-gray-400 w-20 truncate flex-shrink-0">
                    {field.label}:
                  </span>
                  <span className="truncate ml-1">{displayValue}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer: Modified time */}
        {card.modified && (
          <div className="mt-2 pt-2 border-t border-gray-100 ml-5">
            <div className="flex items-center text-xs text-gray-400">
              <Clock className="h-3 w-3 mr-1" />
              <span>{formatDate(card.modified)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Overlay Card (for drag preview)
// ============================================================================

export function KanbanCardOverlay({
  card,
  previewFields,
}: {
  card: KanbanCardType;
  previewFields: DocTypeField[];
}) {
  return (
    <div
      className={cn(
        "bg-white rounded-lg border border-primary shadow-xl",
        "transform rotate-3 scale-105",
        "cursor-grabbing"
      )}
    >
      <div className="p-3">
        <h4 className="font-medium text-sm text-gray-900 truncate">
          {card.title}
        </h4>
        {previewFields.slice(0, 2).map((field) => {
          const value = card.fields[field.fieldname];
          if (!value) return null;
          return (
            <div key={field.fieldname} className="text-xs text-gray-500 mt-1">
              {getFieldDisplayValue(value, field)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
