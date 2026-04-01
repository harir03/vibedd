import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type RiskLevel = 'safe' | 'moderate' | 'danger' | 'severe';

export interface WardInfo {
  id: number;
  name: string;
  wardNumber: string;
  zone: string;
}

export interface FloodRiskState {
  /** Current ward (auto-detected or selected) */
  ward: WardInfo | null;
  /** Risk level for current ward */
  riskLevel: RiskLevel;
  /** Readiness score 0-100 */
  readinessScore: number | null;
  /** Readiness grade A-F */
  readinessGrade: string | null;
  /** Forecast: rainfall in mm for next N hours */
  forecastRainfallMm: number | null;
  forecastHours: number;
  /** Advisory text */
  advisory: string;
  /** Location detection */
  latitude: number | null;
  longitude: number | null;
  locationLoading: boolean;
  locationError: string | null;
  /** Online/offline */
  isOnline: boolean;
  lastUpdated: string | null;
  /** UI mode */
  isAdvancedMode: boolean;
}

const initialState: FloodRiskState = {
  ward: null,
  riskLevel: 'safe',
  readinessScore: null,
  readinessGrade: null,
  forecastRainfallMm: null,
  forecastHours: 6,
  advisory: '',
  latitude: null,
  longitude: null,
  locationLoading: false,
  locationError: null,
  isOnline: navigator.onLine,
  lastUpdated: null,
  isAdvancedMode: false,
};

const floodRiskSlice = createSlice({
  name: 'floodRisk',
  initialState,
  reducers: {
    setWard(state, action: PayloadAction<WardInfo>) {
      state.ward = action.payload;
    },
    setRiskLevel(state, action: PayloadAction<RiskLevel>) {
      state.riskLevel = action.payload;
    },
    setReadinessScore(state, action: PayloadAction<{ score: number; grade: string }>) {
      state.readinessScore = action.payload.score;
      state.readinessGrade = action.payload.grade;
    },
    setForecast(state, action: PayloadAction<{ rainfallMm: number; hours: number }>) {
      state.forecastRainfallMm = action.payload.rainfallMm;
      state.forecastHours = action.payload.hours;
    },
    setAdvisory(state, action: PayloadAction<string>) {
      state.advisory = action.payload;
    },
    setLocation(state, action: PayloadAction<{ lat: number; lng: number }>) {
      state.latitude = action.payload.lat;
      state.longitude = action.payload.lng;
      state.locationLoading = false;
      state.locationError = null;
    },
    setLocationLoading(state, action: PayloadAction<boolean>) {
      state.locationLoading = action.payload;
    },
    setLocationError(state, action: PayloadAction<string>) {
      state.locationError = action.payload;
      state.locationLoading = false;
    },
    setOnlineStatus(state, action: PayloadAction<boolean>) {
      state.isOnline = action.payload;
    },
    setLastUpdated(state, action: PayloadAction<string>) {
      state.lastUpdated = action.payload;
    },
    toggleAdvancedMode(state) {
      state.isAdvancedMode = !state.isAdvancedMode;
    },
  },
});

export const {
  setWard,
  setRiskLevel,
  setReadinessScore,
  setForecast,
  setAdvisory,
  setLocation,
  setLocationLoading,
  setLocationError,
  setOnlineStatus,
  setLastUpdated,
  toggleAdvancedMode,
} = floodRiskSlice.actions;

export default floodRiskSlice.reducer;
