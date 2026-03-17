// Vehicle Data Service - Parses and provides access to real vehicle dataset
import csvData from '../data/dataset_with_condition.csv?raw';

export interface Vehicle {
  id: string;
  vehicleType: string;
  make: string;
  model: string;
  year: number;
  price: number; // In millions (LKR)
  mileage: number;
  district: string;
  publishedDate: string;
  vehicleUrl: string;
  condition: 'Used' | 'Recondition' | 'Brand New';
  imageUrl?: string;
}

// Parse CSV data
function parseCSV(csv: string): Vehicle[] {
  const lines = csv.trim().split('\n');
  const vehicles: Vehicle[] = [];
  
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Parse CSV line (handling potential commas in fields)
    const values = line.split(',');
    
    if (values.length < 11) continue;
    
    const make = values[2]?.trim() || '';
    const model = values[3]?.trim() || '';
    const year = parseFloat(values[4]) || 0;
    const priceRaw = parseFloat(values[5]) || 0;
    const mileage = parseFloat(values[6]) || 0;
    const district = values[7]?.trim() || '';
    const publishedDate = values[8]?.trim() || '';
    const vehicleUrl = values[9]?.trim() || '';
    const condition = values[10]?.trim() as 'Used' | 'Recondition' | 'Brand New';
    
    if (!make || !model || priceRaw <= 0) continue;
    
    // Convert price to millions
    const price = Math.round((priceRaw / 1000000) * 100) / 100;
    
    vehicles.push({
      id: `v-${i}`,
      vehicleType: 'Car',
      make,
      model,
      year,
      price,
      mileage,
      district,
      publishedDate,
      vehicleUrl,
      condition: condition || 'Used',
    });
  }
  
  return vehicles;
}

// Parse and cache vehicle data
let cachedVehicles: Vehicle[] | null = null;

export function getAllVehicles(): Vehicle[] {
  if (!cachedVehicles) {
    cachedVehicles = parseCSV(csvData);
  }
  return cachedVehicles;
}

// Get unique makes
export function getUniqueMakes(): string[] {
  const vehicles = getAllVehicles();
  const makes = [...new Set(vehicles.map(v => v.make))];
  return makes.sort();
}

// Get models for a specific make
export function getModelsForMake(make: string): string[] {
  const vehicles = getAllVehicles();
  const models = [...new Set(
    vehicles
      .filter(v => v.make.toLowerCase() === make.toLowerCase())
      .map(v => v.model)
  )];
  return models.sort();
}

// Get unique districts (cities)
export function getUniqueDistricts(): string[] {
  const vehicles = getAllVehicles();
  const districts = [...new Set(vehicles.map(v => v.district))];
  return districts.sort();
}

// Get top makes by count
export function getTopMakes(limit: number = 10): { make: string; count: number }[] {
  const vehicles = getAllVehicles();
  const makeCount: Record<string, number> = {};
  
  vehicles.forEach(v => {
    makeCount[v.make] = (makeCount[v.make] || 0) + 1;
  });
  
  return Object.entries(makeCount)
    .map(([make, count]) => ({ make, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// Get popular models for a make
export function getPopularModels(make: string, limit: number = 10): { model: string; count: number }[] {
  const vehicles = getAllVehicles();
  const modelCount: Record<string, number> = {};
  
  vehicles
    .filter(v => v.make.toLowerCase() === make.toLowerCase())
    .forEach(v => {
      modelCount[v.model] = (modelCount[v.model] || 0) + 1;
    });
  
  return Object.entries(modelCount)
    .map(([model, count]) => ({ model, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// Search vehicles with filters
export interface VehicleFilters {
  make?: string;
  model?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  minYear?: number;
  maxYear?: number;
  minMileage?: number;
  maxMileage?: number;
  district?: string;
}

export function searchVehicles(filters: VehicleFilters, limit?: number): Vehicle[] {
  let vehicles = getAllVehicles();
  
  if (filters.make && filters.make !== 'All') {
    vehicles = vehicles.filter(v => 
      v.make.toLowerCase() === filters.make!.toLowerCase()
    );
  }
  
  if (filters.model && filters.model !== 'All') {
    vehicles = vehicles.filter(v => 
      v.model.toLowerCase().includes(filters.model!.toLowerCase())
    );
  }
  
  if (filters.condition && filters.condition !== 'All') {
    vehicles = vehicles.filter(v => 
      v.condition.toLowerCase() === filters.condition!.toLowerCase()
    );
  }
  
  if (filters.minPrice !== undefined) {
    vehicles = vehicles.filter(v => v.price >= filters.minPrice!);
  }
  
  if (filters.maxPrice !== undefined) {
    vehicles = vehicles.filter(v => v.price <= filters.maxPrice!);
  }
  
  if (filters.minYear !== undefined) {
    vehicles = vehicles.filter(v => v.year >= filters.minYear!);
  }
  
  if (filters.maxYear !== undefined) {
    vehicles = vehicles.filter(v => v.year <= filters.maxYear!);
  }
  
  if (filters.minMileage !== undefined) {
    vehicles = vehicles.filter(v => v.mileage >= filters.minMileage!);
  }
  
  if (filters.maxMileage !== undefined) {
    vehicles = vehicles.filter(v => v.mileage <= filters.maxMileage!);
  }
  
  if (filters.district && filters.district !== 'All') {
    vehicles = vehicles.filter(v => 
      v.district.toLowerCase() === filters.district!.toLowerCase()
    );
  }
  
  if (limit) {
    return vehicles.slice(0, limit);
  }
  
  return vehicles;
}

// Get market statistics for a make/model
export function getMarketStats(make: string, model?: string): {
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  avgMileage: number;
  totalListings: number;
  conditionBreakdown: Record<string, number>;
} {
  let vehicles = getAllVehicles().filter(v => 
    v.make.toLowerCase() === make.toLowerCase()
  );
  
  if (model && model !== 'All') {
    vehicles = vehicles.filter(v => 
      v.model.toLowerCase().includes(model.toLowerCase())
    );
  }
  
  if (vehicles.length === 0) {
    return {
      avgPrice: 0,
      minPrice: 0,
      maxPrice: 0,
      avgMileage: 0,
      totalListings: 0,
      conditionBreakdown: {},
    };
  }
  
  const prices = vehicles.map(v => v.price);
  const mileages = vehicles.map(v => v.mileage);
  
  const conditionBreakdown: Record<string, number> = {};
  vehicles.forEach(v => {
    conditionBreakdown[v.condition] = (conditionBreakdown[v.condition] || 0) + 1;
  });
  
  return {
    avgPrice: Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100,
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    avgMileage: Math.round(mileages.reduce((a, b) => a + b, 0) / mileages.length),
    totalListings: vehicles.length,
    conditionBreakdown,
  };
}

// Get featured/top selling vehicles (most recent listings with good conditions)
export function getFeaturedVehicles(limit: number = 8): Vehicle[] {
  const vehicles = getAllVehicles();
  
  // Prioritize reconditioned and brand new, recent listings
  const sorted = [...vehicles].sort((a, b) => {
    // Prefer better conditions
    const condOrder: Record<string, number> = { 'Brand New': 3, 'Recondition': 2, 'Used': 1 };
    const condDiff = (condOrder[b.condition] || 0) - (condOrder[a.condition] || 0);
    if (condDiff !== 0) return condDiff;
    
    // Then by year (newer first)
    return b.year - a.year;
  });
  
  return sorted.slice(0, limit);
}

// Get similar vehicles (same make, different model or similar price range)
export function getSimilarVehicles(vehicle: Vehicle, limit: number = 3): Vehicle[] {
  const vehicles = getAllVehicles();
  
  // Find vehicles of same make but different model, or similar price range
  const similar = vehicles.filter(v => 
    v.id !== vehicle.id && (
      (v.make === vehicle.make && v.model !== vehicle.model) ||
      (Math.abs(v.price - vehicle.price) <= 2)
    )
  );
  
  // Shuffle and return
  return similar
    .sort(() => Math.random() - 0.5)
    .slice(0, limit);
}

// Get transmission type (mock - dataset doesn't have this)
export function getTransmission(): 'Auto' | 'Manual' {
  return Math.random() > 0.2 ? 'Auto' : 'Manual';
}

export interface LiveSearchApiFilters {
  vehicle_type?: 'cars' | 'vans' | 'pickups' | 'suvs';
  make?: string;
  model?: string;
  year?: string;
  district?: string;
  condition?: string;
  min_year?: number;
  max_year?: number;
  min_mileage?: number;
  max_mileage?: number;
  min_price_lkr?: number;
  max_price_lkr?: number;
  max_results?: number;
}

function toNumber(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toVehicleFromApi(item: Record<string, unknown>, index: number): Vehicle {
  const priceMillion = toNumber(item.priceMillion);
  const fallbackPriceLkr = toNumber(item.priceLkr);

  return {
    id: String(item.id ?? `live-${index}`),
    vehicleType: String(item.vehicleType ?? item['Vehicle Type'] ?? 'Car'),
    make: String(item.make ?? item.Make ?? ''),
    model: String(item.model ?? item.Model ?? ''),
    year: Math.trunc(toNumber(item.year ?? item.Year)),
    price: priceMillion > 0
      ? Math.round(priceMillion * 100) / 100
      : Math.round((fallbackPriceLkr / 1_000_000) * 100) / 100,
    mileage: Math.trunc(toNumber(item.mileage ?? item.Milleage)),
    district: String(item.district ?? item.District ?? ''),
    publishedDate: String(item.publishedDate ?? item['published date'] ?? ''),
    vehicleUrl: String(item.vehicleUrl ?? item['Vehicle URL'] ?? ''),
    condition: String(item.condition ?? 'Used') as 'Used' | 'Recondition' | 'Brand New',
  };
}

export async function searchVehiclesLive(filters: LiveSearchApiFilters): Promise<Vehicle[]> {
  // Try to fetch from API first, fall back to local data if not available
  try {
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(filters),
    });

    if (response.ok) {
      const data = (await response.json()) as { results?: Record<string, unknown>[] };
      const list = Array.isArray(data.results) ? data.results : [];
      if (list.length > 0) {
        return list.map((item, index) => toVehicleFromApi(item, index + 1));
      }
    }
  } catch {
    // Fall back to local search if API is unavailable
  }

  // Fall back to local CSV data search
  const localFilters: VehicleFilters = {};
  if (filters.make) localFilters.make = filters.make;
  if (filters.model) localFilters.model = filters.model;
  if (filters.condition) localFilters.condition = filters.condition;
  if (filters.min_price_lkr) localFilters.minPrice = filters.min_price_lkr / 1_000_000;
  if (filters.max_price_lkr) localFilters.maxPrice = filters.max_price_lkr / 1_000_000;
  if (filters.min_mileage) localFilters.minMileage = filters.min_mileage;
  if (filters.max_mileage) localFilters.maxMileage = filters.max_mileage;
  if (filters.year) localFilters.minYear = localFilters.maxYear = parseInt(filters.year);
  if (filters.district) localFilters.district = filters.district;

  const maxResults = filters.max_results ?? 250;
  return searchVehicles(localFilters, maxResults);
}
