import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { Car, Search, ChevronLeft, ChevronRight, ArrowUpDown, Loader2, QrCode } from 'lucide-react';
import { formatDate, formatNumber } from '@/lib/utils';

export default function Vehicles() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [searchBy, setSearchBy] = useState('plate,model,brand');
  const [sortBy, setSortBy] = useState('createdAt:DESC');
  const [debouncedSearch, setDebouncedSearch] = useState('');

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
    queryKey: ['vehicles', query],
    queryFn: () => dashboardApi.getVehicles(query),
    keepPreviousData: true,
  });

  const vehiclesData = data;

  const handleSort = (field: string) => {
    const [currentField, currentDirection] = sortBy.split(':');
    const newDirection = currentField === field && currentDirection === 'ASC' ? 'DESC' : 'ASC';
    setSortBy(`${field}:${newDirection}`);
  };

  const SortButton = ({ field, children }: { field: string; children: React.ReactNode }) => {
    const [currentField, currentDirection] = sortBy.split(':');
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

  const renderQrCode = (qrCode: string | null) => {
    if (!qrCode) {
      return <span className="text-muted-foreground">Not Generated</span>;
    }
    // If qrCode is a data URL (base64 image), display it
    if (qrCode.startsWith('data:image')) {
      return (
        <div className="flex items-center gap-2">
          <img src={qrCode} alt="QR Code" className="h-8 w-8" />
          <QrCode className="h-4 w-4 text-muted-foreground" />
        </div>
      );
    }
    // If it's a string, display it
    return (
      <div className="flex items-center gap-2">
        <QrCode className="h-4 w-4 text-primary" />
        <span className="text-xs font-mono max-w-[100px] truncate">{qrCode}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Car className="h-8 w-8" />
          Vehicles
        </h1>
        <p className="text-muted-foreground">
          View and manage vehicles in the system
        </p>
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
                        <TableCell>{renderQrCode(vehicle.qrCode)}</TableCell>
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
    </div>
  );
}
