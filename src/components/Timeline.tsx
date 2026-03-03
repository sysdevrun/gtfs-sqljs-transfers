import { useMemo } from 'react';
import type { GtfsSqlJs } from 'gtfs-sqljs';
import { gtfsTimeToMinutes, minutesToDisplay } from '../utils/time';

interface TimeEvent {
  time: number; // minutes since midnight
  display: string;
  tripId: string;
  type: 'arrival' | 'departure';
}

interface Connection {
  arrival: TimeEvent;
  departure: TimeEvent;
  diff: number;
  quality: 'good' | 'bad';
}

interface Props {
  gtfs: GtfsSqlJs;
  date: string;
  arrivalRouteId: string;
  arrivalDirectionId: number;
  arrivalStopName: string;
  departureRouteId: string;
  departureDirectionId: number;
  departureStopName: string;
  goodInterval: number;
  badInterval: number;
  arrivalColor: string;
  departureColor: string;
}

function getStopIdsByName(gtfs: GtfsSqlJs, stopName: string): string[] {
  const allStops = gtfs.getStops();
  return allStops.filter((s) => s.stop_name === stopName).map((s) => s.stop_id);
}

export function Timeline({
  gtfs, date,
  arrivalRouteId, arrivalDirectionId, arrivalStopName,
  departureRouteId, departureDirectionId, departureStopName,
  goodInterval, badInterval,
  arrivalColor, departureColor,
}: Props) {
  const { arrivals, departures, connections } = useMemo(() => {
    // Get all stop IDs matching the arrival stop name
    const arrivalStopIds = getStopIdsByName(gtfs, arrivalStopName);
    const departureStopIds = getStopIdsByName(gtfs, departureStopName);

    // Get stop times for arrivals
    const arrivalEvents: TimeEvent[] = [];
    for (const stopId of arrivalStopIds) {
      const stopTimes = gtfs.getStopTimes({
        routeId: arrivalRouteId,
        directionId: arrivalDirectionId,
        stopId,
        date,
      });
      for (const st of stopTimes) {
        if (!st.arrival_time) continue;
        const time = gtfsTimeToMinutes(st.arrival_time);
        arrivalEvents.push({
          time,
          display: minutesToDisplay(time),
          tripId: st.trip_id,
          type: 'arrival',
        });
      }
    }

    // Get stop times for departures
    const departureEvents: TimeEvent[] = [];
    for (const stopId of departureStopIds) {
      const stopTimes = gtfs.getStopTimes({
        routeId: departureRouteId,
        directionId: departureDirectionId,
        stopId,
        date,
      });
      for (const st of stopTimes) {
        if (!st.departure_time) continue;
        const time = gtfsTimeToMinutes(st.departure_time);
        departureEvents.push({
          time,
          display: minutesToDisplay(time),
          tripId: st.trip_id,
          type: 'departure',
        });
      }
    }

    // Deduplicate by time (multiple stop_ids for same stop_name might yield duplicates)
    const dedup = (events: TimeEvent[]) => {
      const seen = new Set<string>();
      return events.filter((e) => {
        const key = `${e.tripId}-${e.time}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    const uniqueArrivals = dedup(arrivalEvents).sort((a, b) => a.time - b.time);
    const uniqueDepartures = dedup(departureEvents).sort((a, b) => a.time - b.time);

    // Calculate connections
    const conns: Connection[] = [];

    for (const arr of uniqueArrivals) {
      for (const dep of uniqueDepartures) {
        const diff = dep.time - arr.time;
        if (diff >= 0 && diff <= goodInterval) {
          const quality = diff < badInterval ? 'bad' : 'good';
          conns.push({ arrival: arr, departure: dep, diff, quality });
        }
      }
    }

    return {
      arrivals: uniqueArrivals,
      departures: uniqueDepartures,
      connections: conns,
    };
  }, [gtfs, date, arrivalRouteId, arrivalDirectionId, arrivalStopName,
      departureRouteId, departureDirectionId, departureStopName,
      goodInterval, badInterval]);

  if (arrivals.length === 0 && departures.length === 0) {
    return <p className="no-data">Aucun horaire trouvé pour cette sélection</p>;
  }

  // Merge all events and sort by time for the timeline
  const allEvents = [
    ...arrivals.map((e, i) => ({ ...e, idx: i, side: 'arrival' as const })),
    ...departures.map((e, i) => ({ ...e, idx: i, side: 'departure' as const })),
  ].sort((a, b) => a.time - b.time);

  // Determine time range
  const minTime = allEvents[0].time;
  const maxTime = allEvents[allEvents.length - 1].time;
  const range = maxTime - minTime || 1;

  // Build connection lookup for highlighting
  const arrivalConnections = new Map<string, Connection[]>();
  const departureConnections = new Map<string, Connection[]>();
  for (const conn of connections) {
    const aKey = `${conn.arrival.tripId}-${conn.arrival.time}`;
    const dKey = `${conn.departure.tripId}-${conn.departure.time}`;
    if (!arrivalConnections.has(aKey)) arrivalConnections.set(aKey, []);
    arrivalConnections.get(aKey)!.push(conn);
    if (!departureConnections.has(dKey)) departureConnections.set(dKey, []);
    departureConnections.get(dKey)!.push(conn);
  }

  function getConnectionClass(event: TimeEvent): string {
    const key = `${event.tripId}-${event.time}`;
    const conns = event.type === 'arrival'
      ? arrivalConnections.get(key)
      : departureConnections.get(key);
    if (!conns || conns.length === 0) return '';
    // If any connection is good, mark as good (user can take the comfortable transfer)
    if (conns.some((c) => c.quality === 'good')) return 'connection-good';
    return 'connection-bad';
  }

  const TIMELINE_HEIGHT = Math.max(600, allEvents.length * 25);
  const PADDING = 30;

  function getY(time: number): number {
    return PADDING + ((time - minTime) / range) * (TIMELINE_HEIGHT - 2 * PADDING);
  }

  return (
    <div className="timeline-container">
      <div className="timeline-header">
        <span style={{ color: arrivalColor }}>Arrivées ({arrivalStopName})</span>
        <span style={{ color: departureColor }}>Départs ({departureStopName})</span>
      </div>
      <svg className="timeline-svg" viewBox={`0 0 400 ${TIMELINE_HEIGHT}`} preserveAspectRatio="xMidYMid meet">
        {/* Center axis */}
        <line x1="200" y1={PADDING} x2="200" y2={TIMELINE_HEIGHT - PADDING} stroke="#ddd" strokeWidth="2" />

        {/* Time labels on axis */}
        {Array.from({ length: Math.ceil(range / 60) + 1 }, (_, i) => {
          const t = minTime + i * 60;
          if (t > maxTime + 30) return null;
          const y = getY(t);
          return (
            <text key={`hour-${i}`} x="200" y={y} textAnchor="middle" dy="-6" fontSize="10" fill="#999">
              {minutesToDisplay(t)}
            </text>
          );
        })}

        {/* Connection lines */}
        {connections.map((conn, i) => {
          const ay = getY(conn.arrival.time);
          const dy = getY(conn.departure.time);
          const color = conn.quality === 'good' ? '#3b82f6' : '#ef4444';
          return (
            <line
              key={`conn-${i}`}
              x1="120" y1={ay}
              x2="280" y2={dy}
              stroke={color}
              strokeWidth="1.5"
              strokeDasharray={conn.quality === 'bad' ? '4,2' : 'none'}
              opacity="0.4"
            />
          );
        })}

        {/* Arrival points (left side) */}
        {arrivals.map((event) => {
          const y = getY(event.time);
          const connClass = getConnectionClass(event);
          const ringColor = connClass === 'connection-good' ? '#3b82f6'
            : connClass === 'connection-bad' ? '#ef4444' : 'none';
          return (
            <g key={`arr-${event.tripId}-${event.time}`}>
              {ringColor !== 'none' && (
                <circle cx="120" cy={y} r="10" fill="none" stroke={ringColor} strokeWidth="2.5" />
              )}
              <circle cx="120" cy={y} r="5" fill={arrivalColor} />
              <text x="110" y={y} textAnchor="end" dy="4" fontSize="11" fill="#333">
                {event.display}
              </text>
            </g>
          );
        })}

        {/* Departure points (right side) */}
        {departures.map((event) => {
          const y = getY(event.time);
          const connClass = getConnectionClass(event);
          const ringColor = connClass === 'connection-good' ? '#3b82f6'
            : connClass === 'connection-bad' ? '#ef4444' : 'none';
          return (
            <g key={`dep-${event.tripId}-${event.time}`}>
              {ringColor !== 'none' && (
                <circle cx="280" cy={y} r="10" fill="none" stroke={ringColor} strokeWidth="2.5" />
              )}
              <circle cx="280" cy={y} r="5" fill={departureColor} />
              <text x="290" y={y} textAnchor="start" dy="4" fontSize="11" fill="#333">
                {event.display}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="timeline-legend">
        <span className="legend-item">
          <span className="legend-dot" style={{ borderColor: '#3b82f6' }} /> Bonne correspondance (&le; {goodInterval} min)
        </span>
        <span className="legend-item">
          <span className="legend-dot bad" style={{ borderColor: '#ef4444' }} /> Mauvaise correspondance (&lt; {badInterval} min)
        </span>
      </div>

      <div className="connections-summary">
        <h4>Correspondances ({connections.length})</h4>
        <div className="connections-list">
          {connections.map((conn, i) => (
            <div key={i} className={`connection-row ${conn.quality}`}>
              <span className="conn-time">{conn.arrival.display}</span>
              <span className="conn-arrow">&rarr;</span>
              <span className="conn-time">{conn.departure.display}</span>
              <span className="conn-diff">{Math.round(conn.diff)} min</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
