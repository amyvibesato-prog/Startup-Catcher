interface ColorSliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  trackBackground: string;
  onChange: (nextValue: number) => void;
}

export function ColorSlider({
  id,
  label,
  value,
  min,
  max,
  unit,
  trackBackground,
  onChange,
}: ColorSliderProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-[12px]">
        <label
          htmlFor={id}
          className="font-medium"
          style={{ color: 'var(--sc-text-muted)' }}
        >
          {label}
        </label>
        <span
          className="font-mono text-[11.5px] tabular-nums"
          style={{ color: 'var(--sc-text)' }}
        >
          {value}
          {unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="sc-slider"
        style={{ background: trackBackground }}
      />
    </div>
  );
}
