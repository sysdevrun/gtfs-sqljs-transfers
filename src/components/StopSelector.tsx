import { useMemo } from 'react';
import type { GtfsSqlJs, Stop } from 'gtfs-sqljs';

interface Props {
  gtfs: GtfsSqlJs;
  routeId: string;
  directionId: number;
  date: string; // YYYYMMDD
  selectedStopName: string | null;
  onSelect: (stopName: string) => void;
}

export function StopSelector({ gtfs, routeId, directionId, date, selectedStopName, onSelect }: Props) {
  const stops = useMemo<Stop[]>(() => {
    const trips = gtfs.getTrips({ routeId, directionId, date });
    if (trips.length === 0) return [];
    const tripIds = trips.map((t) => t.trip_id);
    return gtfs.buildOrderedStopList(tripIds);
  }, [gtfs, routeId, directionId, date]);

  // Deduplicate by stop_name for display
  const uniqueStops = useMemo(() => {
    const seen = new Set<string>();
    return stops.filter((s) => {
      if (seen.has(s.stop_name)) return false;
      seen.add(s.stop_name);
      return true;
    });
  }, [stops]);

  if (uniqueStops.length === 0) {
    return <p className="no-data">Aucun arrêt pour cette date/route/direction</p>;
  }

  return (
    <div className="stop-selector">
      <div className="stop-list">
        {uniqueStops.map((stop) => (
          <button
            key={stop.stop_id}
            className={`stop-btn ${selectedStopName === stop.stop_name ? 'selected' : ''}`}
            onClick={() => onSelect(stop.stop_name)}
          >
            {stop.stop_name}
          </button>
        ))}
      </div>
    </div>
  );
}
