import { useState, useEffect } from 'react';
import { useQuery, keepPreviousData, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  dashboardApi,
  PaginateQuery,
  PaginateResult,
  type CenterQueueItem,
  type CenterQueueSummary,
} from '@/api/dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Building2, Search, ChevronLeft, ChevronRight, ArrowUpDown, Loader2, ListOrdered, Play, Plus } from 'lucide-react';
import { formatNumber, formatDate } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { CreateCenterDialog } from '@/components/centers/CreateCenterDialog';

export default function Centers() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [searchBy, setSearchBy] = useState('name');
  const [sortBy, setSortBy] = useState('name:ASC');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [queueModalCenterId, setQueueModalCenterId] = useState<number | null>(null);
  const [queueType, setQueueType] = useState<'LOADING' | 'UNLOADING'>('LOADING');
  const [createOpen, setCreateOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const query: PaginateQuery = {
    page,
    limit,
    search: debouncedSearch || undefined,
    searchBy: searchBy || undefined,
    sortBy: sortBy || undefined,
  };

  const { data, isLoading, error } = useQuery<PaginateResult<any>>({
    queryKey: ['centers', query],
    queryFn: () => dashboardApi.getCenters(query),
    placeholderData: keepPreviousData,
  });

  const centersData = data as PaginateResult<any> | undefined;

  const { data: queueData, isLoading: queueLoading } = useQuery({
    queryKey: ['center-queue', queueModalCenterId, queueType],
    queryFn: () =>
      dashboardApi.getCenterQueue(queueModalCenterId!, { type: queueType, isActive: true }),
    enabled: queueModalCenterId != null,
  });

  const { data: queueSummary } = useQuery<CenterQueueSummary>({
    queryKey: ['center-queue-summary', queueModalCenterId],
    queryFn: () => dashboardApi.getCenterQueueSummary(queueModalCenterId!),
    enabled: queueModalCenterId != null,
  });

  const startNextMutation = useMutation({
    mutationFn: () =>
      dashboardApi.startNextService(queueModalCenterId!, { queueType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['center-queue', queueModalCenterId, queueType] });
      queryClient.invalidateQueries({ queryKey: ['center-queue-summary', queueModalCenterId] });
      toast.success(t('centers.toast.serviceStarted'), t('centers.toast.serviceStartedDesc'));
    },
    onError: (err: any) => {
      toast.error(t('centers.toast.error'), err?.response?.data?.message || err?.message || t('centers.toast.startFailed'));
    },
  });

  const queueItems: CenterQueueItem[] = queueData?.data ?? [];
  const centerName = queueModalCenterId
    ? centersData?.data?.find((c: any) => c.id === queueModalCenterId)?.name ?? `Center ${queueModalCenterId}`
    : '';

  const handleSort = (field: string) => {
    const [currentField, currentDirection] = sortBy.split(':');
    const newDirection = currentField === field && currentDirection === 'ASC' ? 'DESC' : 'ASC';
    setSortBy(`${field}:${newDirection}`);
  };

  const SortButton = ({ field, children }: { field: string; children: React.ReactNode }) => {
    const [currentField] = sortBy.split(':');
    const isActive = currentField === field;
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-8 gap-1"
        onClick={() => handleSort(field)}
      >
        {children}
        <ArrowUpDown className={`h-3 w-3 ${isActive ? 'text-primary' : ''}`} />
      </Button>
    );
  };

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card/60 px-4 py-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
          <Building2 className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 leading-tight">
          <h1 className="text-base font-bold tracking-tight">{t('centers.title')}</h1>
          <p className="text-[11px] text-muted-foreground">{t('centers.subtitle')}</p>
        </div>
        <Button
          size="sm"
          onClick={() => setCreateOpen(true)}
          className="ml-auto h-8 gap-1 text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('centers.create.button')}
        </Button>
      </div>

      <Card className="rounded-xl">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm font-semibold">{t('centers.filterTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="grid gap-2 md:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="search" className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {t('common.search')}
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder={t('centers.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="searchBy" className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {t('centers.searchFields')}
              </Label>
              <Select
                id="searchBy"
                className="h-8 text-xs"
                value={searchBy}
                onChange={(e) => setSearchBy(e.target.value)}
              >
                <option value="name">{t('centers.searchBy.name')}</option>
                <option value="geozone">{t('centers.searchBy.geozone')}</option>
                <option value="manager">{t('centers.searchBy.manager')}</option>
                <option value="groupname">{t('centers.searchBy.group')}</option>
                <option value="name,geozone,manager">{t('centers.searchBy.combined')}</option>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="sortBy" className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {t('centers.sortBy')}
              </Label>
              <Select
                id="sortBy"
                className="h-8 text-xs"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name:ASC">{t('centers.sort.nameAsc')}</option>
                <option value="name:DESC">{t('centers.sort.nameDesc')}</option>
                <option value="geozone:ASC">{t('centers.sort.geozoneAsc')}</option>
                <option value="manager:ASC">{t('centers.sort.managerAsc')}</option>
                <option value="groupname:ASC">{t('centers.sort.groupAsc')}</option>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="limit" className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {t('common.itemsPerPage')}
              </Label>
              <Select
                id="limit"
                className="h-8 text-xs"
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm font-semibold">{t('centers.listTitle')}</CardTitle>
          <CardDescription className="text-[11px]">
            {centersData && centersData.meta && centersData.meta.totalItems > 0
              ? t('centers.listDescription', {
                  from: (page - 1) * limit + 1,
                  to: Math.min(page * limit, centersData.meta.totalItems),
                  total: formatNumber(centersData.meta.totalItems),
                })
              : t('centers.emptyTitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <Building2 className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
              <p className="mb-1 text-xs text-muted-foreground">{t('centers.loadError')}</p>
              <p className="text-[11px] text-muted-foreground">
                {error instanceof Error ? error.message : t('centers.fetchError')}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 h-7 text-xs"
                onClick={() => window.location.reload()}
              >
                {t('common.retry')}
              </Button>
            </div>
          ) : !centersData || !centersData.data || centersData.data.length === 0 ? (
            <div className="py-8 text-center">
              <Building2 className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{t('centers.emptyTitle')}</p>
            </div>
          ) : (
            <>
              <div className="min-h-0 flex-1 overflow-auto border-t">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="h-8 py-1 text-[10px]">
                        <SortButton field="name">{t('centers.columns.name')}</SortButton>
                      </TableHead>
                      <TableHead className="h-8 py-1 text-[10px]">{t('centers.columns.geozone')}</TableHead>
                      <TableHead className="h-8 py-1 text-[10px]">{t('centers.columns.manager')}</TableHead>
                      <TableHead className="h-8 py-1 text-[10px]">{t('centers.columns.group')}</TableHead>
                      <TableHead className="h-8 py-1 text-[10px]">{t('centers.columns.time1')}</TableHead>
                      <TableHead className="h-8 py-1 text-[10px]">{t('centers.columns.time2')}</TableHead>
                      <TableHead className="h-8 py-1 text-[10px]">{t('centers.columns.breakStart')}</TableHead>
                      <TableHead className="h-8 py-1 text-[10px]">{t('centers.columns.breakStop')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {centersData.data.map((center: any) => (
                      <TableRow key={center.id}>
                        <TableCell className="py-1.5 text-xs font-medium">{center.name ?? t('common.notAvailable')}</TableCell>
                        <TableCell className="py-1.5 text-xs">{center.geozone ?? t('common.notAvailable')}</TableCell>
                        <TableCell className="py-1.5 text-xs">{center.manager ?? t('common.notAvailable')}</TableCell>
                        <TableCell className="py-1.5 text-xs">{center.groupname ?? t('common.notAvailable')}</TableCell>
                        <TableCell className="py-1.5 text-[11px] text-muted-foreground">{center.time1 ?? t('common.notAvailable')}</TableCell>
                        <TableCell className="py-1.5 text-[11px] text-muted-foreground">{center.time2 ?? t('common.notAvailable')}</TableCell>
                        <TableCell className="py-1.5 text-[11px] text-muted-foreground">{center.breakstart ?? t('common.notAvailable')}</TableCell>
                        <TableCell className="py-1.5 text-[11px] text-muted-foreground">{center.breakstop ?? t('common.notAvailable')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {centersData.meta && centersData.meta.totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-3 py-2">
                  <div className="text-[11px] text-muted-foreground">
                    {t('common.pageOf', { page: centersData.meta.currentPage, total: centersData.meta.totalPages })}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-3 w-3" />
                      {t('common.previous')}
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, centersData.meta.totalPages) }, (_, i) => {
                        let pageNum;
                        if (centersData.meta.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= centersData.meta.totalPages - 2) {
                          pageNum = centersData.meta.totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                            className="h-7 w-7 p-0 text-xs"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setPage((p) => Math.min(centersData.meta.totalPages, p + 1))}
                      disabled={page === centersData.meta.totalPages}
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

      <CreateCenterDialog open={createOpen} onOpenChange={setCreateOpen} />

      {/* Center queue modal */}
      <Dialog open={queueModalCenterId != null} onOpenChange={(open) => !open && setQueueModalCenterId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListOrdered className="h-5 w-5" />
              {t('centers.queueDialog.title', { center: centerName })}
            </DialogTitle>
            <DialogDescription>
              {t('centers.queueDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 border-b pb-3">
            <Button
              variant={queueType === 'LOADING' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setQueueType('LOADING')}
            >
              {t('centers.queueDialog.loading')}
            </Button>
            <Button
              variant={queueType === 'UNLOADING' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setQueueType('UNLOADING')}
            >
              {t('centers.queueDialog.unloading')}
            </Button>
          </div>
          {queueSummary && (() => {
            const loadingActive =
              typeof queueSummary.loading === 'number'
                ? queueSummary.loading
                : (queueSummary.loading?.active ?? queueSummary.loading?.total ?? 0);
            const unloadingActive =
              typeof queueSummary.unloading === 'number'
                ? queueSummary.unloading
                : (queueSummary.unloading?.active ?? queueSummary.unloading?.total ?? 0);
            return (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg border p-2">
                  <span className="text-muted-foreground">{t('centers.queueDialog.loadingActive')}</span>
                  <p className="font-semibold">{loadingActive}</p>
                </div>
                <div className="rounded-lg border p-2">
                  <span className="text-muted-foreground">{t('centers.queueDialog.unloadingActive')}</span>
                  <p className="font-semibold">{unloadingActive}</p>
                </div>
              </div>
            );
          })()}
          <div className="flex-1 min-h-0 overflow-y-auto rounded-md border">
            {queueLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : queueItems.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                {queueType === 'LOADING' ? t('centers.queueDialog.emptyLoading') : t('centers.queueDialog.emptyUnloading')}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('centers.queueDialog.position')}</TableHead>
                    <TableHead>{t('centers.queueDialog.vehicle')}</TableHead>
                    <TableHead>{t('centers.queueDialog.queuedAt')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queueItems.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.position ?? index + 1}</TableCell>
                      <TableCell>
                        {(item.vehicle as any)?.plate ?? `Vehicle #${item.vehicleId}`}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(item.queuedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="default"
              onClick={() => startNextMutation.mutate()}
              disabled={startNextMutation.isPending || queueLoading}
              className="gap-2"
            >
              {startNextMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {queueType === 'LOADING' ? t('centers.queueDialog.startNextLoading') : t('centers.queueDialog.startNextUnloading')}
            </Button>
            <Button variant="outline" onClick={() => setQueueModalCenterId(null)}>
              {t('common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
