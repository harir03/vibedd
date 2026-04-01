import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface EmergencyContact {
  labelKey: string;
  number: string;
  icon: string;
}

/** Hardcoded — works offline, no API needed */
const CONTACTS: EmergencyContact[] = [
  { labelKey: 'emergency_contacts.ndrf',              number: '011-24363260', icon: '🚤' },
  { labelKey: 'emergency_contacts.fire',              number: '101',          icon: '🚒' },
  { labelKey: 'emergency_contacts.police',            number: '100',          icon: '🚔' },
  { labelKey: 'emergency_contacts.ambulance',         number: '108',          icon: '🚑' },
  { labelKey: 'emergency_contacts.disaster_helpline', number: '1070',         icon: '📞' },
  { labelKey: 'emergency_contacts.emergency_number',  number: '112',          icon: '🆘' },
];

export default function EmergencyFAB() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const onToggle = () => setIsOpen((v) => !v);

  const handleShare = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude, longitude } = pos.coords;
      const msg = `I need help! My location: https://maps.google.com/?q=${latitude},${longitude}`;
      if (navigator.share) {
        navigator.share({ title: 'Emergency Location', text: msg }).catch(() => {});
      } else {
        window.open(`sms:?body=${encodeURIComponent(msg)}`);
      }
    });
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/* Contact sheet */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-4 left-4 sm:left-auto sm:w-80 bg-white rounded-2xl shadow-2xl z-50 p-4"
          role="dialog"
          aria-label={t('emergency_contacts.title')}
        >
          <h3 className="text-lg font-bold mb-3 text-red-600">
            🆘 {t('emergency_contacts.title')}
          </h3>
          <ul className="space-y-2">
            {CONTACTS.map((c) => (
              <li key={c.number}>
                <a
                  href={`tel:${c.number}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-red-50 transition-colors"
                  aria-label={`${t(c.labelKey)}: ${c.number}`}
                >
                  <span className="text-2xl">{c.icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{t(c.labelKey)}</p>
                    <p className="text-sky-600 font-mono text-base">{c.number}</p>
                  </div>
                  <span className="text-green-600 text-xl">📞</span>
                </a>
              </li>
            ))}
          </ul>
          <button
            onClick={handleShare}
            className="w-full mt-3 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl transition-colors"
            aria-label={t('emergency_contacts.share_location')}
          >
            📍 {t('emergency_contacts.share_location')}
          </button>
        </div>
      )}

      {/* FAB Button — always visible */}
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white text-2xl shadow-lg flex items-center justify-center transition-transform active:scale-95"
        aria-label={t('simple_mode.emergency')}
      >
        🆘
      </button>
    </>
  );
}
