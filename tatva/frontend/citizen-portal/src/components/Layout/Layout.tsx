import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export type TabId = 'home' | 'map' | 'report' | 'readiness' | 'settings';

interface LayoutProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  children: ReactNode;
}

const TABS: { id: TabId; icon: string; labelKey: string }[] = [
  { id: 'home', icon: '🏠', labelKey: 'nav.home' },
  { id: 'map', icon: '🗺️', labelKey: 'nav.map' },
  { id: 'report', icon: '📝', labelKey: 'nav.report' },
  { id: 'readiness', icon: '🛡️', labelKey: 'nav.readiness' },
  { id: 'settings', icon: '⚙️', labelKey: 'nav.settings' },
];

export default function Layout({ activeTab, onTabChange, children }: LayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-dvh bg-gray-50">
      {/* Header */}
      <header className="bg-sky-600 text-white px-4 py-3 flex items-center justify-between shadow-md flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">🌊</span>
          <div>
            <h1 className="text-lg font-bold leading-tight">{t('app.name')}</h1>
            <p className="text-xs text-sky-100 leading-none">{t('app.tagline')}</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-20" id="main-content">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-40"
        role="tablist"
        aria-label={t('app.name')}
      >
        <div className="flex justify-around max-w-md mx-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls="main-content"
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center py-2 px-3 min-w-[56px] min-h-[48px] transition-colors ${
                  isActive
                    ? 'text-sky-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <span className="text-xl leading-none" aria-hidden="true">
                  {tab.icon}
                </span>
                <span className={`text-[10px] mt-0.5 font-medium ${isActive ? 'font-bold' : ''}`}>
                  {t(tab.labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
