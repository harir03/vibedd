import { configureStore } from '@reduxjs/toolkit';
import floodRiskReducer from './floodRiskSlice';

export const store = configureStore({
  reducer: {
    floodRisk: floodRiskReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
