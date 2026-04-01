import { useState } from 'react';
import { useTranslation } from 'react-i18next';

type WaterDepth = 'ankle' | 'knee' | 'waist' | 'chest' | 'above_head';

const DEPTH_OPTIONS: WaterDepth[] = ['ankle', 'knee', 'waist', 'chest', 'above_head'];
const DEPTH_ICONS: Record<WaterDepth, string> = {
  ankle: '🦶',
  knee: '🦵',
  waist: '🧍',
  chest: '🫁',
  above_head: '🏊',
};

export default function ReportForm() {
  const { t } = useTranslation();
  const [depth, setDepth] = useState<WaterDepth | ''>('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // TODO (Tier 3): API call to citizen-service
    // For now, simulate submission
    await new Promise((r) => setTimeout(r, 1000));

    setSubmitting(false);
    setSuccess(true);
    setDepth('');
    setDescription('');
    setPhoto(null);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <h2 className="text-xl font-bold mb-4">🌊 {t('report.title')}</h2>

      {success && (
        <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-xl mb-4" role="alert">
          ✅ {t('report.success')}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Water Depth Selector */}
        <fieldset>
          <legend className="text-sm font-semibold text-gray-700 mb-2">
            💧 {t('report.water_depth')}
          </legend>
          <div className="grid grid-cols-5 gap-2">
            {DEPTH_OPTIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDepth(d)}
                className={`flex flex-col items-center p-2 rounded-xl border-2 transition-colors text-xs ${
                  depth === d
                    ? 'border-sky-500 bg-sky-50 text-sky-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
                aria-pressed={depth === d}
                aria-label={t(`report.${d}`)}
              >
                <span className="text-2xl">{DEPTH_ICONS[d]}</span>
                <span className="mt-1 leading-tight">{t(`report.${d}`)}</span>
              </button>
            ))}
          </div>
        </fieldset>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-1">
            📝 {t('report.description')}
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('report.description_placeholder')}
            className="w-full rounded-xl border border-gray-300 p-3 text-base min-h-[100px] focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none"
            maxLength={500}
          />
        </div>

        {/* Photo */}
        <div>
          <label
            htmlFor="photo"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border-2 border-dashed border-gray-300 hover:border-sky-400 cursor-pointer text-gray-600 hover:text-sky-600 transition-colors"
          >
            📷 {photo ? photo.name : t('report.add_photo')}
          </label>
          <input
            id="photo"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            className="hidden"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || !depth}
          className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-base transition-colors"
          aria-label={t('report.submit')}
        >
          {submitting ? t('report.submitting') : t('report.submit')}
        </button>
      </form>
    </div>
  );
}
