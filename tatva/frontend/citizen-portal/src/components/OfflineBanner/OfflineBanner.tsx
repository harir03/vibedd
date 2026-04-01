import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hooks';

interface OfflineBannerProps {
  className?: string;
}

export default function OfflineBanner({ className = '' }: OfflineBannerProps) {
  const { t } = useTranslation();
  const { isOnline, lastUpdated } = useAppSelector((s) => s.floodRisk);

  if (isOnline) return null;

  const timeStr = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—';

  return (
    <div
      className={`offline-banner ${className}`}
      role="alert"
      aria-live="polite"
    >
      ⚠️ {t('offline.banner', { time: timeStr })}
    </div>
  );
}
