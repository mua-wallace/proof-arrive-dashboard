import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardApi, VehicleGroup, Vehicle } from '@/api/dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Car,
  Search,
  Loader2,
  QrCode,
  X,
  ScanLine,
  Hash,
  Tag,
  FileDown,
  CheckSquare,
  Square,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { formatNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function Vehicles() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [qrSheetOpen, setQrSheetOpen] = useState(false);
  const [qrSheetThirdPartyId, setQrSheetThirdPartyId] = useState<number | null>(null);
  const [selectedVehicles, setSelectedVehicles] = useState<Set<number>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: vehicleGroups, isLoading, error } = useQuery<VehicleGroup[]>({
    queryKey: ['vehicle-groups', 'database'],
    queryFn: () => dashboardApi.getVehicleGroups('database'),
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

  const bulkCreateQrMutation = useMutation({
    mutationFn: (vehicleIds: number[]) => dashboardApi.bulkCreateQrCodes(vehicleIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-groups'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setSelectedVehicles(new Set());
    },
  });

  // Filter groups and vehicles based on search
  const filteredGroups = useMemo(() => {
    if (!vehicleGroups) return [];
    if (!debouncedSearch) return vehicleGroups;

    const searchLower = debouncedSearch.toLowerCase();
    return vehicleGroups
      .map((group) => {
        const filteredVehicles = group.vehicles.filter(
          (vehicle) =>
            vehicle.plate?.toLowerCase().includes(searchLower) ||
            vehicle.model?.toLowerCase().includes(searchLower)
        );
        return {
          ...group,
          vehicles: filteredVehicles,
          total: filteredVehicles.length,
        };
      })
      .filter((group) => group.vehicles.length > 0);
  }, [vehicleGroups, debouncedSearch]);

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
    const pageW = 210;
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

  /** Resolve QR code value */
  const getQrCodeValue = (qrCode: string | null | { qrCode?: string } | undefined): string | null => {
    if (qrCode == null) return null;
    if (typeof qrCode === 'string') return qrCode;
    if (typeof qrCode === 'object' && qrCode !== null && 'qrCode' in qrCode) {
      return qrCode.qrCode ?? null;
    }
    return null;
  };

  // Handle vehicle selection
  const toggleVehicleSelection = (vehicleId: number) => {
    setSelectedVehicles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(vehicleId)) {
        newSet.delete(vehicleId);
      } else {
        newSet.add(vehicleId);
      }
      return newSet;
    });
  };

  // Handle select all vehicles in a group
  const toggleGroupSelection = (group: VehicleGroup) => {
    const groupVehicleIds = group.vehicles.map((v) => v.thirdPartyId);
    const allSelected = groupVehicleIds.every((id) => selectedVehicles.has(id));

    setSelectedVehicles((prev) => {
      const newSet = new Set(prev);
      if (allSelected) {
        groupVehicleIds.forEach((id) => newSet.delete(id));
      } else {
        groupVehicleIds.forEach((id) => newSet.add(id));
      }
      return newSet;
    });
  };

  // Check if all vehicles in a group are selected
  const isGroupFullySelected = (group: VehicleGroup): boolean => {
    if (group.vehicles.length === 0) return false;
    return group.vehicles.every((v) => selectedVehicles.has(v.thirdPartyId));
  };

  // Check if some vehicles in a group are selected
  const isGroupPartiallySelected = (group: VehicleGroup): boolean => {
    const selectedCount = group.vehicles.filter((v) => selectedVehicles.has(v.thirdPartyId)).length;
    return selectedCount > 0 && selectedCount < group.vehicles.length;
  };

  // Handle bulk QR code generation
  const handleBulkGenerateQr = () => {
    if (selectedVehicles.size === 0) return;
    const vehicleIds = Array.from(selectedVehicles);
    bulkCreateQrMutation.mutate(vehicleIds);
  };

  // Get total selected count
  const totalSelected = selectedVehicles.size;

  // Get vehicles without QR codes that are selected
  const selectedVehiclesWithoutQr = useMemo(() => {
    if (!vehicleGroups) return [];
    const allVehicles = vehicleGroups.flatMap((g) => g.vehicles);
    return allVehicles.filter(
      (v) => selectedVehicles.has(v.thirdPartyId) && !getQrCodeValue(v.qrCode)
    );
  }, [vehicleGroups, selectedVehicles]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Car className="h-8 w-8" />
            Vehicles
          </h1>
          <p className="text-muted-foreground">
            View and manage vehicles grouped by categories
          </p>
        </div>
        {totalSelected > 0 && (
          <Button
            variant="default"
            size="sm"
            onClick={handleBulkGenerateQr}
            disabled={bulkCreateQrMutation.isPending || selectedVehiclesWithoutQr.length === 0}
            className="gap-2 shadow-sm shrink-0"
          >
            {bulkCreateQrMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <QrCode className="h-4 w-4" />
                Generate QR Codes ({selectedVehiclesWithoutQr.length})
              </>
            )}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search</CardTitle>
          <CardDescription>Find vehicles by plate or model</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="search">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search vehicles by plate or model..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Vehicle Groups</CardTitle>
              <CardDescription>
                {vehicleGroups
                  ? `${vehicleGroups.length} groups, ${vehicleGroups.reduce((sum, g) => sum + g.total, 0)} total vehicles`
                  : 'Loading...'}
                {totalSelected > 0 && (
                  <span className="ml-2 text-primary font-medium">
                    • {totalSelected} selected
                  </span>
                )}
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
          ) : !filteredGroups || filteredGroups.length === 0 ? (
            <div className="text-center py-12">
              <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No vehicles found</p>
            </div>
          ) : (
            <Accordion
              type="multiple"
              value={expandedGroups}
              onValueChange={setExpandedGroups}
              className="space-y-2"
            >
              {filteredGroups.map((group) => {
                const groupId = `group-${group.groupId}`;
                const isFullySelected = isGroupFullySelected(group);
                const isPartiallySelected = isGroupPartiallySelected(group);

                return (
                  <AccordionItem key={group.groupId} value={groupId}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 flex-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleGroupSelection(group);
                          }}
                          className="flex items-center justify-center w-5 h-5"
                        >
                          {isFullySelected ? (
                            <CheckSquare className="h-5 w-5 text-primary" />
                          ) : isPartiallySelected ? (
                            <div className="relative w-5 h-5 border-2 border-primary rounded-sm bg-primary/10">
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-2 h-0.5 bg-primary" />
                              </div>
                            </div>
                          ) : (
                            <Square className="h-5 w-5 text-muted-foreground" />
                          )}
                        </button>
                        <div className="flex-1 text-left">
                          <span className="font-semibold">{group.groupName}</span>
                          <span className="ml-2 text-sm text-muted-foreground">
                            ({group.total} {group.total === 1 ? 'vehicle' : 'vehicles'})
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="relative grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 pt-2 pl-6 md:pl-8">
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-border" />
                        {group.vehicles.map((vehicle) => {
                          const hasQr = !!getQrCodeValue(vehicle.qrCode);
                          const isSelected = selectedVehicles.has(vehicle.thirdPartyId);

                          return (
                            <div
                              key={vehicle.id}
                              className={cn(
                                'flex flex-col gap-2 p-3 rounded-md border transition-colors',
                                isSelected && 'bg-accent border-primary/20',
                                !isSelected && 'hover:bg-muted/50'
                              )}
                            >
                              <div className="flex items-start gap-2">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleVehicleSelection(vehicle.thirdPartyId)}
                                  disabled={hasQr}
                                  className="mt-0.5"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-medium text-sm">
                                        {vehicle.plate ?? 'N/A'}
                                      </span>
                                      <span className="text-muted-foreground text-xs">—</span>
                                      <span className="text-muted-foreground text-sm">
                                        {vehicle.model ?? 'N/A'}
                                      </span>
                                    </div>
                                    {hasQr && (
                                      <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                        <QrCode className="h-3 w-3" />
                                        QR Code Available
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {hasQr && vehicle.thirdPartyId && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openQrSheet(vehicle.thirdPartyId)}
                                  className="gap-2 w-full justify-start text-xs h-8"
                                >
                                  <ScanLine className="h-3 w-3" />
                                  View QR Code
                                </Button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* QR Code detail sheet */}
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
