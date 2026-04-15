export type ExceptionType = 'BREAKDOWN' | 'ACCIDENT' | 'OVERDUE' | 'TRANSFER';

export type ExceptionSeverity = 'MINOR' | 'MAJOR' | 'CRITICAL';

export type ExceptionStatus =
  | 'ACTIVE'
  | 'AWAITING_REPAIR'
  | 'IN_PROGRESS'
  | 'RESOLVED_RESUMED'
  | 'CLOSED_RETURNED'
  | 'CLOSED_TRANSFERRED'
  | 'ESCALATED';

export type ContactOutcome = 'ANSWERED' | 'NO_ANSWER' | 'VOICEMAIL';

export interface ExceptionNote {
  at: string;
  by: string;
  text: string;
}

export interface ContactAttempt {
  at: string;
  by: string;
  outcome: ContactOutcome;
  notes?: string;
}

export interface Technician {
  name: string;
  phone: string;
  etaText: string;
  dispatchedAt: string;
}

export interface ExceptionRecord {
  id: string;
  tripId: number | string;
  vehiclePlate: string;
  originName?: string;
  destinationName?: string;
  type: ExceptionType;
  status: ExceptionStatus;
  reportedBy: string;
  reportedAt: string;
  location: string;
  description: string;
  severity?: ExceptionSeverity;
  injuries?: boolean;
  cargoDamaged?: boolean;
  cargoDamageNotes?: string;
  vehicleDriveable?: boolean;
  policeRef?: string;
  technician?: Technician;
  contactAttempts: ContactAttempt[];
  expectedArrival?: string;
  driverPhone?: string;
  resolution?: {
    kind: 'REPAIRED' | 'RETURNED' | 'ESCALATED' | 'TRANSFERRED';
    by: string;
    at: string;
    notes?: string;
    repairRef?: string;
    policeRef?: string;
  };
  notes: ExceptionNote[];
}

export interface ReportExceptionInput {
  tripId: number | string;
  vehiclePlate: string;
  originName?: string;
  destinationName?: string;
  type: ExceptionType;
  reportedBy: string;
  location: string;
  description: string;
  driverPhone?: string;
  severity?: ExceptionSeverity;
  injuries?: boolean;
  cargoDamaged?: boolean;
  cargoDamageNotes?: string;
  vehicleDriveable?: boolean;
  policeRef?: string;
  expectedArrival?: string;
}

export const ACTIVE_STATUSES: ExceptionStatus[] = [
  'ACTIVE',
  'AWAITING_REPAIR',
  'IN_PROGRESS',
];

export const CLOSED_STATUSES: ExceptionStatus[] = [
  'RESOLVED_RESUMED',
  'CLOSED_RETURNED',
  'CLOSED_TRANSFERRED',
  'ESCALATED',
];

export function isExceptionActive(e: ExceptionRecord): boolean {
  return ACTIVE_STATUSES.includes(e.status);
}
