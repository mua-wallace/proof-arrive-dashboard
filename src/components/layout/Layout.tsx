import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

const mainNav = [
  { name: 'Dashboard', href: '/app', icon: LayoutDashboard },
  { name: 'Trips', href: '/app/trips', icon: ArrowRightLeft },
  { name: 'Vehicles', href: '/app/vehicles', icon: Car },
  { name: 'Available vehicles', href: '/app/available-vehicles', icon: CheckCircle2 },
  { name: 'Centers', href: '/app/centers', icon: Building2 },
];

const otherNav = [{ name: 'Users', href: '/app/users', icon: Users }];

export default function Layout() {
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    clearAuth();
    window.location.href = '/';
  };

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  const NavLink = ({
    item,
    isActive,
  }: {
    item: (typeof mainNav)[0];
    isActive: boolean;
  }) => {
    const Icon = item.icon;
    return (
      <Link
        to={item.href}
        title={isSidebarCollapsed ? item.name : undefined}
        className={cn(
          'flex items-center rounded-xl text-sm font-medium transition-all duration-200',
          isSidebarCollapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5',
          isActive
            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        {!isSidebarCollapsed && <span>{item.name}</span>}
      </Link>
    );
  };

  return (
    <div className="min-h-screen app-shell">
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside
          className={cn(
            'flex flex-col border-r border-border/80 bg-card/80 backdrop-blur-xl transition-all duration-300',
            isSidebarCollapsed ? 'w-[72px]' : 'w-64'
          )}
        >
          {/* Brand */}
          <div className="flex h-16 items-center border-b border-border/80 px-4">
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
                  <span className="text-lg font-bold text-primary">P</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight sidebar-brand">Proof Arrive</h1>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Fleet & trips
                  </p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'ml-auto h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground',
                isSidebarCollapsed && 'mx-auto'
              )}
              onClick={toggleSidebar}
            >
              {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          {/* Main nav */}
          <nav className={cn('flex-1 overflow-y-auto', isSidebarCollapsed ? 'p-2' : 'p-3')}>
            {!isSidebarCollapsed && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Main
              </p>
            )}
            <div className="space-y-0.5">
              {mainNav.map((item) => (
                <NavLink key={item.name} item={item} isActive={location.pathname === item.href} />
              ))}
            </div>
            {!isSidebarCollapsed && (
              <>
                <p className="mb-2 mt-5 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Other
                </p>
                <div className="space-y-0.5">
                  {otherNav.map((item) => (
                    <NavLink key={item.name} item={item} isActive={location.pathname === item.href} />
                  ))}
                </div>
              </>
            )}
          </nav>

          {/* Bottom: Settings + user */}
          <div className={cn('border-t border-border/80', isSidebarCollapsed ? 'p-2' : 'p-3')}>
            <Link
              to="/app/settings"
              title={isSidebarCollapsed ? 'Settings' : undefined}
              className={cn(
                'flex items-center rounded-xl text-sm font-medium transition-all',
                isSidebarCollapsed ? 'justify-center py-2.5' : 'gap-3 px-3 py-2.5',
                location.pathname === '/app/settings'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Settings className="h-5 w-5 flex-shrink-0" />
              {!isSidebarCollapsed && <span>Settings</span>}
            </Link>
            {!isSidebarCollapsed && (
              <div className="mt-3 rounded-xl bg-muted/60 p-3">
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Signed in
                </p>
                <p className="mt-0.5 truncate text-sm font-medium">{user?.username ?? 'agent'}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full gap-2"
                  onClick={handleLogout}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </Button>
              </div>
            )}
            {isSidebarCollapsed && (
              <Button variant="outline" size="icon" className="mt-2 w-full" onClick={handleLogout} title="Logout">
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1600px] px-3 py-5 sm:px-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
