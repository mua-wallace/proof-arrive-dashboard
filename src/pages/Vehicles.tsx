import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { dashboardApi, VehicleGroup, Vehicle, VehicleStatus, StatusSummary, StatusHistory, UpdateStatusRequest, BulkAssignmentItem } from '@/api/dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
  Activity,
  MapPin,
  Wrench,
  Truck,
  Building2,
  AlertCircle,
  Clock,
  Edit,
  History,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { QrCodeResponse, CurrentUser } from '@/api/dashboard';

export default function Vehicles() {
  const { t } = useTranslation();
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
  const [viewMode, setViewMode] = useState<'groups' | 'status' | 'center'>('groups');
  const [selectedStatus, setSelectedStatus] = useState<VehicleStatus | 'all'>('all');
  const [selectedCenterId, setSelectedCenterId] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [statusUpdateModalOpen, setStatusUpdateModalOpen] = useState(false);
  const [statusHistoryModalOpen, setStatusHistoryModalOpen] = useState(false);
  const [selectedVehicleForStatus, setSelectedVehicleForStatus] = useState<Vehicle | null>(null);
  const [statusSummaryModalOpen, setStatusSummaryModalOpen] = useState(false);
  const [selectedStatusForSummary, setSelectedStatusForSummary] = useState<VehicleStatus | null>(null);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [assignmentVehicle, setAssignmentVehicle] = useState<Vehicle | null>(null);
  const [assignmentCenterId, setAssignmentCenterId] = useState<number | null>(null);
  const [bulkAssignModalOpen, setBulkAssignModalOpen] = useState(false);
  const [bulkAssignCenterId, setBulkAssignCenterId] = useState<number | null>(null);
  const [updateStatusForm, setUpdateStatusForm] = useState<UpdateStatusRequest>({
    status: 'available',
    centerId: undefined,
    notes: '',
  });
  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: vehicleGroups, isLoading, error } = useQuery<VehicleGroup[]>({
    queryKey: ['vehicle-groups', 'database', 'qrCodes,currentCenter'],
    queryFn: () => dashboardApi.getVehicleGroups('database', 'qrCodes,group,assignedCenter,currentCenter'),
  });

  // Handle vehicle groups error
  useEffect(() => {
    if (error) {
      const message = (error as any)?.response?.data?.message || (error as Error)?.message || t('vehicles.loadError');
      toast.error(t('vehicles.toast.errorLoadingVehicles'), message);
    }
  }, [error, t]);

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
  const canManageStatus = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  // Fetch status summary
  const { data: statusSummary } = useQuery<StatusSummary>({
    queryKey: ['vehicle-status-summary'],
    queryFn: () => dashboardApi.getStatusSummary(),
    refetchInterval: 60000, // Refetch every 60 seconds
  });

  // Fetch centers for status update form
  const { data: centersData } = useQuery({
    queryKey: ['centers'],
    queryFn: () => dashboardApi.getCenters({ limit: 1000 }),
  });

  // Fetch vehicles by status
  const { data: vehiclesByStatus, isLoading: vehiclesByStatusLoading } = useQuery<Vehicle[]>({
    queryKey: ['vehicles-by-status', selectedStatus],
    queryFn: () => dashboardApi.getVehiclesByStatus(selectedStatus as VehicleStatus),
    enabled: viewMode === 'status' && selectedStatus !== 'all',
  });

  // Fetch vehicles by status for summary modal
  const { data: vehiclesForSummary, isLoading: vehiclesForSummaryLoading } = useQuery<Vehicle[]>({
    queryKey: ['vehicles-by-status-summary', selectedStatusForSummary],
    queryFn: () => dashboardApi.getVehiclesByStatus(selectedStatusForSummary!),
    enabled: statusSummaryModalOpen && selectedStatusForSummary !== null,
  });

  // Fetch vehicles by center
  const { data: vehiclesByCenter, isLoading: vehiclesByCenterLoading } = useQuery<Vehicle[]>({
    queryKey: ['vehicles-by-center', selectedCenterId],
    queryFn: () => dashboardApi.getVehiclesByCenter(selectedCenterId!),
    enabled: viewMode === 'center' && selectedCenterId !== null,
  });

  // Fetch status history for selected vehicle
  const { data: statusHistory, isLoading: statusHistoryLoading } = useQuery<StatusHistory[]>({
    queryKey: ['vehicle-status-history', selectedVehicleForStatus?.id],
    queryFn: () => dashboardApi.getVehicleStatusHistory(selectedVehicleForStatus!.id, 100),
    enabled: statusHistoryModalOpen && selectedVehicleForStatus !== null,
  });

  // Update vehicle status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ vehicleId, data }: { vehicleId: number; data: UpdateStatusRequest }) =>
      dashboardApi.updateVehicleStatus(vehicleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-groups'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-status-summary'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles-by-status'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles-by-center'] });
      setStatusUpdateModalOpen(false);
      setSelectedVehicleForStatus(null);
      setUpdateStatusForm({ status: 'available', centerId: undefined, notes: '' });
      toast.success(t('vehicles.toast.statusUpdatedTitle'), t('vehicles.toast.statusUpdatedDesc'));
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || t('vehicles.toast.errorUpdatingStatusDefault');
      toast.error(t('vehicles.toast.errorUpdatingStatusTitle'), errorMessage);
    },
  });

  // Regenerate QR code mutation
  const regenerateQrMutation = useMutation({
    mutationFn: (thirdPartyId: number) => dashboardApi.regenerateVehicleQrCode(thirdPartyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-qr', qrSheetThirdPartyId] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-groups'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success(t('vehicles.toast.qrRegeneratedTitle'), t('vehicles.toast.qrRegeneratedDesc'));
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message
        || error?.response?.data?.error
        || error?.message
        || t('vehicles.toast.errorRegeneratingQrDefault');
      toast.error(t('vehicles.toast.errorRegeneratingQrTitle'), errorMessage);
    },
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: ({ vehicleId, centerId }: { vehicleId: number; centerId: number | null }) =>
      dashboardApi.updateVehicleAssignment(vehicleId, centerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-groups'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-status-summary'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles-by-status'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles-by-center'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles-list'] });
      setAssignmentModalOpen(false);
      setAssignmentVehicle(null);
      setAssignmentCenterId(null);
      toast.success(t('vehicles.toast.assignmentUpdatedTitle'), t('vehicles.toast.assignmentUpdatedDesc'));
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || t('vehicles.toast.errorAssignmentDefault');
      toast.error(t('vehicles.toast.errorAssignmentTitle'), msg);
    },
  });

  const bulkAssignMutation = useMutation({
    mutationFn: (assignments: BulkAssignmentItem[]) => dashboardApi.bulkAssignVehicles(assignments),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-groups'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-status-summary'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles-by-status'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles-by-center'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles-list'] });
      setSelectedVehicles(new Set());
      setBulkAssignModalOpen(false);
      setBulkAssignCenterId(null);
      const failed = data.results?.filter((r) => !r.success).length ?? 0;
      if (failed > 0) {
        toast.error(
          t('vehicles.toast.bulkAssignTitle'),
          t('vehicles.toast.bulkAssignPartialDesc', { updated: data.updatedCount, failed })
        );
      } else {
        toast.success(
          t('vehicles.toast.bulkAssignTitle'),
          t('vehicles.toast.bulkAssignSuccessDesc', { count: data.updatedCount })
        );
      }
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || error?.message || t('vehicles.toast.errorBulkAssignDefault');
      toast.error(t('vehicles.toast.errorBulkAssignTitle'), msg);
    },
  });

  // Handle QR detail error
  useEffect(() => {
    if (qrDetailError) {
      const message = (qrDetailError as any)?.response?.data?.message || (qrDetailError as Error)?.message || t('vehicles.toast.errorLoadingQrDefault');
      toast.error(t('vehicles.toast.errorLoadingQrTitle'), message);
    }
  }, [qrDetailError, t]);

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
          t('vehicles.toast.bulkQrPartialTitle'),
          t('vehicles.toast.bulkQrPartialDesc', { success: successCount, failed: failedCount, errorDetails })
        );
      } else {
        toast.success(
          t('vehicles.toast.bulkQrSuccessTitle'),
          t('vehicles.toast.bulkQrSuccessDesc', { count: successCount })
        );
      }
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message
        || error?.response?.data?.error
        || error?.message
        || t('vehicles.toast.errorBulkQrDefault');
      toast.error(t('vehicles.toast.errorBulkQrTitle'), errorMessage);
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
      const plate = vehicle.plate ?? t('common.notAvailable');
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

  // Status management helpers
  const getStatusColor = (status: VehicleStatus): string => {
    const colors: Record<VehicleStatus, string> = {
      available: 'bg-green-500',
      in_garage: 'bg-yellow-500',
      in_transit: 'bg-blue-500',
      in_processing: 'bg-purple-500',
      at_center: 'bg-indigo-500',
      unavailable: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusLabel = (status: VehicleStatus): string => {
    return t(`vehicleStatus.${status}`, status);
  };

  const getStatusIcon = (status: VehicleStatus) => {
    const icons: Record<VehicleStatus, typeof Activity> = {
      available: Activity,
      in_garage: Wrench,
      in_transit: Truck,
      in_processing: Building2,
      at_center: MapPin,
      unavailable: AlertCircle,
    };
    return icons[status] || Activity;
  };

  const openStatusUpdateModal = (vehicle: Vehicle) => {
    setSelectedVehicleForStatus(vehicle);
    setUpdateStatusForm({
      status: vehicle.currentStatus || 'available',
      centerId: vehicle.currentCenterId,
      notes: '',
    });
    setStatusUpdateModalOpen(true);
  };

  const openStatusHistoryModal = (vehicle: Vehicle) => {
    setSelectedVehicleForStatus(vehicle);
    setStatusHistoryModalOpen(true);
  };

  const handleAssignmentSubmit = () => {
    if (!assignmentVehicle) return;
    updateAssignmentMutation.mutate({ vehicleId: assignmentVehicle.id, centerId: assignmentCenterId });
  };

  const handleBulkAssignSubmit = () => {
    if (!vehicleGroups || bulkAssignCenterId == null) return;
    const allVehicles = vehicleGroups.flatMap((g: VehicleGroup) => g.vehicles);
    const selected = allVehicles.filter((v: Vehicle) => selectedVehicles.has(v.thirdPartyId));
    const assignments: BulkAssignmentItem[] = selected.map((v: Vehicle) => ({
      vehicleId: v.id,
      centerId: bulkAssignCenterId,
    }));
    if (assignments.length === 0) return;
    bulkAssignMutation.mutate(assignments);
  };

  const handleStatusUpdate = () => {
    if (!selectedVehicleForStatus) return;
    
    const requiresCenter = ['at_center', 'in_processing', 'in_garage'].includes(updateStatusForm.status);
    if (requiresCenter && !updateStatusForm.centerId) {
      toast.error(t('vehicles.toast.centerRequiredTitle'), t('vehicles.toast.centerRequiredDesc'));
      return;
    }

    updateStatusMutation.mutate({
      vehicleId: selectedVehicleForStatus.id,
      data: updateStatusForm,
    });
  };

  // Helper: get center name from vehicle (currentCenter or current_center from API) or fallback to centers list
  const getCenterName = (centerId?: number, vehicle?: Vehicle): string | null => {
    const fromVehicle = vehicle?.currentCenter?.name ?? (vehicle as any)?.current_center?.name;
    if (fromVehicle) return fromVehicle;
    if (!centerId || !centersData?.data) return null;
    const center = centersData.data.find((c: any) => c.id === centerId);
    return center?.name || null;
  };

  // Fetch vehicle list from GET /vehicles with currentCenter so we have center names
  const { data: vehiclesListData } = useQuery({
    queryKey: ['vehicles-list', 1, 500, 'qrCodes,group,assignedCenter,currentCenter'],
    queryFn: () =>
      dashboardApi.getVehicles({
        page: 1,
        limit: 500,
        include: 'qrCodes,group,assignedCenter,currentCenter',
      }),
  });

  const vehiclesByIdMap = useMemo(() => {
    const map = new Map<number, Vehicle>();
    const list = vehiclesListData?.data ?? [];
    list.forEach((v: any) => {
      map.set(v.id, v);
    });
    return map;
  }, [vehiclesListData?.data]);

  const getDisplayCenterName = (vehicle: Vehicle): string => {
    const fromVehicle =
      vehicle?.currentCenter?.name ?? (vehicle as any)?.current_center?.name;
    if (fromVehicle) return fromVehicle;
    const fromList = vehiclesByIdMap.get(vehicle.id);
    const fromListName =
      fromList?.currentCenter?.name ?? (fromList as any)?.current_center?.name;
    if (fromListName) return fromListName;
    const fromCenters = getCenterName(vehicle.currentCenterId);
    if (fromCenters) return fromCenters;
    if (vehicle.currentCenterId) return `Center ${vehicle.currentCenterId}`;
    return '—';
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
      {/* Page title - compact */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Car className="h-7 w-7 text-primary" />
          {t('vehicles.title')}
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {t('vehicles.subtitle')}
        </p>
      </div>

      {/* Status summary - click to filter */}
      {statusSummary && (
        <section>
          <p className="text-sm font-medium text-muted-foreground mb-3">{t('vehicles.fleetAtAGlance')}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {(['available', 'in_garage', 'in_transit', 'in_processing', 'at_center', 'unavailable'] as VehicleStatus[]).map((status) => {
              const Icon = getStatusIcon(status);
              const count = statusSummary[status] || 0;
              const isActive = viewMode === 'status' && selectedStatus === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => {
                    if (count > 0) {
                      setViewMode('status');
                      setSelectedStatus(status);
                      listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    } else {
                      setSelectedStatusForSummary(status);
                      setStatusSummaryModalOpen(true);
                    }
                  }}
                  className={cn(
                    'flex items-center gap-4 rounded-xl border bg-card p-4 text-left transition-all hover:shadow-md hover:border-primary/30',
                    isActive && 'ring-2 ring-primary border-primary shadow-md'
                  )}
                >
                  <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', getStatusColor(status) + '/20')}>
                    <Icon className={cn('h-5 w-5', getStatusColor(status).replace('bg-', 'text-'))} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">{getStatusLabel(status)}</p>
                    <p className="text-xl font-bold tabular-nums">{count}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Single toolbar: search + view + filters */}
      <Card className="rounded-xl border p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder={t('vehicles.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-lg"
              aria-label={t('vehicles.searchAria')}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">{t('vehicles.view')}</span>
            <div className="flex rounded-lg border bg-muted/50 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('groups')}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  viewMode === 'groups' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t('vehicles.viewByGroup')}
              </button>
              <button
                type="button"
                onClick={() => { setViewMode('status'); if (selectedStatus === 'all') setSelectedStatus('available'); }}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  viewMode === 'status' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t('vehicles.viewByStatus')}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('center')}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  viewMode === 'center' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t('vehicles.viewByCenter')}
              </button>
            </div>
            {viewMode === 'status' && (
              <>
                <Label htmlFor="status-filter" className="sr-only">{t('vehicles.statusView.columns.status')}</Label>
                <Select
                  id="status-filter"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as VehicleStatus | 'all')}
                  className="h-9 w-[160px] rounded-lg"
                >
                  <option value="all">{t('vehicles.allStatuses')}</option>
                  {(['available', 'in_garage', 'in_transit', 'in_processing', 'at_center', 'unavailable'] as VehicleStatus[]).map((s) => (
                    <option key={s} value={s}>{getStatusLabel(s)}</option>
                  ))}
                </Select>
              </>
            )}
            {viewMode === 'center' && (
              <>
                <Label htmlFor="center-filter" className="sr-only">{t('common.center')}</Label>
                <Select
                  id="center-filter"
                  value={selectedCenterId ?? ''}
                  onChange={(e) => setSelectedCenterId(e.target.value ? Number(e.target.value) : null)}
                  className="h-9 w-[180px] rounded-lg"
                >
                  <option value="">{t('vehicles.selectCenter')}</option>
                  {centersData?.data?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name || `Center ${c.id}`}</option>
                  ))}
                </Select>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Bulk actions - only when selection exists */}
      {totalSelected > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
          <span className="text-sm font-medium text-primary">{t('vehicles.selected', { count: totalSelected })}</span>
          <Button variant="ghost" size="sm" onClick={() => setSelectedVehicles(new Set())} className="text-muted-foreground hover:text-foreground">
            {t('vehicles.clearSelection')}
          </Button>
          <span className="text-muted-foreground/80">|</span>
          <div className="flex flex-wrap gap-2">
            {selectedVehiclesWithoutQr.length > 0 && selectedVehiclesWithQr.length === 0 && (
              <Button size="sm" onClick={handleBulkGenerateQr} disabled={bulkCreateQrMutation.isPending} className="gap-2">
                {bulkCreateQrMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                {t('vehicles.generateQr', { count: selectedVehiclesWithoutQr.length })}
              </Button>
            )}
            {selectedVehiclesWithQr.length > 0 && selectedVehiclesWithoutQr.length === 0 && (
              <>
                <Label htmlFor="download-per-page" className="text-sm text-muted-foreground whitespace-nowrap self-center">{t('vehicles.perPage')}</Label>
                <Select id="download-per-page" value={String(downloadPerPage)} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setDownloadPerPage(Number(e.target.value) as 1 | 2 | 3 | 4)} className="w-16 h-9 text-sm">
                  <option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option>
                </Select>
                <Button size="sm" onClick={handleBulkDownloadQr} className="gap-2">
                  <FileDown className="h-4 w-4" /> {t('vehicles.download', { count: selectedVehiclesWithQr.length })}
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={() => setBulkAssignModalOpen(true)} className="gap-2">
              <Building2 className="h-4 w-4" /> {t('vehicles.assignToCenter')}
            </Button>
          </div>
        </div>
      )}
      <Card className="rounded-xl border overflow-hidden" ref={listRef}>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">{t('vehicles.listTitle')}</CardTitle>
              <CardDescription>
                {viewMode === 'groups' && vehicleGroups && t('vehicles.groupsSummary', { groups: vehicleGroups.length, vehicles: vehicleGroups.reduce((sum, g) => sum + g.total, 0) })}
                {viewMode === 'status' && (selectedStatus === 'all' ? t('vehicles.selectStatusAbove') : t('vehicles.vehiclesCount', { count: vehiclesByStatus?.length ?? 0 }))}
                {viewMode === 'center' && (selectedCenterId == null ? t('vehicles.selectCenterAbove') : t('vehicles.vehiclesCount', { count: vehiclesByCenter?.length ?? 0 }))}
                {totalSelected > 0 && <span className="text-primary font-medium">{t('vehicles.selectedSuffix', { count: totalSelected })}</span>}
              </CardDescription>
            </div>
            {viewMode === 'groups' && filteredGroups && filteredGroups.length > 0 && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1" onClick={() => setExpandedGroups(filteredGroups.map((g: VehicleGroup) => `group-${g.groupId}`))}>
                  <ChevronDown className="h-4 w-4" /> {t('vehicles.expandAll')}
                </Button>
                <Button variant="outline" size="sm" className="gap-1" onClick={() => setExpandedGroups([])}>
                  <ChevronUp className="h-4 w-4" /> {t('vehicles.collapseAll')}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'groups' && (
            <>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">{t('vehicles.loadError')}</p>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : t('vehicles.fetchError')}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                {t('common.retry')}
              </Button>
            </div>
          ) : !filteredGroups || filteredGroups.length === 0 ? (
            <div className="text-center py-12">
              <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t('vehicles.noVehicles')}</p>
            </div>
          ) : (
            <Accordion
              type="multiple"
              value={expandedGroups}
              onValueChange={setExpandedGroups}
              className="space-y-3"
            >
              {filteredGroups.map((group: VehicleGroup) => {
                const groupId = `group-${group.groupId}`;
                const isFullySelected = isGroupFullySelected(group);
                const isPartiallySelected = isGroupPartiallySelected(group);

                return (
                    <AccordionItem key={group.groupId} value={groupId} className="rounded-xl border bg-muted/30 px-4 overflow-hidden">
                    <AccordionTrigger className="hover:no-underline py-5">
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleGroupSelection(group);
                          }}
                          className="flex items-center justify-center w-5 h-5 cursor-pointer rounded border border-transparent hover:border-primary/50 transition-colors"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleGroupSelection(group);
                            }
                          }}
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
                        </div>
                        <div className="flex-1 text-left">
                          <span className="font-semibold">{group.groupName}</span>
                          <span className="ml-2 text-sm text-muted-foreground">
                            ({t('vehicles.group', { count: group.total })})
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="relative grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 pt-2 pb-4 pl-6 md:pl-8">
                        <div className="absolute left-4 top-0 bottom-4 w-px bg-border rounded-full" />
                        {group.vehicles.map((vehicle: Vehicle) => {
                          const hasQr = !!getQrCodeValue(vehicle.qrCode);
                          const qrCodeDataUrl = getQrCodeDataUrl(vehicle);
                          const isSelected = selectedVehicles.has(vehicle.thirdPartyId);

                          return (
                            <div
                              key={vehicle.id}
                              className={cn(
                                'flex flex-col gap-2 p-4 rounded-xl border bg-card transition-all',
                                isSelected && 'ring-2 ring-primary/30 border-primary/40 shadow-sm',
                                !isSelected && 'hover:bg-muted/50 hover:border-muted-foreground/20'
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
                                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-sm">
                                        {vehicle.plate ?? t('common.notAvailable')}
                                      </span>
                                      {vehicle.currentStatus && (
                                        <Badge
                                          variant="secondary"
                                          className={cn(
                                            'text-xs px-1.5 py-0.5',
                                            vehicle.currentStatus === 'available' && 'bg-green-100 text-green-700',
                                            vehicle.currentStatus === 'in_garage' && 'bg-yellow-100 text-yellow-700',
                                            vehicle.currentStatus === 'in_transit' && 'bg-blue-100 text-blue-700',
                                            vehicle.currentStatus === 'in_processing' && 'bg-purple-100 text-purple-700',
                                            vehicle.currentStatus === 'at_center' && 'bg-indigo-100 text-indigo-700',
                                            vehicle.currentStatus === 'unavailable' && 'bg-red-100 text-red-700'
                                          )}
                                        >
                                          {getStatusLabel(vehicle.currentStatus)}
                                        </Badge>
                                      )}
                                    </div>
                                    <span className="text-muted-foreground text-xs">
                                      {vehicle.model ?? t('common.notAvailable')}
                                    </span>
                                    {(() => {
                                      const centerLabel = getDisplayCenterName(vehicle);
                                      const hasCenter = centerLabel !== '—';
                                      return (
                                        <div
                                          className={cn(
                                            'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium w-fit mt-1',
                                            hasCenter
                                              ? 'bg-primary/10 text-primary dark:bg-primary/20'
                                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                                          )}
                                        >
                                          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                          <span>{hasCenter ? centerLabel : t('vehicles.notAssigned')}</span>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                  {qrCodeDataUrl && (
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                      <img
                                        src={qrCodeDataUrl}
                                        alt={`QR Code for ${vehicle.plate ?? 'vehicle'}`}
                                        className="h-6 w-6 object-contain cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => vehicle.thirdPartyId && openQrSheet(vehicle.thirdPartyId)}
                                        title={t('vehicles.viewQrDetails')}
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
                                        {t('common.view')}
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
            </>
          )}

          {/* Vehicles by Status View */}
          {viewMode === 'status' && (
            <>
              {vehiclesByStatusLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : selectedStatus === 'all' ? (
                <div className="text-center py-12 rounded-lg border border-dashed bg-muted/30">
                  <Activity className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="font-medium text-muted-foreground">{t('vehicles.statusView.selectTitle')}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t('vehicles.statusView.selectHint')}</p>
                </div>
              ) : vehiclesByStatus && vehiclesByStatus.length > 0 ? (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox
                            checked={vehiclesByStatus.length > 0 && vehiclesByStatus.every((v) => selectedVehicles.has(v.thirdPartyId))}
                            onCheckedChange={(checked) => {
                              if (checked) setSelectedVehicles(new Set(vehiclesByStatus.map((v) => v.thirdPartyId)));
                              else setSelectedVehicles(new Set());
                            }}
                            aria-label={t('vehicles.statusView.columns.actions')}
                          />
                        </TableHead>
                        <TableHead>{t('vehicles.statusView.columns.plate')}</TableHead>
                        <TableHead>{t('vehicles.statusView.columns.model')}</TableHead>
                        <TableHead>{t('vehicles.statusView.columns.status')}</TableHead>
                        <TableHead>{t('vehicles.statusView.columns.center')}</TableHead>
                        <TableHead className="text-right w-32">{t('vehicles.statusView.columns.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vehiclesByStatus.map((vehicle: Vehicle) => {
                        const qrCodeDataUrl = getQrCodeDataUrl(vehicle);
                        const hasQr = !!getQrCodeValue(vehicle.qrCode);
                        const isSelected = selectedVehicles.has(vehicle.thirdPartyId);
                        return (
                          <TableRow key={vehicle.id} className={isSelected ? 'bg-primary/5' : ''}>
                            <TableCell>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleVehicleSelection(vehicle.thirdPartyId)}
                                disabled={hasQr}
                                aria-label={`Select ${vehicle.plate ?? vehicle.id}`}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{vehicle.plate ?? '—'}</TableCell>
                            <TableCell className="text-muted-foreground">{vehicle.model ?? '—'}</TableCell>
                            <TableCell>
                              {vehicle.currentStatus ? (
                                <Badge variant="secondary" className={cn('text-xs',
                                  vehicle.currentStatus === 'available' && 'bg-green-100 text-green-700',
                                  vehicle.currentStatus === 'in_garage' && 'bg-yellow-100 text-yellow-700',
                                  vehicle.currentStatus === 'in_transit' && 'bg-blue-100 text-blue-700',
                                  vehicle.currentStatus === 'in_processing' && 'bg-purple-100 text-purple-700',
                                  vehicle.currentStatus === 'at_center' && 'bg-indigo-100 text-indigo-700',
                                  vehicle.currentStatus === 'unavailable' && 'bg-red-100 text-red-700'
                                )}>
                                  {getStatusLabel(vehicle.currentStatus)}
                                </Badge>
                              ) : '—'}
                            </TableCell>
                            <TableCell>
                              {(() => {
                                const centerLabel = getDisplayCenterName(vehicle);
                                const hasCenter = centerLabel !== '—';
                                return (
                                  <span
                                    className={cn(
                                      'inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs font-medium',
                                      hasCenter
                                        ? 'bg-primary/10 text-primary dark:bg-primary/20'
                                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                                    )}
                                  >
                                    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                    {hasCenter ? centerLabel : t('vehicles.notAssigned')}
                                  </span>
                                );
                              })()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {qrCodeDataUrl ? (
                                  <button type="button" onClick={() => vehicle.thirdPartyId && openQrSheet(vehicle.thirdPartyId)} className="p-2 rounded-md hover:bg-muted" title={t('vehicles.viewQr')}>
                                    <img src={qrCodeDataUrl} alt="QR" className="h-5 w-5 object-contain" />
                                  </button>
                                ) : hasQr ? (
                                  <Button variant="ghost" size="icon" className="h-8 w-8" title={t('vehicles.viewQr')} onClick={() => vehicle.thirdPartyId && openQrSheet(vehicle.thirdPartyId)}>
                                    <QrCode className="h-4 w-4" />
                                  </Button>
                                ) : null}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 rounded-lg border border-dashed bg-muted/30">
                  <Car className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">{t('vehicles.statusView.empty')}</p>
                </div>
              )}
            </>
          )}

          {/* Vehicles by Center View */}
          {viewMode === 'center' && (
            <>
              {vehiclesByCenterLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : selectedCenterId == null ? (
                <div className="text-center py-12 rounded-lg border border-dashed bg-muted/30">
                  <Building2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="font-medium text-muted-foreground">{t('vehicles.centerView.selectTitle')}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t('vehicles.centerView.selectHint')}</p>
                </div>
              ) : vehiclesByCenter && vehiclesByCenter.length > 0 ? (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox
                            checked={vehiclesByCenter.length > 0 && vehiclesByCenter.every((v) => selectedVehicles.has(v.thirdPartyId))}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedVehicles(new Set(vehiclesByCenter.map((v) => v.thirdPartyId)));
                              } else {
                                setSelectedVehicles(new Set());
                              }
                            }}
                            aria-label={t('vehicles.statusView.columns.actions')}
                          />
                        </TableHead>
                        <TableHead>{t('vehicles.statusView.columns.plate')}</TableHead>
                        <TableHead>{t('vehicles.statusView.columns.model')}</TableHead>
                        <TableHead>{t('vehicles.statusView.columns.status')}</TableHead>
                        <TableHead>{t('vehicles.statusView.columns.center')}</TableHead>
                        <TableHead className="text-right w-32">{t('vehicles.statusView.columns.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vehiclesByCenter.map((vehicle: Vehicle) => {
                        const qrCodeDataUrl = getQrCodeDataUrl(vehicle);
                        const hasQr = !!getQrCodeValue(vehicle.qrCode);
                        const isSelected = selectedVehicles.has(vehicle.thirdPartyId);
                        return (
                          <TableRow key={vehicle.id} className={isSelected ? 'bg-primary/5' : ''}>
                            <TableCell>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleVehicleSelection(vehicle.thirdPartyId)}
                                disabled={hasQr}
                                aria-label={`Select ${vehicle.plate ?? vehicle.id}`}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{vehicle.plate ?? '—'}</TableCell>
                            <TableCell className="text-muted-foreground">{vehicle.model ?? '—'}</TableCell>
                            <TableCell>
                              {vehicle.currentStatus ? (
                                <Badge variant="secondary" className={cn('text-xs',
                                  vehicle.currentStatus === 'available' && 'bg-green-100 text-green-700',
                                  vehicle.currentStatus === 'in_garage' && 'bg-yellow-100 text-yellow-700',
                                  vehicle.currentStatus === 'in_transit' && 'bg-blue-100 text-blue-700',
                                  vehicle.currentStatus === 'in_processing' && 'bg-purple-100 text-purple-700',
                                  vehicle.currentStatus === 'at_center' && 'bg-indigo-100 text-indigo-700',
                                  vehicle.currentStatus === 'unavailable' && 'bg-red-100 text-red-700'
                                )}>
                                  {getStatusLabel(vehicle.currentStatus)}
                                </Badge>
                              ) : '—'}
                            </TableCell>
                            <TableCell>
                              {(() => {
                                const centerLabel = getDisplayCenterName(vehicle);
                                const hasCenter = centerLabel !== '—';
                                return (
                                  <span
                                    className={cn(
                                      'inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs font-medium',
                                      hasCenter
                                        ? 'bg-primary/10 text-primary dark:bg-primary/20'
                                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                                    )}
                                  >
                                    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                    {hasCenter ? centerLabel : t('vehicles.notAssigned')}
                                  </span>
                                );
                              })()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {qrCodeDataUrl ? (
                                  <button type="button" onClick={() => vehicle.thirdPartyId && openQrSheet(vehicle.thirdPartyId)} className="p-2 rounded-md hover:bg-muted" title={t('vehicles.viewQr')}>
                                    <img src={qrCodeDataUrl} alt="QR" className="h-5 w-5 object-contain" />
                                  </button>
                                ) : hasQr ? (
                                  <Button variant="ghost" size="icon" className="h-8 w-8" title={t('vehicles.viewQr')} onClick={() => vehicle.thirdPartyId && openQrSheet(vehicle.thirdPartyId)}>
                                    <QrCode className="h-4 w-4" />
                                  </Button>
                                ) : null}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 rounded-lg border border-dashed bg-muted/30">
                  <Car className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">{t('vehicles.centerView.empty')}</p>
                </div>
              )}
            </>
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
                {t('vehicles.qrSheet.title')}
              </h2>
              <div className="flex items-center gap-1">
                {qrDetail && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={downloadQrPdf}
                    className="gap-2 shadow-sm"
                    aria-label={t('vehicles.qrSheet.downloadPdf')}
                  >
                    <FileDown className="h-4 w-4" />
                    {t('vehicles.qrSheet.downloadPdf')}
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={closeQrSheet} aria-label={t('common.close')}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {qrDetailLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">{t('vehicles.qrSheet.loading')}</p>
                </div>
              ) : qrDetailError ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-2">{t('vehicles.qrSheet.loadError')}</p>
                  <Button variant="outline" size="sm" onClick={closeQrSheet}>
                    {t('common.close')}
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
                      {t('vehicles.qrSheet.vehicleDetails')}
                    </h3>
                    <dl className="grid gap-2 text-sm">
                      <div className="flex justify-between gap-4 py-2 border-b">
                        <dt className="text-muted-foreground flex items-center gap-2">
                          <Hash className="h-3.5 w-3.5" />
                          {t('vehicles.qrSheet.plate')}
                        </dt>
                        <dd className="font-medium">{qrDetail.vehicle?.plate ?? '—'}</dd>
                      </div>
                      <div className="flex justify-between gap-4 py-2 border-b">
                        <dt className="text-muted-foreground flex items-center gap-2">
                          <Tag className="h-3.5 w-3.5" />
                          {t('vehicles.qrSheet.model')}
                        </dt>
                        <dd className="font-medium">{qrDetail.vehicle?.model ?? '—'}</dd>
                      </div>
                      <div className="flex justify-between gap-4 py-2 border-b">
                        <dt className="text-muted-foreground flex items-center gap-2">{t('vehicles.qrSheet.brand')}</dt>
                        <dd className="font-medium">{qrDetail.vehicle?.brand ?? '—'}</dd>
                      </div>
                      <div className="flex justify-between gap-4 py-2 border-b">
                        <dt className="text-muted-foreground flex items-center gap-2">{t('vehicles.qrSheet.year')}</dt>
                        <dd className="font-medium">{qrDetail.vehicle?.year ?? '—'}</dd>
                      </div>
                      <div className="flex justify-between gap-4 py-2">
                        <dt className="text-muted-foreground flex items-center gap-2">{t('vehicles.qrSheet.tag')}</dt>
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
                        aria-label={t('vehicles.qrSheet.regenerate')}
                      >
                        <RotateCw className="h-4 w-4" />
                        {t('vehicles.qrSheet.regenerate')}
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
            <DialogTitle>{t('vehicles.regenerateDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('vehicles.regenerateDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              <strong>{t('vehicles.regenerateDialog.consequencesLabel')}</strong>
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
              <li>{t('vehicles.regenerateDialog.consequence1')}</li>
              <li>{t('vehicles.regenerateDialog.consequence2')}</li>
              <li>{t('vehicles.regenerateDialog.consequence3')}</li>
            </ul>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRegenerateDialogOpen(false)}
            >
              {t('vehicles.regenerateDialog.cancel')}
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
                  {t('vehicles.regenerateDialog.regenerating')}
                </>
              ) : (
                <>
                  <RotateCw className="h-4 w-4" />
                  {t('vehicles.regenerateDialog.confirm')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Update Modal */}
      <Dialog open={statusUpdateModalOpen} onOpenChange={setStatusUpdateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('vehicles.statusUpdate.title')}</DialogTitle>
            <DialogDescription>
              {t('vehicles.statusUpdate.description', { plate: selectedVehicleForStatus?.plate || t('vehicles.statusUpdate.descriptionFallback') })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status-select">{t('vehicles.statusUpdate.status')}</Label>
              <Select
                id="status-select"
                value={updateStatusForm.status}
                onChange={(e) => {
                  const newStatus = e.target.value as VehicleStatus;
                  setUpdateStatusForm((prev) => ({
                    ...prev,
                    status: newStatus,
                    centerId: ['at_center', 'in_processing', 'in_garage'].includes(newStatus) ? prev.centerId : undefined,
                  }));
                }}
              >
                {(['available', 'in_garage', 'in_transit', 'in_processing', 'at_center', 'unavailable'] as VehicleStatus[]).map((status) => (
                  <option key={status} value={status}>
                    {getStatusLabel(status)}
                  </option>
                ))}
              </Select>
            </div>

            {['at_center', 'in_processing', 'in_garage'].includes(updateStatusForm.status) && (
              <div className="space-y-2">
                <Label htmlFor="center-select">
                  {t('vehicles.statusUpdate.centerRequired')} <span className="text-destructive">*</span>
                </Label>
                <Select
                  id="center-select"
                  value={updateStatusForm.centerId || ''}
                  onChange={(e) =>
                    setUpdateStatusForm((prev) => ({
                      ...prev,
                      centerId: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                >
                  <option value="">{t('vehicles.statusUpdate.selectCenter')}</option>
                  {centersData?.data?.map((center: any) => (
                    <option key={center.id} value={center.id}>
                      {center.name || `Center ${center.id}`}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="status-notes">{t('vehicles.statusUpdate.notes')}</Label>
              <textarea
                id="status-notes"
                className="w-full min-h-[80px] px-3 py-2 text-sm border rounded-md resize-none"
                placeholder={t('vehicles.statusUpdate.notesPlaceholder')}
                value={updateStatusForm.notes || ''}
                onChange={(e) =>
                  setUpdateStatusForm((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusUpdateModalOpen(false)}>
              {t('vehicles.statusUpdate.cancel')}
            </Button>
            <Button
              variant="default"
              onClick={handleStatusUpdate}
              disabled={updateStatusMutation.isPending}
              className="gap-2"
            >
              {updateStatusMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('vehicles.statusUpdate.updating')}
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4" />
                  {t('vehicles.statusUpdate.update')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Center assignment modal (single vehicle) */}
      <Dialog open={assignmentModalOpen} onOpenChange={setAssignmentModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('vehicles.assignment.title')}</DialogTitle>
            <DialogDescription>
              {t('vehicles.assignment.description', { plate: assignmentVehicle?.plate ?? t('vehicles.assignment.descriptionFallback') })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="assignment-center">{t('vehicles.assignment.center')}</Label>
              <Select
                id="assignment-center"
                value={assignmentCenterId ?? ''}
                onChange={(e) =>
                  setAssignmentCenterId(e.target.value === '' ? null : Number(e.target.value))
                }
              >
                <option value="">{t('vehicles.assignment.remove')}</option>
                {centersData?.data?.map((center: any) => (
                  <option key={center.id} value={center.id}>
                    {center.name || `Center ${center.id}`}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignmentModalOpen(false)}>
              {t('vehicles.assignment.cancel')}
            </Button>
            <Button
              variant="default"
              onClick={handleAssignmentSubmit}
              disabled={updateAssignmentMutation.isPending}
              className="gap-2"
            >
              {updateAssignmentMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('vehicles.assignment.updating')}
                </>
              ) : (
                t('vehicles.assignment.update')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk assign to center modal */}
      <Dialog open={bulkAssignModalOpen} onOpenChange={setBulkAssignModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('vehicles.bulkAssign.title')}</DialogTitle>
            <DialogDescription>
              {t('vehicles.bulkAssign.description', { count: totalSelected })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-assign-center">{t('vehicles.bulkAssign.center')}</Label>
              <Select
                id="bulk-assign-center"
                value={bulkAssignCenterId ?? ''}
                onChange={(e) =>
                  setBulkAssignCenterId(e.target.value === '' ? null : Number(e.target.value))
                }
              >
                <option value="">{t('vehicles.statusUpdate.selectCenter')}</option>
                {centersData?.data?.map((center: any) => (
                  <option key={center.id} value={center.id}>
                    {center.name || `Center ${center.id}`}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkAssignModalOpen(false)}>
              {t('vehicles.bulkAssign.cancel')}
            </Button>
            <Button
              variant="default"
              onClick={handleBulkAssignSubmit}
              disabled={bulkAssignMutation.isPending || bulkAssignCenterId == null}
              className="gap-2"
            >
              {bulkAssignMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('vehicles.bulkAssign.assigning')}
                </>
              ) : (
                <>
                  <Building2 className="h-4 w-4" />
                  {t('vehicles.bulkAssign.assign', { count: totalSelected })}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status History Modal */}
      <Dialog open={statusHistoryModalOpen} onOpenChange={setStatusHistoryModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{t('vehicles.history.title')}</DialogTitle>
            <DialogDescription>
              {t('vehicles.history.description', { plate: selectedVehicleForStatus?.plate || t('vehicles.history.descriptionFallback') })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {statusHistoryLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">{t('vehicles.history.loading')}</p>
              </div>
            ) : statusHistory && statusHistory.length > 0 ? (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {statusHistory.map((entry, index) => (
                  <div
                    key={entry.id}
                    className={cn(
                      'flex gap-4 p-3 rounded-lg border',
                      index === 0 && 'bg-primary/5 border-primary/20'
                    )}
                  >
                    <div className="flex-shrink-0">
                      <div className={`w-2 h-2 rounded-full mt-2 ${getStatusColor(entry.status)}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={cn(
                              'text-xs',
                              entry.status === 'available' && 'bg-green-100 text-green-700',
                              entry.status === 'in_garage' && 'bg-yellow-100 text-yellow-700',
                              entry.status === 'in_transit' && 'bg-blue-100 text-blue-700',
                              entry.status === 'in_processing' && 'bg-purple-100 text-purple-700',
                              entry.status === 'at_center' && 'bg-indigo-100 text-indigo-700',
                              entry.status === 'unavailable' && 'bg-red-100 text-red-700'
                            )}
                          >
                            {getStatusLabel(entry.status)}
                          </Badge>
                          {entry.centerName && (
                            <span className="text-xs text-muted-foreground">
                              @ {entry.centerName}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(entry.changedAt).toLocaleString()}
                        </span>
                      </div>
                      {entry.changedBy && (
                        <p className="text-xs text-muted-foreground mb-1">
                          {t('vehicles.history.changedBy')} {entry.changedBy}
                        </p>
                      )}
                      {entry.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{entry.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">{t('vehicles.history.empty')}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusHistoryModalOpen(false)}>
              {t('vehicles.history.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Summary Modal */}
      {statusSummaryModalOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setStatusSummaryModalOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="relative w-[95vw] max-w-[1400px] h-[92vh] max-h-[92vh] rounded-lg border bg-card shadow-lg flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  {selectedStatusForSummary && (
                    <>
                      <div className={cn(
                        'p-2 rounded-lg',
                        selectedStatusForSummary === 'available' && 'bg-green-100',
                        selectedStatusForSummary === 'in_garage' && 'bg-yellow-100',
                        selectedStatusForSummary === 'in_transit' && 'bg-blue-100',
                        selectedStatusForSummary === 'in_processing' && 'bg-purple-100',
                        selectedStatusForSummary === 'at_center' && 'bg-indigo-100',
                        selectedStatusForSummary === 'unavailable' && 'bg-red-100'
                      )}>
                        {(() => {
                          const Icon = selectedStatusForSummary ? getStatusIcon(selectedStatusForSummary) : Activity;
                          return <Icon className={cn(
                            'h-5 w-5',
                            selectedStatusForSummary === 'available' && 'text-green-700',
                            selectedStatusForSummary === 'in_garage' && 'text-yellow-700',
                            selectedStatusForSummary === 'in_transit' && 'text-blue-700',
                            selectedStatusForSummary === 'in_processing' && 'text-purple-700',
                            selectedStatusForSummary === 'at_center' && 'text-indigo-700',
                            selectedStatusForSummary === 'unavailable' && 'text-red-700'
                          )} />;
                        })()}
                      </div>
                      <span>{selectedStatusForSummary && getStatusLabel(selectedStatusForSummary)}</span>
                    </>
                  )}
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  {t('vehicles.summary.subtitle')}
                </p>
              </div>
            </div>
              </div>
          
              {/* Content */}
              <div className="px-6 py-4 flex-1 overflow-hidden flex flex-col min-h-0">
            {vehiclesForSummaryLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground">{t('vehicles.summary.loading')}</p>
              </div>
            ) : vehiclesForSummary && vehiclesForSummary.length > 0 ? (
              <div className="space-y-6 flex-1 overflow-y-auto min-h-0">
                {(() => {
                  // Group vehicles by center
                  const groupedByCenter: Partial<Record<number | 'none', Vehicle[]>> = {};
                  vehiclesForSummary.forEach((vehicle: Vehicle) => {
                    const centerId = vehicle.currentCenterId || 'none';
                    if (!groupedByCenter[centerId]) {
                      groupedByCenter[centerId] = [];
                    }
                    groupedByCenter[centerId].push(vehicle);
                  });

                  // Sort centers by vehicle count (descending)
                  const sortedCenters = Object.entries(groupedByCenter).sort(
                    ([, a = []], [, b = []]) => b.length - a.length
                  );

                  // Calculate totals
                  const totalVehicles = vehiclesForSummary.length;
                  const totalCenters = sortedCenters.length;

                  return (
                    <>
                      {/* Summary Stats Bar */}
                      <div className="flex items-center gap-6 p-4 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Car className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('vehicles.summary.totalVehicles')}</p>
                            <p className="text-3xl font-bold">{totalVehicles}</p>
                          </div>
                        </div>
                        <div className="h-12 w-px bg-border" />
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">{t('vehicles.summary.totalCenters')}</p>
                            <p className="text-3xl font-bold">{totalCenters}</p>
                          </div>
                        </div>
                      </div>

                      {/* Centers List */}
                      <div className="space-y-4">
                        {sortedCenters.map(([centerId, vehicles = []]) => {
                          const centerIdNum = centerId === 'none' ? null : Number(centerId);
                          const centerName = centerIdNum ? getCenterName(centerIdNum) : null;
                          
                          return (
                            <div
                              key={centerId || 'none'}
                              className="border rounded-lg overflow-hidden bg-card hover:shadow-md transition-shadow"
                            >
                              {/* Center Header */}
                              <div className="bg-muted/50 border-b px-4 py-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-primary/10 rounded">
                                      <Building2 className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                      <h3 className="font-semibold text-base">
                                        {centerName || (centerIdNum ? `Center ${centerIdNum}` : t('vehicles.summary.noCenterAssigned'))}
                                      </h3>
                                      <p className="text-xs text-muted-foreground">
                                        {t('vehicles.summary.vehicleCount', { count: vehicles.length })}
                                      </p>
                                    </div>
                                  </div>
                                  <Badge variant="secondary" className="text-sm font-medium">
                                    {vehicles.length}
                                  </Badge>
                                </div>
                              </div>

                              {/* Vehicles List */}
                              <div className="p-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                                  {(vehicles || []).map((vehicle: Vehicle) => (
                                    <div
                                      key={vehicle.id}
                                      className="group relative flex flex-col gap-2 p-3 rounded-lg border-2 bg-card hover:border-primary/60 hover:shadow-md hover:bg-accent/30 transition-all cursor-pointer"
                                      onClick={() => {
                                        if (canManageStatus) {
                                          setStatusSummaryModalOpen(false);
                                          openStatusUpdateModal(vehicle);
                                        }
                                      }}
                                    >
                                      {/* Plate Number - Prominent */}
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                          <p className="font-bold text-base text-foreground truncate">
                                            {vehicle.plate ?? t('common.notAvailable')}
                                          </p>
                                        </div>
                                        {canManageStatus && (
                                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-7 w-7 p-0 hover:bg-primary/10"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setStatusSummaryModalOpen(false);
                                                openStatusUpdateModal(vehicle);
                                              }}
                                              title={t('vehicles.summary.updateStatus')}
                                            >
                                              <Edit className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-7 w-7 p-0 hover:bg-primary/10"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setStatusSummaryModalOpen(false);
                                                openStatusHistoryModal(vehicle);
                                              }}
                                              title={t('vehicles.summary.viewHistory')}
                                            >
                                              <History className="h-3.5 w-3.5" />
                                            </Button>
                                          </div>
                                        )}
                                      </div>

                                      {/* Model/Brand */}
                                      {(vehicle.model || vehicle.brand) && (
                                        <p className="text-sm text-muted-foreground font-medium">
                                          {vehicle.model || vehicle.brand}
                                        </p>
                                      )}

                                      {/* Status Badge */}
                                      {vehicle.currentStatus && (
                                        <div className="mt-auto pt-1">
                                          <Badge
                                            variant="secondary"
                                            className={cn(
                                              'text-xs px-2 py-1 font-medium',
                                              vehicle.currentStatus === 'available' && 'bg-green-100 text-green-800 border border-green-200',
                                              vehicle.currentStatus === 'in_garage' && 'bg-yellow-100 text-yellow-800 border border-yellow-200',
                                              vehicle.currentStatus === 'in_transit' && 'bg-blue-100 text-blue-800 border border-blue-200',
                                              vehicle.currentStatus === 'in_processing' && 'bg-purple-100 text-purple-800 border border-purple-200',
                                              vehicle.currentStatus === 'at_center' && 'bg-indigo-100 text-indigo-800 border border-indigo-200',
                                              vehicle.currentStatus === 'unavailable' && 'bg-red-100 text-red-800 border border-red-200'
                                            )}
                                          >
                                            {getStatusLabel(vehicle.currentStatus)}
                                          </Badge>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="text-center py-16">
                <Car className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-base font-medium text-muted-foreground mb-1">
                  {t('vehicles.summary.emptyTitle')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('vehicles.summary.emptyDesc')}
                </p>
              </div>
            )}
          </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t bg-muted/30 shrink-0 flex justify-end">
                <Button variant="outline" onClick={() => setStatusSummaryModalOpen(false)}>
                  {t('vehicles.summary.close')}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

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
                {t('vehicles.preview.title', { count: previewVehicleIds.length })}
              </h2>
              <Button variant="ghost" size="icon" onClick={closePreviewModal} aria-label={t('common.close')}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {previewQrQueries.isLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">{t('vehicles.preview.loading')}</p>
                </div>
              ) : previewQrQueries.error ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-2">{t('vehicles.preview.loadError')}</p>
                  <Button variant="outline" size="sm" onClick={closePreviewModal}>
                    {t('common.close')}
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
                                {t('vehicles.preview.view')}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => qrData && downloadPreviewQrPdf(qrData)}
                                className="flex-1 gap-2 text-xs"
                              >
                                <Download className="h-3 w-3" />
                                {t('vehicles.preview.pdf')}
                              </Button>
                            </>
                          )}
                          {!qrData && item.error && (
                            <div className="flex-1 text-xs text-destructive text-center py-2">
                              {t('vehicles.preview.failed')}
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
                {t('vehicles.preview.close')}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
