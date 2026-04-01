import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hooks';
import type { RiskLevel } from '@/store/floodRiskSlice';

const riskConfig: Record<RiskLevel, { emoji: string; color: string; bgColor: string; labelKey: string; descKey: string }> = {
  safe:     { emoji: '🟢', color: 'text-green-700', bgColor: 'bg-green-50 border-green-200', labelKey: 'risk.safe', descKey: 'risk.safe_desc' },
  moderate: { emoji: '🟡', color: 'text-yellow-700', bgColor: 'bg-yellow-50 border-yellow-300', labelKey: 'risk.moderate', descKey: 'risk.moderate_desc' },
  danger:   { emoji: '🟠', color: 'text-orange-700', bgColor: 'bg-orange-50 border-orange-300', labelKey: 'risk.danger', descKey: 'risk.danger_desc' },
  severe:   { emoji: '🔴', color: 'text-red-700', bgColor: 'bg-red-50 border-red-300', labelKey: 'risk.severe', descKey: 'risk.severe_desc' },
};

interface SimpleModeProps {
  onViewMap?: () => void;
}

export default function SimpleMode({ onViewMap }: SimpleModeProps) {
  const { t } = useTranslation();
  const { ward, riskLevel, advisory, forecastRainfallMm, forecastHours } = useAppSelector(
    (s) => s.floodRisk
  );

  const cfg = riskConfig[riskLevel];

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <div
        className={`w-full max-w-md rounded-2xl border-2 ${cfg.bgColor} p-6 shadow-lg`}
        role="region"
        aria-label={t('simple_mode.flood_risk')}
      >
        {/* Ward Name */}
        <p className="text-sm text-gray-500 mb-1">
          📍 {t('simple_mode.your_area')}
        </p>
        <h2 className="text-xl font-bold mb-4">
          {ward ? `${ward.name}, ${t('simple_mode.ward')} ${ward.wardNumber}` : t('common.loading')}
        </h2>

        {/* Risk Level — large, centered, unmissable */}
        <div className="text-center mb-4">
          <span className="text-5xl" role="img" aria-label={t(cfg.labelKey)}>
            {cfg.emoji}
          </span>
          <h3 className={`text-2xl font-extrabold mt-2 ${cfg.color}`}>
            {t(cfg.labelKey).toUpperCase()}
          </h3>
        </div>

        {/* Advisory */}
        <p className="text-base text-gray-700 text-center mb-4 leading-relaxed">
          {advisory || t(cfg.descKey)}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-4">
          <button
            className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 px-4 rounded-xl text-base flex items-center justify-center gap-2 transition-colors"
            aria-label={t('simple_mode.see_safe_routes')}
          >
            🗺️ {t('simple_mode.see_safe_routes')}
          </button>
          <button
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-xl text-base flex items-center justify-center gap-2 transition-colors"
            aria-label={t('simple_mode.emergency')}
          >
            ☎️ {t('simple_mode.emergency')}
          </button>
        </div>

        {/* Forecast */}
        {forecastRainfallMm !== null && (
          <p className="text-sm text-gray-600 text-center">
            {t('simple_mode.next_hours', { hours: forecastHours })}:{' '}
            🌧️ {t('simple_mode.rain_expected', { amount: forecastRainfallMm })}
          </p>
        )}
      </div>

      {/* View Map link */}
      <button
        onClick={onViewMap}
        className="mt-4 text-sky-600 hover:text-sky-800 font-medium text-base underline underline-offset-4"
        aria-label={t('simple_mode.view_map')}
      >
        {t('simple_mode.view_map')} →
      </button>
    </div>
  );
}
