interface Props {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
}

export function DatePicker({ value, onChange }: Props) {
  return (
    <div className="control-group">
      <label htmlFor="date-picker">Date</label>
      <input
        id="date-picker"
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
