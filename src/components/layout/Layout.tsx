import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { dashboardApi } from '@/api/dashboard';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import {
  LayoutDashboard,
  Users,
  Car,
  Building2,
  ArrowRightLeft,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Settings,
  CheckCircle2,
  Bell,
  AlertTriangle,
  Menu,
  X as CloseIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActiveExceptions } from '@/hooks/useExceptions';

type NavItem = { key: string; labelKey: string; href: string; icon: typeof LayoutDashboard };

const mainNav: NavItem[] = [
  { key: 'dashboard', labelKey: 'nav.dashboard', href: '/app', icon: LayoutDashboard },
  { key: 'trips', labelKey: 'nav.trips', href: '/app/trips', icon: ArrowRightLeft },
  { key: 'vehicles', labelKey: 'nav.vehicles', href: '/app/vehicles', icon: Car },
  { key: 'availableVehicles', labelKey: 'nav.availableVehicles', href: '/app/available-vehicles', icon: CheckCircle2 },
  { key: 'centers', labelKey: 'nav.centers', href: '/app/centers', icon: Building2 },
];

const alertsNav: NavItem[] = [
  { key: 'incidents', labelKey: 'nav.incidents', href: '/app/incidents', icon: AlertTriangle },
];

const otherNav: NavItem[] = [
  { key: 'users', labelKey: 'nav.users', href: '/app/users', icon: Users },
];

export default function Layout() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const { data: pendingData } = useQuery({
    queryKey: ['trips', 'pending'],
    queryFn: () => dashboardApi.getPendingTrips(),
    retry: 1,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  const pendingCount = Array.isArray(pendingData?.data) ? pendingData.data.length : 0;

  const { data: activeExceptionsData } = useActiveExceptions();
  const activeIncidentsCount = activeExceptionsData?.length ?? 0;

  const { data: currentUser } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => dashboardApi.getCurrentUser(),
    staleTime: 5 * 60_000,
    retry: 1,
  });
  const displayRole =
    currentUser?.role ?? (user as { role?: string } | null)?.role ?? user?.username ?? '—';

  const handleBellClick = () => {
    navigate('/app/trips?view=uncompleted');
  };

  const handleLogout = () => {
    clearAuth();
    window.location.href = '/';
  };

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);
  const openMobileSidebar = () => setIsMobileSidebarOpen(true);
  const closeMobileSidebar = () => setIsMobileSidebarOpen(false);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  const showExpanded = !isSidebarCollapsed || isMobileSidebarOpen;

  const NavLink = ({
    item,
    isActive,
    count,
  }: {
    item: NavItem;
    isActive: boolean;
    count?: number;
  }) => {
    const Icon = item.icon;
    const label = t(item.labelKey);
    return (
      <Link
        to={item.href}
        title={!showExpanded ? label : undefined}
        className={cn(
          'relative flex items-center rounded-xl text-sm font-medium transition-all duration-200',
          showExpanded ? 'gap-3 px-3 py-2.5' : 'justify-center px-0 py-2.5',
          isActive
            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        {showExpanded && <span className="flex-1">{label}</span>}
        {count != null && count > 0 && (
          <span
            className={cn(
              'flex min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold leading-[16px] text-white tabular-nums',
              !showExpanded && 'absolute right-1 top-1',
            )}
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen app-shell">
      <div className="flex h-screen">
        {/* Mobile sidebar backdrop */}
        {isMobileSidebarOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={closeMobileSidebar}
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
          />
        )}
        {/* Sidebar */}
        <aside
          className={cn(
            'flex flex-col border-r border-border/80 bg-card/95 md:bg-card/80 backdrop-blur-xl transition-all duration-300',
            'fixed inset-y-0 left-0 z-40 md:static md:z-auto',
            isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
            'md:translate-x-0',
            isSidebarCollapsed ? 'md:w-[72px]' : 'md:w-64',
            'w-64'
          )}
        >
          {/* Brand */}
          <div className="flex h-16 items-center border-b border-border/80 px-4">
            {showExpanded && (
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
                  <span className="text-lg font-bold text-primary">P</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight sidebar-brand">Proof Arrive</h1>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {t('brand.subtitle')}
                  </p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'ml-auto h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hidden md:inline-flex',
                !showExpanded && 'mx-auto'
              )}
              onClick={toggleSidebar}
            >
              {!showExpanded ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground md:hidden"
              onClick={closeMobileSidebar}
              aria-label="Close navigation"
            >
              <CloseIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Main nav */}
          <nav className={cn('flex-1 overflow-y-auto', showExpanded ? 'p-3' : 'p-2')}>
            {showExpanded && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t('nav.sectionMain')}
              </p>
            )}
            <div className="space-y-0.5">
              {mainNav.map((item) => (
                <NavLink key={item.key} item={item} isActive={location.pathname === item.href} />
              ))}
            </div>
            {showExpanded && (
              <p className="mb-2 mt-5 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {t('nav.sectionAlerts')}
              </p>
            )}
            <div className="space-y-0.5">
              {alertsNav.map((item) => (
                <NavLink
                  key={item.key}
                  item={item}
                  isActive={location.pathname.startsWith(item.href)}
                  count={item.key === 'incidents' ? activeIncidentsCount : undefined}
                />
              ))}
            </div>
            {showExpanded && (
              <>
                <p className="mb-2 mt-5 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('nav.sectionOther')}
                </p>
                <div className="space-y-0.5">
                  {otherNav.map((item) => (
                    <NavLink key={item.key} item={item} isActive={location.pathname === item.href} />
                  ))}
                </div>
              </>
            )}
          </nav>

          {/* Bottom: Settings + user */}
          <div className={cn('border-t border-border/80', showExpanded ? 'p-3' : 'p-2')}>
            <Link
              to="/app/settings"
              title={!showExpanded ? t('nav.settings') : undefined}
              className={cn(
                'flex items-center rounded-xl text-sm font-medium transition-all',
                showExpanded ? 'gap-3 px-3 py-2.5' : 'justify-center py-2.5',
                location.pathname === '/app/settings'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Settings className="h-5 w-5 flex-shrink-0" />
              {showExpanded && <span>{t('nav.settings')}</span>}
            </Link>
            {showExpanded && (
              <div className="mt-3 rounded-xl bg-muted/60 p-3">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {t('nav.signedIn')}
                </p>
                <p className="mt-0.5 truncate text-sm font-medium capitalize">{displayRole}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full gap-2"
                  onClick={handleLogout}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  {t('nav.logout')}
                </Button>
              </div>
            )}
            {!showExpanded && (
              <Button variant="outline" size="icon" className="mt-2 w-full" onClick={handleLogout} title={t('nav.logout')}>
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto min-w-0">
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border/80 bg-background/80 px-4 backdrop-blur-xl sm:px-6">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl md:hidden"
              onClick={openMobileSidebar}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="ml-auto flex items-center gap-3">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={handleBellClick}
              title={
                pendingCount > 0
                  ? t('common.uncompletedTripsCount', { count: pendingCount })
                  : t('common.noUncompleted')
              }
              aria-label={t('trips.uncompletedTitle')}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Bell className="h-5 w-5" />
              {pendingCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold leading-none text-white ring-2 ring-background">
                  {pendingCount > 99 ? '99+' : pendingCount}
                </span>
              )}
            </button>
            </div>
          </header>
          <div className="mx-auto w-full max-w-[1600px] px-3 py-4 sm:px-4 sm:py-5 lg:px-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
