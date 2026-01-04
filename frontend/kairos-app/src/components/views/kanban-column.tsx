/**
 * Kanban Column Component
 *
 * Droppable column that contains cards. Displays column header with
 * count badge and renders all cards within the column.
 */

"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { KanbanColumn as KanbanColumnType } from "@/hooks/use-kanban-data";
import { KanbanCard } from "./kanban-card";
import { DocTypeField } from "@/types/frappe";
import { ScrollArea } from "@/components/ui/scroll-area";

// ============================================================================
// Types
// ============================================================================

interface KanbanColumnProps {
  column: KanbanColumnType;
  previewFields: DocTypeField[];
  onCardClick?: (name: string) => void;
  isOver?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function KanbanColumn({
  column,
  previewFields,
  onCardClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    data: {
      type: "column",
      column,
    },
  });

  const cardIds = column.cards.map((card) => card.name);

  return (
    <div
      className={cn(
        "flex flex-col h-full min-w-[300px] max-w-[350px]",
        "bg-gray-50/50 rounded-xl",
        "border border-gray-200",
        "transition-all duration-200"
      )}
    >
      {/* Column Header */}
      <div
        className={cn(
          "flex-shrink-0 px-4 py-3",
          "border-b-2 rounded-t-xl",
          column.color || "border-gray-300 bg-gray-100"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Color indicator dot */}
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                column.color?.includes("yellow") && "bg-yellow-500",
                column.color?.includes("blue") && "bg-blue-500",
                column.color?.includes("indigo") && "bg-indigo-500",
                column.color?.includes("green") && "bg-green-500",
                column.color?.includes("emerald") && "bg-emerald-500",
                column.color?.includes("red") && "bg-red-500",
                column.color?.includes("gray") && "bg-gray-500",
                !column.color && "bg-slate-400"
              )}
            />
            <h3 className="font-semibold text-sm text-gray-700">
              {column.title}
            </h3>
          </div>
          
          {/* Card count badge */}
          <span
            className={cn(
              "inline-flex items-center justify-center",
              "px-2 py-0.5 min-w-[24px]",
              "text-xs font-medium",
              "bg-white/80 text-gray-600",
              "rounded-full border border-gray-200"
            )}
          >
            {column.cards.length}
          </span>
        </div>
      </div>

      {/* Droppable Area with Cards */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 overflow-hidden",
          "transition-colors duration-200",
          isOver && "bg-primary/5"
        )}
      >
        <ScrollArea className="h-full">
          <SortableContext
            items={cardIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="p-2 space-y-2 min-h-[100px]">
              {column.cards.length === 0 ? (
                <div
                  className={cn(
                    "flex items-center justify-center",
                    "h-24 rounded-lg",
                    "border-2 border-dashed border-gray-200",
                    "text-gray-400 text-sm",
                    "transition-colors duration-200",
                    isOver && "border-primary/50 bg-primary/5 text-primary"
                  )}
                >
                  {isOver ? "Drop here" : "No items"}
                </div>
              ) : (
                column.cards.map((card) => (
                  <KanbanCard
                    key={card.name}
                    card={card}
                    previewFields={previewFields}
                    columnColor={column.color}
                    onClick={onCardClick}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </ScrollArea>
      </div>

      {/* Drop indicator when hovering */}
      {isOver && (
        <div className="absolute inset-0 pointer-events-none rounded-xl border-2 border-primary/50 bg-primary/5" />
      )}
    </div>
  );
}
