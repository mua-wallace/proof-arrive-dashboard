import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  dashboardApi,
  normalizeStatusSummary,
  type StatusSummary,
  type Trip,
  type ReportsDashboard,
  type TripsSummaryReport,
  type QueuesSummaryReport,
} from '@/api/dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';
import { formatDate, formatNumber } from '@/lib/utils';
import {
  TRIP_STATUS_THEME,
  getStatusTheme,
  getStatusStyle,
} from '@/lib/status-theme';

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
  const {
    data: reportsDashboard,
    isLoading: loadingReports,
    error: errorReports,
  } = useQuery<ReportsDashboard>({
    queryKey: ['reports', 'dashboard'],
    queryFn: () => dashboardApi.getReportsDashboard(),
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

  const { data: tripsSummary } = useQuery<TripsSummaryReport>({
    queryKey: ['reports', 'trips', 'summary'],
    queryFn: () => dashboardApi.getReportsTripsSummary(),
    retry: 1,
    staleTime: 60 * 1000,
  });

  const { data: queuesSummary } = useQuery<QueuesSummaryReport>({
    queryKey: ['reports', 'queues', 'summary'],
    queryFn: () => dashboardApi.getReportsQueuesSummary(),
    retry: 1,
    staleTime: 30 * 1000,
  });

  const normalizedStatus = normalizeStatusSummary(statusSummary);
  const activeTrips: Trip[] = tripsData?.data ?? [];
  const centers = centersData?.data ?? [];
  const centerCount = Array.isArray(centers) ? centers.length : (reportsDashboard?.centers as number) ?? 0;
  const isLoading = loadingReports && loadingStatus;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Loading operational overview…</p>
        </div>
        <DashboardSkeleton />
      </div>
    );
  }

  const totalVehicles = Object.values(normalizedStatus).reduce((a, b) => a + b, 0);
  const ongoingCount = tripsSummary?.ongoingCount ?? activeTrips.length ?? 0;
  const completedCount = tripsSummary?.completedInPeriod ?? 0;
  const completionRate = tripsSummary?.completionRate ?? 0;
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
                Operational overview
              </Badge>
              {errorReports && (
                <Badge variant="secondary" className="bg-status-warning/90 text-white border-status-warning font-medium">
                  <AlertCircle className="h-3.5 w-3.5 mr-1" />
                  Partial data
                </Badge>
              )}
            </div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Dashboard</h1>
            <p className="mt-1 max-w-md text-sm text-primary-foreground/90">
              Real-time vehicle status, trips, and queue overview at a glance
            </p>
          </div>
          <Badge variant="secondary" className="w-fit bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 font-medium">
            <Activity className="h-4 w-4 mr-1.5" />
            Live data
          </Badge>
        </div>
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary-foreground/10" />
        <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-primary-foreground/5" />
      </header>

      {/* Vehicle status — badge-style links, Proof Arrive status colors */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
          <Car className="h-4 w-4 text-primary" />
          Vehicles by status
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
            Total vehicles: <span className="font-semibold text-foreground">{formatNumber(totalVehicles)}</span>
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
                    Trips
                  </Badge>
                  <p className="text-2xl font-bold text-foreground">{formatNumber(ongoingCount)}</p>
                  {completedCount !== undefined && completedCount > 0 && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatNumber(completedCount)} completed in period
                    </p>
                  )}
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
                  Completion
                </Badge>
                <p className="text-2xl font-bold text-foreground">
                  {typeof completionRate === 'number' ? `${completionRate.toFixed(1)}%` : '—'}
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
                    Centers
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
                  Queues active
                </Badge>
                <p className="text-2xl font-bold text-foreground">{formatNumber(queueActive)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Loading / Unloading</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-status-warning/15">
                <ListOrdered className="h-6 w-6 text-status-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Active trips + Quick links */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="card-hover border border-border bg-card lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Truck className="h-5 w-5 text-primary" />
                  Active trips
                </CardTitle>
                <CardDescription>Ongoing trips between centers</CardDescription>
              </div>
              <Link to="/app/trips">
                <Button variant="ghost" size="sm" className="gap-1.5 font-medium text-foreground">
                  View all
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {activeTrips.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 py-12 text-center">
                <ArrowRightLeft className="h-10 w-10 text-muted-foreground" />
                <p className="mt-3 font-medium text-muted-foreground">No active trips</p>
                <p className="mt-0.5 text-sm text-muted-foreground">Trips will appear here when in progress</p>
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
              Quick links
            </CardTitle>
            <CardDescription>Jump to main views</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { to: '/app/vehicles', label: 'Vehicles', sub: 'Manage fleet', icon: Car },
                { to: '/app/trips', label: 'Trips', sub: 'View all trips', icon: ArrowRightLeft },
                { to: '/app/centers', label: 'Centers', sub: 'Queues & sites', icon: Building2 },
                { to: '/app/settings', label: 'Settings', sub: 'Preferences', icon: Activity },
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
