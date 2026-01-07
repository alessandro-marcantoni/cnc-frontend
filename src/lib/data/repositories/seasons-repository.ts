import type { Season } from "$model/shared/season";

const seasons: Season[] = [];
const currentYear = new Date().getFullYear();
for (let year = 2024; year <= currentYear; year++) {
  seasons.push({
    name: year,
    startsAt: new Date(year, 3, 1), // April 1st (month is 0-indexed)
    endsAt: new Date(year + 1, 2, 31), // March 31st of next year
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
  const now = new Date();
  return (
    seasons.find((season) => now >= season.startsAt && now <= season.endsAt) ||
    seasons[seasons.length - 1] ||
    null
  );
}
