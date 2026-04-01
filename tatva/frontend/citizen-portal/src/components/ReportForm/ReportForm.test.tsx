import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import ReportForm from './ReportForm';
import { renderWithProviders } from '../../test/test-utils';

describe('ReportForm', () => {
  it('renders the report title', () => {
    renderWithProviders(<ReportForm />);
    expect(screen.getByText(/Report Flooding/)).toBeInTheDocument();
  });

  it('renders all 5 water depth options', () => {
    renderWithProviders(<ReportForm />);
    expect(screen.getByRole('button', { name: /ankle/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /knee/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /waist/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /chest/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /above head/i })).toBeInTheDocument();
  });

  it('submit button is disabled until depth is selected', () => {
    renderWithProviders(<ReportForm />);
    const submitBtn = screen.getByRole('button', { name: /submit report/i });
    expect(submitBtn).toBeDisabled();
  });

  it('submit button becomes enabled after selecting a depth', () => {
    renderWithProviders(<ReportForm />);
    fireEvent.click(screen.getByRole('button', { name: /knee/i }));
    const submitBtn = screen.getByRole('button', { name: /submit report/i });
    expect(submitBtn).not.toBeDisabled();
  });

  it('shows description textarea', () => {
    renderWithProviders(<ReportForm />);
    expect(screen.getByPlaceholderText(/describe the flooding/i)).toBeInTheDocument();
  });

  it('has a photo upload label', () => {
    renderWithProviders(<ReportForm />);
    expect(screen.getByText(/Add Photo/)).toBeInTheDocument();
  });
});
