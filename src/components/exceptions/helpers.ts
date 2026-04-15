import type { ExceptionRecord, ExceptionType } from '@/types/exceptions';
import { getStatusTheme } from '@/lib/status-theme';

export function typeThemeKey(type: ExceptionType): string {
  return type;
}

export function getExceptionTheme(type: ExceptionType) {
  return getStatusTheme(typeThemeKey(type));
}

export function formatRelativeFromNow(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.round(diffMs / 60_000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  if (hours < 24) return rem === 0 ? `${hours}h ago` : `${hours}h ${rem}m ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 60_000));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function getOverdueDelta(e: ExceptionRecord): string | null {
  if (e.type !== 'OVERDUE' || !e.expectedArrival) return null;
  const ms = Date.now() - new Date(e.expectedArrival).getTime();
  return formatDuration(ms);
}

export function getActionNeededText(e: ExceptionRecord): string {
  switch (e.status) {
    case 'ACTIVE':
      return e.type === 'OVERDUE' ? 'Contact driver' : 'Needs action';
    case 'AWAITING_REPAIR':
      return e.technician
        ? `Technician ${e.technician.name} · ETA ${e.technician.etaText}`
        : 'Technician dispatched';
    case 'IN_PROGRESS':
      return 'Investigation ongoing';
    case 'RESOLVED_RESUMED':
      return 'Resolved';
    case 'CLOSED_RETURNED':
      return 'Returned to origin';
    case 'CLOSED_TRANSFERRED':
      return 'Transferred';
    case 'ESCALATED':
      return 'Escalated';
    default:
      return '—';
  }
}
