/**
 * Convert GTFS time string (HH:MM:SS) to minutes since midnight.
 * GTFS times can exceed 24:00:00 for trips that span past midnight.
 */
export function gtfsTimeToMinutes(time: string): number {
  const parts = time.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parseInt(parts[2] || '0', 10);
  return hours * 60 + minutes + seconds / 60;
}

/**
 * Convert minutes since midnight to display string "HH:MM"
 */
export function minutesToDisplay(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  const displayH = h >= 24 ? h - 24 : h;
  return `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Format a date as YYYYMMDD for gtfs-sqljs
 */
export function dateToGtfs(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

/**
 * Format a date as YYYY-MM-DD for HTML input[type=date]
 */
export function dateToInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parse YYYY-MM-DD to YYYYMMDD
 */
export function inputDateToGtfs(inputDate: string): string {
  return inputDate.replace(/-/g, '');
}
