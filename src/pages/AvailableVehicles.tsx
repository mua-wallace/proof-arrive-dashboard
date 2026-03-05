import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { dashboardApi, type Vehicle } from '@/api/dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, Building2, CheckCircle2, MapPin } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

function getCenterFromVehicle(v: Vehicle): { id: number; name: string } | null {
  const center = v.currentCenter ?? (v as { current_center?: { id: number; name?: string } }).current_center;
  const assigned = (v as { assignedCenter?: { id: number; name?: string } }).assignedCenter;
  const c = center ?? assigned;
  if (!c || c.id == null) return null;
  return { id: c.id, name: (c as { name?: string }).name ?? `Center ${c.id}` };
}

export default function AvailableVehicles() {
  const { data: vehicles, isLoading, error } = useQuery({
    queryKey: ['vehicles-by-status', 'available'],
    queryFn: () => dashboardApi.getVehiclesByStatus('available'),
    retry: 1,
    staleTime: 60 * 1000,
  });

  const byCenter = useMemo(() => {
    const list = Array.isArray(vehicles) ? vehicles : [];
    const map = new Map<number, { centerName: string; vehicles: Vehicle[] }>();
    const noCenter: Vehicle[] = [];
    for (const v of list) {
      const center = getCenterFromVehicle(v);
      if (!center) {
        noCenter.push(v);
        continue;
      }
      const existing = map.get(center.id);
      if (existing) {
        existing.vehicles.push(v);
      } else {
        map.set(center.id, { centerName: center.name, vehicles: [v] });
      }
    }
    const entries = Array.from(map.entries()).map(([id, { centerName, vehicles: vs }]) => ({
      centerId: id,
      centerName,
      vehicles: vs,
    }));
    if (noCenter.length > 0) {
      entries.push({ centerId: 0, centerName: 'No center / Unassigned', vehicles: noCenter });
    }
    return entries.sort((a, b) => (a.centerId === 0 ? 1 : b.centerId === 0 ? -1 : a.centerName.localeCompare(b.centerName)));
  }, [vehicles]);

  const totalCount = Array.isArray(vehicles) ? vehicles.length : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Available vehicles</h1>
          <p className="text-muted-foreground">Loading…</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border bg-card/50 px-6 py-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-status-success/15">
              <CheckCircle2 className="h-6 w-6 text-status-success" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Available vehicles</h1>
              <p className="text-muted-foreground">
                Vehicles with status <strong>AVAILABLE</strong> and their respective centers
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="w-fit text-base font-semibold">
            {formatNumber(totalCount)} vehicle{totalCount !== 1 ? 's' : ''}
          </Badge>
        </div>
      </header>

      {error && (
        <Card className="border-status-warning/50 bg-status-warning/5">
          <CardContent className="py-4">
            <p className="text-sm text-foreground">
              Could not load available vehicles. {(error as Error)?.message ?? String(error)}
            </p>
          </CardContent>
        </Card>
      )}

      {totalCount === 0 && !error && (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Car className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 font-medium text-foreground">No available vehicles</p>
            <p className="mt-1 text-sm text-muted-foreground">
              There are no vehicles with status AVAILABLE at the moment.
            </p>
            <Link to="/app/vehicles" className="mt-4 text-sm font-medium text-primary hover:underline">
              View all vehicles →
            </Link>
          </CardContent>
        </Card>
      )}

      {byCenter.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {byCenter.map(({ centerId, centerName, vehicles: vs }) => (
            <Card key={centerId} className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <Building2 className="h-4 w-4 text-primary" />
                  {centerName}
                </CardTitle>
                <CardDescription>
                  {formatNumber(vs.length)} vehicle{vs.length !== 1 ? 's' : ''} available
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {vs.map((v) => (
                    <li key={v.id}>
                      <Link
                        to={`/app/vehicles?vehicleId=${v.id}`}
                        className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2 transition-colors hover:bg-muted/50"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                          <Car className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground truncate">{v.plate}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {[v.brand, v.model].filter(Boolean).join(' ') || '—'}
                          </p>
                        </div>
                        <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                      </Link>
                    </li>
                  ))}
                </ul>
                {centerId !== 0 && (
                  <Link
                    to={`/app/centers?centerId=${centerId}`}
                    className="mt-3 inline-block text-xs font-medium text-primary hover:underline"
                  >
                    View center →
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
