// packages/ui/src/ScentProfile.tsx — note pyramid + family/mood. หอมฉลุย — Powered by 2T9COME.
import type { Locale } from "@homchalui/i18n";

const L = {
  heading: { th: "โปรไฟล์กลิ่น", en: "Scent profile", zh: "香调档案" },
  top: { th: "โน้ตบน", en: "Top notes", zh: "前调" },
  middle: { th: "โน้ตกลาง", en: "Middle notes", zh: "中调" },
  base: { th: "โน้ตล่าง", en: "Base notes", zh: "后调" },
  family: { th: "ตระกูลกลิ่น", en: "Family", zh: "香调" },
  mood: { th: "อารมณ์", en: "Mood", zh: "氛围" },
  occasion: { th: "โอกาส", en: "Occasion", zh: "场合" },
} satisfies Record<string, Record<Locale, string>>;

export interface ScentProfileProps {
  topNotes?: string[];
  middleNotes?: string[];
  baseNotes?: string[];
  family?: string | null;
  mood?: string[];
  occasion?: string[];
  locale: Locale;
}

function Tier({ label, notes }: { label: string; notes: string[] }) {
  if (notes.length === 0) return null;
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className="w-20 shrink-0 text-xs text-text-muted">{label}</span>
      <span className="flex flex-wrap gap-1.5">
        {notes.map((n) => (
          <span key={n} className="rounded-full bg-bg-soft px-2 py-0.5 text-xs text-text-secondary">{n}</span>
        ))}
      </span>
    </div>
  );
}

export function ScentProfile({ topNotes = [], middleNotes = [], baseNotes = [], family, mood = [], occasion = [], locale }: ScentProfileProps) {
  const hasNotes = topNotes.length || middleNotes.length || baseNotes.length;
  if (!hasNotes && !family && mood.length === 0 && occasion.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="mb-3 font-semibold text-brand-dark">{L.heading[locale]}</h2>
      <div className="space-y-2 rounded-2xl border border-line bg-card p-4">
        {family && (
          <p className="text-sm">
            <span className="text-text-muted">{L.family[locale]}: </span>
            <span className="rounded-full bg-gold/15 px-2 py-0.5 text-xs text-brand-dark">{family}</span>
          </p>
        )}
        <Tier label={L.top[locale]} notes={topNotes} />
        <Tier label={L.middle[locale]} notes={middleNotes} />
        <Tier label={L.base[locale]} notes={baseNotes} />
        {mood.length > 0 && <Tier label={L.mood[locale]} notes={mood} />}
        {occasion.length > 0 && <Tier label={L.occasion[locale]} notes={occasion} />}
      </div>
    </section>
  );
}
