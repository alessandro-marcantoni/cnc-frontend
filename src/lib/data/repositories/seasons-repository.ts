import type { Season } from "$model/shared/season";
import { CalendarDate, getLocalTimeZone, today } from "@internationalized/date";

const seasons: Season[] = [];
const currentYear = new Date().getFullYear();
for (let year = 2025; year <= currentYear; year++) {
  seasons.push({
    id: year - 2024,
    code: year,
    name: year,
    startsAt: new CalendarDate(year, 4, 1), // April 1st
    endsAt: new CalendarDate(year + 1, 3, 31), // March 31st of next year
  });
}

/**
 * Get all available seasons
 */
export function getSeasons(): Season[] {
  return seasons;
}

/**
 * Get the current season based on today's date
 */
export function getCurrentSeason(): Season {
  const now = today(getLocalTimeZone());
  return (
    seasons.find((season) => now >= season.startsAt && now <= season.endsAt) ||
    seasons[seasons.length - 1] ||
    null
  );
}
