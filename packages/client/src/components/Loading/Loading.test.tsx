import { render, screen } from '@testing-library/react';
import Loading from './Loading';
import { describe, it, expect } from 'vitest';

describe('<Loading />', () => {
  it('renders an accessible loading spinner', () => {
    render(<Loading />);
    expect(screen.getByRole('status')).toHaveTextContent(/loading/i);
    expect(document.querySelector('.loading-spinner')).toBeInTheDocument();
    expect(document.querySelector('.loading-screen')).toBeInTheDocument();
  });
});
