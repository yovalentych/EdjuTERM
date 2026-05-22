"use client";

import { useEffect, useMemo } from "react";
import { useNextCalendarApp, ScheduleXCalendar } from "@schedule-x/react";
import {
  createViewWeek,
  createViewDay,
  createViewMonthGrid,
} from "@schedule-x/calendar";
import { createDragAndDropPlugin } from "@schedule-x/drag-and-drop";
import { createScrollControllerPlugin } from "@schedule-x/scroll-controller";
import "@schedule-x/theme-default/dist/index.css";

import type { LearningSession } from "@/lib/schemas";

// ── session type → calendar color mapping ────────────────────────────────────
const CALENDARS = {
  lecture:      { colorName: "lecture",      lightColors: { main: "#3b82f6", container: "#dbeafe", onContainer: "#1e40af" } },
  seminar:      { colorName: "seminar",      lightColors: { main: "#10b981", container: "#d1fae5", onContainer: "#065f46" } },
  practical:    { colorName: "practical",    lightColors: { main: "#f59e0b", container: "#fef3c7", onContainer: "#92400e" } },
  lab:          { colorName: "lab",          lightColors: { main: "#8b5cf6", container: "#ede9fe", onContainer: "#4c1d95" } },
  self_study:   { colorName: "self_study",   lightColors: { main: "#94a3b8", container: "#f1f5f9", onContainer: "#475569" } },
  consultation: { colorName: "consultation", lightColors: { main: "#f43f5e", container: "#ffe4e6", onContainer: "#9f1239" } },
} as const;

const TYPE_LABEL: Record<string, string> = {
  lecture: "Лекція", seminar: "Семінар", practical: "Практична",
  lab: "Лаб. робота", self_study: "Сам. робота", consultation: "Консультація",
};

function toCalendarDateTime(date: string, time: string): string {
  // schedule-x wants "YYYY-MM-DD HH:mm"
  if (!time) return `${date} 08:00`;
  return `${date} ${time.slice(0, 5)}`;
}

interface Props {
  locale: "uk" | "en";
  sessions: LearningSession[];
  onSessionClick?: (sessionId: string) => void;
  onSessionDrop?: (sessionId: string, newDate: string, newStart: string, newEnd: string) => void;
}

export function CalendarGridView({ locale, sessions, onSessionClick, onSessionDrop }: Props) {
  const calendarSessions = useMemo(() =>
    sessions
      .filter((s) => s.date && s.sessionType !== "self_study")
      .map((s) => ({
        id: s._id!,
        title: s.title || TYPE_LABEL[s.sessionType] || s.sessionType,
        start: toCalendarDateTime(s.date, s.startTime),
        end: toCalendarDateTime(s.date, s.endTime || s.startTime),
        location: s.location || undefined,
        description: TYPE_LABEL[s.sessionType] || s.sessionType,
        calendarId: s.sessionType,
      })),
    [sessions],
  );

  const scrollController = createScrollControllerPlugin({ initialScroll: "08:00" });

  const dragAndDrop = createDragAndDropPlugin();

  const today = new Date().toISOString().slice(0, 10);

  const calendarApp = useNextCalendarApp(
    {
      locale: locale === "uk" ? "uk-UA" : "en-US",
      firstDayOfWeek: 1,
      selectedDate: today,
      views: [createViewWeek(), createViewDay(), createViewMonthGrid()],
      defaultView: createViewWeek().name,
      events: calendarSessions,
      calendars: CALENDARS,
      dayBoundaries: { start: "07:00", end: "22:00" },
      weekOptions: { gridHeight: 560, nDays: 5 },
      callbacks: {
        onEventClick: (event) => {
          if (onSessionClick) onSessionClick(String(event.id));
        },
        onBeforeEventUpdate: (oldEvent, newEvent) => {
          if (onSessionDrop) {
            const newDate = newEvent.start.slice(0, 10);
            const newStart = newEvent.start.slice(11, 16);
            const newEnd = newEvent.end.slice(11, 16);
            onSessionDrop(String(newEvent.id), newDate, newStart, newEnd);
          }
          return true;
        },
      },
    },
    [dragAndDrop, scrollController],
  );

  // Sync events when sessions prop changes
  useEffect(() => {
    if (!calendarApp) return;
    calendarApp.events.getAll().forEach((e) => calendarApp.events.remove(String(e.id)));
    calendarSessions.forEach((e) => calendarApp.events.add(e));
  }, [calendarSessions]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="sx-wrapper">
      <ScheduleXCalendar calendarApp={calendarApp} />
    </div>
  );
}
