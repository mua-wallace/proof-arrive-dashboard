export type ExceptionType = 'BREAKDOWN' | 'ACCIDENT' | 'OVERDUE' | 'TRANSFER' | 'POLICE_STOP' | 'OTHER';

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

export type CargoCondition = 'GOOD' | 'MINOR_DAMAGE' | 'MAJOR_DAMAGE';

export interface ExceptionNote {
  at: string;
  by: unknown;
  text: string;
}

export interface ContactAttempt {
  at: string;
  by: unknown;
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
  reportedBy: string | { id?: number | string; username?: string };
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
  contactAttempts?: ContactAttempt[];
  expectedArrival?: string;
  driverPhone?: string;
  resolution?: {
    kind: 'REPAIRED' | 'RETURNED' | 'ESCALATED' | 'TRANSFERRED';
    by: unknown;
    at: string;
    notes?: string;
    repairRef?: string;
    policeRef?: string;
  };
  notes?: ExceptionNote[];
  incidentReference?: string;
  rescueVehicleId?: number;
  rescueTrip?: {
    id: number | string;
    vehiclePlate?: string;
    phase?: string;
  };
  hasInjuries?: boolean;
  isCargoDamaged?: boolean;
  cargoDamageDescription?: string;
  isVehicleDriveable?: boolean;
  policeReportReference?: string;
}

export interface ReportExceptionInput {
  type: ExceptionType;
  location: string;
  description: string;
  severity?: ExceptionSeverity;
  hasInjuries?: boolean;
  isCargoDamaged?: boolean;
  cargoDamageDescription?: string;
  isVehicleDriveable?: boolean;
  policeReportReference?: string;
}

export interface DispatchTechnicianInput {
  technicianName: string;
  technicianPhone: string;
  estimatedArrival?: string;
  notes?: string;
}

export interface MarkRepairedInput {
  repairedBy?: string;
  description?: string;
  repairReference?: string;
}

export interface DispatchRescueInput {
  rescueVehicleId: number;
  transferLocation: string;
  estimatedArrival?: string;
  notes?: string;
}

export interface ConfirmTransferInput {
  cargoCountTransferred: number;
  cargoCondition: CargoCondition;
  notes?: string;
}

export interface ReturnToOriginInput {
  reason: string;
}

export interface LogCallAttemptInput {
  outcome: ContactOutcome;
  notes?: string;
}

export interface EscalateInput {
  reason: 'DRIVER_UNREACHABLE' | 'SUSPECTED_BREAKDOWN' | 'SUSPECTED_ACCIDENT' | 'UNKNOWN';
  contactAttemptsMade: number;
  notes: string;
  actionsTaken?: string[];
  policeReportReference?: string;
}

export interface AddNoteInput {
  text: string;
}

export interface ExceptionSummary {
  breakdowns: number;
  accidents: number;
  transfers: number;
  resolvedToday: number;
  totalActive: number;
}

export interface TimelineEvent {
  id: string | number;
  exceptionId: string;
  eventType: string;
  actor?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ExceptionsQuery {
  type?: ExceptionType;
  status?: 'ACTIVE' | 'RESOLVED';
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
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
