/**
 * Proof Arrive status & phase theme — matches mobile app constants/theme.ts and trip-store.
 * Use for trip lists, vehicle status cards, filters, and phase badges.
 */

import type { LucideIcon } from 'lucide-react';
import {
  Clock,
  Upload,
  Download,
  CheckCircle2,
  Truck,
  MapPin,
  CheckCheck,
  Radio,
  PauseCircle,
  Info,
  Building2,
} from 'lucide-react';
import i18n from '@/lib/i18n';

/** Trip/vehicle status (UI) → Proof Arrive color hex and display */
type StatusThemeEntry = { hex: string; labelKey: string; icon: LucideIcon };

const TRIP_STATUS_THEME_RAW: Record<string, StatusThemeEntry> = {
  WAITING_IN_QUEUE: { hex: '#FF9800', labelKey: 'vehicleStatus.WAITING_IN_QUEUE', icon: Clock },
  LOADING: { hex: '#2196F3', labelKey: 'vehicleStatus.LOADING', icon: Upload },
  UNLOADING: { hex: '#2196F3', labelKey: 'vehicleStatus.UNLOADING', icon: Download },
  AVAILABLE: { hex: '#4CAF50', labelKey: 'vehicleStatus.AVAILABLE', icon: CheckCircle2 },
  IN_TRANSIT: { hex: '#9C27B0', labelKey: 'vehicleStatus.IN_TRANSIT', icon: Truck },
  ARRIVED: { hex: '#4CAF50', labelKey: 'vehicleStatus.ARRIVED', icon: MapPin },
  COMPLETED: { hex: '#9E9E9E', labelKey: 'vehicleStatus.COMPLETED', icon: CheckCheck },
  ACTIVE: { hex: '#4CAF50', labelKey: 'vehicleStatus.ACTIVE', icon: Radio },
  IDLE: { hex: '#9E9E9E', labelKey: 'vehicleStatus.IDLE', icon: PauseCircle },
  IN_GARAGE: { hex: '#9E9E9E', labelKey: 'vehicleStatus.IN_GARAGE', icon: Building2 },
};

/**
 * Localised view of the status theme map. Consumers use `getStatusTheme` which
 * reads from this via i18n — this exported accessor is a Proxy-like object so
 * direct access (TRIP_STATUS_THEME[key]) works with the current language.
 */
export const TRIP_STATUS_THEME = new Proxy(
  {} as Record<string, { hex: string; label: string; icon: LucideIcon }>,
  {
    get(_target, prop: string) {
      const entry = TRIP_STATUS_THEME_RAW[prop];
      if (!entry) return undefined;
      return { hex: entry.hex, label: i18n.t(entry.labelKey), icon: entry.icon };
    },
    has(_target, prop: string) {
      return prop in TRIP_STATUS_THEME_RAW;
    },
    ownKeys() {
      return Object.keys(TRIP_STATUS_THEME_RAW);
    },
    getOwnPropertyDescriptor(_target, prop: string) {
      if (prop in TRIP_STATUS_THEME_RAW) {
        return { enumerable: true, configurable: true };
      }
      return undefined;
    },
  },
);

/** API phase → derived status for color/label (from trip-store derivation) */
const PHASE_TO_STATUS: Record<string, string> = {
  AT_ORIGIN_ARRIVED: 'WAITING_IN_QUEUE',
  AT_ORIGIN_LOADING: 'LOADING',
  AT_ORIGIN_LOADING_ENDED: 'AVAILABLE',
  READY_TO_EXIT: 'AVAILABLE',
  IN_TRANSIT: 'IN_TRANSIT',
  AT_DESTINATION_ARRIVED: 'ARRIVED',
  AT_DESTINATION_UNLOADING: 'UNLOADING',
  AT_DESTINATION_UNLOADING_ENDED: 'AVAILABLE',
  COMPLETED: 'COMPLETED',
};

const DEFAULT_STATUS = { hex: '#9E9E9E', label: '—', icon: Info };

export function getStatusTheme(statusOrPhase: string | undefined): {
  hex: string;
  label: string;
  icon: LucideIcon;
} {
  if (!statusOrPhase) return DEFAULT_STATUS;
  const key = statusOrPhase.toUpperCase().replace(/-/g, '_');
  const derived = PHASE_TO_STATUS[key] ?? key;
  const rawEntry = TRIP_STATUS_THEME_RAW[derived] ?? TRIP_STATUS_THEME_RAW[key];
  if (!rawEntry) {
    return { ...DEFAULT_STATUS, label: statusOrPhase.replace(/_/g, ' ') };
  }
  return { hex: rawEntry.hex, label: i18n.t(rawEntry.labelKey), icon: rawEntry.icon };
}

/** Inline style for status badge (color, bg, border) — use for phase/status badges */
export function getStatusStyle(hex: string): {
  color: string;
  backgroundColor: string;
  borderColor: string;
} {
  return {
    color: hex,
    backgroundColor: `${hex}1A`,
    borderColor: `${hex}4D`,
  };
}
