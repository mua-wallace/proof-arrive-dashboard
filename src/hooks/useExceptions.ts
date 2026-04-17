import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardApi } from '@/api/dashboard';
import type { PaginateResult } from '@/api/dashboard';
import type {
  ExceptionRecord,
  ExceptionSummary,
  ExceptionsQuery,
  TimelineEvent,
  ReportExceptionInput,
  DispatchTechnicianInput,
  MarkRepairedInput,
  DispatchRescueInput,
  ConfirmTransferInput,
  ReturnToOriginInput,
  LogCallAttemptInput,
  EscalateInput,
  AddNoteInput,
} from '@/types/exceptions';
import { toast } from '@/lib/toast';
import { useTranslation } from 'react-i18next';

// ---------------------------------------------------------------------------
// Query Keys
// ---------------------------------------------------------------------------

export const exceptionKeys = {
  all: ['exceptions'] as const,
  active: () => [...exceptionKeys.all, 'active'] as const,
  summary: () => [...exceptionKeys.all, 'summary'] as const,
  list: (params: ExceptionsQuery) => [...exceptionKeys.all, 'list', params] as const,
  byTrip: (tripId: number | string) => [...exceptionKeys.all, 'trip', tripId] as const,
  detail: (id: string) => [...exceptionKeys.all, id] as const,
  timeline: (id: string) => [...exceptionKeys.all, id, 'timeline'] as const,
};

// ---------------------------------------------------------------------------
// Query Hooks
// ---------------------------------------------------------------------------

export function useActiveExceptions() {
  return useQuery<ExceptionRecord[]>({
    queryKey: exceptionKeys.active(),
    queryFn: () => dashboardApi.getActiveExceptions(),
  });
}

export function useExceptionsSummary() {
  return useQuery<ExceptionSummary>({
    queryKey: exceptionKeys.summary(),
    queryFn: () => dashboardApi.getExceptionsSummary(),
  });
}

export function useExceptions(params: ExceptionsQuery) {
  return useQuery<PaginateResult<ExceptionRecord>>({
    queryKey: exceptionKeys.list(params),
    queryFn: () => dashboardApi.getExceptions(params),
  });
}

export function useExceptionsByTrip(tripId: number | string | undefined) {
  return useQuery<ExceptionRecord[]>({
    queryKey: exceptionKeys.byTrip(tripId!),
    queryFn: () => dashboardApi.getExceptionsByTrip(tripId!),
    enabled: !!tripId,
  });
}

export function useException(id: string | undefined) {
  return useQuery<ExceptionRecord>({
    queryKey: exceptionKeys.detail(id!),
    queryFn: () => dashboardApi.getException(id!),
    enabled: !!id,
  });
}

export function useExceptionTimeline(id: string | undefined) {
  return useQuery<TimelineEvent[]>({
    queryKey: exceptionKeys.timeline(id!),
    queryFn: () => dashboardApi.getExceptionTimeline(id!),
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Shared invalidation helper
// ---------------------------------------------------------------------------

function useInvalidateExceptions() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: exceptionKeys.all });
  };
}

// ---------------------------------------------------------------------------
// Mutation Hooks
// ---------------------------------------------------------------------------

export function useReportException() {
  const invalidate = useInvalidateExceptions();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ tripId, data }: { tripId: number | string; data: ReportExceptionInput }) =>
      dashboardApi.reportException(tripId, data),
    onSuccess: () => {
      invalidate();
      toast.success(t('exceptions.toasts.reported'), t('exceptions.toasts.reportedDesc'));
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || t('common.error');
      toast.error(t('exceptions.toasts.reported'), msg);
    },
  });
}

export function useDispatchTechnician() {
  const invalidate = useInvalidateExceptions();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DispatchTechnicianInput }) =>
      dashboardApi.dispatchTechnician(id, data),
    onSuccess: () => {
      invalidate();
      toast.success(t('exceptions.toasts.technicianDispatched'));
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || t('common.error');
      toast.error(t('exceptions.dispatchTechnician.title'), msg);
    },
  });
}

export function useMarkRepaired() {
  const invalidate = useInvalidateExceptions();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MarkRepairedInput }) =>
      dashboardApi.markRepaired(id, data),
    onSuccess: () => {
      invalidate();
      toast.success(t('exceptions.toasts.repaired'), t('exceptions.toasts.repairedDesc'));
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || t('common.error');
      toast.error(t('exceptions.markRepaired.title'), msg);
    },
  });
}

export function useDispatchRescueVehicle() {
  const invalidate = useInvalidateExceptions();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DispatchRescueInput }) =>
      dashboardApi.dispatchRescueVehicle(id, data),
    onSuccess: () => {
      invalidate();
      toast.success(t('exceptions.toasts.rescueDispatched', 'Rescue vehicle dispatched'));
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || t('common.error');
      toast.error(t('exceptions.actions.dispatchRescue'), msg);
    },
  });
}

export function useConfirmTransfer() {
  const invalidate = useInvalidateExceptions();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ConfirmTransferInput }) =>
      dashboardApi.confirmTransfer(id, data),
    onSuccess: () => {
      invalidate();
      toast.success(t('exceptions.toasts.transferConfirmed', 'Transfer confirmed'));
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || t('common.error');
      toast.error(t('exceptions.confirmTransfer.title', 'Confirm transfer'), msg);
    },
  });
}

export function useReturnToOrigin() {
  const invalidate = useInvalidateExceptions();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReturnToOriginInput }) =>
      dashboardApi.returnToOrigin(id, data),
    onSuccess: () => {
      invalidate();
      toast.success(t('exceptions.toasts.returned'));
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || t('common.error');
      toast.error(t('exceptions.returnOrigin.title'), msg);
    },
  });
}

export function useLogCallAttempt() {
  const invalidate = useInvalidateExceptions();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LogCallAttemptInput }) =>
      dashboardApi.logCallAttempt(id, data),
    onSuccess: () => {
      invalidate();
      toast.success(t('exceptions.toasts.contactLogged'));
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || t('common.error');
      toast.error(t('exceptions.logContact.title'), msg);
    },
  });
}

export function useEscalateException() {
  const invalidate = useInvalidateExceptions();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EscalateInput }) =>
      dashboardApi.escalateException(id, data),
    onSuccess: () => {
      invalidate();
      toast.success(t('exceptions.toasts.escalated'));
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || t('common.error');
      toast.error(t('exceptions.escalate.title'), msg);
    },
  });
}

export function useAddExceptionNote() {
  const invalidate = useInvalidateExceptions();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AddNoteInput }) =>
      dashboardApi.addExceptionNote(id, data),
    onSuccess: () => {
      invalidate();
      toast.success(t('exceptions.toasts.noteAdded'));
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || t('common.error');
      toast.error(t('exceptions.addNote.title'), msg);
    },
  });
}

export function useSetTripEta() {
  const invalidate = useInvalidateExceptions();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: ({ tripId, estimatedArrivalAt }: { tripId: number | string; estimatedArrivalAt: string }) =>
      dashboardApi.setTripEta(tripId, { estimatedArrivalAt }),
    onSuccess: (_data, variables) => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['trip', variables.tripId] });
      toast.success(t('exceptions.toasts.etaUpdated'));
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || t('common.error');
      toast.error(t('exceptions.updateEta.title'), msg);
    },
  });
}
