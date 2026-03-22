import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SearchResults from "../../src/page/SearchResults";
import {
  type FacetsResponse,
  type ListingsResponse,
  fetchFacets,
  fetchListings,
} from "../../src/services/vehicleDataService";

const navigateSpy = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return {
    ...actual,
    useLocation: () => ({ state: null }),
    useNavigate: () => navigateSpy,
  };
});

vi.mock("../../src/component/OgImage", () => ({
  default: ({ alt }: { alt: string }) => (
    <img alt={alt} src="https://example.com/car.jpg" />
  ),
}));

vi.mock("../../src/component/Skeleton", () => ({
  SearchResultsSkeleton: () => <div>Loading...</div>,
}));

vi.mock("../../src/services/vehicleDataService", async () => {
  const actual = await vi.importActual<
    typeof import("../../src/services/vehicleDataService")
  >("../../src/services/vehicleDataService");

  return {
    ...actual,
    fetchFacets: vi.fn(),
    fetchListings: vi.fn(),
  };
});

vi.mock("../../src/services/marketplaceStorage", () => ({
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
  vehicleTypes: [{ value: "Car", count: 10 }],
  makes: [
    { value: "Toyota", count: 5 },
    { value: "Honda", count: 5 },
  ],
  models: [
    { value: "Corolla", count: 3 },
    { value: "Civic", count: 2 },
  ],
  conditions: [
    { value: "Used", count: 9 },
    { value: "Brand New", count: 3 },
  ],
  districts: [{ value: "Colombo", count: 6 }],
};

const listingsFixture: ListingsResponse = {
  items: [
    {
      id: "v1",
      vehicleType: "Car",
      make: "Toyota",
      model: "Corolla",
      year: 2024,
      price: 11.5,
      priceLkr: 11500000,
      mileage: 1000,
      district: "Colombo",
      publishedDate: "2026-03-01",
      listedAt: "2026-03-01",
      vehicleUrl: "https://example.com/v1",
      condition: "Brand New",
      imageUrl: null,
      validationStatus: "validated",
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
    avgPriceLkr: 11500000,
    avgPriceMillion: 11.5,
    avgMileage: 1000,
    marketAnalysis: {
      previousMonthPriceLkr: 11200000,
      nextWeekPriceLkr: 11600000,
      avgPriceLkr: 11500000,
      avgMileage: 1000,
      priceTrend: [],
    },
  },
};

describe("SearchResults condition new filter behavior", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockedFetchFacets.mockResolvedValue(facetsFixture);
    mockedFetchListings.mockResolvedValue(listingsFixture);
  });

  it("applies Brand New condition to listing filters", async () => {
    const user = userEvent.setup();
    render(<SearchResults />);

    const brandNewButton = await screen.findByRole("button", {
      name: /brand new/i,
    });
    await user.click(brandNewButton);

    await waitFor(() => {
      expect(mockedFetchListings).toHaveBeenLastCalledWith(
        expect.objectContaining({
          condition: ["Brand New"],
        }),
        expect.objectContaining({ page: 1 }),
      );
    });
  });
});
