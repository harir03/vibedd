import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import SimpleMode from './SimpleMode';
import { renderWithProviders } from '../../test/test-utils';

describe('SimpleMode', () => {
  it('renders ward name and risk level', () => {
    renderWithProviders(<SimpleMode />);
    expect(screen.getByText(/Saidapet/)).toBeInTheDocument();
    expect(screen.getByText(/MODERATE RISK/i)).toBeInTheDocument();
  });

  it('shows Safe label when risk is safe', () => {
    renderWithProviders(<SimpleMode />, {
      preloadedState: { riskLevel: 'safe' },
    });
    expect(screen.getByText(/SAFE/)).toBeInTheDocument();
  });

  it('shows Severe Risk when risk is severe', () => {
    renderWithProviders(<SimpleMode />, {
      preloadedState: { riskLevel: 'severe' },
    });
    expect(screen.getByText(/SEVERE RISK/i)).toBeInTheDocument();
  });

  it('shows See Safe Routes and Emergency buttons', () => {
    renderWithProviders(<SimpleMode />);
    expect(screen.getByRole('button', { name: /safe routes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /emergency/i })).toBeInTheDocument();
  });

  it('shows loading when ward is null', () => {
    renderWithProviders(<SimpleMode />, {
      preloadedState: { ward: null },
    });
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays forecast rainfall when available', () => {
    renderWithProviders(<SimpleMode />, {
      preloadedState: { forecastRainfallMm: 45, forecastHours: 6 },
    });
    expect(screen.getByText(/45mm/)).toBeInTheDocument();
  });

  it('renders View Full Map button', () => {
    renderWithProviders(<SimpleMode />);
    expect(screen.getByText(/View Full Map/)).toBeInTheDocument();
  });
});
