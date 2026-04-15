import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { dashboardApi, CurrentUser, PaginateResult, VehicleGroup } from '@/api/dashboard';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Settings as SettingsIcon,
  User,
  Mail,
  Building2,
  Shield,
  Calendar,
  Loader2,
  AlertCircle,
  Sparkles,
  Sliders,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Car,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from '@/lib/toast';

function getInitials(name: string | undefined): string {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function UserDetailsCard({ user, t }: { user: CurrentUser; t: TFunction }) {
  const displayName = user.fullname ?? user.username ?? '—';
  const initials = getInitials(displayName !== '—' ? displayName : undefined);

  const details = [
    { label: t('settings.profile.fullName'), value: displayName, icon: User },
    { label: t('settings.profile.email'), value: user.email ?? '—', icon: Mail },
    { label: t('settings.profile.company'), value: user.company ?? '—', icon: Building2 },
    { label: t('settings.profile.accountId'), value: user.accid ?? '—', icon: User },
    { label: t('settings.profile.subId'), value: user.subid ?? '—', icon: User },
    { label: t('settings.profile.lastLogin'), value: user.lastLoginAt ? formatDate(user.lastLoginAt) : '—', icon: Calendar },
  ];

  return (
    <Card className="overflow-hidden">
      <div className="h-20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />
      <CardHeader className="pb-2">
        <div className="flex items-start gap-4 -mt-12">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-card bg-primary text-lg font-semibold text-primary-foreground shadow-lg">
            {initials}
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <CardTitle className="text-xl flex items-center gap-2 flex-wrap">
              {displayName}
              {user.role && (
                <Badge variant="secondary" className="font-normal">
                  <Shield className="h-3 w-3 mr-1" />
                  {user.role}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>{t('settings.profile.serverDetails')}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          {details.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="flex items-start gap-3 rounded-lg border bg-muted/30 px-4 py-3"
            >
              <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {label}
                </dt>
                <dd className="text-sm font-medium break-words mt-0.5">{value}</dd>
              </div>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { data: currentUser, isLoading, error } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => dashboardApi.getCurrentUser(),
  });

  // Check if user is admin or manager
  const canManageGroups = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  // Vehicle groups sync state
  const [groupsPage, setGroupsPage] = useState(1);
  const [groupsLimit, setGroupsLimit] = useState(100);
  const [groupsNode, setGroupsNode] = useState('root');
  const [groupsSync, setGroupsSync] = useState(false);
  const [groupsSearch, setGroupsSearch] = useState('');
  const [groupsSortBy, setGroupsSortBy] = useState('name:ASC');
  const [debouncedGroupsSearch, setDebouncedGroupsSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedGroupsSearch(groupsSearch);
      setGroupsPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [groupsSearch]);

  const [shouldFetchGroups, setShouldFetchGroups] = useState(false);

  // Fetch vehicle groups from API
  const {
    data: groupsData,
    isLoading: groupsLoading,
    error: groupsError,
  } = useQuery<PaginateResult<VehicleGroup>>({
    queryKey: ['vehicle-groups-from-api', groupsPage, groupsLimit, groupsNode, false, debouncedGroupsSearch, groupsSortBy],
    queryFn: () =>
      dashboardApi.getVehicleGroupsFromApi({
        page: groupsPage,
        limit: groupsLimit,
        node: groupsNode,
        sync: false,
        search: debouncedGroupsSearch || undefined,
        sortBy: groupsSortBy || undefined,
      }),
    enabled: canManageGroups && shouldFetchGroups,
  });

  // Sync mutation
  const syncGroupsMutation = useMutation({
    mutationFn: () =>
      dashboardApi.getVehicleGroupsFromApi({
        page: groupsPage,
        limit: groupsLimit,
        node: groupsNode,
        sync: true,
        search: debouncedGroupsSearch || undefined,
        sortBy: groupsSortBy || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-groups'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle-groups-from-api'] });
      toast.success(t('settings.groups.syncSuccess'), t('settings.groups.syncSuccessDesc'));
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message
        || error?.response?.data?.error
        || error?.message
        || t('settings.groups.syncErrorDefault');
      toast.error(t('settings.groups.syncErrorTitle'), errorMessage);
    },
  });

  const handleFetchGroups = () => {
    setShouldFetchGroups(true);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card/60 px-4 py-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
          <SettingsIcon className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 leading-tight">
          <h1 className="text-base font-bold tracking-tight">{t('settings.title')}</h1>
          <p className="text-[11px] text-muted-foreground">{t('settings.subtitle')}</p>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Loader2 className="mb-2 h-6 w-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">{t('settings.loadingProfile')}</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('settings.profileError')}</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : t('settings.profileErrorDefault')}
          </AlertDescription>
        </Alert>
      ) : currentUser ? (
        <div className="grid gap-3 lg:grid-cols-[340px_1fr]">
          <UserDetailsCard user={currentUser} t={t} />
          <div className="flex flex-col gap-3">
            {canManageGroups && (
              <Card>
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
                    <Car className="h-3.5 w-3.5 text-primary" />
                    {t('settings.groups.title')}
                  </CardTitle>
                  <CardDescription className="text-[11px]">
                    {t('settings.groups.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 p-3 pt-0">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="groups-node">{t('settings.groups.node')}</Label>
                      <Input
                        id="groups-node"
                        placeholder="root"
                        value={groupsNode}
                        onChange={(e) => setGroupsNode(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t('settings.groups.nodeHint')}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="groups-limit">{t('settings.groups.itemsPerPage')}</Label>
                      <Select
                        id="groups-limit"
                        value={String(groupsLimit)}
                        onChange={(e) => {
                          setGroupsLimit(Number(e.target.value));
                          setGroupsPage(1);
                        }}
                      >
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                        <option value="200">200</option>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="groups-search">{t('settings.groups.search')}</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="groups-search"
                        placeholder={t('settings.groups.searchPlaceholder')}
                        value={groupsSearch}
                        onChange={(e) => setGroupsSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="groups-sort">{t('settings.groups.sortBy')}</Label>
                    <Select
                      id="groups-sort"
                      value={groupsSortBy}
                      onChange={(e) => setGroupsSortBy(e.target.value)}
                    >
                      <option value="name:ASC">{t('settings.groups.sortNameAsc')}</option>
                      <option value="name:DESC">{t('settings.groups.sortNameDesc')}</option>
                      <option value="createdAt:DESC">{t('settings.groups.sortNewest')}</option>
                      <option value="createdAt:ASC">{t('settings.groups.sortOldest')}</option>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="groups-sync"
                      checked={groupsSync}
                      onCheckedChange={(checked) => setGroupsSync(checked === true)}
                    />
                    <Label htmlFor="groups-sync" className="cursor-pointer">
                      {t('settings.groups.syncToDb')}
                    </Label>
                  </div>

                  {groupsError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>{t('settings.groups.errorTitle')}</AlertTitle>
                      <AlertDescription>
                        {(groupsError as any)?.response?.data?.message || (groupsError as Error)?.message || t('settings.groups.fetchError')}
                      </AlertDescription>
                    </Alert>
                  )}

                  {groupsData && (
                    <div className="rounded-md border p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          {t('settings.groups.found', { count: groupsData.meta?.totalItems ?? 0 })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t('settings.groups.pageOf', { page: groupsData.meta?.currentPage ?? 1, total: groupsData.meta?.totalPages ?? 1 })}
                        </p>
                      </div>
                      {groupsData.data && groupsData.data.length > 0 ? (
                        <>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {groupsData.data.map((group: VehicleGroup) => (
                              <div
                                key={group.groupId}
                                className="flex items-center justify-between p-2 rounded border bg-muted/30"
                              >
                                <div>
                                  <p className="text-sm font-medium">{group.groupName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {t('settings.groups.vehiclesCount', { count: group.total })}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                          {groupsData.meta && groupsData.meta.totalPages > 1 && (
                            <div className="flex items-center justify-between pt-2 border-t">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setGroupsPage((p) => Math.max(1, p - 1))}
                                disabled={groupsPage === 1 || groupsLoading}
                              >
                                <ChevronLeft className="h-4 w-4" />
                                {t('settings.groups.previous')}
                              </Button>
                              <span className="text-xs text-muted-foreground">
                                {t('settings.groups.pageOf', { page: groupsPage, total: groupsData.meta.totalPages })}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setGroupsPage((p) => Math.min(groupsData.meta!.totalPages, p + 1))}
                                disabled={groupsPage === groupsData.meta!.totalPages || groupsLoading}
                              >
                                {t('settings.groups.next')}
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          {t('settings.groups.noGroups')}
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t bg-muted/20 flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleFetchGroups}
                    disabled={groupsLoading}
                    className="gap-2 flex-1"
                  >
                    {groupsLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t('settings.groups.loading')}
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4" />
                        {t('settings.groups.fetchGroups')}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => syncGroupsMutation.mutate()}
                    disabled={syncGroupsMutation.isPending || groupsLoading}
                    className="gap-2 flex-1"
                  >
                    {syncGroupsMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t('settings.groups.syncing')}
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        {t('settings.groups.syncToDatabase')}
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sliders className="h-5 w-5 text-primary" />
                  {t('settings.moreOptions.title')}
                </CardTitle>
                <CardDescription>
                  {t('settings.moreOptions.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('settings.moreOptions.placeholder')}
                </p>
              </CardContent>
              <CardFooter className="border-t bg-muted/20">
                <Button variant="outline" size="sm" disabled className="gap-2">
                  {t('settings.moreOptions.comingSoon')}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
