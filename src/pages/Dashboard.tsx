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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
  Filter,
  Calendar,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatDate, formatNumber } from '@/lib/utils';
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
    <div className="space-y-8">
      {/* Hero — Proof Arrive tint, badges for context */}
      <header className="relative overflow-hidden rounded-2xl bg-primary px-6 py-6 text-primary-foreground shadow-lg border border-primary/20">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 font-medium">
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                {t('dashboard.badges.operationalOverview')}
              </Badge>
              {errorReports && (
                <Badge variant="secondary" className="bg-status-warning/90 text-white border-status-warning font-medium">
                  <AlertCircle className="h-3.5 w-3.5 mr-1" />
                  {t('dashboard.badges.partialData')}
                </Badge>
              )}
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{t('dashboard.title')}</h1>
            <p className="mt-1 max-w-md text-sm text-primary-foreground/90">
              {t('dashboard.subtitle')}
            </p>
          </div>
          <Badge variant="secondary" className="w-fit bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 font-medium">
            <Activity className="h-4 w-4 mr-1.5" />
            {t('dashboard.badges.liveData')}
          </Badge>
        </div>
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary-foreground/10" />
        <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-primary-foreground/5" />
      </header>

      {/* Report filters — date range, center, vehicle */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <Filter className="h-4 w-4 text-primary" />
            {t('dashboard.filters.title')}
          </CardTitle>
          <CardDescription>
            {t('dashboard.filters.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="report-date" className="flex items-center gap-1.5 text-sm">
                <Calendar className="h-3.5 w-3.5" />
                {t('dashboard.filters.period')}
              </Label>
              <Select
                id="report-date"
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value as ReportDatePreset)}
              >
                <option value="today">{t('dashboard.period.today')}</option>
                <option value="last7">{t('dashboard.period.last7')}</option>
                <option value="month">{t('dashboard.period.month')}</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-center" className="text-sm">{t('dashboard.filters.center')}</Label>
              <Select
                id="report-center"
                value={centerId === '' ? 'all' : String(centerId)}
                onChange={(e) => setCenterId(e.target.value === 'all' ? '' : Number(e.target.value))}
              >
                <option value="all">{t('dashboard.filters.allCenters')}</option>
                {(centers as { id: number; name?: string }[]).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name ?? `Center ${c.id}`}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-vehicle" className="text-sm">{t('dashboard.filters.vehicle')}</Label>
              <Select
                id="report-vehicle"
                value={vehicleId === '' ? 'all' : String(vehicleId)}
                onChange={(e) => setVehicleId(e.target.value === 'all' ? '' : Number(e.target.value))}
              >
                <option value="all">{t('dashboard.filters.allVehicles')}</option>
                {(vehicles as { id: number; plate?: string }[]).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plate ?? `Vehicle ${v.id}`}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle status — badge-style links, Proof Arrive status colors */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
          <Car className="h-4 w-4 text-primary" />
          {t('dashboard.vehiclesByStatus')}
        </h2>
        <div className="flex flex-wrap gap-2">
          {VEHICLE_STATUS_KEYS.map((key) => {
            const config = getVehicleStatusConfig(key);
            const Icon = config.icon;
            const count = normalizedStatus[key] ?? 0;
            return (
              <Link key={key} to={`/app/vehicles?status=${key}`}>
                <Badge
                  variant="outline"
                  className="card-hover gap-1.5 border-2 px-3 py-1.5 text-xs font-semibold transition-all hover:shadow-md"
                  style={{
                    color: config.color,
                    backgroundColor: config.backgroundColor,
                    borderColor: config.borderColor,
                  }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: config.color }} />
                  <span>{config.label}</span>
                  <span className="ml-0.5 tabular-nums opacity-90">({formatNumber(count)})</span>
                </Badge>
              </Link>
            );
          })}
        </div>
        {totalVehicles > 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            {t('dashboard.totalVehicles')} <span className="font-semibold text-foreground">{formatNumber(totalVehicles)}</span>
          </p>
        )}
      </section>

      {/* KPI row — Proof Arrive semantic colors, badges for labels */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/app/trips">
          <Card className="card-hover border-l-4 border-l-status-info bg-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="secondary" className="mb-2 text-[10px] font-medium uppercase tracking-wider border-status-info/30 bg-status-info/10 text-status-info">
                    {t('dashboard.kpi.trips')}
                  </Badge>
                  <p className="text-2xl font-bold text-foreground">{formatNumber(startedInPeriod)}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t('dashboard.kpi.tripsSub', {
                      completed: formatNumber(completedInPeriod),
                      ongoing: formatNumber(ongoingCount),
                    })}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-status-info/15">
                  <ArrowRightLeft className="h-6 w-6 text-status-info" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="card-hover border-l-4 border-l-status-success bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <Badge variant="secondary" className="mb-2 text-[10px] font-medium uppercase tracking-wider border-status-success/30 bg-status-success/10 text-status-success">
                  {t('dashboard.kpi.completionRate')}
                </Badge>
                <p className="text-2xl font-bold text-foreground">
                  {typeof completionRatePercent === 'number' ? `${completionRatePercent.toFixed(1)}%` : '—'}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-status-success/15">
                <CheckCircle2 className="h-6 w-6 text-status-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Link to="/app/centers">
          <Card className="card-hover border-l-4 border-l-status-transit bg-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <Badge variant="secondary" className="mb-2 text-[10px] font-medium uppercase tracking-wider border-status-transit/30 bg-status-transit/10 text-status-transit">
                    {t('dashboard.kpi.centers')}
                  </Badge>
                  <p className="text-2xl font-bold text-foreground">{formatNumber(centerCount)}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-status-transit/15">
                  <Building2 className="h-6 w-6 text-status-transit" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="card-hover border-l-4 border-l-status-warning bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <Badge variant="secondary" className="mb-2 text-[10px] font-medium uppercase tracking-wider border-status-warning/30 bg-status-warning/10 text-status-warning">
                  {t('dashboard.kpi.queuesActive')}
                </Badge>
                <p className="text-2xl font-bold text-foreground">{formatNumber(queueActive)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t('dashboard.kpi.queuesActiveSub')}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-status-warning/15">
                <ListOrdered className="h-6 w-6 text-status-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Trips over time + Queues over time */}
      {(tripsByDate.length > 0 || queuesByDate.length > 0) && (
        <section className="grid gap-6 lg:grid-cols-2">
          {tripsByDate.length > 0 && (
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground">{t('dashboard.charts.tripsOverTime')}</CardTitle>
                <CardDescription>{t('dashboard.charts.tripsOverTimeDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={tripsByDate.map((d) => ({
                        date: d.date.slice(0, 10),
                        started: d.startedCount ?? d.count ?? 0,
                        completed: d.completedCount ?? 0,
                      }))}
                      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                      <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                      <Tooltip
                        contentStyle={{ borderRadius: 8 }}
                        labelFormatter={(v) => String(v)}
                        formatter={(value: number) => [formatNumber(value), '']}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="started"
                        name={t('dashboard.charts.started')}
                        fill="var(--status-info)"
                        stroke="var(--status-info)"
                        fillOpacity={0.5}
                      />
                      <Area
                        type="monotone"
                        dataKey="completed"
                        name={t('dashboard.charts.completed')}
                        fill="var(--status-success)"
                        stroke="var(--status-success)"
                        fillOpacity={0.5}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
          {queuesByDate.length > 0 && (
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground">{t('dashboard.charts.queuesOverTime')}</CardTitle>
                <CardDescription>{t('dashboard.charts.queuesOverTimeDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={queuesByDate.map((d) => ({
                        date: d.date.slice(0, 10),
                        loading: d.loadingActive ?? 0,
                        unloading: d.unloadingActive ?? 0,
                      }))}
                      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                      <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                      <Tooltip
                        contentStyle={{ borderRadius: 8 }}
                        labelFormatter={(v) => String(v)}
                        formatter={(value: number) => [formatNumber(value), '']}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="loading"
                        name={t('dashboard.charts.loadingActive')}
                        fill="var(--status-warning)"
                        stroke="var(--status-warning)"
                        fillOpacity={0.6}
                      />
                      <Area
                        type="monotone"
                        dataKey="unloading"
                        name={t('dashboard.charts.unloadingActive')}
                        fill="var(--status-transit)"
                        stroke="var(--status-transit)"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      )}

      {/* Active trips + Quick links */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="card-hover border border-border bg-card lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Truck className="h-5 w-5 text-primary" />
                  {t('dashboard.activeTrips.title')}
                </CardTitle>
                <CardDescription>{t('dashboard.activeTrips.description')}</CardDescription>
              </div>
              <Link to="/app/trips">
                <Button variant="ghost" size="sm" className="gap-1.5 font-medium text-foreground">
                  {t('dashboard.activeTrips.viewAll')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {activeTrips.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 py-12 text-center">
                <ArrowRightLeft className="h-10 w-10 text-muted-foreground" />
                <p className="mt-3 font-medium text-muted-foreground">{t('dashboard.activeTrips.empty')}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{t('dashboard.activeTrips.emptyHint')}</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {activeTrips.slice(0, 8).map((trip) => {
                  const theme = getStatusTheme(trip.phase ?? trip.status);
                  const displayLabel = theme.label !== '—' ? theme.label : (trip.phase?.replace(/_/g, ' ') ?? trip.status ?? '—');
                  return (
                    <li key={trip.id}>
                      <Link
                        to={`/app/trips?tripId=${trip.id}`}
                        className="flex items-center gap-4 rounded-xl border border-border bg-muted/20 p-3 transition-colors hover:bg-muted/50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground truncate">
                            {trip.vehicle?.plate ?? `Vehicle #${trip.vehicleId}`}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {trip.originCenter?.name ?? `Center ${trip.originCenterId}`}
                            <span className="mx-1">→</span>
                            {trip.destinationCenter?.name ?? (trip.destinationCenterId ? `Center ${trip.destinationCenterId}` : '—')}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className="shrink-0 border font-medium"
                          style={getStatusStyle(theme.hex)}
                        >
                          {displayLabel}
                        </Badge>
                        {trip.startedAt && (
                          <span className="shrink-0 text-xs text-muted-foreground">{formatDate(trip.startedAt)}</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="card-hover border border-border bg-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Clock className="h-5 w-5 text-primary" />
              {t('dashboard.quickLinks.title')}
            </CardTitle>
            <CardDescription>{t('dashboard.quickLinks.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { to: '/app/vehicles', label: t('dashboard.quickLinks.vehiclesLabel'), sub: t('dashboard.quickLinks.vehiclesSub'), icon: Car },
                { to: '/app/trips', label: t('dashboard.quickLinks.tripsLabel'), sub: t('dashboard.quickLinks.tripsSub'), icon: ArrowRightLeft },
                { to: '/app/centers', label: t('dashboard.quickLinks.centersLabel'), sub: t('dashboard.quickLinks.centersSub'), icon: Building2 },
                { to: '/app/settings', label: t('dashboard.quickLinks.settingsLabel'), sub: t('dashboard.quickLinks.settingsSub'), icon: Activity },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.to} to={item.to}>
                    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:bg-primary/5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.sub}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
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
