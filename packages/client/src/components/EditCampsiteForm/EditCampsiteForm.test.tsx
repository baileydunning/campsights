import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import EditCampsiteForm from './EditCampsiteForm';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { putCampsite, deleteCampsite } from '../../store/campsiteSlice';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';

vi.mock('../../store/store', () => ({
  useAppDispatch: vi.fn(),
  useAppSelector: vi.fn(),
}));

vi.mock('../../store/campsiteSlice', () => {
  const mockPut = vi.fn();
  (mockPut as any).fulfilled = { match: (action: any) => action.type === 'put/fulfilled' };
  const mockDelete = vi.fn();
  (mockDelete as any).fulfilled = { match: (action: any) => action.type === 'delete/fulfilled' };
  return {
    putCampsite: mockPut,
    deleteCampsite: mockDelete,
  };
});

describe('EditCampsiteForm', () => {
  const site = {
    id: "test-site-id",
    name: 'Trailhead Camp',
    description: 'A lovely spot by the river',
    lat: 35,
    lng: -120,
    requires_4wd: false,
    last_updated: '2025-06-01T00:00:00.000Z',
    weather: [], // Add an empty array or mock WeatherPeriod[] as needed
  };
  let dispatchMock: ReturnType<typeof vi.fn>;
  const onCancelMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    dispatchMock = vi.fn();
    (useAppDispatch as unknown as Mock).mockReturnValue(dispatchMock);
    (useAppSelector as unknown as Mock).mockReturnValue(null);
  });

  it('renders fields with initial values and buttons', () => {
    render(<EditCampsiteForm site={site} onCancel={onCancelMock} />);

    expect(screen.getByPlaceholderText('Name')).toHaveValue(site.name);
    expect(screen.getByPlaceholderText('Description')).toHaveValue(site.description);
    expect(screen.getByPlaceholderText('Lat')).toHaveValue(site.lat);
    expect(screen.getByPlaceholderText('Lng')).toHaveValue(site.lng);
    expect(screen.getByLabelText('4WD')).not.toBeChecked();

    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeEnabled();
  });

  it('updates input values on change', () => {
    render(<EditCampsiteForm site={site} onCancel={onCancelMock} />);

    const nameInput = screen.getByPlaceholderText('Name');
    fireEvent.change(nameInput, { target: { value: 'New Camp Name' } });
    expect(nameInput).toHaveValue('New Camp Name');

    const checkbox = screen.getByLabelText('4WD') as HTMLInputElement;
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);
  });

  it('calls onCancel when Cancel button is clicked', () => {
    render(<EditCampsiteForm site={site} onCancel={onCancelMock} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancelMock).toHaveBeenCalledTimes(1);
  });

  it('dispatches putCampsite and calls onCancel on successful save', async () => {
    dispatchMock.mockResolvedValue({ type: 'put/fulfilled', payload: {} });

    render(<EditCampsiteForm site={site} onCancel={onCancelMock} />);

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();

    await waitFor(() => {
      expect(putCampsite).toHaveBeenCalledWith(
        expect.objectContaining({ id: site.id, data: expect.any(Object) })
      );
      expect(dispatchMock).toHaveBeenCalledTimes(1);
      expect(onCancelMock).toHaveBeenCalledTimes(1);
    });
  });

  it('shows error message on failed save', async () => {
    dispatchMock.mockResolvedValue({ type: 'put/rejected', payload: 'Update failed' });

    render(<EditCampsiteForm site={site} onCancel={onCancelMock} />);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(screen.getByText('Update failed')).toBeInTheDocument();
    });
  });

  it('dispatches deleteCampsite and shows error on failed delete', async () => {
    dispatchMock.mockResolvedValue({ type: 'delete/rejected', payload: 'Delete failed' });

    render(<EditCampsiteForm site={site} onCancel={onCancelMock} />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(screen.getByRole('button', { name: 'Deleting...' })).toBeDisabled();

    await waitFor(() => {
      expect(deleteCampsite).toHaveBeenCalledWith(site.id);
      expect(screen.getByText('Delete failed')).toBeInTheDocument();
    });
  });
});
