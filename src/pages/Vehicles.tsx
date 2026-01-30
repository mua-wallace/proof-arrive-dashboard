import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { dashboardApi, PaginateQuery, PaginateResult } from '@/api/dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Car,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Loader2,
  QrCode,
  X,
  ScanLine,
  Hash,
  Tag,
  FileDown,
  Plus,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { formatNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function Vehicles() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [searchBy, setSearchBy] = useState('plate,model,brand');
  const [sortBy, setSortBy] = useState('createdAt:DESC');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [qrSheetOpen, setQrSheetOpen] = useState(false);
  const [qrSheetThirdPartyId, setQrSheetThirdPartyId] = useState<number | null>(null);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [selectedThirdPartyIdForGenerate, setSelectedThirdPartyIdForGenerate] = useState<string>('');
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
    include: 'qrCodes',
    search: debouncedSearch || undefined,
    searchBy: searchBy || undefined,
    sortBy: sortBy || undefined,
  };

  const { data, isLoading, error } = useQuery<PaginateResult<any>>({
    queryKey: ['vehicles', query],
    queryFn: () => dashboardApi.getVehicles(query),
    placeholderData: keepPreviousData,
  });

  const {
    data: qrDetail,
    isLoading: qrDetailLoading,
    error: qrDetailError,
  } = useQuery({
    queryKey: ['vehicle-qr', qrSheetThirdPartyId],
    queryFn: () => dashboardApi.getVehicleQrCode(qrSheetThirdPartyId!),
    enabled: qrSheetOpen && qrSheetThirdPartyId != null,
  });

  const { data: vehiclesForDropdown } = useQuery<PaginateResult<any>>({
    queryKey: ['vehicles', 'dropdown', { page: 1, limit: 200, include: 'qrCodes' }],
    queryFn: () =>
      dashboardApi.getVehicles({ page: 1, limit: 200, include: 'qrCodes' }),
    enabled: generateModalOpen,
  });

  const generateQrMutation = useMutation({
    mutationFn: (thirdPartyId: number) => dashboardApi.generateVehicleQrCode(thirdPartyId),
    onSuccess: (_, thirdPartyId) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setGenerateModalOpen(false);
      setSelectedThirdPartyIdForGenerate('');
      openQrSheet(thirdPartyId);
    },
  });

  const vehiclesData = data as PaginateResult<any> | undefined;

  const openQrSheet = (thirdPartyId: number) => {
    setQrSheetThirdPartyId(thirdPartyId);
    setQrSheetOpen(true);
  };

  const closeQrSheet = () => {
    setQrSheetOpen(false);
    setQrSheetThirdPartyId(null);
  };

  const downloadQrPdf = () => {
    if (!qrDetail) return;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = 210; // A4 width in mm
    const margin = 20;
    let y = 20;

    doc.setFontSize(18);
    doc.text('Vehicle QR Code', margin, y);
    y += 12;

    const v = qrDetail.vehicle;
    const plate = v?.plate ?? '—';
    const qrSize = 50;
    const qrX = (pageW - qrSize) / 2;

    if (qrDetail.qrCodeDataUrl) {
      doc.addImage(qrDetail.qrCodeDataUrl, 'PNG', qrX, y, qrSize, qrSize);
      y += qrSize + 8;
    }
    doc.setFontSize(14);
    doc.text(plate, pageW / 2, y, { align: 'center' });
    y += 14;

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('Vehicle details', margin, y);
    y += 8;
    doc.setTextColor(0, 0, 0);

    const details = [
      ['Plate', plate],
      ['Model', v?.model ?? '—'],
      ['Brand', v?.brand ?? '—'],
      ['Year', String(v?.year ?? '—')],
      ['Tag', v?.tag2 ?? '—'],
    ];
    details.forEach(([label, value]) => {
      doc.setFont('helvetica', 'normal');
      doc.text(`${label}:`, margin, y);
      doc.setFont('helvetica', 'bold');
      doc.text(String(value), margin + 35, y);
      y += 7;
    });

    const filename = `qr-code-${plate.replace(/\s+/g, '-')}.pdf`;
    doc.save(filename);
  };

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

  /** Resolve QR code value: API may return null, a string, or an object { qrCode: string } */
  const getQrCodeValue = (qrCode: string | null | { qrCode?: string } | undefined): string | null => {
    if (qrCode == null) return null;
    if (typeof qrCode === 'string') return qrCode;
    if (typeof qrCode === 'object' && qrCode !== null && 'qrCode' in qrCode) {
      return qrCode.qrCode ?? null;
    }
    return null;
  };

  const renderQrCode = (qrCodeValue: string | null, vehicle: any) => {
    const thirdPartyId = vehicle?.thirdPartyId;
    const hasQr = !!qrCodeValue && thirdPartyId != null;
    const content = !qrCodeValue ? (
      <span className="text-muted-foreground">Not Generated</span>
    ) : qrCodeValue.startsWith('data:image') ? (
      <div className="flex items-center gap-2">
        <img src={qrCodeValue} alt="QR Code" className="h-8 w-8" />
        <QrCode className="h-4 w-4 text-muted-foreground" />
      </div>
    ) : (
      <div className="flex items-center gap-2">
        <QrCode className="h-4 w-4 text-primary" />
        <span className="text-xs font-mono max-w-[100px] truncate">{qrCodeValue}</span>
      </div>
    );
    if (hasQr) {
      return (
        <button
          type="button"
          onClick={() => openQrSheet(thirdPartyId)}
          className={cn(
            'flex items-center gap-2 rounded-md px-2 py-1 -mx-2 -my-1',
            'hover:bg-accent/80 transition-colors cursor-pointer text-left w-full',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1'
          )}
          title="View QR code details"
        >
          {content}
        </button>
      );
    }
    return content;
  };

  const handleGenerateQrSubmit = () => {
    const id = selectedThirdPartyIdForGenerate ? Number(selectedThirdPartyIdForGenerate) : null;
    if (id == null || Number.isNaN(id)) return;
    generateQrMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Car className="h-8 w-8" />
            Vehicles
          </h1>
          <p className="text-muted-foreground">
            View and manage vehicles in the system
          </p>
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={() => setGenerateModalOpen(true)}
          className="gap-2 shadow-sm shrink-0"
        >
          <Plus className="h-4 w-4" />
          Generate QR Code
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>Find vehicles by plate, model, brand, or other fields</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search vehicles..."
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
                <option value="plate,model,brand">Plate, Model & Brand</option>
                <option value="plate">Plate Only</option>
                <option value="model">Model Only</option>
                <option value="brand">Brand Only</option>
                <option value="tag2">Tag</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortBy">Sort By</Label>
              <Select
                id="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="createdAt:DESC">Newest First</option>
                <option value="createdAt:ASC">Oldest First</option>
                <option value="plate:ASC">Plate A-Z</option>
                <option value="plate:DESC">Plate Z-A</option>
                <option value="model:ASC">Model A-Z</option>
                <option value="brand:ASC">Brand A-Z</option>
                <option value="year:DESC">Year (Newest)</option>
                <option value="year:ASC">Year (Oldest)</option>
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
              <CardTitle>Vehicles List</CardTitle>
              <CardDescription>
                {vehiclesData && vehiclesData.meta && vehiclesData.meta.totalItems > 0
                  ? `Showing ${(page - 1) * limit + 1} to ${Math.min(page * limit, vehiclesData.meta.totalItems)} of ${formatNumber(vehiclesData.meta.totalItems)} vehicles`
                  : 'No vehicles found'}
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
              <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">Failed to load vehicles</p>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : 'An error occurred while fetching vehicles'}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          ) : !vehiclesData || !vehiclesData.data || vehiclesData.data.length === 0 ? (
            <div className="text-center py-12">
              <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No vehicles found</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <SortButton field="plate">Plate</SortButton>
                      </TableHead>
                      <TableHead>
                        <SortButton field="model">Model</SortButton>
                      </TableHead>
                      <TableHead>
                        <SortButton field="brand">Brand</SortButton>
                      </TableHead>
                      <TableHead>
                        <SortButton field="year">Year</SortButton>
                      </TableHead>
                      <TableHead>Tag</TableHead>
                      <TableHead>QR-Code</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehiclesData.data.map((vehicle: any) => (
                      <TableRow key={vehicle.id}>
                        <TableCell className="font-medium">{vehicle.plate ?? 'N/A'}</TableCell>
                        <TableCell>{vehicle.model ?? 'N/A'}</TableCell>
                        <TableCell>{vehicle.brand ?? 'N/A'}</TableCell>
                        <TableCell>{vehicle.year ?? 'N/A'}</TableCell>
                        <TableCell>{vehicle.tag2 ?? 'N/A'}</TableCell>
                        <TableCell>{renderQrCode(getQrCodeValue(vehicle.qrCode), vehicle)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {vehiclesData.meta && vehiclesData.meta.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Page {vehiclesData.meta.currentPage} of {vehiclesData.meta.totalPages}
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
                      {Array.from({ length: Math.min(5, vehiclesData.meta.totalPages) }, (_, i) => {
                        let pageNum;
                        if (vehiclesData.meta.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= vehiclesData.meta.totalPages - 2) {
                          pageNum = vehiclesData.meta.totalPages - 4 + i;
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
                      onClick={() => setPage((p) => Math.min(vehiclesData.meta.totalPages, p + 1))}
                      disabled={page === vehiclesData.meta.totalPages}
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

      {/* Generate QR Code modal */}
      {generateModalOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            aria-hidden
            onClick={() => !generateQrMutation.isPending && setGenerateModalOpen(false)}
          />
          <div
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-card p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="generate-qr-title"
          >
            <h2 id="generate-qr-title" className="text-lg font-semibold mb-4 flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              Generate QR Code
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Select a vehicle without a QR code to generate one.
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="generate-vehicle-select">Vehicle</Label>
                <Select
                  id="generate-vehicle-select"
                  value={selectedThirdPartyIdForGenerate}
                  onChange={(e) => setSelectedThirdPartyIdForGenerate(e.target.value)}
                  disabled={generateQrMutation.isPending}
                >
                  <option value="">Select a vehicle…</option>
                  {(vehiclesForDropdown?.data ?? [])
                    .filter((v: any) => !getQrCodeValue(v.qrCode))
                    .map((v: any) => (
                      <option key={v.id} value={v.thirdPartyId ?? v.id}>
                        {v.plate ?? 'N/A'}
                        {v.model ? ` — ${v.model}` : ''}
                        {v.brand ? ` (${v.brand})` : ''}
                      </option>
                    ))}
                </Select>
                {(vehiclesForDropdown?.data ?? []).filter((v: any) => !getQrCodeValue(v.qrCode)).length === 0 &&
                  vehiclesForDropdown?.data != null && (
                    <p className="text-xs text-muted-foreground">
                      All vehicles already have a QR code.
                    </p>
                  )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setGenerateModalOpen(false)}
                  disabled={generateQrMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  onClick={handleGenerateQrSubmit}
                  disabled={!selectedThirdPartyIdForGenerate || generateQrMutation.isPending}
                  className="gap-2"
                >
                  {generateQrMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* QR Code detail sheet (slide-in from right) */}
      {qrSheetOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
            aria-hidden
            onClick={closeQrSheet}
          />
          <div
            className={cn(
              'fixed top-0 right-0 z-50 h-full w-full max-w-md',
              'bg-card border-l shadow-xl',
              'flex flex-col',
              'animate-sheet-in-right'
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="qr-sheet-title"
          >
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 id="qr-sheet-title" className="text-lg font-semibold flex items-center gap-2">
                <ScanLine className="h-5 w-5 text-primary" />
                QR Code Details
              </h2>
              <div className="flex items-center gap-1">
                {qrDetail && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={downloadQrPdf}
                    className="gap-2 shadow-sm"
                    aria-label="Download PDF"
                  >
                    <FileDown className="h-4 w-4" />
                    Download PDF
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={closeQrSheet} aria-label="Close">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {qrDetailLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">Loading QR code…</p>
                </div>
              ) : qrDetailError ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-2">Could not load QR code details.</p>
                  <Button variant="outline" size="sm" onClick={closeQrSheet}>
                    Close
                  </Button>
                </div>
              ) : qrDetail ? (
                <div className="space-y-6">
                  <div className="rounded-xl border-2 border-border bg-muted/20 p-5 flex flex-col items-center gap-4 ring-1 ring-black/5">
                    <div className="rounded-lg border-2 border-border bg-white p-4 shadow-sm">
                      {qrDetail.qrCodeDataUrl ? (
                        <img
                          src={qrDetail.qrCodeDataUrl}
                          alt="Vehicle QR Code"
                          className="h-48 w-48 object-contain"
                        />
                      ) : (
                        <div className="h-48 w-48 flex items-center justify-center bg-muted/50 rounded">
                          <QrCode className="h-16 w-16 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-medium text-center">
                      {qrDetail.vehicle?.plate ?? '—'}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      Vehicle details
                    </h3>
                    <dl className="grid gap-2 text-sm">
                      <div className="flex justify-between gap-4 py-2 border-b">
                        <dt className="text-muted-foreground flex items-center gap-2">
                          <Hash className="h-3.5 w-3.5" />
                          Plate
                        </dt>
                        <dd className="font-medium">{qrDetail.vehicle?.plate ?? '—'}</dd>
                      </div>
                      <div className="flex justify-between gap-4 py-2 border-b">
                        <dt className="text-muted-foreground flex items-center gap-2">
                          <Tag className="h-3.5 w-3.5" />
                          Model
                        </dt>
                        <dd className="font-medium">{qrDetail.vehicle?.model ?? '—'}</dd>
                      </div>
                      <div className="flex justify-between gap-4 py-2 border-b">
                        <dt className="text-muted-foreground flex items-center gap-2">Brand</dt>
                        <dd className="font-medium">{qrDetail.vehicle?.brand ?? '—'}</dd>
                      </div>
                      <div className="flex justify-between gap-4 py-2 border-b">
                        <dt className="text-muted-foreground flex items-center gap-2">Year</dt>
                        <dd className="font-medium">{qrDetail.vehicle?.year ?? '—'}</dd>
                      </div>
                      <div className="flex justify-between gap-4 py-2">
                        <dt className="text-muted-foreground flex items-center gap-2">Tag</dt>
                        <dd className="font-medium">{qrDetail.vehicle?.tag2 ?? '—'}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
