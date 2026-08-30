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
            <span className="text-sm text-ink">{label}</span>
            <input
              type="range"
              min={0}
              max={100}
              value={sliders[key]}
              onChange={(e) => onChange(key, Number(e.target.value))}
              className="accent-accent"
            />
          </label>
        ))}
      </div>

      <p className="rounded-md border border-hairline bg-paper px-4 py-3 text-sm text-ink-soft">
        {previewSentence(sliders)}
      </p>
    </div>
  );
}
