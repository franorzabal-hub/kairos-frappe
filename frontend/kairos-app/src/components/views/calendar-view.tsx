/**
 * CalendarView Component
 *
 * A calendar view for displaying DocType documents with date fields.
 * Supports month, week, and day views with event clicking and date selection.
 */

"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateSelectArg, EventClickArg, DatesSetArg, EventDropArg } from "@fullcalendar/core";
import { useFrappeUpdateDoc } from "frappe-react-sdk";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, AlertCircle, RefreshCw } from "lucide-react";

import { useCalendarEvents, type CalendarEvent } from "@/hooks/use-calendar-events";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface CalendarViewProps {
  doctype: string;
  doctypeSlug: string;
  className?: string;
}

type CalendarViewType = "dayGridMonth" | "timeGridWeek" | "timeGridDay";

// ============================================================================
// Styles
// ============================================================================

// CSS for FullCalendar customization matching shadcn/ui design system
const calendarStyles = `
  .fc {
    --fc-border-color: hsl(var(--border));
    --fc-button-text-color: hsl(var(--foreground));
    --fc-button-bg-color: hsl(var(--background));
    --fc-button-border-color: hsl(var(--border));
    --fc-button-hover-bg-color: hsl(var(--accent));
    --fc-button-hover-border-color: hsl(var(--border));
    --fc-button-active-bg-color: hsl(var(--primary));
    --fc-button-active-border-color: hsl(var(--primary));
    --fc-today-bg-color: hsl(var(--accent) / 0.3);
    --fc-event-bg-color: hsl(var(--primary));
    --fc-event-border-color: hsl(var(--primary));
    --fc-event-text-color: hsl(var(--primary-foreground));
    --fc-page-bg-color: hsl(var(--background));
    --fc-neutral-bg-color: hsl(var(--muted));
    --fc-neutral-text-color: hsl(var(--muted-foreground));
    --fc-highlight-color: hsl(var(--accent) / 0.5);
    font-family: inherit;
  }

  .fc .fc-toolbar-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: hsl(var(--foreground));
  }

  .fc .fc-col-header-cell-cushion {
    color: hsl(var(--muted-foreground));
    font-weight: 500;
    font-size: 0.875rem;
    padding: 0.5rem;
  }

  .fc .fc-daygrid-day-number {
    color: hsl(var(--foreground));
    font-size: 0.875rem;
    padding: 0.5rem;
  }

  .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
    background-color: hsl(var(--primary));
    color: hsl(var(--primary-foreground));
    border-radius: 9999px;
    width: 1.75rem;
    height: 1.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0.25rem;
  }

  .fc .fc-daygrid-day-frame {
    min-height: 100px;
  }

  .fc .fc-event {
    border-radius: 0.375rem;
    padding: 0.125rem 0.375rem;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    border-width: 1px;
    border-style: solid;
    transition: opacity 0.15s ease;
  }

  .fc .fc-event:hover {
    opacity: 0.85;
  }

  .fc .fc-daygrid-event-dot {
    display: none;
  }

  .fc .fc-daygrid-day:hover {
    background-color: hsl(var(--accent) / 0.2);
  }

  .fc .fc-timegrid-slot {
    height: 3rem;
  }

  .fc .fc-timegrid-slot-label-cushion {
    color: hsl(var(--muted-foreground));
    font-size: 0.75rem;
  }

  .fc .fc-scrollgrid {
    border-radius: 0.5rem;
    overflow: hidden;
  }

  .fc .fc-scrollgrid-section > * {
    border-color: hsl(var(--border));
  }

  .fc .fc-daygrid-body-natural .fc-daygrid-day-events {
    margin-bottom: 0.25rem;
  }

  .fc .fc-more-link {
    color: hsl(var(--primary));
    font-weight: 500;
    font-size: 0.75rem;
  }

  .fc .fc-popover {
    background-color: hsl(var(--popover));
    border-color: hsl(var(--border));
    border-radius: 0.5rem;
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  }

  .fc .fc-popover-header {
    background-color: hsl(var(--muted));
    color: hsl(var(--foreground));
    padding: 0.5rem;
  }

  .fc .fc-popover-body {
    padding: 0.5rem;
  }

  .fc-theme-standard td,
  .fc-theme-standard th {
    border-color: hsl(var(--border));
  }

  .fc-direction-ltr .fc-daygrid-event.fc-event-end,
  .fc-direction-rtl .fc-daygrid-event.fc-event-start {
    margin-right: 2px;
  }

  .fc-direction-ltr .fc-daygrid-event.fc-event-start,
  .fc-direction-rtl .fc-daygrid-event.fc-event-end {
    margin-left: 2px;
  }

  .fc .fc-daygrid-day-bg .fc-highlight {
    background-color: hsl(var(--accent) / 0.5);
  }

  .fc .fc-timegrid-col.fc-day-today {
    background-color: hsl(var(--accent) / 0.1);
  }
`;

// ============================================================================
// Main Component
// ============================================================================

export function CalendarView({ doctype, doctypeSlug, className }: CalendarViewProps) {
  const router = useRouter();
  const calendarRef = useRef<FullCalendar>(null);

  // State
  const [currentView, setCurrentView] = useState<CalendarViewType>("dayGridMonth");
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start, end };
  });
  const [currentTitle, setCurrentTitle] = useState("");

  // Fetch calendar events
  const {
    events,
    isLoading,
    error,
    mutate,
    primaryDateField,
    hasDateFields,
  } = useCalendarEvents({
    doctype,
    dateRange,
    enabled: true,
  });

  // Update document date via API
  const { updateDoc } = useFrappeUpdateDoc();

  // Inject custom styles
  useEffect(() => {
    const styleId = "calendar-view-styles";
    let styleElement = document.getElementById(styleId) as HTMLStyleElement | null;
    
    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = styleId;
      styleElement.textContent = calendarStyles;
      document.head.appendChild(styleElement);
    }

    return () => {
      // Don't remove styles on unmount as they might be needed by other instances
    };
  }, []);

  // ============================================================================
  // Handlers
  // ============================================================================

  /**
   * Handle event click - navigate to document detail
   */
  const handleEventClick = useCallback(
    (clickInfo: EventClickArg) => {
      const event = clickInfo.event;
      const docname = event.extendedProps.docname as string;
      router.push("/" + doctypeSlug + "/" + encodeURIComponent(docname));
    },
    [router, doctypeSlug]
  );

  /**
   * Handle date selection - navigate to new document with date pre-filled
   */
  const handleDateSelect = useCallback(
    (selectInfo: DateSelectArg) => {
      if (!primaryDateField) return;

      // Format date for URL parameter
      const dateStr = selectInfo.startStr.split("T")[0];
      const params = new URLSearchParams();
      params.set(primaryDateField.fieldname, dateStr);

      router.push("/" + doctypeSlug + "/new?" + params.toString());
    },
    [router, doctypeSlug, primaryDateField]
  );

  /**
   * Handle date range change
   */
  const handleDatesSet = useCallback((dateInfo: DatesSetArg) => {
    setDateRange({
      start: dateInfo.start,
      end: dateInfo.end,
    });
    setCurrentTitle(dateInfo.view.title);
  }, []);

  /**
   * Handle event drag and drop
   */
  const handleEventDrop = useCallback(
    async (dropInfo: EventDropArg) => {
      if (!primaryDateField) {
        dropInfo.revert();
        return;
      }

      const event = dropInfo.event;
      const docname = event.extendedProps.docname as string;
      const newDate = event.startStr.split("T")[0];

      try {
        await updateDoc(doctype, docname, {
          [primaryDateField.fieldname]: newDate,
        });
        mutate(); // Refresh the calendar
      } catch (err) {
        console.error("Failed to update document date:", err);
        dropInfo.revert();
      }
    },
    [doctype, primaryDateField, updateDoc, mutate]
  );

  /**
   * Navigate to previous period
   */
  const handlePrev = useCallback(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.prev();
    }
  }, []);

  /**
   * Navigate to next period
   */
  const handleNext = useCallback(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.next();
    }
  }, []);

  /**
   * Navigate to today
   */
  const handleToday = useCallback(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.today();
    }
  }, []);

  /**
   * Change calendar view
   */
  const handleViewChange = useCallback((view: CalendarViewType) => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.changeView(view);
      setCurrentView(view);
    }
  }, []);

  // ============================================================================
  // Transform events for FullCalendar
  // ============================================================================

  const calendarEvents = useMemo(() => {
    return events.map((event: CalendarEvent) => ({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      allDay: event.allDay,
      backgroundColor: event.backgroundColor,
      borderColor: event.borderColor,
      textColor: event.textColor,
      extendedProps: event.extendedProps,
    }));
  }, [events]);

  // ============================================================================
  // Loading State
  // ============================================================================

  if (isLoading && events.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        {/* Toolbar skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-20" />
          </div>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-9 w-32" />
        </div>
        {/* Calendar skeleton */}
        <Skeleton className="h-[600px] w-full rounded-lg" />
      </div>
    );
  }

  // ============================================================================
  // No Date Fields State
  // ============================================================================

  if (!hasDateFields && !isLoading) {
    return (
      <Card className={cn("border-muted", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <CalendarIcon className="h-5 w-5" />
            Calendar View Not Available
          </CardTitle>
          <CardDescription>
            This DocType does not have any date or datetime fields.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            To use the calendar view, the DocType must have at least one Date or Datetime field
            that can be used to position documents on the calendar.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ============================================================================
  // Error State
  // ============================================================================

  if (error) {
    return (
      <Card className={cn("border-destructive", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Error Loading Calendar
          </CardTitle>
          <CardDescription>
            There was a problem loading the calendar data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {error.message}
          </p>
          <Button variant="outline" onClick={() => mutate()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className={cn("space-y-4", className)}>
      {/* Custom Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => mutate()}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>

        {/* Current Title */}
        <h2 className="text-lg font-semibold text-foreground">
          {currentTitle}
        </h2>

        {/* View Selector */}
        <Select value={currentView} onValueChange={(v) => handleViewChange(v as CalendarViewType)}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="View" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dayGridMonth">Month</SelectItem>
            <SelectItem value="timeGridWeek">Week</SelectItem>
            <SelectItem value="timeGridDay">Day</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date Field Info */}
      {primaryDateField && (
        <p className="text-xs text-muted-foreground">
          Showing events by: <span className="font-medium">{primaryDateField.label}</span>
        </p>
      )}

      {/* Calendar */}
      <div className="rounded-lg border bg-card">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={currentView}
          headerToolbar={false}
          events={calendarEvents}
          eventClick={handleEventClick}
          select={handleDateSelect}
          datesSet={handleDatesSet}
          eventDrop={handleEventDrop}
          selectable={true}
          editable={true}
          droppable={true}
          dayMaxEvents={3}
          weekends={true}
          nowIndicator={true}
          height="auto"
          aspectRatio={1.8}
          eventDisplay="block"
          displayEventTime={currentView !== "dayGridMonth"}
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={true}
          expandRows={true}
          stickyHeaderDates={true}
          eventTimeFormat={{
            hour: "numeric",
            minute: "2-digit",
            meridiem: "short",
          }}
          slotLabelFormat={{
            hour: "numeric",
            minute: "2-digit",
            meridiem: "short",
          }}
        />
      </div>

      {/* Event Count */}
      {events.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          {events.length} event{events.length !== 1 ? "s" : ""} in view
        </p>
      )}
    </div>
  );
}
