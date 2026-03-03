import { useState, useMemo } from 'react';
import { useGtfs } from './hooks/useGtfs';
import { LoadingScreen } from './components/LoadingScreen';
import { DatePicker } from './components/DatePicker';
import { IntervalControls } from './components/IntervalControls';
import { RouteSelector } from './components/RouteSelector';
import { StopSelector } from './components/StopSelector';
import { Timeline } from './components/Timeline';
import { dateToInput, inputDateToGtfs } from './utils/time';
import './App.css';

function App() {
  const { gtfs, loading, progress, error } = useGtfs();

  const [dateInput, setDateInput] = useState(dateToInput(new Date()));
  const [goodInterval, setGoodInterval] = useState(15);
  const [badInterval, setBadInterval] = useState(5);

  const [arrivalRouteId, setArrivalRouteId] = useState<string | null>(null);
  const [arrivalDirectionId, setArrivalDirectionId] = useState<number | null>(null);
  const [departureRouteId, setDepartureRouteId] = useState<string | null>(null);
  const [departureDirectionId, setDepartureDirectionId] = useState<number | null>(null);
  const [arrivalStopName, setArrivalStopName] = useState<string | null>(null);
  const [departureStopName, setDepartureStopName] = useState<string | null>(null);

  const date = inputDateToGtfs(dateInput);

  const arrivalColor = useMemo(() => {
    if (!gtfs || !arrivalRouteId) return '#16a34a';
    const routes = gtfs.getRoutes({ routeId: arrivalRouteId });
    return routes[0]?.route_color ? `#${routes[0].route_color}` : '#16a34a';
  }, [gtfs, arrivalRouteId]);

  const departureColor = useMemo(() => {
    if (!gtfs || !departureRouteId) return '#ea580c';
    const routes = gtfs.getRoutes({ routeId: departureRouteId });
    return routes[0]?.route_color ? `#${routes[0].route_color}` : '#ea580c';
  }, [gtfs, departureRouteId]);

  if (loading || !gtfs) {
    return <LoadingScreen progress={progress} error={error} />;
  }

  const handleArrivalRoute = (routeId: string, directionId: number) => {
    setArrivalRouteId(routeId);
    setArrivalDirectionId(directionId);
    setArrivalStopName(null);
  };

  const handleDepartureRoute = (routeId: string, directionId: number) => {
    setDepartureRouteId(routeId);
    setDepartureDirectionId(directionId);
    setDepartureStopName(null);
  };

  const canShowTimeline = arrivalRouteId !== null && arrivalDirectionId !== null
    && departureRouteId !== null && departureDirectionId !== null
    && arrivalStopName !== null && departureStopName !== null;

  return (
    <div className="app">
      <header className="app-header">
        <h1>Correspondances Car Jaune</h1>
      </header>

      <div className="controls">
        <DatePicker value={dateInput} onChange={setDateInput} />
        <IntervalControls
          goodInterval={goodInterval}
          badInterval={badInterval}
          onGoodChange={setGoodInterval}
          onBadChange={setBadInterval}
        />
      </div>

      <div className="selectors">
        <div className="selector-column">
          <RouteSelector
            gtfs={gtfs}
            label="Ligne d'arrivée"
            selectedRouteId={arrivalRouteId}
            selectedDirectionId={arrivalDirectionId}
            onSelect={handleArrivalRoute}
          />
          {arrivalRouteId !== null && arrivalDirectionId !== null && (
            <div className="stop-section">
              <h4>Arrêt d'arrivée</h4>
              <StopSelector
                gtfs={gtfs}
                routeId={arrivalRouteId}
                directionId={arrivalDirectionId}
                date={date}
                selectedStopName={arrivalStopName}
                onSelect={setArrivalStopName}
              />
            </div>
          )}
        </div>

        <div className="selector-column">
          <RouteSelector
            gtfs={gtfs}
            label="Ligne de départ"
            selectedRouteId={departureRouteId}
            selectedDirectionId={departureDirectionId}
            onSelect={handleDepartureRoute}
          />
          {departureRouteId !== null && departureDirectionId !== null && (
            <div className="stop-section">
              <h4>Arrêt de départ</h4>
              <StopSelector
                gtfs={gtfs}
                routeId={departureRouteId}
                directionId={departureDirectionId}
                date={date}
                selectedStopName={departureStopName}
                onSelect={setDepartureStopName}
              />
            </div>
          )}
        </div>
      </div>

      {canShowTimeline && (
        <Timeline
          gtfs={gtfs}
          date={date}
          arrivalRouteId={arrivalRouteId}
          arrivalDirectionId={arrivalDirectionId!}
          arrivalStopName={arrivalStopName}
          departureRouteId={departureRouteId}
          departureDirectionId={departureDirectionId!}
          departureStopName={departureStopName}
          goodInterval={goodInterval}
          badInterval={badInterval}
          arrivalColor={arrivalColor}
          departureColor={departureColor}
        />
      )}
    </div>
  );
}

export default App;
