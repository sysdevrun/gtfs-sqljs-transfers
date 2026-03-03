interface Props {
  goodInterval: number;
  badInterval: number;
  onGoodChange: (value: number) => void;
  onBadChange: (value: number) => void;
}

export function IntervalControls({ goodInterval, badInterval, onGoodChange, onBadChange }: Props) {
  return (
    <div className="interval-controls">
      <div className="control-group">
        <label htmlFor="good-interval">
          Bonne correspondance
          <span className="interval-badge good">{goodInterval} min</span>
        </label>
        <input
          id="good-interval"
          type="range"
          min={1}
          max={60}
          value={goodInterval}
          onChange={(e) => onGoodChange(Number(e.target.value))}
        />
      </div>
      <div className="control-group">
        <label htmlFor="bad-interval">
          Mauvaise correspondance
          <span className="interval-badge bad">{badInterval} min</span>
        </label>
        <input
          id="bad-interval"
          type="range"
          min={0}
          max={30}
          value={badInterval}
          onChange={(e) => onBadChange(Number(e.target.value))}
        />
      </div>
    </div>
  );
}
