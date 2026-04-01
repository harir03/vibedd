import { type ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import floodRiskReducer, { type FloodRiskState } from '../store/floodRiskSlice';

// Minimal i18n for tests — returns keys as-is
const testI18n = i18n.createInstance();
testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: {
      translation: {
        'app.name': 'JalDrishti',
        'app.tagline': 'Urban Flood Watch',
        'simple_mode.your_area': 'Your Area',
        'simple_mode.ward': 'Ward',
        'simple_mode.flood_risk': 'Flood Risk',
        'simple_mode.see_safe_routes': 'See Safe Routes',
        'simple_mode.emergency': 'Emergency',
        'simple_mode.view_map': 'View Full Map',
        'simple_mode.next_hours': 'Next {{hours}} hours',
        'simple_mode.rain_expected': '{{amount}}mm rain expected',
        'simple_mode.last_updated': 'Last updated {{time}}',
        'common.loading': 'Loading...',
        'risk.safe': 'Safe',
        'risk.safe_desc': 'No flooding expected.',
        'risk.moderate': 'Moderate Risk',
        'risk.moderate_desc': 'Light waterlogging possible.',
        'risk.danger': 'High Risk',
        'risk.danger_desc': 'Significant waterlogging expected.',
        'risk.severe': 'Severe Risk',
        'risk.severe_desc': 'Dangerous flooding expected.',
        'emergency_contacts.title': 'Emergency Contacts',
        'emergency_contacts.ndrf': 'NDRF',
        'emergency_contacts.fire': 'Fire Department',
        'emergency_contacts.police': 'Police',
        'emergency_contacts.ambulance': 'Ambulance',
        'emergency_contacts.disaster_helpline': 'Disaster Helpline',
        'emergency_contacts.emergency_number': 'Emergency',
        'emergency_contacts.share_location': 'Share My Location',
        'offline.banner': 'OFFLINE — Last updated {{time}}',
        'report.title': 'Report Flooding',
        'report.water_depth': 'Water Depth',
        'report.ankle': 'Ankle deep',
        'report.knee': 'Knee deep',
        'report.waist': 'Waist deep',
        'report.chest': 'Chest deep',
        'report.above_head': 'Above head',
        'report.description': 'Description',
        'report.description_placeholder': 'Describe the flooding...',
        'report.add_photo': 'Add Photo',
        'report.submit': 'Submit Report',
        'report.submitting': 'Submitting...',
        'report.success': 'Report submitted successfully!',
        'nav.home': 'Home',
        'nav.map': 'Map',
        'nav.report': 'Report',
        'nav.readiness': 'Readiness',
        'nav.settings': 'Settings',
      },
    },
  },
  interpolation: { escapeValue: false },
});

const defaultPreloadedState: FloodRiskState = {
  ward: { id: 173, name: 'Saidapet', wardNumber: '173', zone: 'Zone 13' },
  riskLevel: 'moderate',
  readinessScore: 62,
  readinessGrade: 'C',
  forecastRainfallMm: 45,
  forecastHours: 6,
  advisory: '',
  latitude: 13.0208,
  longitude: 80.2211,
  locationLoading: false,
  locationError: null,
  isOnline: true,
  lastUpdated: new Date().toISOString(),
  isAdvancedMode: false,
};

interface WrapperOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: Partial<FloodRiskState>;
}

export function renderWithProviders(
  ui: ReactNode,
  { preloadedState = {}, ...renderOptions }: WrapperOptions = {},
) {
  const store = configureStore({
    reducer: { floodRisk: floodRiskReducer },
    preloadedState: {
      floodRisk: { ...defaultPreloadedState, ...preloadedState },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <I18nextProvider i18n={testI18n}>{children}</I18nextProvider>
      </Provider>
    );
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}
