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

/** Trip/vehicle status (UI) → Proof Arrive color hex and display */
export const TRIP_STATUS_THEME: Record<
  string,
  { hex: string; label: string; icon: LucideIcon }
> = {
  WAITING_IN_QUEUE: { hex: '#FF9800', label: 'Waiting / In Queue', icon: Clock },
  LOADING: { hex: '#2196F3', label: 'Loading', icon: Upload },
  UNLOADING: { hex: '#2196F3', label: 'Unloading', icon: Download },
  AVAILABLE: { hex: '#4CAF50', label: 'Available / Ready to exit', icon: CheckCircle2 },
  IN_TRANSIT: { hex: '#9C27B0', label: 'In Transit', icon: Truck },
  ARRIVED: { hex: '#4CAF50', label: 'Arrived', icon: MapPin },
  COMPLETED: { hex: '#9E9E9E', label: 'Completed', icon: CheckCheck },
  ACTIVE: { hex: '#4CAF50', label: 'Active', icon: Radio },
  IDLE: { hex: '#9E9E9E', label: 'Idle', icon: PauseCircle },
  IN_GARAGE: { hex: '#9E9E9E', label: 'In Garage', icon: Building2 },
};

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
  const theme = TRIP_STATUS_THEME[derived] ?? TRIP_STATUS_THEME[key];
  return theme ?? { ...DEFAULT_STATUS, label: statusOrPhase.replace(/_/g, ' ') };
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
