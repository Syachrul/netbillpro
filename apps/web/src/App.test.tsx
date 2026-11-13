import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  it('menampilkan judul NetBill Pro', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('NetBill Pro');
  });

  it('menampilkan deskripsi', () => {
    render(<App />);
    expect(screen.getByText(/sistem manajemen billing/i)).toBeInTheDocument();
  });
});
