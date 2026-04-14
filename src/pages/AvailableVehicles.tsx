import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { dashboardApi, type Vehicle, type BulkAssignmentItem } from '@/api/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Car, Building2, CheckCircle2, Loader2, Pencil } from 'lucide-react';
import { toast } from '@/lib/toast';

/** Number of cards per row in the grid (used to align row heights by min count in row). */
const COLS_PER_ROW = 3;

function getCenterFromVehicle(v: Vehicle): { id: number; name: string } | null {
  const center = v.currentCenter ?? (v as { current_center?: { id: number; name?: string } }).current_center;
  const assigned = (v as { assignedCenter?: { id: number; name?: string } }).assignedCenter;
  const c = center ?? assigned;
  if (!c || c.id == null) return null;
  return { id: c.id, name: (c as { name?: string }).name ?? `Center ${c.id}` };
}

export default function AvailableVehicles() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

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
      entries.push({ centerId: 0, centerName: t('availableVehicles.noCenter'), vehicles: noCenter });
    }
    return entries.sort((a, b) =>
      a.centerId === 0 ? 1 : b.centerId === 0 ? -1 : a.centerName.localeCompare(b.centerName)
    );
  }, [vehicles, t]);

  const unassignedGroup = byCenter.find((g) => g.centerId === 0);
  const assignedGroups = byCenter.filter((g) => g.centerId !== 0);

  const [selectedUnassigned, setSelectedUnassigned] = useState<Set<number>>(new Set());
  const [assignCenterId, setAssignCenterId] = useState<number | ''>('');
  const [reassignVehicle, setReassignVehicle] = useState<Vehicle | null>(null);
  const [reassignCenterId, setReassignCenterId] = useState<number | ''>('');
  const [expandedCenterIds, setExpandedCenterIds] = useState<Set<number>>(new Set());
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => dashboardApi.getCurrentUser(),
    staleTime: 5 * 60 * 1000,
  });

  const isAdmin = currentUser?.role === 'admin';

  const { data: centersData } = useQuery({
    queryKey: ['centers', 'for-available-vehicles'],
    queryFn: () => dashboardApi.getCenters({ limit: 1000 }),
    staleTime: 5 * 60 * 1000,
  });

  const centers = Array.isArray(centersData?.data) ? centersData.data : [];

  const bulkAssignMutation = useMutation({
    mutationFn: async (payload: { centerId: number; vehicleIds: number[] }) => {
      const assignments: BulkAssignmentItem[] = payload.vehicleIds.map((vehicleId) => ({
        vehicleId,
        centerId: payload.centerId,
      }));
      return dashboardApi.bulkAssignVehicles(assignments);
    },
    onSuccess: (result) => {
      setSelectedUnassigned(new Set());
      setAssignCenterId('');
      setBulkAssignOpen(false);
      queryClient.invalidateQueries({ queryKey: ['vehicles-by-status', 'available'] });
      const failed = result.results?.filter((r) => !r.success).length ?? 0;
      if (failed > 0) {
        toast.error(
          t('availableVehicles.toast.partialTitle'),
          t('availableVehicles.toast.partialDesc', { updated: result.updatedCount, failed })
        );
      } else {
        toast.success(
          t('availableVehicles.toast.updatedTitle'),
          t('availableVehicles.toast.updatedDesc', { count: result.updatedCount })
        );
      }
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        t('availableVehicles.toast.failedMsg');
      toast.error(t('availableVehicles.toast.failedTitle'), msg);
    },
  });

  const toggleUnassignedSelection = (vehicleId: number) => {
    setSelectedUnassigned((prev) => {
      const next = new Set(prev);
      if (next.has(vehicleId)) next.delete(vehicleId);
      else next.add(vehicleId);
      return next;
    });
  };

  const handleAssignSelected = () => {
    if (assignCenterId === '' || selectedUnassigned.size === 0) return;
    bulkAssignMutation.mutate({
      centerId: assignCenterId,
      vehicleIds: Array.from(selectedUnassigned),
    });
  };

  const reassignMutation = useMutation({
    mutationFn: async (payload: { vehicleId: number; centerId: number }) => {
      const assignments: BulkAssignmentItem[] = [
        { vehicleId: payload.vehicleId, centerId: payload.centerId },
      ];
      return dashboardApi.bulkAssignVehicles(assignments);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles-by-status', 'available'] });
      setReassignVehicle(null);
      setReassignCenterId('');
      const failed = result.results?.filter((r) => !r.success).length ?? 0;
      if (failed > 0) {
        toast.error(
          t('availableVehicles.toast.partialTitle'),
          t('availableVehicles.toast.partialDesc', { updated: result.updatedCount, failed })
        );
      } else {
        toast.success(
          t('availableVehicles.toast.updatedTitle'),
          t('availableVehicles.toast.updatedSingleDesc')
        );
      }
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        t('availableVehicles.toast.updateFailedMsg');
      toast.error(t('availableVehicles.toast.updateFailedTitle'), msg);
    },
  });

  const totalCount = Array.isArray(vehicles) ? vehicles.length : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('availableVehicles.title')}</h1>
          <p className="text-muted-foreground">{t('availableVehicles.loading')}</p>
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
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('availableVehicles.title')}</h1>
              <p className="text-muted-foreground">
                <Trans i18nKey="availableVehicles.subtitle" components={{ strong: <strong /> }} />
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && unassignedGroup && unassignedGroup.vehicles.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setBulkAssignOpen(true)}
              >
                {t('availableVehicles.unassignedButton', { count: unassignedGroup.vehicles.length })}
              </Button>
            )}
            <Badge variant="secondary" className="text-base font-semibold">
              {t('availableVehicles.totalBadge', { count: totalCount })}
            </Badge>
          </div>
        </div>
      </header>

      {error && (
        <Card className="border-status-warning/50 bg-status-warning/5">
          <CardContent className="py-4">
            <p className="text-sm text-foreground">
              {t('availableVehicles.loadErrorPrefix')} {(error as Error)?.message ?? String(error)}
            </p>
          </CardContent>
        </Card>
      )}

      {totalCount === 0 && !error && (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Car className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 font-medium text-foreground">{t('availableVehicles.emptyTitle')}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('availableVehicles.emptyHint')}
            </p>
            <Link to="/app/vehicles" className="mt-4 text-sm font-medium text-primary hover:underline">
              {t('availableVehicles.viewAllLink')}
            </Link>
          </CardContent>
        </Card>
      )}

      {assignedGroups.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {t('availableVehicles.availableByCenter')}
          </h2>
          <div className="grid gap-3 items-start sm:grid-cols-2 lg:grid-cols-3">
            {assignedGroups.map(({ centerId, centerName, vehicles: vs }, index) => {
              const isExpanded = expandedCenterIds.has(centerId);
              const rowIndex = Math.floor(index / COLS_PER_ROW);
              const rowStart = rowIndex * COLS_PER_ROW;
              const row = assignedGroups.slice(rowStart, rowStart + COLS_PER_ROW);
              const maxVisibleInRow = Math.min(...row.map((g) => g.vehicles.length));
              const visible = isExpanded ? vs : vs.slice(0, maxVisibleInRow);
              const hasMore = vs.length > maxVisibleInRow;
              return (
              <Card key={centerId} className="border-border bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between gap-2 text-sm font-semibold text-foreground">
                    <span className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span className="truncate">{centerName}</span>
                    </span>
                    <Badge variant="outline" className="text-[11px] font-medium">
                      {t('availableVehicles.countBadge', { count: vs.length })}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-1">
                  <div className="rounded-md border bg-muted/10">
                    <ul className="divide-y">
                      {visible.map((v) => (
                        <li
                          key={v.id}
                          className="flex items-center justify-between gap-3 px-3 py-1.5 text-sm"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-foreground truncate">{v.plate}</p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {[v.brand, v.model].filter(Boolean).join(' ') || '—'}
                            </p>
                          </div>
                          {isAdmin && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-primary"
                              title={t('availableVehicles.updateAssignment')}
                              onClick={() => {
                                setReassignVehicle(v);
                                const current =
                                  v.currentCenterId ?? getCenterFromVehicle(v)?.id ?? null;
                                const firstOther = centers.find((c: any) => c.id !== current);
                                setReassignCenterId(firstOther?.id ?? '');
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {hasMore && (
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {isExpanded ? (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedCenterIds((prev) => {
                              const next = new Set(prev);
                              next.delete(centerId);
                              return next;
                            })
                          }
                          className="font-medium text-primary hover:underline"
                        >
                          {t('availableVehicles.showLess')}
                        </button>
                      ) : (
                        <>
                          {t('availableVehicles.moreVehicles', { count: vs.length - maxVisibleInRow })}
                          {' · '}
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedCenterIds((prev) => new Set(prev).add(centerId))
                            }
                            className="font-medium text-primary hover:underline"
                          >
                            {t('availableVehicles.seeMore')}
                          </button>
                        </>
                      )}
                    </p>
                  )}
                </CardContent>
              </Card>
            );})}
          </div>
        </section>
      )}

      {/* Bulk assign drawer (right side) */}
      {isAdmin && unassignedGroup && unassignedGroup.vehicles.length > 0 && bulkAssignOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => {
              setBulkAssignOpen(false);
              setAssignCenterId('');
              setSelectedUnassigned(new Set());
            }}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-card border-l border-border shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div>
                <h2 className="text-sm font-semibold text-foreground">{t('availableVehicles.drawer.title')}</h2>
                <p className="text-xs text-muted-foreground">
                  {t('availableVehicles.drawer.description')}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={() => {
                  setBulkAssignOpen(false);
                  setAssignCenterId('');
                  setSelectedUnassigned(new Set());
                }}
              >
                ×
              </Button>
            </div>
            <div className="flex-1 min-h-0 flex flex-col px-5 py-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="drawer-assign-center">{t('availableVehicles.drawer.center')}</Label>
                <Select
                  id="drawer-assign-center"
                  value={assignCenterId === '' ? 'none' : String(assignCenterId)}
                  onChange={(e) =>
                    setAssignCenterId(e.target.value === 'none' ? '' : Number(e.target.value))
                  }
                  className="w-full"
                >
                  <option value="none">{t('common.selectCenter')}</option>
                  {centers.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name ?? `Center ${c.id}`}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t('availableVehicles.drawer.selectedCount', { count: selectedUnassigned.size })}</span>
                {bulkAssignMutation.isPending && (
                  <span className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {t('availableVehicles.drawer.assigning')}
                  </span>
                )}
              </div>
              <div className="flex-1 min-h-0 rounded-md border bg-card">
                <ul className="max-h-full overflow-y-auto divide-y">
                  {unassignedGroup.vehicles.map((v) => {
                    const checked = selectedUnassigned.has(v.id);
                    return (
                      <li
                        key={v.id}
                        className="flex items-center gap-3 px-3 py-1.5 hover:bg-muted/40 text-sm"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-primary"
                          checked={checked}
                          onChange={() => toggleUnassignedSelection(v.id)}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground truncate">{v.plate}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {[v.brand, v.model].filter(Boolean).join(' ') || '—'}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t bg-muted/40">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setBulkAssignOpen(false);
                  setAssignCenterId('');
                  setSelectedUnassigned(new Set());
                }}
              >
                {t('availableVehicles.drawer.cancel')}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleAssignSelected}
                disabled={
                  assignCenterId === '' ||
                  selectedUnassigned.size === 0 ||
                  bulkAssignMutation.isPending
                }
                className="gap-2"
              >
                {bulkAssignMutation.isPending && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {t('availableVehicles.drawer.assign')}
              </Button>
            </div>
          </div>
        </>
      )}
      <Dialog
        open={reassignVehicle != null}
        onOpenChange={(open) => {
          if (!open) {
            setReassignVehicle(null);
            setReassignCenterId('');
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('availableVehicles.reassignDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('availableVehicles.reassignDialog.description')}
            </DialogDescription>
          </DialogHeader>
          {reassignVehicle && (
            <>
              <div className="space-y-2 mb-4">
                <p className="text-sm font-medium text-foreground">
                  {reassignVehicle.plate}{' '}
                  <span className="text-xs text-muted-foreground">
                    {[reassignVehicle.brand, reassignVehicle.model].filter(Boolean).join(' ') || '—'}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('availableVehicles.reassignDialog.currentCenter')}{' '}
                  <span className="font-medium">
                    {getCenterFromVehicle(reassignVehicle)?.name ?? '—'}
                  </span>
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reassign-center">{t('availableVehicles.reassignDialog.newCenter')}</Label>
                <Select
                  id="reassign-center"
                  value={reassignCenterId === '' ? 'none' : String(reassignCenterId)}
                  onChange={(e) =>
                    setReassignCenterId(
                      e.target.value === 'none' ? '' : Number(e.target.value),
                    )
                  }
                >
                  <option value="none">{t('common.selectCenter')}</option>
                  {centers
                    .filter((c: any) => {
                      const current =
                        reassignVehicle.currentCenterId ?? getCenterFromVehicle(reassignVehicle)?.id;
                      return c.id !== current;
                    })
                    .map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name ?? `Center ${c.id}`}
                      </option>
                    ))}
                </Select>
              </div>
            </>
          )}
          <DialogFooter className="mt-4 flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setReassignVehicle(null);
                setReassignCenterId('');
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="button"
              disabled={!reassignVehicle || reassignCenterId === '' || reassignMutation.isPending}
              onClick={() => {
                if (!reassignVehicle || reassignCenterId === '') return;
                reassignMutation.mutate({
                  vehicleId: reassignVehicle.id,
                  centerId: reassignCenterId as number,
                });
              }}
              className="gap-2"
            >
              {reassignMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('availableVehicles.reassignDialog.update')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
