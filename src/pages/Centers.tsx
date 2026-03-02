import { useState, useEffect } from 'react';
import { useQuery, keepPreviousData, useMutation, useQueryClient } from '@tanstack/react-query';
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

  const { data: queueSummary } = useQuery({
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
      toast.success('Service started', 'Next vehicle in queue is now being served.');
    },
    onError: (err: any) => {
      toast.error('Error', err?.response?.data?.message || err?.message || 'Failed to start next service');
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
          Centers
        </h1>
        <p className="text-muted-foreground">
          View and manage centers (sites) in the system
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>Find centers by name, geozone, manager, or group</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search centers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="searchBy">Search Fields</Label>
              <Select
                id="searchBy"
                value={searchBy}
                onChange={(e) => setSearchBy(e.target.value)}
              >
                <option value="name">Name</option>
                <option value="geozone">Geozone</option>
                <option value="manager">Manager</option>
                <option value="groupname">Group</option>
                <option value="name,geozone,manager">Name, Geozone & Manager</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortBy">Sort By</Label>
              <Select
                id="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="name:ASC">Name A-Z</option>
                <option value="name:DESC">Name Z-A</option>
                <option value="geozone:ASC">Geozone A-Z</option>
                <option value="manager:ASC">Manager A-Z</option>
                <option value="groupname:ASC">Group A-Z</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="limit">Items Per Page</Label>
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
              <CardTitle>Centers List</CardTitle>
              <CardDescription>
                {centersData && centersData.meta && centersData.meta.totalItems > 0
                  ? `Showing ${(page - 1) * limit + 1} to ${Math.min(page * limit, centersData.meta.totalItems)} of ${formatNumber(centersData.meta.totalItems)} centers`
                  : 'No centers found'}
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
              <p className="text-muted-foreground mb-2">Failed to load centers</p>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : 'An error occurred while fetching centers'}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          ) : !centersData || !centersData.data || centersData.data.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No centers found</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <SortButton field="name">Name</SortButton>
                      </TableHead>
                      <TableHead>Geozone</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Time 1</TableHead>
                      <TableHead>Time 2</TableHead>
                      <TableHead>Break Start</TableHead>
                      <TableHead>Break Stop</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {centersData.data.map((center: any) => (
                      <TableRow key={center.id}>
                        <TableCell className="font-medium">{center.name ?? 'N/A'}</TableCell>
                        <TableCell>{center.geozone ?? 'N/A'}</TableCell>
                        <TableCell>{center.manager ?? 'N/A'}</TableCell>
                        <TableCell>{center.groupname ?? 'N/A'}</TableCell>
                        <TableCell>{center.time1 ?? 'N/A'}</TableCell>
                        <TableCell>{center.time2 ?? 'N/A'}</TableCell>
                        <TableCell>{center.breakstart ?? 'N/A'}</TableCell>
                        <TableCell>{center.breakstop ?? 'N/A'}</TableCell>
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
                            Queue
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
                    Page {centersData.meta.currentPage} of {centersData.meta.totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
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

      {/* Center queue modal */}
      <Dialog open={queueModalCenterId != null} onOpenChange={(open) => !open && setQueueModalCenterId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListOrdered className="h-5 w-5" />
              Queue — {centerName}
            </DialogTitle>
            <DialogDescription>
              View queue and start next service for loading or unloading
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 border-b pb-3">
            <Button
              variant={queueType === 'LOADING' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setQueueType('LOADING')}
            >
              Loading
            </Button>
            <Button
              variant={queueType === 'UNLOADING' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setQueueType('UNLOADING')}
            >
              Unloading
            </Button>
          </div>
          {queueSummary && (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg border p-2">
                <span className="text-muted-foreground">Loading (active)</span>
                <p className="font-semibold">{queueSummary.loading?.active ?? queueSummary.loading ?? 0}</p>
              </div>
              <div className="rounded-lg border p-2">
                <span className="text-muted-foreground">Unloading (active)</span>
                <p className="font-semibold">{queueSummary.unloading?.active ?? queueSummary.unloading ?? 0}</p>
              </div>
            </div>
          )}
          <div className="flex-1 min-h-0 overflow-y-auto rounded-md border">
            {queueLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : queueItems.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No active {queueType.toLowerCase()} queue entries
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Position</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Queued at</TableHead>
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
              Start next {queueType.toLowerCase()} service
            </Button>
            <Button variant="outline" onClick={() => setQueueModalCenterId(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
