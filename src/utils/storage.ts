import type { GtfsSelectionResult } from 'react-gtfs-selector';

type UrlSelection = Extract<GtfsSelectionResult, { type: 'url' }>;

const KEYS = {
  arrival: 'gtfs-transfers-arrival-source',
  departure: 'gtfs-transfers-departure-source',
} as const;

export type Column = keyof typeof KEYS;

export function saveSelection(column: Column, result: GtfsSelectionResult): void {
  if (result.type === 'url') {
    localStorage.setItem(KEYS[column], JSON.stringify(result));
  }
}

export function loadSelection(column: Column): UrlSelection | null {
  try {
    const raw = localStorage.getItem(KEYS[column]);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.type === 'url' && typeof parsed.url === 'string') {
      return parsed as UrlSelection;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearSelection(column: Column): void {
  localStorage.removeItem(KEYS[column]);
}
