import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import {
  dashboardApi,
  type Trip,
  type TripsQuery,
  type Vehicle,
} from '@/api/dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
} from '@/components/ui/select';
import {
  ArrowRightLeft,
  Truck,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { getStatusTheme, getStatusStyle } from '@/lib/status-theme';
import { useActiveExceptions } from '@/hooks/useExceptions';
import type { ExceptionType } from '@/types/exceptions';
import { ExceptionBadge } from '@/components/exceptions/ExceptionBadge';
import { selectActiveExceptionForTrip } from '@/components/exceptions/helpers';

type DatePreset = 'today' | 'day' | 'week' | 'month' | 'custom';

const toYmd = (d: Date) => format(d, 'yyyy-MM-dd');

function computeRangeForPreset(preset: DatePreset): { startDate: string; endDate: string } {
  const now = new Date();
  switch (preset) {
    case 'today':
    case 'day':
      return { startDate: toYmd(now), endDate: toYmd(now) };
    case 'week':
      return {
        startDate: toYmd(startOfWeek(now, { weekStartsOn: 1 })),
        endDate: toYmd(endOfWeek(now, { weekStartsOn: 1 })),
      };
    case 'month':
      return { startDate: toYmd(startOfMonth(now)), endDate: toYmd(endOfMonth(now)) };
    default:
      return { startDate: '', endDate: '' };
  }
}

export default function Trips() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(() => parseInt(searchParams.get('page') || '1', 10));
  const limit = 20;
  const [exceptionChip, setExceptionChip] = useState<ExceptionType | 'EXCEPTIONS' | null>(null);
  const { data: allExceptions = [] } = useActiveExceptions();
  const activeExceptionsCount = allExceptions.length;
  const countByType = useMemo(() => {
    const counts: Record<string, number> = {
      BREAKDOWN: 0,
      ACCIDENT: 0,
      OVERDUE: 0,
      TRANSFER: 0,
    };
    for (const e of allExceptions) {
      if (counts[e.type] !== undefined) counts[e.type] += 1;
    }
    return counts;
  }, [allExceptions]);
  const [status, setStatus] = useState<'ONGOING' | 'COMPLETED' | ''>(() => (searchParams.get('status') as 'ONGOING' | 'COMPLETED') || '');
  const [purpose, setPurpose] = useState<'DELIVERY' | 'PICKUP' | ''>(() => (searchParams.get('purpose') as 'DELIVERY' | 'PICKUP') || '');
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [preset, setPreset] = useState<DatePreset>(() => {
    const p = searchParams.get('preset') as DatePreset | null;
    if (p === 'today' || p === 'day' || p === 'week' || p === 'month' || p === 'custom') return p;
    const sd = searchParams.get('startDate');
    const ed = searchParams.get('endDate');
    if (sd || ed) return 'custom';
    return 'today';
  });
  const [startDate, setStartDate] = useState(() => searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(() => searchParams.get('endDate') || '');
  const [showUncompleted, setShowUncompleted] = useState(
    () => searchParams.get('view') === 'uncompleted'
  );

  useEffect(() => {
    setShowUncompleted(searchParams.get('view') === 'uncompleted');
  }, [searchParams]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Compute what gets sent to the API. "today" preset omits both params so the
  // API returns today's trips unioned with all ONGOING trips (the new default).
  const apiRange = useMemo(() => {
    if (preset === 'today') return { startDate: '', endDate: '' };
    if (preset === 'custom' || preset === 'day') return { startDate, endDate };
    return computeRangeForPreset(preset);
  }, [preset, startDate, endDate]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', String(page));
    if (status) params.set('status', status);
    if (purpose) params.set('purpose', purpose);
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (preset !== 'today') params.set('preset', preset);
    if (preset === 'custom' || preset === 'day') {
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
    }
    if (showUncompleted) params.set('view', 'uncompleted');
    setSearchParams(params, { replace: true });
  }, [page, status, purpose, debouncedSearch, preset, startDate, endDate, showUncompleted, setSearchParams]);

  const query: TripsQuery = {
    page,
    limit,
    include: 'vehicle,originCenter,destinationCenter,events',
    sortOrder: 'DESC',
  };
  if (status) query.status = status;
  if (purpose) query.purpose = purpose;
  if (debouncedSearch) query.search = debouncedSearch;
  if (apiRange.startDate) query.startDate = apiRange.startDate;
  if (apiRange.endDate) query.endDate = apiRange.endDate;

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['trips', query],
    queryFn: () =>
      dashboardApi.getAllTrips({
        page,
        limit,
        sortOrder: 'DESC',
        include: 'vehicle,originCenter,destinationCenter,events',
        ...(status && { status }),
        ...(purpose && { purpose }),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(apiRange.startDate && { startDate: apiRange.startDate }),
        ...(apiRange.endDate && { endDate: apiRange.endDate }),
      }),
    placeholderData: keepPreviousData,
    retry: 1,
    enabled: !showUncompleted,
  });

  const {
    data: pendingData,
    isLoading: pendingLoading,
    isFetching: pendingFetching,
    error: pendingError,
    refetch: refetchPending,
  } = useQuery({
    queryKey: ['trips', 'pending'],
    queryFn: () => dashboardApi.getPendingTrips(),
    enabled: showUncompleted,
    retry: 1,
  });

  const { data: vehiclesForLookup } = useQuery({
    queryKey: ['vehicles', 'lookup'],
    queryFn: () => dashboardApi.getVehicles({ limit: 1000 }),
    enabled: showUncompleted,
    staleTime: 5 * 60_000,
  });

  const vehiclePlateById = new Map<number, string>();
  if (Array.isArray(vehiclesForLookup?.data)) {
    for (const v of vehiclesForLookup.data as Vehicle[]) {
      if (v?.id != null && v.plate) vehiclePlateById.set(v.id, v.plate);
    }
  }

  const activeData = showUncompleted ? pendingData : data;
  const activeLoading = showUncompleted ? pendingLoading : isLoading;
  const activeFetching = showUncompleted ? pendingFetching : isFetching;
  const activeError = showUncompleted ? pendingError : error;
  const activeRefetch = showUncompleted ? refetchPending : refetch;

  const trips: Trip[] = useMemo(
    () => (Array.isArray(activeData?.data) ? (activeData.data as Trip[]) : []),
    [activeData],
  );

  const filteredTrips = useMemo(() => {
    if (!exceptionChip) return trips;
    return trips.filter((trip) => {
      const exc = selectActiveExceptionForTrip(allExceptions, trip.id);
      if (!exc) return false;
      if (exceptionChip === 'EXCEPTIONS') return true;
      return exc.type === exceptionChip;
    });
  }, [trips, exceptionChip, allExceptions]);

  const meta = activeData?.meta;
  const totalPages = showUncompleted ? 1 : meta?.totalPages ?? 1;
  const totalItems = meta?.totalItems ?? 0;
  const apiErrorMessage =
    activeError instanceof Error
      ? activeError.message
      : activeError != null
        ? String(activeError)
        : null;

  const getPhaseDisplayLabel = (phase: string | undefined, status: string | undefined): string => {
    const theme = getStatusTheme(phase ?? status);
    return theme.label !== '—' ? theme.label : (phase != null ? String(phase).replace(/_/g, ' ') : (status ?? '—'));
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card/60 px-4 py-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
          <ArrowRightLeft className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 leading-tight">
          <h1 className="text-base font-bold tracking-tight">{t('trips.title')}</h1>
          <p className="text-[11px] text-muted-foreground">{t('trips.subtitle')}</p>
        </div>
        <div className="ml-auto flex flex-wrap gap-1">
          {(
            [
              { key: null, label: t('common.all'), count: null },
              { key: 'EXCEPTIONS', label: t('exceptions.filters.exceptions'), count: activeExceptionsCount },
              { key: 'BREAKDOWN', label: t('exceptions.filters.breakdown'), count: countByType.BREAKDOWN },
              { key: 'ACCIDENT', label: t('exceptions.filters.accident'), count: countByType.ACCIDENT },
              { key: 'OVERDUE', label: t('exceptions.filters.overdue'), count: countByType.OVERDUE },
            ] as Array<{
              key: ExceptionType | 'EXCEPTIONS' | null;
              label: string;
              count: number | null;
            }>
          ).map((chip) => {
            const active = exceptionChip === chip.key;
            return (
              <button
                key={String(chip.key)}
                type="button"
                onClick={() => setExceptionChip(chip.key)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition',
                  active
                    ? 'border-red-500 bg-red-500 text-white'
                    : 'border-input bg-background text-muted-foreground hover:bg-muted',
                )}
              >
                {chip.label}
                {chip.count != null && chip.count > 0 && (
                  <span
                    className={cn(
                      'rounded-full px-1 text-[9px] tabular-nums',
                      active ? 'bg-white/20' : 'bg-red-500 text-white',
                    )}
                  >
                    {chip.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <Card className="overflow-hidden rounded-xl">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
            <Filter className="h-3.5 w-3.5" />
            {t('trips.filters.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
            <div className="space-y-1">
              <Label htmlFor="status" className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {t('trips.filters.status')}
              </Label>
              <Select
                id="status"
                className="h-8 text-xs"
                value={status || 'all'}
                onChange={(e) => {
                  const v = e.target.value;
                  setStatus(v === 'all' ? '' : (v as 'ONGOING' | 'COMPLETED'));
                  setPage(1);
                }}
              >
                <option value="all">{t('common.all')}</option>
                <option value="ONGOING">{t('trips.status.ongoing')}</option>
                <option value="COMPLETED">{t('trips.status.completed')}</option>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="purpose" className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {t('trips.filters.purpose')}
              </Label>
              <Select
                id="purpose"
                className="h-8 text-xs"
                value={purpose || 'all'}
                onChange={(e) => {
                  const v = e.target.value;
                  setPurpose(v === 'all' ? '' : (v as 'DELIVERY' | 'PICKUP'));
                  setPage(1);
                }}
              >
                <option value="all">{t('common.all')}</option>
                <option value="DELIVERY">{t('trips.purpose.delivery')}</option>
                <option value="PICKUP">{t('trips.purpose.pickup')}</option>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="preset" className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {t('trips.filters.datePreset')}
              </Label>
              <Select
                id="preset"
                className="h-8 text-xs"
                value={preset}
                onChange={(e) => {
                  const next = e.target.value as DatePreset;
                  setPreset(next);
                  if (next === 'today') {
                    setStartDate('');
                    setEndDate('');
                  } else if (next === 'day') {
                    const today = toYmd(new Date());
                    setStartDate(today);
                    setEndDate(today);
                  } else if (next === 'week' || next === 'month') {
                    const r = computeRangeForPreset(next);
                    setStartDate(r.startDate);
                    setEndDate(r.endDate);
                  }
                  setPage(1);
                }}
              >
                <option value="today">{t('trips.datePreset.today')}</option>
                <option value="day">{t('trips.datePreset.day')}</option>
                <option value="week">{t('trips.datePreset.week')}</option>
                <option value="month">{t('trips.datePreset.month')}</option>
                <option value="custom">{t('trips.datePreset.custom')}</option>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="startDate" className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {t('trips.filters.startDate')}
              </Label>
              <Input
                id="startDate"
                type="date"
                className="h-8 text-xs"
                value={apiRange.startDate}
                disabled={preset === 'today' || preset === 'week' || preset === 'month'}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (preset === 'day') setEndDate(e.target.value);
                  else setPreset('custom');
                  setPage(1);
                }}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="endDate" className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {t('trips.filters.endDate')}
              </Label>
              <Input
                id="endDate"
                type="date"
                className="h-8 text-xs"
                value={apiRange.endDate}
                disabled={preset === 'today' || preset === 'day' || preset === 'week' || preset === 'month'}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPreset('custom');
                  setPage(1);
                }}
              />
            </div>
            <div className="space-y-1 sm:col-span-2 lg:col-span-1">
              <Label htmlFor="search" className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {t('trips.filters.search')}
              </Label>
              <div className="relative">
                <Truck className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder={t('trips.filters.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 p-3 pb-2">
          <div className="min-w-0">
            <CardTitle className="text-sm font-semibold">
              {showUncompleted ? t('trips.uncompletedTitle') : t('trips.listTitle')}
            </CardTitle>
            <CardDescription className="text-[11px]">
              {showUncompleted
                ? meta
                  ? t('trips.uncompletedDescription', { count: trips.length })
                  : t('common.loading')
                : meta
                  ? t('trips.listDescription', {
                      from: (page - 1) * limit + 1,
                      to: Math.min(page * limit, totalItems),
                      total: formatNumber(totalItems),
                    })
                  : t('common.loading')}
            </CardDescription>
          </div>
          {showUncompleted && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 whitespace-nowrap text-xs"
              onClick={() => setShowUncompleted(false)}
            >
              {t('trips.showAll')}
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {apiErrorMessage ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <p className="mb-1 text-xs font-medium text-destructive">
                {showUncompleted ? t('trips.loadErrorUncompleted') : t('trips.loadError')}
              </p>
              <p className="mb-2 max-w-md text-[11px] text-muted-foreground">{apiErrorMessage}</p>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => activeRefetch()}>
                {t('common.tryAgain')}
              </Button>
            </div>
          ) : activeLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !filteredTrips.length ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ArrowRightLeft className="mb-2 h-6 w-6 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">
                {showUncompleted ? t('trips.emptyUncompleted') : t('trips.empty')}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {showUncompleted ? t('trips.emptyUncompletedHint') : t('trips.emptyHint')}
              </p>
            </div>
          ) : (
            <>
              <div className="border-t">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="h-8 py-1 text-[10px]">{t('trips.columns.vehicle')}</TableHead>
                      <TableHead className="h-8 py-1 text-[10px]">{t('trips.columns.origin')}</TableHead>
                      <TableHead className="h-8 py-1 text-[10px]">{t('trips.columns.started')}</TableHead>
                      <TableHead className="h-8 py-1 text-[10px]">{t('trips.columns.destination')}</TableHead>
                      <TableHead className="h-8 py-1 text-[10px]">{t('trips.columns.purpose')}</TableHead>
                      <TableHead className="h-8 py-1 text-[10px]">{t('trips.columns.phaseStatus')}</TableHead>
                      <TableHead className="h-8 w-[72px] py-1 text-[10px]">{t('trips.columns.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTrips.map((trip) => {
                      const exc = selectActiveExceptionForTrip(allExceptions, trip.id);
                      const excTheme = exc ? getStatusTheme(exc.type) : null;
                      return (
                        <TableRow
                          key={trip.id}
                          style={
                            excTheme
                              ? {
                                  backgroundImage: `linear-gradient(to right, ${excTheme.hex}1A, transparent 60%)`,
                                }
                              : undefined
                          }
                        >
                          <TableCell className="py-1.5 text-xs font-medium">
                            <span className="inline-flex items-center gap-1">
                              {excTheme && (
                                <span
                                  className="h-1.5 w-1.5 rounded-full"
                                  style={{ backgroundColor: excTheme.hex }}
                                />
                              )}
                              {trip.vehicle?.plate
                                ?? vehiclePlateById.get(trip.vehicleId)
                                ?? `#${trip.vehicleId}`}
                            </span>
                          </TableCell>
                          <TableCell className="py-1.5 text-xs">
                            {trip.originCenter?.name ?? `Center ${trip.originCenterId}`}
                          </TableCell>
                          <TableCell className="py-1.5 text-[11px] text-muted-foreground">
                            {trip.startedAt ? formatDate(trip.startedAt) : trip.createdAt ? formatDate(trip.createdAt) : '—'}
                          </TableCell>
                          <TableCell className="py-1.5 text-xs">
                            {trip.destinationCenter?.name ?? (trip.destinationCenterId ? `Center ${trip.destinationCenterId}` : '—')}
                          </TableCell>
                          <TableCell className="py-1.5">
                            <Badge variant={trip.purpose === 'DELIVERY' ? 'default' : 'outline'} className="text-[10px]">
                              {trip.purpose ?? '—'}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-1.5">
                            {exc ? (
                              <ExceptionBadge type={exc.type} status={exc.status} />
                            ) : (
                              <Badge
                                variant="secondary"
                                className="border text-[10px]"
                                style={getStatusStyle(getStatusTheme(trip.phase ?? trip.status).hex)}
                              >
                                {getPhaseDisplayLabel(trip.phase, trip.status)}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 gap-1 whitespace-nowrap px-2 text-[11px]"
                              onClick={() => navigate(`/app/trips/${trip.id}`)}
                            >
                              <Eye className="h-3 w-3" />
                              {t('trips.viewTimeline')}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {!showUncompleted && totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-3 py-2">
                  <p className="text-[11px] text-muted-foreground">
                    {t('common.pageOf', { page, total: totalPages })}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1 || activeFetching}
                    >
                      <ChevronLeft className="h-3 w-3" />
                      {t('common.previous')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages || activeFetching}
                    >
                      {t('common.next')}
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
