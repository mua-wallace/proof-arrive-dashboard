import { create } from 'zustand';
import {
  ACTIVE_STATUSES,
  CLOSED_STATUSES,
  isExceptionActive,
  type ContactAttempt,
  type ExceptionNote,
  type ExceptionRecord,
  type ExceptionStatus,
  type ExceptionType,
  type ReportExceptionInput,
  type Technician,
} from '@/types/exceptions';

function nowIso(): string {
  return new Date().toISOString();
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function incidentId(baseDate: Date, seq: number): string {
  const y = baseDate.getFullYear();
  const m = pad(baseDate.getMonth() + 1);
  const d = pad(baseDate.getDate());
  return `INC-${y}${m}${d}-${String(seq).padStart(3, '0')}`;
}

function seedExceptions(): ExceptionRecord[] {
  const now = new Date();
  const minutesAgo = (mins: number) => new Date(now.getTime() - mins * 60_000).toISOString();

  const bd: ExceptionRecord = {
    id: incidentId(now, 1),
    tripId: 'DEMO-TRP-001',
    vehiclePlate: 'CM-4821-BA',
    originName: 'Douala Central',
    destinationName: 'Yaoundé Main',
    type: 'BREAKDOWN',
    status: 'AWAITING_REPAIR',
    reportedBy: 'Sophie N.',
    reportedAt: minutesAgo(85),
    location: 'N4 highway, km 142, after Edea junction',
    description:
      'Engine overheated and vehicle stopped. Driver says coolant light was on for 20 minutes before stopping.',
    driverPhone: '+237 670 000 001',
    technician: {
      name: 'Jean-Paul M.',
      phone: '+237 699 000 002',
      etaText: '45 minutes',
      dispatchedAt: minutesAgo(40),
    },
    contactAttempts: [],
    notes: [
      { at: minutesAgo(35), by: 'Sophie N.', text: 'Technician confirmed dispatch, on the way.' },
    ],
  };

  const acc: ExceptionRecord = {
    id: incidentId(now, 2),
    tripId: 'DEMO-TRP-002',
    vehiclePlate: 'CM-7302-LT',
    originName: 'Edea Hub',
    destinationName: 'Douala Central',
    type: 'ACCIDENT',
    status: 'ACTIVE',
    reportedBy: 'Marc K.',
    reportedAt: minutesAgo(22),
    location: 'N3 road, km 67, between Edea and Douala',
    description:
      'Rear-end collision with a civilian vehicle. Driver unhurt, truck front-left headlight broken, still driveable.',
    severity: 'MINOR',
    injuries: false,
    cargoDamaged: false,
    vehicleDriveable: true,
    policeRef: 'PR-2026-00421',
    driverPhone: '+237 670 000 003',
    contactAttempts: [],
    notes: [],
  };

  const ov: ExceptionRecord = {
    id: incidentId(now, 3),
    tripId: 'DEMO-TRP-003',
    vehiclePlate: 'CM-1109-JK',
    originName: 'Bafoussam',
    destinationName: 'Yaoundé Main',
    type: 'OVERDUE',
    status: 'IN_PROGRESS',
    reportedBy: 'Auto (timer)',
    reportedAt: minutesAgo(70),
    location: 'Unknown — awaiting driver contact',
    description: 'Trip is 1h 10min past expected arrival. No scan at destination yet.',
    expectedArrival: new Date(now.getTime() - 70 * 60_000).toISOString(),
    driverPhone: '+237 670 000 004',
    contactAttempts: [
      { at: minutesAgo(40), by: 'Sophie N.', outcome: 'NO_ANSWER' },
      { at: minutesAgo(15), by: 'Sophie N.', outcome: 'VOICEMAIL' },
    ],
    notes: [],
  };

  const tr: ExceptionRecord = {
    id: incidentId(now, 4),
    tripId: 'DEMO-TRP-004',
    vehiclePlate: 'CM-5540-ZN',
    originName: 'Yaoundé Main',
    destinationName: 'Douala Central',
    type: 'TRANSFER',
    status: 'ACTIVE',
    reportedBy: 'Marc K.',
    reportedAt: minutesAgo(140),
    location: 'N3 road, km 88, near Pouma',
    description: 'Cargo being transferred to rescue vehicle CM-9912-RS after hydraulic failure.',
    driverPhone: '+237 670 000 005',
    contactAttempts: [],
    notes: [
      { at: minutesAgo(100), by: 'Sophie N.', text: 'Rescue vehicle CM-9912-RS dispatched.' },
    ],
  };

  return [bd, acc, ov, tr];
}

interface ExceptionsState {
  exceptions: ExceptionRecord[];
  nextSeq: number;
  report: (input: ReportExceptionInput) => ExceptionRecord;
  addNote: (id: string, text: string, by: string) => void;
  addContactAttempt: (id: string, attempt: Omit<ContactAttempt, 'at'>) => void;
  dispatchTechnician: (
    id: string,
    tech: Omit<Technician, 'dispatchedAt'>,
    by: string,
  ) => void;
  markRepaired: (
    id: string,
    payload: { repairedBy: string; description: string; repairRef?: string },
  ) => void;
  returnToOrigin: (id: string, reason: string, by: string) => void;
  escalate: (
    id: string,
    payload: {
      reason: string;
      attempts: number;
      notes: string;
      actions: string[];
      policeRef?: string;
      by: string;
    },
  ) => void;
  updateExpectedArrival: (id: string, iso: string, by: string) => void;
  setStatus: (id: string, status: ExceptionStatus) => void;
  removeDemo: () => void;
}

export const useExceptionsStore = create<ExceptionsState>((set, get) => ({
  exceptions: seedExceptions(),
  nextSeq: 5,

  report: (input) => {
    const seq = get().nextSeq;
    const record: ExceptionRecord = {
      id: incidentId(new Date(), seq),
      tripId: input.tripId,
      vehiclePlate: input.vehiclePlate,
      originName: input.originName,
      destinationName: input.destinationName,
      type: input.type,
      status: 'ACTIVE',
      reportedBy: input.reportedBy,
      reportedAt: nowIso(),
      location: input.location,
      description: input.description,
      severity: input.severity,
      injuries: input.injuries,
      cargoDamaged: input.cargoDamaged,
      cargoDamageNotes: input.cargoDamageNotes,
      vehicleDriveable: input.vehicleDriveable,
      policeRef: input.policeRef,
      expectedArrival: input.expectedArrival,
      driverPhone: input.driverPhone,
      contactAttempts: [],
      notes: [],
    };
    set({
      exceptions: [record, ...get().exceptions],
      nextSeq: seq + 1,
    });
    return record;
  },

  addNote: (id, text, by) => {
    const note: ExceptionNote = { at: nowIso(), by, text };
    set({
      exceptions: get().exceptions.map((e) =>
        e.id === id ? { ...e, notes: [...e.notes, note] } : e,
      ),
    });
  },

  addContactAttempt: (id, attempt) => {
    const full: ContactAttempt = { ...attempt, at: nowIso() };
    set({
      exceptions: get().exceptions.map((e) =>
        e.id === id
          ? { ...e, status: 'IN_PROGRESS', contactAttempts: [...e.contactAttempts, full] }
          : e,
      ),
    });
  },

  dispatchTechnician: (id, tech, by) => {
    const full: Technician = { ...tech, dispatchedAt: nowIso() };
    set({
      exceptions: get().exceptions.map((e) =>
        e.id === id
          ? {
              ...e,
              technician: full,
              status: 'AWAITING_REPAIR',
              notes: [
                ...e.notes,
                { at: nowIso(), by, text: `Technician ${full.name} dispatched (ETA ${full.etaText}).` },
              ],
            }
          : e,
      ),
    });
  },

  markRepaired: (id, payload) => {
    set({
      exceptions: get().exceptions.map((e) =>
        e.id === id
          ? {
              ...e,
              status: 'RESOLVED_RESUMED',
              resolution: {
                kind: 'REPAIRED',
                by: payload.repairedBy,
                at: nowIso(),
                notes: payload.description,
                repairRef: payload.repairRef,
              },
              notes: [
                ...e.notes,
                {
                  at: nowIso(),
                  by: payload.repairedBy,
                  text: `Repair complete: ${payload.description}`,
                },
              ],
            }
          : e,
      ),
    });
  },

  returnToOrigin: (id, reason, by) => {
    set({
      exceptions: get().exceptions.map((e) =>
        e.id === id
          ? {
              ...e,
              status: 'CLOSED_RETURNED',
              resolution: { kind: 'RETURNED', by, at: nowIso(), notes: reason },
              notes: [
                ...e.notes,
                { at: nowIso(), by, text: `Return to origin: ${reason}` },
              ],
            }
          : e,
      ),
    });
  },

  escalate: (id, payload) => {
    set({
      exceptions: get().exceptions.map((e) =>
        e.id === id
          ? {
              ...e,
              status: 'ESCALATED',
              resolution: {
                kind: 'ESCALATED',
                by: payload.by,
                at: nowIso(),
                notes: `${payload.reason} · ${payload.notes}`,
                policeRef: payload.policeRef,
              },
              notes: [
                ...e.notes,
                {
                  at: nowIso(),
                  by: payload.by,
                  text: `Escalated: ${payload.reason}. Actions: ${payload.actions.join(', ') || 'none'}. Attempts: ${payload.attempts}. Notes: ${payload.notes}`,
                },
              ],
            }
          : e,
      ),
    });
  },

  updateExpectedArrival: (id, iso, by) => {
    set({
      exceptions: get().exceptions.map((e) =>
        e.id === id
          ? {
              ...e,
              expectedArrival: iso,
              notes: [
                ...e.notes,
                { at: nowIso(), by, text: `Expected arrival updated to ${iso}.` },
              ],
            }
          : e,
      ),
    });
  },

  setStatus: (id, status) => {
    set({
      exceptions: get().exceptions.map((e) => (e.id === id ? { ...e, status } : e)),
    });
  },

  removeDemo: () => {
    set({ exceptions: [] });
  },
}));

export function selectActiveExceptions(state: ExceptionsState): ExceptionRecord[] {
  return state.exceptions.filter(isExceptionActive);
}

export function selectExceptionsByType(state: ExceptionsState, type: ExceptionType): ExceptionRecord[] {
  return state.exceptions.filter((e) => e.type === type);
}

export function selectActiveExceptionForTrip(
  exceptions: ExceptionRecord[],
  tripId: number | string,
): ExceptionRecord | undefined {
  return exceptions.find(
    (e) => String(e.tripId) === String(tripId) && isExceptionActive(e),
  );
}

export function selectResolvedTodayCount(state: ExceptionsState): number {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startIso = startOfDay.toISOString();
  return state.exceptions.filter(
    (e) =>
      CLOSED_STATUSES.includes(e.status) &&
      e.resolution?.at !== undefined &&
      e.resolution.at >= startIso,
  ).length;
}

export function countActiveByType(state: ExceptionsState): Record<ExceptionType, number> {
  const counts: Record<ExceptionType, number> = {
    BREAKDOWN: 0,
    ACCIDENT: 0,
    OVERDUE: 0,
    TRANSFER: 0,
  };
  for (const e of state.exceptions) {
    if (ACTIVE_STATUSES.includes(e.status)) {
      counts[e.type] += 1;
    }
  }
  return counts;
}
