export interface Vehicle {
  id: string;
  vehicleType: string;
  make: string;
  model: string;
  year: number;
  price: number;
  priceLkr: number;
  mileage: number;
  district: string;
  publishedDate: string;
  listedAt: string;
  vehicleUrl: string;
  condition: 'Used' | 'Recondition' | 'Brand New';
  imageUrl?: string | null;
  validationStatus: 'validated' | 'partial' | 'unmatched';
  confidence: number;
  matchedModelRowId?: string | null;
  marketAnalysis?: MarketAnalysis;
}

export interface MarketTrendPoint {
  label: string;
  valueLkr: number;
  predicted: boolean;
}

export interface MarketAnalysis {
  previousMonthPriceLkr: number;
  nextWeekPriceLkr: number;
  avgPriceLkr: number;
  avgMileage: number;
  priceTrend: MarketTrendPoint[];
  available?: boolean;
  reason?: string;
}

export interface VehicleFilters {
  vehicleType: string[];
  make: string[];
  model: string[];
  condition: string[];
  district: string[];
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  mileageMin?: number;
  mileageMax?: number;
}

export interface ListingsMeta {
  total: number;
  page: number;
  limit: number;
  cursor?: string | null;
  nextCursor?: string | null;
  hasNext: boolean;
}

export interface ListingsStats {
  avgPriceLkr: number;
  avgPriceMillion: number;
  avgMileage: number;
  marketAnalysis: MarketAnalysis;
}

export interface ListingsResponse {
  items: Vehicle[];
  meta: ListingsMeta;
  stats: ListingsStats;
}

export interface FacetOption {
  value: string;
  count: number;
}

export interface FacetsResponse {
  vehicleTypes: FacetOption[];
  makes: FacetOption[];
  models: FacetOption[];
  conditions: FacetOption[];
  districts: FacetOption[];
}

export type VehicleSort = 'newest' | 'price' | 'year' | 'mileage';
export type SortDirection = 'asc' | 'desc';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export const EMPTY_FILTERS: VehicleFilters = {
  vehicleType: [],
  make: [],
  model: [],
  condition: [],
  district: [],
};

function parseNumber(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseVehicle(item: Record<string, unknown>): Vehicle {
  const priceLkr = parseNumber(item.priceLkr);
  const priceMillion = parseNumber(item.priceMillion) || priceLkr / 1_000_000;

  const marketAnalysisRaw = item.market_analysis ?? item.marketAnalysis;
  const marketAnalysis =
    marketAnalysisRaw && typeof marketAnalysisRaw === 'object'
      ? parseMarketAnalysis(marketAnalysisRaw as Record<string, unknown>)
      : undefined;

  return {
    id: String(item.id ?? ''),
    vehicleType: String(item.vehicleType ?? 'Car'),
    make: String(item.make ?? ''),
    model: String(item.model ?? ''),
    year: Math.trunc(parseNumber(item.year)),
    price: Math.round(priceMillion * 100) / 100,
    priceLkr: Math.trunc(priceLkr),
    mileage: Math.trunc(parseNumber(item.mileage)),
    district: String(item.district ?? ''),
    publishedDate: String(item.publishedDate ?? ''),
    listedAt: String(item.listedAt ?? ''),
    vehicleUrl: String(item.vehicleUrl ?? ''),
    condition: String(item.condition ?? 'Used') as Vehicle['condition'],
    imageUrl: item.imageUrl ? String(item.imageUrl) : null,
    validationStatus: String(item.validation_status ?? item.validationStatus ?? 'unmatched') as Vehicle['validationStatus'],
    confidence: parseNumber(item.confidence),
    matchedModelRowId: item.matched_model_row_id ? String(item.matched_model_row_id) : item.matchedModelRowId ? String(item.matchedModelRowId) : null,
    marketAnalysis,
  };
}

function parseMarketAnalysis(item: Record<string, unknown>): MarketAnalysis {
  const trendRaw = Array.isArray(item.priceTrend) ? item.priceTrend : [];
  return {
    previousMonthPriceLkr: parseNumber(item.previousMonthPriceLkr),
    nextWeekPriceLkr: parseNumber(item.nextWeekPriceLkr),
    avgPriceLkr: parseNumber(item.avgPriceLkr),
    avgMileage: parseNumber(item.avgMileage),
    priceTrend: trendRaw.map((point) => ({
      label: String((point as Record<string, unknown>).label ?? ''),
      valueLkr: parseNumber((point as Record<string, unknown>).valueLkr),
      predicted: Boolean((point as Record<string, unknown>).predicted),
    })),
  };
}

function buildQueryParams(
  filters: VehicleFilters,
  options: {
    sort?: VehicleSort;
    direction?: SortDirection;
    page?: number;
    limit?: number;
    cursor?: string | null;
  } = {},
): URLSearchParams {
  const params = new URLSearchParams();

  const appendList = (key: keyof VehicleFilters) => {
    const values = filters[key];
    if (!Array.isArray(values)) {
      return;
    }
    for (const value of values) {
      params.append(String(key), value);
    }
  };

  appendList('vehicleType');
  appendList('make');
  appendList('model');
  appendList('condition');
  appendList('district');

  const numericKeys: Array<keyof VehicleFilters> = ['yearMin', 'yearMax', 'priceMin', 'priceMax', 'mileageMin', 'mileageMax'];
  for (const key of numericKeys) {
    const value = filters[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      params.set(String(key), String(value));
    }
  }

  params.set('sort', options.sort ?? 'newest');
  params.set('direction', options.direction ?? (options.sort === 'price' || options.sort === 'mileage' ? 'asc' : 'desc'));
  params.set('page', String(options.page ?? 1));
  params.set('limit', String(options.limit ?? 24));

  if (options.cursor) {
    params.set('cursor', options.cursor);
  }

  return params;
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchListings(
  filters: VehicleFilters,
  options: {
    sort?: VehicleSort;
    direction?: SortDirection;
    page?: number;
    limit?: number;
    cursor?: string | null;
  } = {},
): Promise<ListingsResponse> {
  const params = buildQueryParams(filters, options);
  const payload = await fetchJson<{
    items?: Record<string, unknown>[];
    meta?: Partial<ListingsMeta>;
    stats?: Partial<ListingsStats>;
  }>(`/api/listings?${params.toString()}`);

  const items = Array.isArray(payload.items) ? payload.items.map(parseVehicle) : [];
  return {
    items,
    meta: {
      total: parseNumber(payload.meta?.total),
      page: parseNumber(payload.meta?.page) || 1,
      limit: parseNumber(payload.meta?.limit) || (options.limit ?? 24),
      cursor: payload.meta?.cursor ?? null,
      nextCursor: payload.meta?.nextCursor ?? null,
      hasNext: Boolean(payload.meta?.hasNext),
    },
    stats: {
      avgPriceLkr: parseNumber(payload.stats?.avgPriceLkr),
      avgPriceMillion: parseNumber(payload.stats?.avgPriceMillion),
      avgMileage: parseNumber(payload.stats?.avgMileage),
      marketAnalysis: parseMarketAnalysis(
        (payload.stats?.marketAnalysis as Record<string, unknown> | undefined) ?? {},
      ),
    },
  };
}

export async function fetchFacets(filters: VehicleFilters = EMPTY_FILTERS): Promise<FacetsResponse> {
  const params = buildQueryParams(filters, { page: 1, limit: 1 });
  const payload = await fetchJson<Partial<FacetsResponse>>(`/api/facets?${params.toString()}`);
  return {
    vehicleTypes: Array.isArray(payload.vehicleTypes) ? payload.vehicleTypes : [],
    makes: Array.isArray(payload.makes) ? payload.makes : [],
    models: Array.isArray(payload.models) ? payload.models : [],
    conditions: Array.isArray(payload.conditions) ? payload.conditions : [],
    districts: Array.isArray(payload.districts) ? payload.districts : [],
  };
}

export async function fetchListingById(id: string): Promise<Vehicle> {
  const payload = await fetchJson<{ item: Record<string, unknown> }>(`/api/listings/${encodeURIComponent(id)}`);
  return parseVehicle(payload.item);
}

export async function fetchCompareVehicles(ids: string[]): Promise<Vehicle[]> {
  const response = await fetch(`${API_BASE_URL}/api/compare`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ids }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Failed to fetch compare vehicles');
  }

  const payload = (await response.json()) as { items?: Record<string, unknown>[] };
  return Array.isArray(payload.items) ? payload.items.map(parseVehicle) : [];
}

export async function fetchRemoteFavorites(userKey: string): Promise<Vehicle[]> {
  const payload = await fetchJson<{ items?: Record<string, unknown>[] }>(`/api/favorites?userKey=${encodeURIComponent(userKey)}`);
  return Array.isArray(payload.items) ? payload.items.map(parseVehicle) : [];
}

export async function saveRemoteFavorites(userKey: string, listingIds: string[]): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/favorites`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userKey, listingIds }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Failed to save favorites');
  }
}

export function formatPrice(priceMillion: number): string {
  return `LKR ${priceMillion.toFixed(2)}M`;
}
