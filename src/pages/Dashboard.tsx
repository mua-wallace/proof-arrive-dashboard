import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  startOfDay,
  endOfDay,
  subDays,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import {
  dashboardApi,
  normalizeStatusSummary,
  type StatusSummary,
  type Trip,
  type ReportsDashboard,
  type TripsSummaryReport,
  type QueuesSummaryReport,
  type TripsByDateItem,
  type QueuesByDateItem,
} from '@/api/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import {
  Car,
  Building2,
  Truck,
  Activity,
  ArrowRightLeft,
  Clock,
  ListOrdered,
  MapPin,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { useActiveExceptions, useExceptionsSummary } from '@/hooks/useExceptions';
import { type ExceptionType, type ExceptionRecord } from '@/types/exceptions';
import { ExceptionBadge } from '@/components/exceptions/ExceptionBadge';
import { getActionNeededText, formatRelativeFromNow } from '@/components/exceptions/helpers';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatNumber, cn } from '@/lib/utils';
import {
  TRIP_STATUS_THEME,
  getStatusTheme,
  getStatusStyle,
} from '@/lib/status-theme';

export type ReportDatePreset = 'today' | 'last7' | 'month';

function getReportDateRange(preset: ReportDatePreset): { startDate: string; endDate: string } {
  const now = new Date();
  let start: Date;
  let end: Date;
  switch (preset) {
    case 'last7':
      start = startOfDay(subDays(now, 6));
      end = endOfDay(now);
      break;
    case 'month':
      start = startOfMonth(now);
      end = endOfMonth(now);
      break;
    default:
      start = startOfDay(now);
      end = endOfDay(now);
  }
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

const VEHICLE_STATUS_KEYS = [
  'WAITING_IN_QUEUE',
  'LOADING',
  'UNLOADING',
  'AVAILABLE',
  'IN_TRANSIT',
  'ARRIVED',
  'COMPLETED',
  'ACTIVE',
  'IDLE',
  'IN_GARAGE',
] as const;

function getVehicleStatusConfig(statusKey: string) {
  const theme = TRIP_STATUS_THEME[statusKey] ?? getStatusTheme(statusKey);
  const style = getStatusStyle(theme.hex);
  return { label: theme.label, icon: theme.icon, ...style };
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="h-20 rounded-2xl bg-muted/50 animate-pulse" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-muted/50 animate-pulse" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const [datePreset, setDatePreset] = useState<ReportDatePreset>('today');
  const [centerId, setCenterId] = useState<number | ''>('');
  const [vehicleId, setVehicleId] = useState<number | ''>('');

  const reportParams = useMemo(() => {
    const { startDate, endDate } = getReportDateRange(datePreset);
    const params: { startDate: string; endDate: string; centerId?: number; vehicleId?: number } = {
      startDate,
      endDate,
    };
    if (centerId !== '') params.centerId = centerId;
    if (vehicleId !== '') params.vehicleId = vehicleId;
    return params;
  }, [datePreset, centerId, vehicleId]);

  const {
    data: reportsDashboard,
    isLoading: loadingReports,
    error: errorReports,
  } = useQuery<ReportsDashboard>({
    queryKey: ['reports', 'dashboard', reportParams],
    queryFn: () => dashboardApi.getReportsDashboard(reportParams),
    retry: 1,
    staleTime: 60 * 1000,
  });

  const { data: statusSummary, isLoading: loadingStatus } = useQuery<StatusSummary>({
    queryKey: ['vehicles', 'status-summary'],
    queryFn: () => dashboardApi.getStatusSummary(),
    retry: 1,
    staleTime: 45 * 1000,
  });

  const { data: tripsData } = useQuery({
    queryKey: ['trips', 'ongoing', 10],
    queryFn: () => dashboardApi.getTrips({ status: 'ONGOING', limit: 10, include: 'vehicle,originCenter,destinationCenter' }),
    retry: 1,
    staleTime: 30 * 1000,
  });

  const { data: centersData } = useQuery({
    queryKey: ['centers', 'list'],
    queryFn: () => dashboardApi.getCenters({ limit: 500 }),
    retry: 1,
    staleTime: 2 * 60 * 1000,
  });

  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles', 'list', 'dashboard'],
    queryFn: () => dashboardApi.getVehicles({ limit: 500 }),
    retry: 1,
    staleTime: 2 * 60 * 1000,
  });

  const { data: tripsSummary } = useQuery<TripsSummaryReport>({
    queryKey: ['reports', 'trips', 'summary', reportParams],
    queryFn: () => dashboardApi.getReportsTripsSummary(reportParams),
    retry: 1,
    staleTime: 60 * 1000,
  });

  const { data: completionRate } = useQuery({
    queryKey: ['reports', 'trips', 'completion-rate', reportParams],
    queryFn: () => dashboardApi.getReportsTripsCompletionRate(reportParams),
    retry: 1,
    staleTime: 60 * 1000,
  });

  const { data: tripsByDateRaw } = useQuery({
    queryKey: ['reports', 'trips', 'by-date', reportParams],
    queryFn: () => dashboardApi.getReportsTripsByDate({ ...reportParams, groupBy: datePreset === 'month' ? 'day' : 'day' }),
    retry: 1,
    staleTime: 60 * 1000,
  });

  const { data: queuesByDateRaw } = useQuery({
    queryKey: ['reports', 'queues', 'by-date', reportParams],
    queryFn: () => dashboardApi.getReportsQueuesByDate(reportParams),
    retry: 1,
    staleTime: 60 * 1000,
  });

  const { data: queuesSummary } = useQuery<QueuesSummaryReport>({
    queryKey: ['reports', 'queues', 'summary', reportParams],
    queryFn: () => dashboardApi.getReportsQueuesSummary(reportParams),
    retry: 1,
    staleTime: 30 * 1000,
  });

  const { data: activeExceptions = [] } = useActiveExceptions();
  const { data: exceptionSummary } = useExceptionsSummary();
  const exceptionCounts = useMemo(() => {
    const counts: Record<string, number> = {
      BREAKDOWN: exceptionSummary?.breakdowns ?? 0,
      ACCIDENT: exceptionSummary?.accidents ?? 0,
      OVERDUE: 0,
      TRANSFER: exceptionSummary?.transfers ?? 0,
    };
    // Fill in any counts not explicitly in the summary from active exceptions
    for (const e of activeExceptions) {
      if (e.type === 'OVERDUE') counts.OVERDUE += 1;
    }
    return counts;
  }, [activeExceptions, exceptionSummary]);
  const [exceptionFilter, setExceptionFilter] = useState<ExceptionType | 'ALL'>('ALL');
  const filteredExceptions = useMemo(
    () =>
      exceptionFilter === 'ALL'
        ? activeExceptions
        : activeExceptions.filter((e) => e.type === exceptionFilter),
    [activeExceptions, exceptionFilter],
  );

  const normalizedStatus = normalizeStatusSummary(statusSummary);
  const activeTrips: Trip[] = tripsData?.data ?? [];
  const centers = centersData?.data ?? [];
  const vehicles = vehiclesData?.data ?? [];
  const centerCount = Array.isArray(centers) ? centers.length : (reportsDashboard?.centers as number) ?? 0;
  const isLoading = loadingReports && loadingStatus;

  const tripsByDate: TripsByDateItem[] = useMemo(() => {
    const raw = tripsByDateRaw;
    if (!raw) return [];
    return Array.isArray(raw) ? raw : (raw as { data: TripsByDateItem[] }).data ?? [];
  }, [tripsByDateRaw]);

  const queuesByDate: QueuesByDateItem[] = useMemo(() => {
    const raw = queuesByDateRaw;
    if (!raw) return [];
    return Array.isArray(raw) ? raw : (raw as { data: QueuesByDateItem[] }).data ?? [];
  }, [queuesByDateRaw]);

  const startedInPeriod = tripsSummary?.startedInPeriod ?? tripsSummary?.totalStarted ?? 0;
  const completedInPeriod = tripsSummary?.completedInPeriod ?? 0;
  const completionRatePercent =
    completionRate?.completionRatePercent ??
    tripsSummary?.completionRatePercent ??
    (typeof tripsSummary?.completionRate === 'number' ? tripsSummary.completionRate : 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground">{t('dashboard.loadingOverview')}</p>
        </div>
        <DashboardSkeleton />
      </div>
    );
  }

  const totalVehicles = Object.values(normalizedStatus).reduce((a, b) => a + b, 0);
  const ongoingCount = tripsSummary?.ongoingCount ?? activeTrips.length ?? 0;
  const loadingActive = queuesSummary?.loading?.active ?? (queuesSummary as any)?.loading ?? 0;
  const unloadingActive = queuesSummary?.unloading?.active ?? (queuesSummary as any)?.unloading ?? 0;
  const queueActive = Number(loadingActive) + Number(unloadingActive);

  return (
    <div className="flex flex-col gap-3">
      {/* Compact toolbar: title + badges + filters inline */}
      <header className="flex flex-wrap items-center gap-2 sm:gap-3 rounded-xl border border-primary/20 bg-primary px-3 py-2 sm:px-4 sm:py-2.5 text-primary-foreground shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-foreground/15">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">{t('dashboard.title')}</h1>
            <p className="text-xs text-primary-foreground/80">{t('dashboard.badges.operationalOverview')}</p>
          </div>
        </div>
        {errorReports && (
          <Badge variant="secondary" className="bg-status-warning/90 text-white border-status-warning text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            {t('dashboard.badges.partialData')}
          </Badge>
        )}
        <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 text-xs">
          <Activity className="h-3 w-3 mr-1" />
          {t('dashboard.badges.liveData')}
        </Badge>
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-primary-foreground/80" />
          <Select
            id="report-date"
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value as ReportDatePreset)}
            className="h-8 w-auto bg-primary-foreground/15 text-sm text-primary-foreground border-primary-foreground/30"
          >
            <option className="text-foreground" value="today">{t('dashboard.period.today')}</option>
            <option className="text-foreground" value="last7">{t('dashboard.period.last7')}</option>
            <option className="text-foreground" value="month">{t('dashboard.period.month')}</option>
          </Select>
          <Select
            id="report-center"
            value={centerId === '' ? 'all' : String(centerId)}
            onChange={(e) => setCenterId(e.target.value === 'all' ? '' : Number(e.target.value))}
            className="h-8 w-auto max-w-[160px] bg-primary-foreground/15 text-sm text-primary-foreground border-primary-foreground/30"
          >
            <option className="text-foreground" value="all">{t('dashboard.filters.allCenters')}</option>
            {(centers as { id: number; name?: string }[]).map((c) => (
              <option className="text-foreground" key={c.id} value={c.id}>
                {c.name ?? `Center ${c.id}`}
              </option>
            ))}
          </Select>
          <Select
            id="report-vehicle"
            value={vehicleId === '' ? 'all' : String(vehicleId)}
            onChange={(e) => setVehicleId(e.target.value === 'all' ? '' : Number(e.target.value))}
            className="h-8 w-auto max-w-[160px] bg-primary-foreground/15 text-sm text-primary-foreground border-primary-foreground/30"
          >
            <option className="text-foreground" value="all">{t('dashboard.filters.allVehicles')}</option>
            {(vehicles as { id: number; plate?: string }[]).map((v) => (
              <option className="text-foreground" key={v.id} value={v.id}>
                {v.plate ?? `Vehicle ${v.id}`}
              </option>
            ))}
          </Select>
        </div>
      </header>

      {activeExceptions.length > 0 && (
        <ExceptionAlertBanner exceptions={activeExceptions} />
      )}

      {/* KPI row — compact */}
      <section className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <CompactKpi
          to="/app/trips"
          label={t('dashboard.kpi.trips')}
          value={formatNumber(startedInPeriod)}
          sub={t('dashboard.kpi.tripsSub', {
            completed: formatNumber(completedInPeriod),
            ongoing: formatNumber(ongoingCount),
          })}
          icon={ArrowRightLeft}
          colorClass="info"
        />
        <CompactKpi
          label={t('dashboard.kpi.completionRate')}
          value={typeof completionRatePercent === 'number' ? `${completionRatePercent.toFixed(1)}%` : '—'}
          icon={CheckCircle2}
          colorClass="success"
        />
        <CompactKpi
          to="/app/centers"
          label={t('dashboard.kpi.centers')}
          value={formatNumber(centerCount)}
          icon={Building2}
          colorClass="transit"
        />
        <CompactKpi
          label={t('dashboard.kpi.queuesActive')}
          value={formatNumber(queueActive)}
          sub={t('dashboard.kpi.queuesActiveSub')}
          icon={ListOrdered}
          colorClass="warning"
        />
        <Link to="/app/incidents">
          <Card
            className={cn(
              'card-hover border-l-4 bg-card h-full',
              activeExceptions.length > 0 ? 'border-l-red-500 bg-red-50/60' : 'border-l-emerald-500',
            )}
          >
            <CardContent className="flex items-center justify-between p-3">
              <div className="min-w-0">
                <p
                  className={cn(
                    'text-[11px] font-semibold uppercase tracking-wider',
                    activeExceptions.length > 0 ? 'text-red-600' : 'text-emerald-600',
                  )}
                >
                  {t('exceptions.kpi.label')}
                </p>
                <p className="mt-0.5 text-xl sm:text-2xl font-bold leading-none tabular-nums">
                  {formatNumber(activeExceptions.length)}
                </p>
                <p
                  className={cn(
                    'mt-0.5 text-xs font-medium truncate',
                    activeExceptions.length > 0 ? 'text-red-600' : 'text-emerald-600',
                  )}
                >
                  {activeExceptions.length > 0
                    ? t('exceptions.kpi.needsAction')
                    : t('exceptions.kpi.allClear')}
                </p>
              </div>
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                  activeExceptions.length > 0 ? 'bg-red-500/15' : 'bg-emerald-500/15',
                )}
              >
                <AlertTriangle
                  className={cn(
                    'h-4 w-4',
                    activeExceptions.length > 0 ? 'text-red-600' : 'text-emerald-600',
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </Link>
      </section>

      {/* Vehicle status chips — inline wrap */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
          <Car className="h-3 w-3" />
          {t('dashboard.vehiclesByStatus')}:
        </span>
        {VEHICLE_STATUS_KEYS.map((key) => {
          const config = getVehicleStatusConfig(key);
          const Icon = config.icon;
          const count = normalizedStatus[key] ?? 0;
          return (
            <Link key={key} to={`/app/vehicles?status=${key}`}>
              <Badge
                variant="outline"
                className="gap-1 border px-1.5 py-0.5 text-xs font-semibold"
                style={{
                  color: config.color,
                  backgroundColor: config.backgroundColor,
                  borderColor: config.borderColor,
                }}
              >
                <Icon className="h-2.5 w-2.5" style={{ color: config.color }} />
                <span>{config.label}</span>
                <span className="tabular-nums opacity-90">{formatNumber(count)}</span>
              </Badge>
            </Link>
          );
        })}
        {totalVehicles > 0 && (
          <span className="ml-1 text-xs text-muted-foreground">
            · {formatNumber(totalVehicles)} {t('common.vehicle_other')}
          </span>
        )}
      </div>

      {activeExceptions.length > 0 && (
        <ActiveExceptionsSection
          filter={exceptionFilter}
          setFilter={setExceptionFilter}
          counts={exceptionCounts}
          exceptions={filteredExceptions}
        />
      )}

      {/* Bottom grid: Active trips · charts · Quick links */}
      <div className="grid gap-3 xl:grid-cols-12">
        {/* Active trips */}
        <Card className="border border-border bg-card xl:col-span-5">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 p-3 pb-2">
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-1.5 text-sm sm:text-base font-semibold">
                <Truck className="h-3.5 w-3.5 text-primary" />
                {t('dashboard.activeTrips.title')}
              </CardTitle>
            </div>
            <Link to="/app/trips">
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-sm">
                {t('dashboard.activeTrips.viewAll')}
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {activeTrips.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 py-6 text-center">
                <ArrowRightLeft className="h-6 w-6 text-muted-foreground" />
                <p className="mt-1.5 text-sm font-medium text-muted-foreground">{t('dashboard.activeTrips.empty')}</p>
              </div>
            ) : (
              <ul className="space-y-1.5">
                {activeTrips.slice(0, 5).map((trip) => {
                  const theme = getStatusTheme(trip.phase ?? trip.status);
                  const displayLabel = theme.label !== '—' ? theme.label : (trip.phase?.replace(/_/g, ' ') ?? trip.status ?? '—');
                  return (
                    <li key={trip.id}>
                      <Link
                        to={`/app/trips/${trip.id}`}
                        className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-2 py-1.5 transition-colors hover:bg-muted/50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {trip.vehicle?.plate ?? `#${trip.vehicleId}`}
                          </p>
                          <p className="flex items-center gap-0.5 text-xs text-muted-foreground">
                            <MapPin className="h-2.5 w-2.5 shrink-0" />
                            <span className="truncate">
                              {trip.originCenter?.name ?? `C${trip.originCenterId}`}
                              {' → '}
                              {trip.destinationCenter?.name ?? (trip.destinationCenterId ? `C${trip.destinationCenterId}` : '—')}
                            </span>
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className="shrink-0 border px-1.5 py-0 text-[11px] font-medium"
                          style={getStatusStyle(theme.hex)}
                        >
                          {displayLabel}
                        </Badge>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Charts stacked */}
        <div className="flex flex-col gap-3 xl:col-span-4">
          {tripsByDate.length > 0 && (
            <Card className="border-border bg-card">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-sm sm:text-base font-semibold">{t('dashboard.charts.tripsOverTime')}</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={tripsByDate.map((d) => ({
                        date: d.date.slice(0, 10),
                        started: d.startedCount ?? d.count ?? 0,
                        completed: d.completedCount ?? 0,
                      }))}
                      margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 9 }} />
                      <Tooltip
                        contentStyle={{ borderRadius: 6, fontSize: 11 }}
                        formatter={(value: number) => [formatNumber(value), '']}
                      />
                      <Area type="monotone" dataKey="started" name={t('dashboard.charts.started')} fill="var(--status-info)" stroke="var(--status-info)" fillOpacity={0.5} />
                      <Area type="monotone" dataKey="completed" name={t('dashboard.charts.completed')} fill="var(--status-success)" stroke="var(--status-success)" fillOpacity={0.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
          {queuesByDate.length > 0 && (
            <Card className="border-border bg-card">
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-sm sm:text-base font-semibold">{t('dashboard.charts.queuesOverTime')}</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={queuesByDate.map((d) => ({
                        date: d.date.slice(0, 10),
                        loading: d.loadingActive ?? 0,
                        unloading: d.unloadingActive ?? 0,
                      }))}
                      margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 9 }} />
                      <Tooltip
                        contentStyle={{ borderRadius: 6, fontSize: 11 }}
                        formatter={(value: number) => [formatNumber(value), '']}
                      />
                      <Area type="monotone" dataKey="loading" name={t('dashboard.charts.loadingActive')} fill="var(--status-warning)" stroke="var(--status-warning)" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="unloading" name={t('dashboard.charts.unloadingActive')} fill="var(--status-transit)" stroke="var(--status-transit)" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
          {tripsByDate.length === 0 && queuesByDate.length === 0 && (
            <Card className="border-border bg-card">
              <CardContent className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
                {t('dashboard.activeTrips.emptyHint')}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick links */}
        <Card className="border border-border bg-card xl:col-span-3">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="flex items-center gap-1.5 text-sm sm:text-base font-semibold">
              <Clock className="h-3.5 w-3.5 text-primary" />
              {t('dashboard.quickLinks.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { to: '/app/vehicles', label: t('dashboard.quickLinks.vehiclesLabel'), icon: Car },
                { to: '/app/trips', label: t('dashboard.quickLinks.tripsLabel'), icon: ArrowRightLeft },
                { to: '/app/centers', label: t('dashboard.quickLinks.centersLabel'), icon: Building2 },
                { to: '/app/incidents', label: t('nav.incidents'), icon: AlertTriangle },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.to} to={item.to}>
                    <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2 py-1.5 transition-all hover:border-primary/40 hover:bg-primary/5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15">
                        <Icon className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <p className="min-w-0 truncate text-sm font-semibold text-foreground">{item.label}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CompactKpi({
  label,
  value,
  sub,
  icon: Icon,
  colorClass,
  to,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: typeof ArrowRightLeft;
  colorClass: 'info' | 'success' | 'transit' | 'warning';
  to?: string;
}) {
  const card = (
    <Card
      className={cn(
        'card-hover border-l-4 bg-card h-full',
        colorClass === 'info' && 'border-l-status-info',
        colorClass === 'success' && 'border-l-status-success',
        colorClass === 'transit' && 'border-l-status-transit',
        colorClass === 'warning' && 'border-l-status-warning',
      )}
    >
      <CardContent className="flex items-center justify-between p-3">
        <div className="min-w-0">
          <p
            className={cn(
              'text-[11px] font-semibold uppercase tracking-wider',
              colorClass === 'info' && 'text-status-info',
              colorClass === 'success' && 'text-status-success',
              colorClass === 'transit' && 'text-status-transit',
              colorClass === 'warning' && 'text-status-warning',
            )}
          >
            {label}
          </p>
          <p className="mt-0.5 text-xl sm:text-2xl font-bold leading-none tabular-nums">{value}</p>
          {sub && <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
            colorClass === 'info' && 'bg-status-info/15',
            colorClass === 'success' && 'bg-status-success/15',
            colorClass === 'transit' && 'bg-status-transit/15',
            colorClass === 'warning' && 'bg-status-warning/15',
          )}
        >
          <Icon
            className={cn(
              'h-4 w-4',
              colorClass === 'info' && 'text-status-info',
              colorClass === 'success' && 'text-status-success',
              colorClass === 'transit' && 'text-status-transit',
              colorClass === 'warning' && 'text-status-warning',
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
  return to ? <Link to={to}>{card}</Link> : card;
}

function ExceptionAlertBanner({ exceptions }: { exceptions: ExceptionRecord[] }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-red-500/50 bg-gradient-to-r from-red-50 to-white px-3 py-2 shadow-sm">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-red-500/15 text-red-600">
        <AlertTriangle className="h-3.5 w-3.5" />
      </div>
      <p className="text-sm font-bold text-red-600">
        {t('exceptions.banner.activeCount', { count: exceptions.length })}
      </p>
      <div className="flex flex-wrap items-center gap-1">
        {exceptions.slice(0, 5).map((e) => (
          <Link
            key={e.id}
            to={`/app/trips/${e.tripId}`}
            className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-white px-2 py-0.5 text-xs font-medium transition hover:bg-red-500/5"
          >
            <ExceptionBadge type={e.type} withIcon={false} className="!border-0 !bg-transparent !p-0 !text-[11px]" />
            <span className="font-mono text-foreground">{e.vehiclePlate}</span>
          </Link>
        ))}
      </div>
      <Link
        to="/app/incidents"
        className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-md border border-red-500/40 bg-white px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-500/5"
      >
        {t('exceptions.banner.viewAll')}
      </Link>
    </div>
  );
}

function ActiveExceptionsSection({
  filter,
  setFilter,
  counts,
  exceptions,
}: {
  filter: ExceptionType | 'ALL';
  setFilter: (k: ExceptionType | 'ALL') => void;
  counts: Record<ExceptionType, number>;
  exceptions: ExceptionRecord[];
}) {
  const { t } = useTranslation();
  const chips: Array<{ key: ExceptionType | 'ALL'; label: string; count: number }> = [
    { key: 'ALL', label: t('common.all'), count: exceptions.length || Object.values(counts).reduce((a, b) => a + b, 0) },
    { key: 'BREAKDOWN', label: t('exceptions.typeShort.BREAKDOWN'), count: counts.BREAKDOWN },
    { key: 'ACCIDENT', label: t('exceptions.typeShort.ACCIDENT'), count: counts.ACCIDENT },
    { key: 'OVERDUE', label: t('exceptions.typeShort.OVERDUE'), count: counts.OVERDUE },
  ];

  return (
    <Card className="overflow-hidden rounded-xl border border-amber-500/30">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 p-3 pb-2">
        <CardTitle className="flex items-center gap-1.5 text-sm sm:text-base font-semibold">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
          {t('exceptions.active.heading')}
        </CardTitle>
        <div className="flex flex-wrap gap-1">
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setFilter(c.key)}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition',
                filter === c.key
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input bg-background text-muted-foreground hover:bg-muted',
              )}
            >
              {c.label}
              <span
                className={cn(
                  'rounded-full px-1 text-[11px] tabular-nums',
                  filter === c.key ? 'bg-primary-foreground/20' : 'bg-muted',
                )}
              >
                {c.count}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-2 py-1.5">{t('exceptions.active.columnType')}</th>
                <th className="px-2 py-1.5">{t('exceptions.active.columnVehicle')}</th>
                <th className="px-2 py-1.5">{t('exceptions.active.columnRoute')}</th>
                <th className="px-2 py-1.5">{t('exceptions.active.columnReported')}</th>
                <th className="px-2 py-1.5">{t('exceptions.active.columnLocation')}</th>
                <th className="px-2 py-1.5">{t('exceptions.active.columnAction')}</th>
                <th className="px-2 py-1.5" />
              </tr>
            </thead>
            <tbody>
              {exceptions.slice(0, 4).map((e) => {
                const theme = getStatusTheme(e.type);
                return (
                  <tr
                    key={e.id}
                    className="border-b last:border-b-0 transition-colors hover:bg-muted/40"
                    style={{
                      backgroundImage: `linear-gradient(to right, ${theme.hex}0D, transparent 60%)`,
                    }}
                  >
                    <td className="px-2 py-1.5">
                      <ExceptionBadge type={e.type} status={e.status} />
                    </td>
                    <td className="px-2 py-1.5 font-mono text-xs font-semibold">
                      <span className="inline-flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: theme.hex }} />
                        {e.vehiclePlate}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 text-xs text-muted-foreground">
                      {(e.originName ?? '—') + ' → ' + (e.destinationName ?? '—')}
                    </td>
                    <td className="px-2 py-1.5 text-xs text-muted-foreground">
                      {formatRelativeFromNow(e.reportedAt)}
                    </td>
                    <td className="max-w-[200px] truncate px-2 py-1.5 text-xs text-muted-foreground">
                      {e.location}
                    </td>
                    <td className="px-2 py-1.5 text-xs">{getActionNeededText(e)}</td>
                    <td className="px-2 py-1.5">
                      <Link to={`/app/trips/${e.tripId}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 gap-1 px-2 text-xs"
                          style={{ borderColor: theme.hex, color: theme.hex }}
                        >
                          {t('exceptions.active.manage')}
                          <ArrowRight className="h-2.5 w-2.5" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
