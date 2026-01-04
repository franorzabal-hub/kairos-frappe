/**
 * Kanban View Component
 *
 * Main Kanban board view that displays documents as cards organized
 * in columns based on a Select field value. Supports drag & drop
 * to move cards between columns.
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { AlertCircle, RefreshCw, Columns3 } from "lucide-react";
import { toast } from "sonner";

import { cn, doctypeToSlug } from "@/lib/utils";
import { useKanbanData, KanbanCard as KanbanCardType } from "@/hooks/use-kanban-data";
import { KanbanColumn } from "./kanban-column";
import { KanbanCardOverlay } from "./kanban-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

// ============================================================================
// Types
// ============================================================================

interface KanbanViewProps {
  doctype: string;
  columnField?: string;
}

// ============================================================================
// Component
// ============================================================================

export function KanbanView({ doctype, columnField }: KanbanViewProps) {
  const router = useRouter();
  const doctypeSlug = doctypeToSlug(doctype);

  // Kanban data hook
  const {
    columns,
    isLoading,
    isUpdating,
    error,
    selectFields,
    selectedColumnField,
    setColumnField,
    moveCard,
    refetch,
  } = useKanbanData({
    doctype,
    columnField,
  });

  // Get preview fields from meta (list view fields excluding column field)
  const previewFields = useMemo(() => {
    if (!selectedColumnField) return [];
    return selectFields.length > 0 ? [] : []; // We'll use listViewFields from the column
  }, [selectedColumnField, selectFields]);

  // Drag state
  const [activeCard, setActiveCard] = useState<KanbanCardType | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const cardData = active.data.current;
    
    if (cardData?.type === "card") {
      setActiveCard(cardData.card);
    }
  }, []);

  // Handle drag over (optional - for visual feedback)
  const handleDragOver = useCallback((event: DragOverEvent) => {
    // Can be used to update visual state during drag
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      
      setActiveCard(null);

      if (!over) return;

      const activeId = String(active.id);
      const overId = String(over.id);

      // Find what column we dropped over
      let targetColumnId: string | null = null;

      if (overId.startsWith("column-")) {
        // Dropped directly on a column
        targetColumnId = overId.replace("column-", "");
      } else {
        // Dropped on another card - find its column
        const overData = over.data.current;
        if (overData?.type === "card") {
          targetColumnId = overData.card.columnValue;
        }
      }

      if (!targetColumnId) return;

      // Find the source card
      const sourceCard = columns
        .flatMap((col) => col.cards)
        .find((card) => card.name === activeId);

      if (!sourceCard) return;

      // Check if actually moving to a different column
      const sourceColumnId = sourceCard.columnValue || "__unassigned__";
      if (sourceColumnId === targetColumnId) {
        return; // No change needed
      }

      // Move the card
      try {
        await moveCard(activeId, targetColumnId);
        toast.success("Card moved successfully");
      } catch (err) {
        console.error("Failed to move card:", err);
        toast.error("Failed to move card");
      }
    },
    [columns, moveCard]
  );

  // Handle card click - navigate to document
  const handleCardClick = useCallback(
    (name: string) => {
      router.push("/" + doctypeSlug + "/" + encodeURIComponent(name));
    },
    [router, doctypeSlug]
  );

  // ============================================================================
  // Loading State
  // ============================================================================

  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Header skeleton */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-9 w-9" />
        </div>

        {/* Columns skeleton */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[300px] bg-gray-50 rounded-xl border p-4 space-y-3"
            >
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ============================================================================
  // Error State
  // ============================================================================

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Failed to load Kanban
          </CardTitle>
          <CardDescription>
            There was an error loading the Kanban view.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive mb-4">{error.message}</p>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ============================================================================
  // No Select Fields State
  // ============================================================================

  if (selectFields.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Columns3 className="h-5 w-5" />
            Kanban View Not Available
          </CardTitle>
          <CardDescription>
            This DocType does not have any Select fields that can be used for
            Kanban columns.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            To use Kanban view, the DocType needs at least one Select field
            (like Status, Stage, or Priority) with defined options.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-4">
        {/* Column field selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Group by:</span>
          <Select
            value={selectedColumnField?.fieldname || ""}
            onValueChange={setColumnField}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select field" />
            </SelectTrigger>
            <SelectContent>
              {selectFields.map((field) => (
                <SelectItem key={field.fieldname} value={field.fieldname}>
                  {field.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Refresh button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() => refetch()}
          disabled={isUpdating}
          aria-label="Refresh board"
        >
          <RefreshCw
            className={cn("h-4 w-4", isUpdating && "animate-spin")}
          />
        </Button>

        {/* Total count */}
        <span className="text-sm text-muted-foreground ml-auto">
          {columns.reduce((sum, col) => sum + col.cards.length, 0)} items
        </span>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4 min-h-[500px]">
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                previewFields={[]}
                onCardClick={handleCardClick}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Drag Overlay */}
        <DragOverlay dropAnimation={{
          duration: 200,
          easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
        }}>
          {activeCard && (
            <KanbanCardOverlay card={activeCard} previewFields={[]} />
          )}
        </DragOverlay>
      </DndContext>

      {/* Updating indicator */}
      {isUpdating && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-sm">Updating...</span>
        </div>
      )}
    </div>
  );
}
