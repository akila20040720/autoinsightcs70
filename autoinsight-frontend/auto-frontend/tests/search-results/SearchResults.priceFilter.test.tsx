import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SearchResults from '../../src/page/SearchResults';
import {
  type FacetsResponse,
  type ListingsResponse,
  fetchFacets,
  fetchListings,
} from '../../src/services/vehicleDataService';

const navigateSpy = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useLocation: () => ({ state: null }),
    useNavigate: () => navigateSpy,
  };
});

vi.mock('../../src/component/OgImage', () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} src="https://example.com/car.jpg" />,
}));

vi.mock('../../src/component/Skeleton', () => ({
  SearchResultsSkeleton: () => <div>Loading...</div>,
}));

vi.mock('../../src/services/vehicleDataService', async () => {
  const actual = await vi.importActual<typeof import('../../src/services/vehicleDataService')>(
    '../../src/services/vehicleDataService',
  );

  return {
    ...actual,
    fetchFacets: vi.fn(),
    fetchListings: vi.fn(),
  };
});

vi.mock('../../src/services/marketplaceStorage', () => ({
  clearCompareVehicles: vi.fn(),
  getCompareVehicles: vi.fn(() => []),
  getFavorites: vi.fn(() => []),
  isCompared: vi.fn(() => false),
  isFavorite: vi.fn(() => false),
  listenToStoredVehicles: vi.fn(() => () => undefined),
  toggleCompareVehicle: vi.fn(),
  toggleFavorite: vi.fn(),
}));

const mockedFetchFacets = vi.mocked(fetchFacets);
const mockedFetchListings = vi.mocked(fetchListings);

const facetsFixture: FacetsResponse = {
  vehicleTypes: [{ value: 'Car', count: 10 }],
  makes: [
    { value: 'Toyota', count: 5 },
    { value: 'Honda', count: 5 },
  ],
  models: [
    { value: 'Corolla', count: 3 },
    { value: 'Civic', count: 2 },
  ],
  conditions: [{ value: 'Used', count: 9 }],
  districts: [{ value: 'Colombo', count: 6 }],
};

const listingsFixture: ListingsResponse = {
  items: [
    {
      id: 'v1',
      vehicleType: 'Car',
      make: 'Toyota',
      model: 'Corolla',
      year: 2020,
      price: 8.9,
      priceLkr: 8900000,
      mileage: 45000,
      district: 'Colombo',
      publishedDate: '2026-03-01',
      listedAt: '2026-03-01',
      vehicleUrl: 'https://example.com/v1',
      condition: 'Used',
      imageUrl: null,
      validationStatus: 'validated',
      confidence: 0.96,
    },
  ],
  meta: {
    total: 1,
    page: 1,
    limit: 24,
    cursor: null,
    nextCursor: null,
    hasNext: false,
  },
  stats: {
    avgPriceLkr: 8900000,
    avgPriceMillion: 8.9,
    avgMileage: 45000,
    marketAnalysis: {
      previousMonthPriceLkr: 8500000,
      nextWeekPriceLkr: 9000000,
      avgPriceLkr: 8900000,
      avgMileage: 45000,
      priceTrend: [],
    },
  },
};

describe('SearchResults price filter behavior', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockedFetchFacets.mockResolvedValue(facetsFixture);
    mockedFetchListings.mockResolvedValue(listingsFixture);
  });

  it('applies min and max price values to listing filters', async () => {
    const user = userEvent.setup();
    render(<SearchResults />);

    const minPriceInput = await screen.findByPlaceholderText('Min LKR');
    const maxPriceInput = await screen.findByPlaceholderText('Max LKR');

    await user.type(minPriceInput, '5000000');
    await user.type(maxPriceInput, '10000000');

    await waitFor(() => {
      expect(mockedFetchListings).toHaveBeenLastCalledWith(
        expect.objectContaining({
          priceMin: 5000000,
          priceMax: 10000000,
        }),
        expect.objectContaining({ page: 1 }),
      );
    });
  });
});
