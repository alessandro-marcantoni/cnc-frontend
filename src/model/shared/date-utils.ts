import {
  CalendarDate,
  CalendarDateTime,
  ZonedDateTime,
  type DateValue,
} from "@internationalized/date";

export function formatDate(
  date: Date | string | undefined | DateValue,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "2-digit",
  },
): string {
  if (!date) return "-";

  if (typeof date === "string") {
    date = new Date(date);
  }

  if (
    date instanceof CalendarDate ||
    date instanceof CalendarDateTime ||
    date instanceof ZonedDateTime
  ) {
    // Use a timezone explicitly — required
    date = date.toDate("Europe/Rome");
  }

  let defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "2-digit",
  };

  if (options) {
    defaultOptions = { ...defaultOptions, ...options };
  }

  return new Intl.DateTimeFormat("it-IT", defaultOptions).format(date);
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("it-IT", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
