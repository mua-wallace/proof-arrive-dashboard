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
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card/60 px-4 py-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
          <UsersIcon className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 leading-tight">
          <h1 className="text-base font-bold tracking-tight">{t('users.title')}</h1>
          <p className="text-[11px] text-muted-foreground">{t('users.subtitle')}</p>
        </div>
      </div>

      <Card className="rounded-xl">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm font-semibold">{t('users.filterTitle')}</CardTitle>
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
                  placeholder={t('users.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="searchBy" className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {t('users.searchFields')}
              </Label>
              <Select
                id="searchBy"
                className="h-8 text-xs"
                value={searchBy}
                onChange={(e) => setSearchBy(e.target.value)}
              >
                <option value="username">{t('users.searchByUsername')}</option>
                <option value="fullname">{t('users.searchByFullname')}</option>
                <option value="email">{t('users.searchByEmail')}</option>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="sortBy" className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {t('users.sortBy')}
              </Label>
              <Select
                id="sortBy"
                className="h-8 text-xs"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="lastLoginAt:DESC">{t('users.sort.lastLoginDesc')}</option>
                <option value="lastLoginAt:ASC">{t('users.sort.lastLoginAsc')}</option>
                <option value="username:ASC">{t('users.sort.usernameAsc')}</option>
                <option value="username:DESC">{t('users.sort.usernameDesc')}</option>
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

      <Card className="rounded-xl">
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm font-semibold">{t('users.listTitle')}</CardTitle>
          <CardDescription className="text-[11px]">
            {usersData && usersData.meta && usersData.meta.totalItems > 0
              ? t('users.listDescription', {
                  from: (page - 1) * limit + 1,
                  to: Math.min(page * limit, usersData.meta.totalItems),
                  total: formatNumber(usersData.meta.totalItems),
                })
              : t('users.emptyTitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <UsersIcon className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
              <p className="mb-1 text-xs text-muted-foreground">{t('users.loadError')}</p>
              <p className="text-[11px] text-muted-foreground">
                {error instanceof Error ? error.message : t('users.fetchError')}
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
          ) : !usersData || !usersData.data || usersData.data.length === 0 ? (
            <div className="py-8 text-center">
              <UsersIcon className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{t('users.emptyTitle')}</p>
            </div>
          ) : (
            <>
              <div className="border-t">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="h-8 py-1 text-[10px]">{t('users.columns.fullname')}</TableHead>
                      <TableHead className="h-8 py-1 text-[10px]">{t('users.columns.email')}</TableHead>
                      <TableHead className="h-8 py-1 text-[10px]">{t('users.columns.company')}</TableHead>
                      <TableHead className="h-8 py-1 text-[10px]">
                        <SortButton field="lastLoginAt">{t('users.columns.lastLogin')}</SortButton>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersData.data.map((user: any) => (
                      <TableRow key={user.id || user.accid || user.subid}>
                        <TableCell className="py-1.5 text-xs font-medium">{user.fullname || user.fullName || t('common.notAvailable')}</TableCell>
                        <TableCell className="py-1.5 text-xs">{user.email ?? t('common.notAvailable')}</TableCell>
                        <TableCell className="py-1.5 text-xs">{user.company ?? t('common.notAvailable')}</TableCell>
                        <TableCell className="py-1.5 text-[11px] text-muted-foreground">
                          {user.lastLoginAt ? formatDate(user.lastLoginAt) : t('common.notAvailable')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {usersData.meta && usersData.meta.totalPages > 1 && (
                <div className="flex items-center justify-between border-t px-3 py-2">
                  <div className="text-[11px] text-muted-foreground">
                    {t('common.pageOf', { page: usersData.meta.currentPage, total: usersData.meta.totalPages })}
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
                      onClick={() => setPage((p) => Math.min(usersData.meta.totalPages, p + 1))}
                      disabled={page === usersData.meta.totalPages}
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
    </div>
  );
}
