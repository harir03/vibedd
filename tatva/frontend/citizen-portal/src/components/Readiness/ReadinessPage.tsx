import { useTranslation } from 'react-i18next';
import { useAppSelector } from '../../store/hooks';
import type { RiskLevel } from '../../store/floodRiskSlice';

const GRADE_COLORS: Record<string, string> = {
  A: 'text-green-600',
  B: 'text-sky-600',
  C: 'text-yellow-600',
  D: 'text-orange-600',
  F: 'text-red-600',
};

function scoreToGrade(score: number): string {
  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  if (score >= 40) return 'C';
  if (score >= 20) return 'D';
  return 'F';
}

const RISK_BAR_COLORS: Record<RiskLevel, string> = {
  safe: 'bg-green-500',
  moderate: 'bg-yellow-500',
  danger: 'bg-orange-500',
  severe: 'bg-red-500',
};

export default function ReadinessPage() {
  const { t } = useTranslation();
  const { readinessScore, readinessGrade, ward, riskLevel } = useAppSelector(
    (s) => s.floodRisk,
  );

  const score = readinessScore ?? 62; // placeholder
  const grade = readinessGrade ?? scoreToGrade(score);

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-5">
      <h2 className="text-xl font-bold">{t('readiness.title')}</h2>

      {/* Score Card */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 text-center space-y-3">
        <p className="text-sm text-gray-500">{t('readiness.score_label')}</p>

        {/* Big score circle */}
        <div className="relative mx-auto w-28 h-28 flex items-center justify-center">
          <svg className="absolute inset-0 w-28 h-28" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="42"
              fill="none" stroke="#e5e7eb" strokeWidth="8"
            />
            <circle
              cx="50" cy="50" r="42"
              fill="none"
              stroke={
                score >= 80 ? '#22c55e' :
                score >= 60 ? '#0ea5e9' :
                score >= 40 ? '#eab308' :
                score >= 20 ? '#f97316' : '#ef4444'
              }
              strokeWidth="8"
              strokeDasharray={`${(score / 100) * 264} 264`}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="text-center">
            <span className="text-3xl font-bold">{score}</span>
            <span className="text-sm text-gray-400">/100</span>
          </div>
        </div>

        <p className={`text-lg font-semibold ${GRADE_COLORS[grade] ?? 'text-gray-700'}`}>
          {t(`readiness.grade_${grade.toLowerCase()}`)}
        </p>

        {ward && (
          <p className="text-xs text-gray-400">
            {ward.name} — {t('simple_mode.ward')} {ward.wardNumber}
          </p>
        )}
      </div>

      {/* Current risk bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <p className="text-sm text-gray-500 mb-2">{t('simple_mode.flood_risk')}</p>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${RISK_BAR_COLORS[riskLevel]}`}
            style={{
              width:
                riskLevel === 'safe' ? '25%' :
                riskLevel === 'moderate' ? '50%' :
                riskLevel === 'danger' ? '75%' : '100%',
            }}
            role="progressbar"
            aria-valuenow={
              riskLevel === 'safe' ? 25 :
              riskLevel === 'moderate' ? 50 :
              riskLevel === 'danger' ? 75 : 100
            }
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t(`risk.${riskLevel}`)}
          />
        </div>
        <p className="text-sm font-medium mt-1">{t(`risk.${riskLevel}`)}</p>
      </div>

      {/* Tips */}
      <div className="bg-sky-50 rounded-xl p-4 border border-sky-100 space-y-2">
        <h3 className="text-sm font-semibold text-sky-800">{t('readiness.what_you_can_do')}</h3>
        <ul className="space-y-2 text-sm text-sky-900">
          {['tip_1', 'tip_2', 'tip_3', 'tip_4'].map((tip) => (
            <li key={tip} className="flex gap-2">
              <span aria-hidden="true">✅</span>
              <span>{t(`readiness.${tip}`)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
