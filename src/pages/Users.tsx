import { useState, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
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
import { Users as UsersIcon, Search, ChevronLeft, ChevronRight, ArrowUpDown, Loader2 } from 'lucide-react';
import { formatDate, formatNumber } from '@/lib/utils';

export default function Users() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [searchBy, setSearchBy] = useState('username');
  const [sortBy, setSortBy] = useState('lastLoginAt:DESC');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page on new search
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
    queryKey: ['users', query],
    queryFn: () => dashboardApi.getUsers(query),
    placeholderData: keepPreviousData,
  });

  const usersData = data as PaginateResult<any> | undefined;

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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <UsersIcon className="h-8 w-8" />
          {t('users.title')}
        </h1>
        <p className="text-muted-foreground">
          {t('users.subtitle')}
        </p>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>{t('users.filterTitle')}</CardTitle>
          <CardDescription>{t('users.filterDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">{t('common.search')}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder={t('users.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="searchBy">{t('users.searchFields')}</Label>
              <Select
                id="searchBy"
                value={searchBy}
                onChange={(e) => setSearchBy(e.target.value)}
              >
                <option value="username">{t('users.searchByUsername')}</option>
                <option value="fullname">{t('users.searchByFullname')}</option>
                <option value="email">{t('users.searchByEmail')}</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortBy">{t('users.sortBy')}</Label>
              <Select
                id="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="lastLoginAt:DESC">{t('users.sort.lastLoginDesc')}</option>
                <option value="lastLoginAt:ASC">{t('users.sort.lastLoginAsc')}</option>
                <option value="username:ASC">{t('users.sort.usernameAsc')}</option>
                <option value="username:DESC">{t('users.sort.usernameDesc')}</option>
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

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('users.listTitle')}</CardTitle>
              <CardDescription>
                {usersData && usersData.meta && usersData.meta.totalItems > 0
                  ? t('users.listDescription', {
                      from: (page - 1) * limit + 1,
                      to: Math.min(page * limit, usersData.meta.totalItems),
                      total: formatNumber(usersData.meta.totalItems),
                    })
                  : t('users.emptyTitle')}
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
              <UsersIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">{t('users.loadError')}</p>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : t('users.fetchError')}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                {t('common.retry')}
              </Button>
            </div>
          ) : !usersData || !usersData.data || usersData.data.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t('users.emptyTitle')}</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('users.columns.fullname')}</TableHead>
                      <TableHead>{t('users.columns.email')}</TableHead>
                      <TableHead>{t('users.columns.company')}</TableHead>
                      <TableHead>
                        <SortButton field="lastLoginAt">{t('users.columns.lastLogin')}</SortButton>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersData.data.map((user: any) => (
                      <TableRow key={user.id || user.accid || user.subid}>
                        <TableCell className="font-medium">{user.fullname || user.fullName || t('common.notAvailable')}</TableCell>
                        <TableCell>{user.email ?? t('common.notAvailable')}</TableCell>
                        <TableCell>{user.company ?? t('common.notAvailable')}</TableCell>
                        <TableCell>
                          {user.lastLoginAt ? formatDate(user.lastLoginAt) : t('common.notAvailable')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {usersData.meta && usersData.meta.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    {t('common.pageOf', { page: usersData.meta.currentPage, total: usersData.meta.totalPages })}
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
                      {Array.from({ length: Math.min(5, usersData.meta.totalPages) }, (_, i) => {
                        let pageNum;
                        if (usersData.meta.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= usersData.meta.totalPages - 2) {
                          pageNum = usersData.meta.totalPages - 4 + i;
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
                      onClick={() => setPage((p) => Math.min(usersData.meta.totalPages, p + 1))}
                      disabled={page === usersData.meta.totalPages}
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
    </div>
  );
}
