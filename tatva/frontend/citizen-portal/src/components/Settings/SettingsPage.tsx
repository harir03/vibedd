import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [notifications, setNotifications] = useState(true);

  const changeLang = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const changeFontSize = (size: 'small' | 'medium' | 'large') => {
    setFontSize(size);
    const sizes = { small: '14px', medium: '16px', large: '20px' };
    document.documentElement.style.fontSize = sizes[size];
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      <h2 className="text-xl font-bold">⚙️ {t('settings.title')}</h2>

      {/* Language */}
      <section className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">🌐 {t('settings.language')}</h3>
        <div className="flex gap-2">
          {[
            { code: 'en', label: 'English' },
            { code: 'hi', label: 'हिन्दी' },
          ].map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLang(lang.code)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium text-base transition-colors ${
                i18n.language === lang.code
                  ? 'bg-sky-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              aria-pressed={i18n.language === lang.code}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </section>

      {/* Font Size */}
      <section className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">🔤 {t('settings.font_size')}</h3>
        <div className="flex gap-2">
          {(['small', 'medium', 'large'] as const).map((size) => (
            <button
              key={size}
              onClick={() => changeFontSize(size)}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                fontSize === size
                  ? 'bg-sky-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={{ fontSize: size === 'small' ? '14px' : size === 'large' ? '20px' : '16px' }}
              aria-pressed={fontSize === size}
              aria-label={`${t('settings.font_size')}: ${t(`settings.${size}`)}`}
            >
              {t(`settings.${size}`)}
            </button>
          ))}
        </div>
      </section>

      {/* Notifications */}
      <section className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-700">🔔 {t('settings.notifications')}</h3>
          </div>
          <button
            onClick={() => setNotifications(!notifications)}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              notifications ? 'bg-sky-500' : 'bg-gray-300'
            }`}
            role="switch"
            aria-checked={notifications}
            aria-label={t('settings.notifications')}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                notifications ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </section>
    </div>
  );
}
