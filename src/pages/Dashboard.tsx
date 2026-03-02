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
  Package,
  Activity,
  ArrowRightLeft,
  Clock,
  ListOrdered,
  MapPin,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { formatDate, formatNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';

const VEHICLE_STATUS_CONFIG: Record<
  string,
  { label: string; icon: typeof Car; color: string; bgClass: string; gradient: string }
> = {
  AVAILABLE: {
    label: 'Available',
    icon: Car,
    color: 'text-emerald-600',
    bgClass: 'bg-emerald-500/10 border-emerald-200 dark:border-emerald-800',
    gradient: 'from-emerald-500/20 to-emerald-600/5',
  },
  IN_TRANSIT: {
    label: 'In Transit',
    icon: Truck,
    color: 'text-blue-600',
    bgClass: 'bg-blue-500/10 border-blue-200 dark:border-blue-800',
    gradient: 'from-blue-500/20 to-blue-600/5',
  },
  WAITING_IN_QUEUE: {
    label: 'In Queue',
    icon: ListOrdered,
    color: 'text-amber-600',
    bgClass: 'bg-amber-500/10 border-amber-200 dark:border-amber-800',
    gradient: 'from-amber-500/20 to-amber-600/5',
  },
  LOADING: {
    label: 'Loading',
    icon: Package,
    color: 'text-violet-600',
    bgClass: 'bg-violet-500/10 border-violet-200 dark:border-violet-800',
    gradient: 'from-violet-500/20 to-violet-600/5',
  },
  UNLOADING: {
    label: 'Unloading',
    icon: Package,
    color: 'text-purple-600',
    bgClass: 'bg-purple-500/10 border-purple-200 dark:border-purple-800',
    gradient: 'from-purple-500/20 to-purple-600/5',
  },
  IN_GARAGE: {
    label: 'In Garage',
    icon: Building2,
    color: 'text-slate-600',
    bgClass: 'bg-slate-500/10 border-slate-200 dark:border-slate-800',
    gradient: 'from-slate-500/20 to-slate-600/5',
  },
};

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="h-24 rounded-2xl bg-muted/50 animate-pulse" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted/50 animate-pulse" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-muted/50 animate-pulse" />
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
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
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
      {/* Hero strip */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 via-primary to-primary/80 px-6 py-8 text-primary-foreground shadow-xl shadow-primary/20">
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary-foreground/90">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-medium">Operational overview</span>
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Dashboard
            </h1>
            <p className="mt-1 max-w-md text-sm text-primary-foreground/85">
              Real-time vehicle status, trips, and queue overview at a glance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur">
              <Activity className="h-4 w-4" />
              Live data
            </div>
            {errorReports && (
              <Badge variant="secondary" className="bg-amber-400/20 text-amber-100 border-amber-300/30">
                <AlertCircle className="h-3 w-3 mr-1" />
                Partial data
              </Badge>
            )}
          </div>
        </div>
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 -right-12 h-56 w-56 rounded-full bg-white/5" />
      </div>

      {/* Vehicle status cards */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Car className="h-5 w-5 text-primary" />
          Vehicles by status
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Object.entries(VEHICLE_STATUS_CONFIG).map(([key, config]) => {
            const Icon = config.icon;
            const count = normalizedStatus[key] ?? 0;
            return (
              <Link key={key} to={`/app/vehicles?status=${key}`}>
                <Card
                  className={cn(
                    'card-hover overflow-hidden border bg-gradient-to-br',
                    config.gradient,
                    config.bgClass
                  )}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', config.bgClass)}>
                        <Icon className={cn('h-6 w-6', config.color)} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{config.label}</p>
                        <p className="text-2xl font-bold tabular-nums">{formatNumber(count)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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

      {/* KPI row */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/app/trips">
          <Card className="card-hover glow-primary border-l-4 border-l-primary">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active trips</p>
                  <p className="mt-1 text-3xl font-bold">{formatNumber(ongoingCount)}</p>
                  {completedCount !== undefined && completedCount > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatNumber(completedCount)} completed in period
                    </p>
                  )}
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
                  <ArrowRightLeft className="h-7 w-7 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="card-hover border-l-4 border-l-cyan-500 bg-gradient-to-br from-cyan-500/5 to-transparent">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completion rate</p>
                <p className="mt-1 text-3xl font-bold">
                  {typeof completionRate === 'number' ? `${completionRate.toFixed(1)}%` : '—'}
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/15">
                <CheckCircle2 className="h-7 w-7 text-cyan-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Link to="/app/centers">
          <Card className="card-hover border-l-4 border-l-violet-500 bg-gradient-to-br from-violet-500/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Centers</p>
                  <p className="mt-1 text-3xl font-bold">{formatNumber(centerCount)}</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/15">
                  <Building2 className="h-7 w-7 text-violet-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="card-hover border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-500/5 to-transparent">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Queues active</p>
                <p className="mt-1 text-3xl font-bold">{formatNumber(queueActive)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Loading / Unloading</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15">
                <ListOrdered className="h-7 w-7 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Active trips + Quick links */}
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="card-hover lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  Active trips
                </CardTitle>
                <CardDescription>Ongoing trips between centers</CardDescription>
              </div>
              <Link to="/app/trips">
                <Button variant="ghost" size="sm" className="gap-1.5 font-medium">
                  View all
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {activeTrips.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted py-14 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                  <ArrowRightLeft className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="mt-4 font-medium text-muted-foreground">No active trips</p>
                <p className="mt-1 text-sm text-muted-foreground">Trips will appear here when in progress</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {activeTrips.slice(0, 8).map((trip) => (
                  <li key={trip.id}>
                    <Link
                      to={`/app/trips?tripId=${trip.id}`}
                      className="flex items-center gap-4 rounded-xl border bg-muted/30 p-3 transition-colors hover:bg-muted/60"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">
                          {trip.vehicle?.plate ?? `Vehicle #${trip.vehicleId}`}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {trip.originCenter?.name ?? `Center ${trip.originCenterId}`}
                          <span className="mx-1">→</span>
                          {trip.destinationCenter?.name ?? (trip.destinationCenterId ? `Center ${trip.destinationCenterId}` : '—')}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {trip.phase?.replace(/_/g, ' ') ?? trip.status}
                      </Badge>
                      {trip.startedAt && (
                        <span className="shrink-0 text-xs text-muted-foreground">{formatDate(trip.startedAt)}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="card-hover lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Quick links
            </CardTitle>
            <CardDescription>Jump to main views</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link to="/app/vehicles">
                <div className="flex items-center gap-4 rounded-xl border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
                    <Car className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Vehicles</p>
                    <p className="text-xs text-muted-foreground">Manage fleet</p>
                  </div>
                  <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
              <Link to="/app/trips">
                <div className="flex items-center gap-4 rounded-xl border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
                    <ArrowRightLeft className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Trips</p>
                    <p className="text-xs text-muted-foreground">View all trips</p>
                  </div>
                  <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
              <Link to="/app/centers">
                <div className="flex items-center gap-4 rounded-xl border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Centers</p>
                    <p className="text-xs text-muted-foreground">Queues & sites</p>
                  </div>
                  <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
              <Link to="/app/settings">
                <div className="flex items-center gap-4 rounded-xl border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
                    <Activity className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">Settings</p>
                    <p className="text-xs text-muted-foreground">Preferences</p>
                  </div>
                  <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
