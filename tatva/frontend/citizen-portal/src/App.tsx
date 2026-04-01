import { useState, useEffect, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import Layout, { type TabId } from './components/Layout/Layout';
import SimpleMode from './components/SimpleMode/SimpleMode';
import EmergencyFAB from './components/EmergencyFAB/EmergencyFAB';
import OfflineBanner from './components/OfflineBanner/OfflineBanner';
import { useAppDispatch, useAppSelector } from './store/hooks';
import {
  setOnlineStatus,
  setLocation,
  setLocationLoading,
  setLocationError,
  setLastUpdated,
} from './store/floodRiskSlice';

// Lazy-load heavier pages for better initial load
const FloodRiskMap = lazy(() => import('./components/FloodRiskMap/FloodRiskMap'));
const ReportForm = lazy(() => import('./components/ReportForm/ReportForm'));
const ReadinessPage = lazy(() => import('./components/Readiness/ReadinessPage'));
const SettingsPage = lazy(() => import('./components/Settings/SettingsPage'));

function LoadingSpinner() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center h-64" role="status">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-sky-500 border-t-transparent" />
      <span className="sr-only">{t('common.loading')}</span>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const dispatch = useAppDispatch();
  const isOnline = useAppSelector((s) => s.floodRisk.isOnline);

  // Online / offline listeners
  useEffect(() => {
    const handleOnline = () => dispatch(setOnlineStatus(true));
    const handleOffline = () => dispatch(setOnlineStatus(false));
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [dispatch]);

  // Auto-detect location on first load
  useEffect(() => {
    if (!navigator.geolocation) {
      dispatch(setLocationError('Geolocation not supported'));
      return;
    }
    dispatch(setLocationLoading(true));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        dispatch(
          setLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        );
        dispatch(setLocationLoading(false));
        dispatch(setLastUpdated(new Date().toISOString()));
      },
      (err) => {
        dispatch(setLocationError(err.message));
        dispatch(setLocationLoading(false));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }, [dispatch]);

  // Render active page
  const renderPage = () => {
    switch (activeTab) {
      case 'home':
        return <SimpleMode onViewMap={() => setActiveTab('map')} />;
      case 'map':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <FloodRiskMap />
          </Suspense>
        );
      case 'report':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <ReportForm />
          </Suspense>
        );
      case 'readiness':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <ReadinessPage />
          </Suspense>
        );
      case 'settings':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <SettingsPage />
          </Suspense>
        );
      default:
        return <SimpleMode onViewMap={() => setActiveTab('map')} />;
    }
  };

  return (
    <>
      {!isOnline && <OfflineBanner />}
      <Layout activeTab={activeTab} onTabChange={setActiveTab}>
        {renderPage()}
      </Layout>
      <EmergencyFAB />
    </>
  );
}
