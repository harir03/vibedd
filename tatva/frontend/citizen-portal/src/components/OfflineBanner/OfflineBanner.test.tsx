import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import OfflineBanner from './OfflineBanner';
import { renderWithProviders } from '../../test/test-utils';

describe('OfflineBanner', () => {
  it('does NOT render when online', () => {
    renderWithProviders(<OfflineBanner />, {
      preloadedState: { isOnline: true },
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders warning when offline', () => {
    renderWithProviders(<OfflineBanner />, {
      preloadedState: { isOnline: false, lastUpdated: new Date().toISOString() },
    });
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/OFFLINE/)).toBeInTheDocument();
  });

  it('shows "—" when lastUpdated is null', () => {
    renderWithProviders(<OfflineBanner />, {
      preloadedState: { isOnline: false, lastUpdated: null },
    });
    expect(screen.getByText(/—/)).toBeInTheDocument();
  });
});
