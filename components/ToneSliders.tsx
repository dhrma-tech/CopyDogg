import { SLIDER_FIELDS, previewSentence, type Sliders } from "@/lib/voicePreview";

interface ToneSlidersProps {
  sliders: Sliders;
  onChange: (key: keyof Sliders, value: number) => void;
}

export default function ToneSliders({ sliders, onChange }: ToneSlidersProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">
        {SLIDER_FIELDS.map(({ key, label }) => (
          <label key={key} className="flex flex-col gap-1">
            <span className="flex items-baseline justify-between text-small font-medium text-ink">
              {label}
              <span className="label">{sliders[key]}</span>
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={sliders[key]}
              onChange={(e) => onChange(key, Number(e.target.value))}
              style={{ ["--fill" as string]: `${sliders[key]}%` }}
              className="slider"
            />
          </label>
        ))}
      </div>

      <p className="rounded-md bg-paper px-4 py-3 text-small text-ink-soft">
        {previewSentence(sliders)}
      </p>
    </div>
  );
}
