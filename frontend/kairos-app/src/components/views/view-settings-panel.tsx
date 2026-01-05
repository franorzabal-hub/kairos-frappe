/**
 * View Settings Panel
 *
 * Panel for managing column visibility, order, and labels.
 * Features:
 * - Drag-and-drop column reordering
 * - Context menu per column (rename, remove)
 * - Add column with internal navigation
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  MoreVertical,
  Plus,
  Pencil,
  Trash2,
  Settings2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Search,
  Type,
  Hash,
  Calendar,
  Link2,
  List,
  ToggleLeft,
  FileText,
  Image,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { DocTypeField, FieldType } from "@/types/frappe";
import { VisibleColumn } from "@/hooks/use-saved-views";

// ============================================================================
// Types
// ============================================================================

interface NavigationLevel {
  /** The Link field that was clicked */
  field: DocTypeField;
  /** The related DocType name */
  doctype: string;
  /** Fields of the related DocType */
  fields: DocTypeField[];
}

interface ViewSettingsPanelProps {
  /** All available fields for this DocType */
  fields: DocTypeField[];
  /** Currently visible columns with their settings */
  visibleColumns: VisibleColumn[];
  /** Callback when columns change */
  onColumnsChange: (columns: VisibleColumn[]) => void;
  /** Callback to fetch fields of a related DocType */
  onFetchRelatedFields?: (doctype: string) => Promise<DocTypeField[]>;
  /** Optional class name */
  className?: string;
}

interface ColumnItemProps {
  column: VisibleColumn;
  field: DocTypeField | undefined;
  onRename: (fieldname: string, newLabel: string) => void;
  onRemove: (fieldname: string) => void;
}

type PanelView = "settings" | "addColumn";

// ============================================================================
// Constants
// ============================================================================

const FIELD_TYPE_ICONS: Partial<Record<FieldType, React.ReactNode>> = {
  Data: <Type className="h-4 w-4" />,
  "Small Text": <Type className="h-4 w-4" />,
  "Long Text": <FileText className="h-4 w-4" />,
  Text: <FileText className="h-4 w-4" />,
  "Text Editor": <FileText className="h-4 w-4" />,
  Int: <Hash className="h-4 w-4" />,
  Float: <Hash className="h-4 w-4" />,
  Currency: <Hash className="h-4 w-4" />,
  Date: <Calendar className="h-4 w-4" />,
  Datetime: <Calendar className="h-4 w-4" />,
  Time: <Clock className="h-4 w-4" />,
  Link: <Link2 className="h-4 w-4" />,
  Select: <List className="h-4 w-4" />,
  Check: <ToggleLeft className="h-4 w-4" />,
  Attach: <FileText className="h-4 w-4" />,
  "Attach Image": <Image className="h-4 w-4" />,
};

const EXCLUDED_FIELD_TYPES: FieldType[] = [
  "Section Break",
  "Column Break",
  "Tab Break",
  "Table",
  "Table MultiSelect",
  "HTML",
  "Password",
];

function getFieldIcon(fieldtype: FieldType): React.ReactNode {
  return FIELD_TYPE_ICONS[fieldtype] || <Type className="h-4 w-4" />;
}

// ============================================================================
// Sortable Column Item
// ============================================================================

function SortableColumnItem({
  column,
  field,
  onRename,
  onRemove,
}: ColumnItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.fieldname });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const displayLabel = column.label || field?.label || column.fieldname;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded-md group",
        "hover:bg-muted/50",
        isDragging && "opacity-50 bg-muted"
      )}
    >
      {/* Drag Handle */}
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing p-0.5 text-muted-foreground/50 hover:text-muted-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Column Label */}
      <div className="flex-1 min-w-0">
        <span className="text-sm truncate block">{displayLabel}</span>
        {column.label && field?.label && column.label !== field.label && (
          <span className="text-xs text-muted-foreground truncate block">
            {field.label}
          </span>
        )}
      </div>

      {/* Context Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-6 w-6"
          >
            <MoreVertical className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={() => {
              const newLabel = prompt("New label:", displayLabel);
              if (newLabel && newLabel !== displayLabel) {
                onRename(column.fieldname, newLabel);
              }
            }}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Change attribute label
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onRemove(column.fieldname)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Remove column
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ============================================================================
// Rename Dialog
// ============================================================================

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLabel: string;
  onConfirm: (newLabel: string) => void;
}

function RenameDialog({
  open,
  onOpenChange,
  currentLabel,
  onConfirm,
}: RenameDialogProps) {
  const [label, setLabel] = useState(currentLabel);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (label.trim()) {
        onConfirm(label.trim());
        onOpenChange(false);
      }
    },
    [label, onConfirm, onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Change attribute label</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="column-label" className="sr-only">
              Label
            </Label>
            <Input
              id="column-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Enter a label"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!label.trim()}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ViewSettingsPanel({
  fields,
  visibleColumns,
  onColumnsChange,
  onFetchRelatedFields,
  className,
}: ViewSettingsPanelProps) {
  const [open, setOpen] = useState(false);
  const [currentView, setCurrentView] = useState<PanelView>("settings");
  const [searchQuery, setSearchQuery] = useState("");
  const [renameDialog, setRenameDialog] = useState<{
    open: boolean;
    fieldname: string;
    currentLabel: string;
  }>({ open: false, fieldname: "", currentLabel: "" });

  // Navigation state for related DocTypes
  const [navigationStack, setNavigationStack] = useState<NavigationLevel[]>([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);

  // Build field map for quick lookup
  const fieldMap = useMemo(() => {
    const map = new Map<string, DocTypeField>();
    fields.forEach((f) => map.set(f.fieldname, f));
    return map;
  }, [fields]);

  // Get current level fields (base fields or navigated related fields)
  const currentLevelFields = useMemo(() => {
    if (navigationStack.length > 0) {
      return navigationStack[navigationStack.length - 1].fields;
    }
    return fields;
  }, [fields, navigationStack]);

  // Build the fieldname prefix for nested fields
  const fieldnamePrefix = useMemo(() => {
    if (navigationStack.length === 0) return "";
    return navigationStack.map((level) => level.field.fieldname).join(".") + ".";
  }, [navigationStack]);

  // Get available fields (not already visible)
  const availableFields = useMemo(() => {
    const visibleSet = new Set(visibleColumns.map((c) => c.fieldname));
    const query = searchQuery.toLowerCase().trim();

    return currentLevelFields.filter((f) => {
      // Build full fieldname with prefix
      const fullFieldname = fieldnamePrefix + f.fieldname;
      if (visibleSet.has(fullFieldname)) return false;
      if (EXCLUDED_FIELD_TYPES.includes(f.fieldtype)) return false;
      if (query) {
        const labelMatch = f.label?.toLowerCase().includes(query);
        const fieldnameMatch = f.fieldname.toLowerCase().includes(query);
        return labelMatch || fieldnameMatch;
      }
      return true;
    });
  }, [currentLevelFields, visibleColumns, searchQuery, fieldnamePrefix]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = visibleColumns.findIndex(
          (c) => c.fieldname === active.id
        );
        const newIndex = visibleColumns.findIndex(
          (c) => c.fieldname === over.id
        );
        const newColumns = arrayMove(visibleColumns, oldIndex, newIndex);
        onColumnsChange(newColumns);
      }
    },
    [visibleColumns, onColumnsChange]
  );

  // Handle rename
  const handleRename = useCallback(
    (fieldname: string, newLabel: string) => {
      const newColumns = visibleColumns.map((c) =>
        c.fieldname === fieldname ? { ...c, label: newLabel } : c
      );
      onColumnsChange(newColumns);
    },
    [visibleColumns, onColumnsChange]
  );

  // Handle remove
  const handleRemove = useCallback(
    (fieldname: string) => {
      const newColumns = visibleColumns.filter((c) => c.fieldname !== fieldname);
      onColumnsChange(newColumns);
    },
    [visibleColumns, onColumnsChange]
  );

  // Handle add column
  const handleAddColumn = useCallback(
    (fieldname: string, field: DocTypeField) => {
      // Build full fieldname with prefix for nested fields
      const fullFieldname = fieldnamePrefix + fieldname;
      // Build label with path for nested fields
      const label = navigationStack.length > 0
        ? [...navigationStack.map((l) => l.field.label), field.label].join(" > ")
        : undefined;

      const newColumns = [...visibleColumns, { fieldname: fullFieldname, label }];
      onColumnsChange(newColumns);
      setCurrentView("settings");
      setSearchQuery("");
      setNavigationStack([]);
    },
    [visibleColumns, onColumnsChange, fieldnamePrefix, navigationStack]
  );

  // Handle navigating into a Link field
  const handleNavigateIntoLink = useCallback(
    async (field: DocTypeField) => {
      if (!onFetchRelatedFields || !field.options) return;

      setIsLoadingRelated(true);
      try {
        const relatedFields = await onFetchRelatedFields(field.options);
        setNavigationStack((prev) => [
          ...prev,
          {
            field,
            doctype: field.options!,
            fields: relatedFields,
          },
        ]);
        setSearchQuery("");
      } catch (error) {
        console.error("Failed to fetch related fields:", error);
      } finally {
        setIsLoadingRelated(false);
      }
    },
    [onFetchRelatedFields]
  );

  // Handle going back in navigation
  const handleNavigateBack = useCallback(() => {
    setNavigationStack((prev) => prev.slice(0, -1));
    setSearchQuery("");
  }, []);

  // Open rename dialog
  const openRenameDialog = useCallback(
    (fieldname: string) => {
      const column = visibleColumns.find((c) => c.fieldname === fieldname);
      const field = fieldMap.get(fieldname);
      const currentLabel = column?.label || field?.label || fieldname;
      setRenameDialog({ open: true, fieldname, currentLabel });
    },
    [visibleColumns, fieldMap]
  );

  // Handle rename confirm
  const handleRenameConfirm = useCallback(
    (newLabel: string) => {
      handleRename(renameDialog.fieldname, newLabel);
      setRenameDialog({ open: false, fieldname: "", currentLabel: "" });
    },
    [handleRename, renameDialog.fieldname]
  );

  // Handle popover close - reset state
  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setCurrentView("settings");
      setSearchQuery("");
      setNavigationStack([]);
    }
  }, []);

  const columnIds = visibleColumns.map((c) => c.fieldname);

  return (
    <>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn("gap-1.5", className)}
          >
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">View settings</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 p-0 overflow-hidden">
          {/* Settings View */}
          {currentView === "settings" && (
            <>
              <div className="p-3 border-b">
                <h4 className="font-medium text-sm">View settings</h4>
              </div>

              <ScrollArea className="max-h-80 overflow-hidden">
                <div className="p-2">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToVerticalAxis, restrictToParentElement]}
                  >
                    <SortableContext
                      items={columnIds}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-0.5">
                        {visibleColumns.map((column) => (
                          <SortableColumnItem
                            key={column.fieldname}
                            column={column}
                            field={fieldMap.get(column.fieldname)}
                            onRename={(fn) => openRenameDialog(fn)}
                            onRemove={handleRemove}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              </ScrollArea>

              {/* Add Column Button */}
              <div className="p-2 border-t">
                <button
                  onClick={() => setCurrentView("addColumn")}
                  className="flex items-center justify-between w-full px-2 py-1.5 text-sm rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span>Add column</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </>
          )}

          {/* Add Column View */}
          {currentView === "addColumn" && (
            <>
              <div className="p-3 border-b">
                <button
                  onClick={() => {
                    if (navigationStack.length > 0) {
                      handleNavigateBack();
                    } else {
                      setCurrentView("settings");
                      setSearchQuery("");
                    }
                  }}
                  className="flex items-center gap-2 text-sm font-medium hover:text-muted-foreground transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>
                    {navigationStack.length > 0
                      ? navigationStack[navigationStack.length - 1].field.label
                      : "Add column"}
                  </span>
                </button>
                {/* Breadcrumb path */}
                {navigationStack.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1 pl-6">
                    {navigationStack.map((l) => l.field.label).join(" > ")}
                  </p>
                )}
              </div>

              {/* Search */}
              <div className="p-2 border-b">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search attributes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8"
                    autoFocus
                  />
                </div>
              </div>

              {/* Field List */}
              <ScrollArea className="max-h-64">
                <div className="p-1">
                  {isLoadingRelated ? (
                    <div className="px-3 py-8 text-center">
                      <p className="text-sm text-muted-foreground">
                        Loading fields...
                      </p>
                    </div>
                  ) : availableFields.length === 0 ? (
                    <div className="px-3 py-8 text-center">
                      <p className="text-sm text-muted-foreground">
                        {searchQuery
                          ? "No attributes found"
                          : "All attributes are already visible"}
                      </p>
                    </div>
                  ) : (
                    availableFields.map((field) => {
                      const isLink = field.fieldtype === "Link" && field.options && onFetchRelatedFields;
                      return (
                        <button
                          key={field.fieldname}
                          onClick={() => {
                            if (isLink) {
                              handleNavigateIntoLink(field);
                            } else {
                              handleAddColumn(field.fieldname, field);
                            }
                          }}
                          className="flex items-center gap-3 w-full px-3 py-2 text-left rounded-md hover:bg-muted/50 transition-colors group"
                        >
                          <span className="text-muted-foreground">
                            {getFieldIcon(field.fieldtype)}
                          </span>
                          <span className="flex-1 text-sm truncate">{field.label}</span>
                          {isLink && (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </PopoverContent>
      </Popover>

      {/* Rename Dialog */}
      <RenameDialog
        open={renameDialog.open}
        onOpenChange={(open) =>
          setRenameDialog((prev) => ({ ...prev, open }))
        }
        currentLabel={renameDialog.currentLabel}
        onConfirm={handleRenameConfirm}
      />
    </>
  );
}

export default ViewSettingsPanel;
