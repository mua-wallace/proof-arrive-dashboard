import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  dashboardApi,
  type Trip,
  type TripsQuery,
} from '@/api/dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
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
  MapPin,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Eye,
  Clock,
  Package,
  Building2,
} from 'lucide-react';
import { formatDate, formatNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function Trips() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(() => parseInt(searchParams.get('page') || '1', 10));
  const [limit, setLimit] = useState(20);
  const [status, setStatus] = useState<'ONGOING' | 'COMPLETED' | ''>(() => (searchParams.get('status') as 'ONGOING' | 'COMPLETED') || '');
  const [purpose, setPurpose] = useState<'DELIVERY' | 'PICKUP' | ''>(() => (searchParams.get('purpose') as 'DELIVERY' | 'PICKUP') || '');
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [createdAt, setCreatedAt] = useState(() => searchParams.get('createdAt') || '');
  const [detailTripId, setDetailTripId] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', String(page));
    if (status) params.set('status', status);
    if (purpose) params.set('purpose', purpose);
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (createdAt) params.set('createdAt', createdAt);
    setSearchParams(params, { replace: true });
  }, [page, status, purpose, debouncedSearch, createdAt, setSearchParams]);

  const query: TripsQuery = {
    page,
    limit,
    include: 'vehicle,originCenter,destinationCenter,events',
    sortOrder: 'DESC',
  };
  if (status) query.status = status;
  if (purpose) query.purpose = purpose;
  if (debouncedSearch) query.search = debouncedSearch;
  if (createdAt) query.createdAt = createdAt;

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
        ...(createdAt && { createdAt }),
      }),
    placeholderData: keepPreviousData,
    retry: 1,
  });

  const { data: detailTrip, isLoading: detailLoading, error: detailError, refetch: refetchDetail } = useQuery({
    queryKey: ['trip', detailTripId],
    queryFn: () => dashboardApi.getTripById(detailTripId!, 'vehicle,originCenter,destinationCenter,events'),
    enabled: detailTripId != null,
    retry: 1,
  });

  const { data: centersDataForDetail } = useQuery({
    queryKey: ['centers', 'list'],
    queryFn: () => dashboardApi.getCenters({ limit: 500 }),
    enabled: detailTripId != null,
  });

  const centersList = Array.isArray(centersDataForDetail?.data) ? centersDataForDetail.data : [];
  const getCenterName = (centerId: number | undefined): string => {
    if (centerId == null) return '—';
    const fromTrip =
      detailTrip?.originCenterId === centerId
        ? detailTrip?.originCenter
        : detailTrip?.destinationCenterId === centerId
          ? detailTrip?.destinationCenter
          : null;
    const name = (fromTrip as any)?.name ?? (fromTrip as any)?.label ?? (fromTrip as any)?.centerName;
    if (name) return name;
    const center = centersList.find((c: any) => c.id === centerId || c.centerId === centerId);
    return (center?.name ?? center?.label ?? center?.centerName) || `Center ${centerId}`;
  };

  const trips: Trip[] = Array.isArray(data?.data) ? data.data : [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const totalItems = meta?.totalItems ?? 0;
  const apiErrorMessage =
    error instanceof Error
      ? error.message
      : error != null
        ? String(error)
        : null;

  const getPhaseBadgeVariant = (phase: string | undefined): 'default' | 'secondary' | 'outline' => {
    if (!phase) return 'secondary';
    if (phase.includes('COMPLETED')) return 'default';
    if (phase.includes('TRANSIT')) return 'secondary';
    if (phase.includes('LOADING') || phase.includes('UNLOADING')) return 'outline';
    return 'secondary';
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card/50 px-6 py-5">
        <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
            <ArrowRightLeft className="h-6 w-6 text-primary" />
          </div>
          Trips
        </h1>
        <p className="mt-2 text-muted-foreground">
          View and filter trips by status, purpose, and search
        </p>
      </div>

      <Card className="overflow-hidden rounded-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>Narrow down by status, purpose, or vehicle/center search</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                value={status || 'all'}
                onChange={(e) => {
                  const v = e.target.value;
                  setStatus(v === 'all' ? '' : (v as 'ONGOING' | 'COMPLETED'));
                  setPage(1);
                }}
              >
                <option value="all">All</option>
                <option value="ONGOING">Ongoing</option>
                <option value="COMPLETED">Completed</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Select
                id="purpose"
                value={purpose || 'all'}
                onChange={(e) => {
                  const v = e.target.value;
                  setPurpose(v === 'all' ? '' : (v as 'DELIVERY' | 'PICKUP'));
                  setPage(1);
                }}
              >
                <option value="all">All</option>
                <option value="DELIVERY">Delivery</option>
                <option value="PICKUP">Pickup</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="createdAt">Date (created)</Label>
              <Input
                id="createdAt"
                type="date"
                value={createdAt}
                onChange={(e) => {
                  setCreatedAt(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Truck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Vehicle plate or center name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Trips list</CardTitle>
              <CardDescription>
                {meta
                  ? `Showing ${(page - 1) * limit + 1} to ${Math.min(page * limit, totalItems)} of ${formatNumber(totalItems)} trips`
                  : 'Loading…'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {apiErrorMessage ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="font-medium text-destructive mb-1">Failed to load trips</p>
              <p className="text-sm text-muted-foreground mb-4 max-w-md">{apiErrorMessage}</p>
              <Button variant="outline" onClick={() => refetch()}>
                Try again
              </Button>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
          ) : !trips.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ArrowRightLeft className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="font-medium text-muted-foreground">No trips found</p>
              <p className="text-sm text-muted-foreground mt-1">Adjust filters or try another search</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Origin</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Phase / Status</TableHead>
                      <TableHead className="w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trips.map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell className="font-medium">
                          {trip.vehicle?.plate ?? `#${trip.vehicleId}`}
                        </TableCell>
                        <TableCell>
                          {trip.originCenter?.name ?? `Center ${trip.originCenterId}`}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {trip.startedAt ? formatDate(trip.startedAt) : trip.createdAt ? formatDate(trip.createdAt) : '—'}
                        </TableCell>
                        <TableCell>
                          {trip.destinationCenter?.name ?? (trip.destinationCenterId ? `Center ${trip.destinationCenterId}` : '—')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={trip.purpose === 'DELIVERY' ? 'default' : 'outline'}>
                            {trip.purpose ?? '—'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getPhaseBadgeVariant(trip.phase)}>
                            {trip.phase != null ? String(trip.phase).replace(/_/g, ' ') : (trip.status ?? '—')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 whitespace-nowrap"
                            onClick={() => setDetailTripId(trip.id)}
                          >
                            <Eye className="h-4 w-4" />
                            View timeline
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1 || isFetching}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages || isFetching}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Trip detail modal - width grows with content */}
      <Dialog open={detailTripId != null} onOpenChange={(open) => !open && setDetailTripId(null)} fitContent>
        <DialogClose onClick={() => setDetailTripId(null)} />
        <DialogContent className="w-fit min-w-[20rem] max-w-[90vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Trip details</DialogTitle>
            <DialogDescription>
              {detailTripId != null && (detailTrip
                ? `${detailTrip.purpose ?? 'Trip'} · ${detailTrip.phase != null ? String(detailTrip.phase).replace(/_/g, ' ') : detailTrip.status ?? ''}`
                : 'Loading…')}
            </DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
          ) : detailError ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-destructive mb-2">Failed to load trip details</p>
              <Button variant="outline" size="sm" onClick={() => refetchDetail()}>
                Try again
              </Button>
            </div>
          ) : detailTrip ? (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Vehicle</p>
                  <p className="font-semibold mt-1 flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    {detailTrip.vehicle?.plate ?? `#${detailTrip.vehicleId}`}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Origin</p>
                  <p className="font-semibold mt-1 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {getCenterName(detailTrip.originCenterId)}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Destination</p>
                  <p className="font-semibold mt-1 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {detailTrip.destinationCenterId != null ? getCenterName(detailTrip.destinationCenterId) : '—'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge>{detailTrip.purpose ?? '—'}</Badge>
                <Badge variant="secondary">{detailTrip.phase != null ? String(detailTrip.phase).replace(/_/g, ' ') : '—'}</Badge>
                {detailTrip.startedAt && (
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Started {formatDate(detailTrip.startedAt)}
                  </span>
                )}
              </div>
              {detailTrip.events && Array.isArray(detailTrip.events) && detailTrip.events.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Trip timeline
                  </h4>
                  <ul className="space-y-2">
                    {[...(detailTrip.events || [])]
                      .sort((a, b) => new Date((a as any).createdAt || 0).getTime() - new Date((b as any).createdAt || 0).getTime())
                      .map((evt, i) => (
                        <li
                          key={(evt as any).id ?? i}
                          className={cn(
                            'flex items-center gap-3 rounded-lg border p-3 text-sm',
                            i === 0 && 'bg-primary/5 border-primary/20'
                          )}
                        >
                          <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{((evt as any).eventType ?? '—').replace(/_/g, ' ')}</p>
                            {(evt as any).centerId != null && (
                              <p className="text-xs text-muted-foreground">{getCenterName((evt as any).centerId)}</p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {((evt as any).createdAt) ? formatDate((evt as any).createdAt) : '—'}
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailTripId(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
