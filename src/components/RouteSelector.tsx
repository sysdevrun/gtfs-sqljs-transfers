import { useMemo } from 'react';
import type { GtfsSqlJs, Route } from 'gtfs-sqljs';

interface DirectionInfo {
  directionId: number;
  headsign: string;
}

interface RouteWithDirections {
  route: Route;
  directions: DirectionInfo[];
}

interface Props {
  gtfs: GtfsSqlJs;
  label: string;
  selectedRouteId: string | null;
  selectedDirectionId: number | null;
  onSelect: (routeId: string, directionId: number) => void;
}

export function RouteSelector({ gtfs, label, selectedRouteId, selectedDirectionId, onSelect }: Props) {
  const routesWithDirections = useMemo<RouteWithDirections[]>(() => {
    const routes = gtfs.getRoutes();
    return routes.map((route) => {
      const trips = gtfs.getTrips({ routeId: route.route_id });
      const directionMap = new Map<number, string>();
      for (const trip of trips) {
        const dirId = trip.direction_id ?? 0;
        if (!directionMap.has(dirId)) {
          directionMap.set(dirId, trip.trip_headsign || (dirId === 0 ? 'Aller' : 'Retour'));
        }
      }
      const directions: DirectionInfo[] = [];
      for (const [directionId, headsign] of directionMap) {
        directions.push({ directionId, headsign });
      }
      directions.sort((a, b) => a.directionId - b.directionId);
      return { route, directions };
    });
  }, [gtfs]);

  return (
    <div className="route-selector">
      <h3>{label}</h3>
      <div className="route-list">
        {routesWithDirections.map(({ route, directions }) => (
          <div key={route.route_id} className="route-item">
            <div
              className="route-badge"
              style={{
                backgroundColor: route.route_color ? `#${route.route_color}` : '#888',
                color: route.route_text_color ? `#${route.route_text_color}` : '#fff',
              }}
            >
              {route.route_short_name || route.route_id}
            </div>
            <div className="route-directions">
              {directions.map((dir) => {
                const isSelected = selectedRouteId === route.route_id && selectedDirectionId === dir.directionId;
                return (
                  <button
                    key={dir.directionId}
                    className={`direction-btn ${isSelected ? 'selected' : ''}`}
                    onClick={() => onSelect(route.route_id, dir.directionId)}
                    style={isSelected ? {
                      borderColor: route.route_color ? `#${route.route_color}` : '#888',
                    } : undefined}
                  >
                    {dir.headsign}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
