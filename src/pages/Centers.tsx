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
import { Building2, Search, ChevronLeft, ChevronRight, ArrowUpDown, Loader2, ListOrdered, Play } from 'lucide-react';
import { formatNumber, formatDate } from '@/lib/utils';
import { toast } from '@/lib/toast';

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Building2 className="h-8 w-8" />
          {t('centers.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('centers.subtitle')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('centers.filterTitle')}</CardTitle>
          <CardDescription>{t('centers.filterDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">{t('common.search')}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder={t('centers.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="searchBy">{t('centers.searchFields')}</Label>
              <Select
                id="searchBy"
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
            <div className="space-y-2">
              <Label htmlFor="sortBy">{t('centers.sortBy')}</Label>
              <Select
                id="sortBy"
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
            <div className="space-y-2">
              <Label htmlFor="limit">{t('common.itemsPerPage')}</Label>
              <Select
                id="limit"
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('centers.listTitle')}</CardTitle>
              <CardDescription>
                {centersData && centersData.meta && centersData.meta.totalItems > 0
                  ? t('centers.listDescription', {
                      from: (page - 1) * limit + 1,
                      to: Math.min(page * limit, centersData.meta.totalItems),
                      total: formatNumber(centersData.meta.totalItems),
                    })
                  : t('centers.emptyTitle')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">{t('centers.loadError')}</p>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : t('centers.fetchError')}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                {t('common.retry')}
              </Button>
            </div>
          ) : !centersData || !centersData.data || centersData.data.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t('centers.emptyTitle')}</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <SortButton field="name">{t('centers.columns.name')}</SortButton>
                      </TableHead>
                      <TableHead>{t('centers.columns.geozone')}</TableHead>
                      <TableHead>{t('centers.columns.manager')}</TableHead>
                      <TableHead>{t('centers.columns.group')}</TableHead>
                      <TableHead>{t('centers.columns.time1')}</TableHead>
                      <TableHead>{t('centers.columns.time2')}</TableHead>
                      <TableHead>{t('centers.columns.breakStart')}</TableHead>
                      <TableHead>{t('centers.columns.breakStop')}</TableHead>
                      <TableHead className="w-[100px]">{t('centers.columns.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {centersData.data.map((center: any) => (
                      <TableRow key={center.id}>
                        <TableCell className="font-medium">{center.name ?? t('common.notAvailable')}</TableCell>
                        <TableCell>{center.geozone ?? t('common.notAvailable')}</TableCell>
                        <TableCell>{center.manager ?? t('common.notAvailable')}</TableCell>
                        <TableCell>{center.groupname ?? t('common.notAvailable')}</TableCell>
                        <TableCell>{center.time1 ?? t('common.notAvailable')}</TableCell>
                        <TableCell>{center.time2 ?? t('common.notAvailable')}</TableCell>
                        <TableCell>{center.breakstart ?? t('common.notAvailable')}</TableCell>
                        <TableCell>{center.breakstop ?? t('common.notAvailable')}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            onClick={() => {
                              setQueueModalCenterId(center.id);
                              setQueueType('LOADING');
                            }}
                          >
                            <ListOrdered className="h-3 w-3" />
                            {t('centers.queueButton')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {centersData.meta && centersData.meta.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    {t('common.pageOf', { page: centersData.meta.currentPage, total: centersData.meta.totalPages })}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
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
                            className="w-10"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(centersData.meta.totalPages, p + 1))}
                      disabled={page === centersData.meta.totalPages}
                    >
                      {t('common.next')}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

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
