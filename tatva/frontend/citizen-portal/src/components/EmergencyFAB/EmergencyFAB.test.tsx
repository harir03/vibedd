import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import EmergencyFAB from './EmergencyFAB';
import { renderWithProviders } from '../../test/test-utils';

describe('EmergencyFAB', () => {
  it('renders the FAB button', () => {
    renderWithProviders(<EmergencyFAB />);
    expect(screen.getByRole('button', { name: /emergency/i })).toBeInTheDocument();
  });

  it('shows emergency contacts when FAB is clicked', () => {
    renderWithProviders(<EmergencyFAB />);
    fireEvent.click(screen.getByRole('button', { name: /emergency/i }));
    expect(screen.getByRole('dialog', { name: /emergency contacts/i })).toBeInTheDocument();
  });

  it('shows all 6 emergency numbers', () => {
    renderWithProviders(<EmergencyFAB />);
    fireEvent.click(screen.getByRole('button', { name: /emergency/i }));
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('101')).toBeInTheDocument();
    expect(screen.getByText('108')).toBeInTheDocument();
    expect(screen.getByText('112')).toBeInTheDocument();
    expect(screen.getByText('1070')).toBeInTheDocument();
    expect(screen.getByText('011-24363260')).toBeInTheDocument();
  });

  it('contacts are tel: links for one-tap calling', () => {
    renderWithProviders(<EmergencyFAB />);
    fireEvent.click(screen.getByRole('button', { name: /emergency/i }));
    const links = screen.getAllByRole('link');
    const telLinks = links.filter((l) => l.getAttribute('href')?.startsWith('tel:'));
    expect(telLinks.length).toBe(6);
  });

  it('has a Share My Location button', () => {
    renderWithProviders(<EmergencyFAB />);
    fireEvent.click(screen.getByRole('button', { name: /emergency/i }));
    expect(screen.getByRole('button', { name: /share my location/i })).toBeInTheDocument();
  });

  it('closes the dialog on FAB toggle click', () => {
    renderWithProviders(<EmergencyFAB />);
    // Open
    fireEvent.click(screen.getByRole('button', { name: /emergency/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    // Close via FAB toggle
    fireEvent.click(screen.getByRole('button', { name: /emergency/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
