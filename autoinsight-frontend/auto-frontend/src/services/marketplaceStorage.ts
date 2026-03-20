import type { Vehicle } from './vehicleDataService';

const STORAGE_EVENT = 'autoinsight:storage-change';
const FAVORITES_KEY = 'autoinsight_favorites_v2';
const COMPARE_KEY = 'autoinsight_compare_v1';
const USER_KEY = 'autoinsight_user_key';

export interface StoredVehicleSummary {
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
  condition: Vehicle['condition'];
  imageUrl?: string | null;
  validationStatus: Vehicle['validationStatus'];
  confidence: number;
  matchedModelRowId?: string | null;
}

function emitChange(key: string): void {
  window.dispatchEvent(new CustomEvent(STORAGE_EVENT, { detail: key }));
}

function toSummary(vehicle: Vehicle | StoredVehicleSummary): StoredVehicleSummary {
  return {
    id: vehicle.id,
    vehicleType: vehicle.vehicleType,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    price: vehicle.price,
    priceLkr: vehicle.priceLkr,
    mileage: vehicle.mileage,
    district: vehicle.district,
    publishedDate: vehicle.publishedDate,
    listedAt: vehicle.listedAt,
    vehicleUrl: vehicle.vehicleUrl,
    condition: vehicle.condition,
    imageUrl: vehicle.imageUrl ?? null,
    validationStatus: vehicle.validationStatus,
    confidence: vehicle.confidence,
    matchedModelRowId: vehicle.matchedModelRowId ?? null,
  };
}

function readCollection(key: string): StoredVehicleSummary[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const value = JSON.parse(raw);
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeCollection(key: string, items: StoredVehicleSummary[]): void {
  localStorage.setItem(key, JSON.stringify(items));
  emitChange(key);
}

export function getFavorites(): StoredVehicleSummary[] {
  return readCollection(FAVORITES_KEY);
}

export function isFavorite(id: string): boolean {
  return getFavorites().some((item) => item.id === id);
}

export function toggleFavorite(vehicle: Vehicle | StoredVehicleSummary): StoredVehicleSummary[] {
  const items = getFavorites();
  const existing = items.find((item) => item.id === vehicle.id);
  if (existing) {
    const next = items.filter((item) => item.id !== vehicle.id);
    writeCollection(FAVORITES_KEY, next);
    return next;
  }
  const next = [toSummary(vehicle), ...items];
  writeCollection(FAVORITES_KEY, next);
  return next;
}

export function getCompareVehicles(): StoredVehicleSummary[] {
  return readCollection(COMPARE_KEY);
}

export function isCompared(id: string): boolean {
  return getCompareVehicles().some((item) => item.id === id);
}

export function toggleCompareVehicle(vehicle: Vehicle | StoredVehicleSummary): StoredVehicleSummary[] {
  const items = getCompareVehicles();
  const existing = items.find((item) => item.id === vehicle.id);
  if (existing) {
    const next = items.filter((item) => item.id !== vehicle.id);
    writeCollection(COMPARE_KEY, next);
    return next;
  }
  const next = [...items, toSummary(vehicle)].slice(0, 3);
  writeCollection(COMPARE_KEY, next);
  return next;
}

export function clearCompareVehicles(): void {
  writeCollection(COMPARE_KEY, []);
}

export function replaceCompareVehicles(vehicles: Array<Vehicle | StoredVehicleSummary>): void {
  writeCollection(COMPARE_KEY, vehicles.slice(0, 3).map(toSummary));
}

export function listenToStoredVehicles(callback: () => void): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === FAVORITES_KEY || event.key === COMPARE_KEY) {
      callback();
    }
  };
  const handleCustomEvent = (event: Event) => {
    const customEvent = event as CustomEvent<string>;
    if (customEvent.detail === FAVORITES_KEY || customEvent.detail === COMPARE_KEY) {
      callback();
    }
  };

  window.addEventListener('storage', handleStorage);
  window.addEventListener(STORAGE_EVENT, handleCustomEvent);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(STORAGE_EVENT, handleCustomEvent);
  };
}

export function getOrCreateUserKey(): string {
  try {
    const existing = localStorage.getItem(USER_KEY);
    if (existing) return existing;
    const created = `device-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(USER_KEY, created);
    return created;
  } catch {
    return 'local-device';
  }
}
