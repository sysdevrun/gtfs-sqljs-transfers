import { useState, useMemo, useEffect, useCallback } from 'react';
import { useGtfsLoader } from './hooks/useGtfsLoader';
import { LoadingScreen } from './components/LoadingScreen';
import { DatePicker } from './components/DatePicker';
import { IntervalControls } from './components/IntervalControls';
import { RouteSelector } from './components/RouteSelector';
import { StopSelector } from './components/StopSelector';
import { Timeline } from './components/Timeline';
import { dateToInput, inputDateToGtfs } from './utils/time';
import { saveSelection, loadSelection, clearSelection } from './utils/storage';
import { GtfsSelector } from 'react-gtfs-selector';
import type { GtfsSelectionResult } from 'react-gtfs-selector';
import 'react-gtfs-selector/style.css';
import './App.css';

function App() {
  const arrival = useGtfsLoader();
  const departure = useGtfsLoader();

  const [sameFeed, setSameFeed] = useState(true);

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

  // Auto-restore from localStorage on mount
  useEffect(() => {
    const savedArrival = loadSelection('arrival');
    if (savedArrival) arrival.load(savedArrival);
    const savedDeparture = loadSelection('departure');
    if (savedDeparture) {
      departure.load(savedDeparture);
      setSameFeed(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleArrivalSelect = useCallback((result: GtfsSelectionResult) => {
    saveSelection('arrival', result);
    arrival.load(result);
    setArrivalRouteId(null);
    setArrivalDirectionId(null);
    setArrivalStopName(null);
    if (sameFeed) {
      setDepartureRouteId(null);
      setDepartureDirectionId(null);
      setDepartureStopName(null);
    }
  }, [arrival, sameFeed]);

  const handleDepartureSelect = useCallback((result: GtfsSelectionResult) => {
    saveSelection('departure', result);
    departure.load(result);
    setDepartureRouteId(null);
    setDepartureDirectionId(null);
    setDepartureStopName(null);
  }, [departure]);

  const handleArrivalReset = useCallback(() => {
    arrival.reset();
    clearSelection('arrival');
    setArrivalRouteId(null);
    setArrivalDirectionId(null);
    setArrivalStopName(null);
    if (sameFeed) {
      setDepartureRouteId(null);
      setDepartureDirectionId(null);
      setDepartureStopName(null);
    }
  }, [arrival, sameFeed]);

  const handleDepartureReset = useCallback(() => {
    departure.reset();
    clearSelection('departure');
    setDepartureRouteId(null);
    setDepartureDirectionId(null);
    setDepartureStopName(null);
  }, [departure]);

  const handleSameFeedChange = useCallback((checked: boolean) => {
    setSameFeed(checked);
    if (checked) {
      departure.reset();
      clearSelection('departure');
      setDepartureRouteId(null);
      setDepartureDirectionId(null);
      setDepartureStopName(null);
    }
  }, [departure]);

  // Effective gtfs for departure column
  const departureGtfs = sameFeed ? arrival.gtfs : departure.gtfs;

  const arrivalColor = useMemo(() => {
    if (!arrival.gtfs || !arrivalRouteId) return '#16a34a';
    const routes = arrival.gtfs.getRoutes({ routeId: arrivalRouteId });
    return routes[0]?.route_color ? `#${routes[0].route_color}` : '#16a34a';
  }, [arrival.gtfs, arrivalRouteId]);

  const departureColor = useMemo(() => {
    if (!departureGtfs || !departureRouteId) return '#ea580c';
    const routes = departureGtfs.getRoutes({ routeId: departureRouteId });
    return routes[0]?.route_color ? `#${routes[0].route_color}` : '#ea580c';
  }, [departureGtfs, departureRouteId]);

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
        <h1>GTFS Correspondances</h1>
      </header>

      <div className="controls">
        <DatePicker value={dateInput} onChange={setDateInput} />
        <IntervalControls
          goodInterval={goodInterval}
          badInterval={badInterval}
          onGoodChange={setGoodInterval}
          onBadChange={setBadInterval}
        />
        <label className="same-feed-checkbox">
          <input
            type="checkbox"
            checked={sameFeed}
            onChange={(e) => handleSameFeedChange(e.target.checked)}
          />
          Même source pour l'arrivée et le départ
        </label>
      </div>

      <div className="selectors">
        <div className="selector-column">
          <h3 className="column-title">Ligne d'arrivée</h3>
          {arrival.loading ? (
            <LoadingScreen progress={arrival.progress} error={arrival.error} inline onRetry={handleArrivalReset} />
          ) : arrival.error ? (
            <LoadingScreen progress={null} error={arrival.error} inline onRetry={handleArrivalReset} />
          ) : !arrival.gtfs ? (
            <GtfsSelector onSelect={handleArrivalSelect} />
          ) : (
            <>
              <div className="feed-info">
                <span className="feed-title">{arrival.sourceTitle}</span>
                <button className="change-feed-btn" onClick={handleArrivalReset}>Changer</button>
              </div>
              <RouteSelector
                gtfs={arrival.gtfs}
                label="Ligne d'arrivée"
                selectedRouteId={arrivalRouteId}
                selectedDirectionId={arrivalDirectionId}
                onSelect={handleArrivalRoute}
              />
              {arrivalRouteId !== null && arrivalDirectionId !== null && (
                <div className="stop-section">
                  <h4>Arrêt d'arrivée</h4>
                  <StopSelector
                    gtfs={arrival.gtfs}
                    routeId={arrivalRouteId}
                    directionId={arrivalDirectionId}
                    date={date}
                    selectedStopName={arrivalStopName}
                    onSelect={setArrivalStopName}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <div className="selector-column">
          <h3 className="column-title">Ligne de départ</h3>
          {sameFeed ? (
            arrival.gtfs ? (
              <>
                <div className="feed-info">
                  <span className="feed-title">{arrival.sourceTitle}</span>
                  <span className="feed-same-label">même source</span>
                </div>
                <RouteSelector
                  gtfs={arrival.gtfs}
                  label="Ligne de départ"
                  selectedRouteId={departureRouteId}
                  selectedDirectionId={departureDirectionId}
                  onSelect={handleDepartureRoute}
                />
                {departureRouteId !== null && departureDirectionId !== null && (
                  <div className="stop-section">
                    <h4>Arrêt de départ</h4>
                    <StopSelector
                      gtfs={arrival.gtfs}
                      routeId={departureRouteId}
                      directionId={departureDirectionId}
                      date={date}
                      selectedStopName={departureStopName}
                      onSelect={setDepartureStopName}
                    />
                  </div>
                )}
              </>
            ) : (
              <p className="feed-waiting">En attente de la source d'arrivée...</p>
            )
          ) : departure.loading ? (
            <LoadingScreen progress={departure.progress} error={departure.error} inline onRetry={handleDepartureReset} />
          ) : departure.error ? (
            <LoadingScreen progress={null} error={departure.error} inline onRetry={handleDepartureReset} />
          ) : !departure.gtfs ? (
            <GtfsSelector onSelect={handleDepartureSelect} />
          ) : (
            <>
              <div className="feed-info">
                <span className="feed-title">{departure.sourceTitle}</span>
                <button className="change-feed-btn" onClick={handleDepartureReset}>Changer</button>
              </div>
              <RouteSelector
                gtfs={departure.gtfs}
                label="Ligne de départ"
                selectedRouteId={departureRouteId}
                selectedDirectionId={departureDirectionId}
                onSelect={handleDepartureRoute}
              />
              {departureRouteId !== null && departureDirectionId !== null && (
                <div className="stop-section">
                  <h4>Arrêt de départ</h4>
                  <StopSelector
                    gtfs={departure.gtfs}
                    routeId={departureRouteId}
                    directionId={departureDirectionId}
                    date={date}
                    selectedStopName={departureStopName}
                    onSelect={setDepartureStopName}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {canShowTimeline && arrival.gtfs && departureGtfs && (
        <Timeline
          gtfs={arrival.gtfs}
          departureGtfs={sameFeed ? undefined : departureGtfs}
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

      <footer className="app-footer">
        <span>Conçu par <a href="https://www.sys-dev-run.fr/" target="_blank" rel="noopener noreferrer">SysDevRun</a></span>
        <span>npm module : <a href="https://www.npmjs.com/package/gtfs-sqljs" target="_blank" rel="noopener noreferrer">gtfs-sqljs</a></span>
      </footer>
    </div>
  );
}

export default App;
