import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardApi, VehicleGroup, Vehicle } from '@/api/dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
  Eye,
  Download,
  RotateCw,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { QrCodeResponse, CurrentUser } from '@/api/dashboard';

export default function Vehicles() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [qrSheetOpen, setQrSheetOpen] = useState(false);
  const [qrSheetThirdPartyId, setQrSheetThirdPartyId] = useState<number | null>(null);
  const [selectedVehicles, setSelectedVehicles] = useState<Set<number>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewVehicleIds, setPreviewVehicleIds] = useState<number[]>([]);
  const [downloadPerPage, setDownloadPerPage] = useState<1 | 2 | 3 | 4>(4);
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: vehicleGroups, isLoading, error } = useQuery<VehicleGroup[]>({
    queryKey: ['vehicle-groups', 'database', 'qrCodes'],
    queryFn: () => dashboardApi.getVehicleGroups('database', 'qrCodes'),
  });

  // Handle vehicle groups error
  useEffect(() => {
    if (error) {
      const message = (error as any)?.response?.data?.message || (error as Error)?.message || 'Failed to load vehicle groups';
      toast.error('Error Loading Vehicles', message);
    }
  }, [error]);

  const {
    data: qrDetail,
    isLoading: qrDetailLoading,
    error: qrDetailError,
  } = useQuery<QrCodeResponse>({
    queryKey: ['vehicle-qr', qrSheetThirdPartyId],
    queryFn: () => dashboardApi.getVehicleQrCode(qrSheetThirdPartyId!),
    enabled: qrSheetOpen && qrSheetThirdPartyId != null,
  });

  // Get current user to check role
  const { data: currentUser } = useQuery<CurrentUser>({
    queryKey: ['current-user'],
    queryFn: () => dashboardApi.getCurrentUser(),
  });

  // Check if user is admin or manager
  const canRegenerateQr = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  // Regenerate QR code mutation
  const regenerateQrMutation = useMutation({
    mutationFn: (thirdPartyId: number) => dashboardApi.regenerateVehicleQrCode(thirdPartyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-qr', qrSheetThirdPartyId] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-groups'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Success', 'QR code regenerated successfully');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message 
        || error?.response?.data?.error 
        || error?.message 
        || 'Failed to regenerate QR code';
      toast.error('Error Regenerating QR Code', errorMessage);
    },
  });

  // Handle QR detail error
  useEffect(() => {
    if (qrDetailError) {
      const message = (qrDetailError as any)?.response?.data?.message || (qrDetailError as Error)?.message || 'Failed to load QR code details';
      toast.error('Error Loading QR Code', message);
    }
  }, [qrDetailError]);

  const bulkCreateQrMutation = useMutation({
    mutationFn: (vehicleIds: number[]) => {
      // Ensure vehicleIds is an array of numbers (thirdPartyIds)
      return dashboardApi.bulkCreateQrCodes(vehicleIds);
    },
    onSuccess: (data, vehicleIds) => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-groups'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      setSelectedVehicles(new Set());
      
      // Handle response - API may return different formats
      const successCount = data?.created ?? vehicleIds.length;
      const failedCount = data?.failed ?? 0;
      
      if (failedCount > 0) {
        const errorDetails = data?.errors 
          ? ` Errors: ${data.errors.map(e => `Vehicle ${e.vehicleId}: ${e.error}`).join('; ')}`
          : '';
        toast.error(
          'Partial Success',
          `QR codes created for ${successCount} vehicle${successCount !== 1 ? 's' : ''}. ${failedCount} failed.${errorDetails}`
        );
      } else {
        toast.success(
          'Success',
          `QR codes created successfully for ${successCount} vehicle${successCount !== 1 ? 's' : ''}.`
        );
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message 
        || error?.response?.data?.error 
        || error?.message 
        || 'Failed to create QR codes';
      toast.error('Error Creating QR Codes', errorMessage);
    },
  });

  // Filter groups and vehicles based on search
  const filteredGroups = useMemo(() => {
    if (!vehicleGroups) return [];
    if (!debouncedSearch) return vehicleGroups;

    const searchLower = debouncedSearch.toLowerCase();
    return vehicleGroups
      .map((group: VehicleGroup) => {
        const filteredVehicles = group.vehicles.filter(
          (vehicle: Vehicle) =>
            vehicle.plate?.toLowerCase().includes(searchLower) ||
            vehicle.model?.toLowerCase().includes(searchLower)
        );
        return {
          ...group,
          vehicles: filteredVehicles,
          total: filteredVehicles.length,
        };
      })
      .filter((group: VehicleGroup) => group.vehicles.length > 0);
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

  /** Get QR code data URL if available */
  const getQrCodeDataUrl = (vehicle: Vehicle): string | null => {
    // First check if vehicle has qrCodeDataUrl directly (from API with include=qrCodes)
    if (vehicle.qrCodeDataUrl) {
      return vehicle.qrCodeDataUrl;
    }
    
    const qrValue = getQrCodeValue(vehicle.qrCode);
    if (!qrValue) return null;
    
    // Check if it's a data URL (image)
    if (qrValue.startsWith('data:image')) {
      return qrValue;
    }
    
    // Check if qrCode object has qrCodeDataUrl
    if (vehicle.qrCode && typeof vehicle.qrCode === 'object' && 'qrCodeDataUrl' in vehicle.qrCode) {
      return (vehicle.qrCode as any).qrCodeDataUrl || null;
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
    const allVehicles = vehicleGroups.flatMap((g: VehicleGroup) => g.vehicles);
    return allVehicles.filter((v: Vehicle) => {
      if (!selectedVehicles.has(v.thirdPartyId)) return false;
      // Check if vehicle doesn't have QR code (no qrCodeDataUrl, qrCodeString, or qrCode value)
      return !(v.qrCodeDataUrl || v.qrCodeString || getQrCodeValue(v.qrCode));
    });
  }, [vehicleGroups, selectedVehicles]);

  // Get vehicles with QR codes that are selected
  const selectedVehiclesWithQr = useMemo(() => {
    if (!vehicleGroups) return [];
    const allVehicles = vehicleGroups.flatMap((g: VehicleGroup) => g.vehicles);
    return allVehicles.filter((v: Vehicle) => {
      if (!selectedVehicles.has(v.thirdPartyId)) return false;
      // Check if vehicle has QR code (either qrCodeDataUrl, qrCodeString, or qrCode value)
      return !!(v.qrCodeDataUrl || v.qrCodeString || getQrCodeValue(v.qrCode));
    });
  }, [vehicleGroups, selectedVehicles]);

  // Handle bulk download QR codes as PDF (A4). QR size proportionate to available layout; 1 per page = 9/10 of A4, centered.
  const handleBulkDownloadQr = async () => {
    if (selectedVehiclesWithQr.length === 0) return;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = 210;  // A4
    const pageH = 297;  // A4
    const margin = 12;
    const perPage = downloadPerPage;
    const cols = perPage === 1 ? 1 : perPage === 4 ? 2 : 1;
    const rows = perPage === 1 ? 1 : perPage === 2 ? 2 : perPage === 3 ? 3 : 2;
    // Content area = 9/10 of page height, full width minus margins
    const contentW = pageW - 2 * margin;
    const contentH = pageH * 0.9;
    const cellW = contentW / cols;
    const cellH = contentH / rows;

    // QR size proportionate to layout: 1 per page = 9/10 of A4 (min dimension), else 9/10 of cell
    const qrSize =
      perPage === 1
        ? Math.min(pageW, pageH) * 0.9   // 9/10 of A4
        : Math.min(cellW, cellH - 10) * 0.9;  // 9/10 of cell, leave room for plate

    const plateGap = 8;
    const plateFontSize = perPage === 1 ? 14 : perPage === 2 ? 10 : perPage === 3 ? 9 : 8;

    let itemIndex = 0;

    for (const vehicle of selectedVehiclesWithQr) {
      const pageItem = itemIndex % perPage;
      if (pageItem === 0 && itemIndex > 0) {
        doc.addPage();
      }

      const col = pageItem % cols;
      const row = Math.floor(pageItem / cols);
      const cellX = margin + col * cellW;
      const cellY = margin + row * cellH;

      let qrX: number;
      let qrY: number;
      let plateX: number;
      let plateY: number;

      if (perPage === 1) {
        // Center QR + plate block on entire page
        const blockH = qrSize + plateGap + 10;
        const startY = (pageH - blockH) / 2;
        qrX = (pageW - qrSize) / 2;
        qrY = startY;
        plateX = pageW / 2;
        plateY = startY + qrSize + plateGap;
      } else {
        // Center within cell
        qrX = cellX + (cellW - qrSize) / 2;
        qrY = cellY + 4;
        plateX = cellX + cellW / 2;
        plateY = qrY + qrSize + 6;
      }

      let qrDataUrl = getQrCodeDataUrl(vehicle);
      if (!qrDataUrl) {
        try {
          const qrDetail = await dashboardApi.getVehicleQrCode(vehicle.thirdPartyId);
          if (qrDetail?.qrCodeDataUrl) {
            qrDataUrl = qrDetail.qrCodeDataUrl;
          }
        } catch (error) {
          console.error(`Failed to fetch QR code for vehicle ${vehicle.thirdPartyId}:`, error);
          itemIndex++;
          continue;
        }
      }
      if (qrDataUrl) {
        doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
      }

      doc.setFontSize(plateFontSize);
      doc.setTextColor(0, 0, 0);
      const plate = vehicle.plate ?? 'N/A';
      const maxPlateW = perPage === 1 ? pageW - 2 * margin : cellW - 4;
      doc.text(plate, plateX, plateY, { align: 'center', maxWidth: maxPlateW });

      itemIndex++;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `qr-codes-bulk-${timestamp}.pdf`;
    doc.save(filename);
  };

  // Fetch QR codes for preview
  const previewQrQueries = useQuery({
    queryKey: ['preview-qr-codes', previewVehicleIds],
    queryFn: async () => {
      const results = await Promise.allSettled(
        previewVehicleIds.map((id) => dashboardApi.getVehicleQrCode(id))
      );
      return results.map((result, index) => ({
        vehicleId: previewVehicleIds[index],
        qrCode: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason : null,
      }));
    },
    enabled: previewModalOpen && previewVehicleIds.length > 0,
  });

  // Get vehicle info for preview
  const previewVehicles = useMemo(() => {
    if (!vehicleGroups || !previewVehicleIds.length) return [];
    const allVehicles = vehicleGroups.flatMap((g: VehicleGroup) => g.vehicles);
    return previewVehicleIds
      .map((id) => allVehicles.find((v: Vehicle) => v.thirdPartyId === id))
      .filter((v): v is Vehicle => v !== undefined);
  }, [vehicleGroups, previewVehicleIds]);

  const closePreviewModal = () => {
    setPreviewModalOpen(false);
    setPreviewVehicleIds([]);
  };

  const downloadPreviewQrPdf = (qrData: QrCodeResponse) => {
    if (!qrData) return;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = 210;
    const margin = 20;
    let y = 20;

    doc.setFontSize(18);
    doc.text('Vehicle QR Code', margin, y);
    y += 12;

    const v = qrData.vehicle;
    const plate = v?.plate ?? '—';
    const qrSize = 50;
    const qrX = (pageW - qrSize) / 2;

    if (qrData.qrCodeDataUrl) {
      doc.addImage(qrData.qrCodeDataUrl, 'PNG', qrX, y, qrSize, qrSize);
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
          <>
            {selectedVehiclesWithoutQr.length > 0 && selectedVehiclesWithQr.length === 0 && (
              <Button
                variant="default"
                size="sm"
                onClick={handleBulkGenerateQr}
                disabled={bulkCreateQrMutation.isPending}
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
            {selectedVehiclesWithQr.length > 0 && selectedVehiclesWithoutQr.length === 0 && (
              <div className="flex items-center gap-2 shrink-0">
                <Label htmlFor="download-per-page" className="text-sm text-muted-foreground whitespace-nowrap">
                  Per page:
                </Label>
                <Select
                  id="download-per-page"
                  value={String(downloadPerPage)}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDownloadPerPage(Number(e.target.value) as 1 | 2 | 3 | 4)}
                  className="w-20 h-9"
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </Select>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleBulkDownloadQr}
                  className="gap-2 shadow-sm"
                >
                  <FileDown className="h-4 w-4" />
                  Download ({selectedVehiclesWithQr.length})
                </Button>
              </div>
            )}
          </>
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
              {filteredGroups.map((group: VehicleGroup) => {
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
                        {group.vehicles.map((vehicle: Vehicle) => {
                          const hasQr = !!getQrCodeValue(vehicle.qrCode);
                          const qrCodeDataUrl = getQrCodeDataUrl(vehicle);
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
                                <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                                  <div className="flex flex-col gap-0.5 min-w-0">
                                    <span className="font-medium text-sm">
                                      {vehicle.plate ?? 'N/A'}
                                    </span>
                                    <span className="text-muted-foreground text-xs">
                                      {vehicle.model ?? 'N/A'}
                                    </span>
                                  </div>
                                  {qrCodeDataUrl && (
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                      <img
                                        src={qrCodeDataUrl}
                                        alt={`QR Code for ${vehicle.plate ?? 'vehicle'}`}
                                        className="h-6 w-6 object-contain cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => vehicle.thirdPartyId && openQrSheet(vehicle.thirdPartyId)}
                                        title="Click to view QR code details"
                                      />
                                    </div>
                                  )}
                                  {hasQr && !qrCodeDataUrl && (
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                      <QrCode className="h-4 w-4 text-green-600 dark:text-green-400" />
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => vehicle.thirdPartyId && openQrSheet(vehicle.thirdPartyId)}
                                        className="h-6 px-2 text-xs"
                                      >
                                        View
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
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
                  {canRegenerateQr && qrSheetThirdPartyId && (
                    <div className="flex justify-center pt-4 border-t">
                      <Button
                        variant="outline"
                        size="default"
                        onClick={() => setRegenerateDialogOpen(true)}
                        className="gap-2"
                        aria-label="Regenerate QR Code"
                      >
                        <RotateCw className="h-4 w-4" />
                        Regenerate QR Code
                      </Button>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </>
      )}

      {/* Regenerate QR Code Confirmation Dialog */}
      <Dialog open={regenerateDialogOpen} onOpenChange={setRegenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate QR Code</DialogTitle>
            <DialogDescription>
              This action will regenerate (replace) the QR code for this vehicle. The existing QR code will be invalidated and cannot be used anymore.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              <strong>Consequences:</strong>
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
              <li>The current QR code will be permanently replaced</li>
              <li>Any printed copies of the old QR code will no longer work</li>
              <li>You will need to reprint and distribute the new QR code</li>
            </ul>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRegenerateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={() => {
                if (qrSheetThirdPartyId) {
                  regenerateQrMutation.mutate(qrSheetThirdPartyId);
                  setRegenerateDialogOpen(false);
                }
              }}
              disabled={regenerateQrMutation.isPending}
              className="gap-2"
            >
              {regenerateQrMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RotateCw className="h-4 w-4" />
                  Confirm Regenerate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Codes Preview Modal */}
      {previewModalOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
            aria-hidden
            onClick={closePreviewModal}
          />
          <div
            className={cn(
              'fixed left-1/2 top-1/2 z-50 w-full max-w-4xl -translate-x-1/2 -translate-y-1/2',
              'bg-card border shadow-xl rounded-lg',
              'flex flex-col max-h-[90vh]'
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby="preview-modal-title"
          >
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 id="preview-modal-title" className="text-lg font-semibold flex items-center gap-2">
                <Eye className="h-5 w-5 text-primary" />
                Preview Generated QR Codes ({previewVehicleIds.length})
              </h2>
              <Button variant="ghost" size="icon" onClick={closePreviewModal} aria-label="Close">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {previewQrQueries.isLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">Loading QR codes…</p>
                </div>
              ) : previewQrQueries.error ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-2">Could not load QR codes.</p>
                  <Button variant="outline" size="sm" onClick={closePreviewModal}>
                    Close
                  </Button>
                </div>
              ) : previewQrQueries.data ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {previewQrQueries.data.map((item, index) => {
                    const vehicle = previewVehicles[index];
                    const qrData = item.qrCode;
                    const plate = vehicle?.plate ?? `Vehicle ${item.vehicleId}`;

                    return (
                      <div
                        key={item.vehicleId}
                        className="flex flex-col gap-3 p-4 rounded-lg border bg-card"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <div className="rounded-lg border-2 border-border bg-white p-3 shadow-sm">
                            {qrData?.qrCodeDataUrl ? (
                              <img
                                src={qrData.qrCodeDataUrl}
                                alt={`QR Code for ${plate}`}
                                className="h-32 w-32 object-contain"
                              />
                            ) : (
                              <div className="h-32 w-32 flex items-center justify-center bg-muted/50 rounded">
                                <QrCode className="h-12 w-12 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-sm">{plate}</p>
                            {vehicle?.model && (
                              <p className="text-xs text-muted-foreground">{vehicle.model}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {qrData && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setQrSheetThirdPartyId(item.vehicleId);
                                  setQrSheetOpen(true);
                                  closePreviewModal();
                                }}
                                className="flex-1 gap-2 text-xs"
                              >
                                <ScanLine className="h-3 w-3" />
                                View
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => qrData && downloadPreviewQrPdf(qrData)}
                                className="flex-1 gap-2 text-xs"
                              >
                                <Download className="h-3 w-3" />
                                PDF
                              </Button>
                            </>
                          )}
                          {!qrData && item.error && (
                            <div className="flex-1 text-xs text-destructive text-center py-2">
                              Failed to load
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
            <div className="flex items-center justify-end gap-2 border-t px-6 py-4">
              <Button variant="outline" onClick={closePreviewModal}>
                Close
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
