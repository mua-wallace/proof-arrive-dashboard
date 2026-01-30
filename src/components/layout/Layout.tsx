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
  Package,
  Truck,
  ChevronLeft,
  ChevronRight,
  Settings,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/app', icon: LayoutDashboard },
  { name: 'Users', href: '/app/users', icon: Users },
  { name: 'Vehicles', href: '/app/vehicles', icon: Car },
  { name: 'Centers', href: '/app/centers', icon: Building2 },
  { name: 'Arrivals', href: '/app/arrivals', icon: ArrowRightLeft },
  { name: 'Exits', href: '/app/exits', icon: LogOut },
  { name: 'Incoming Vehicles', href: '/app/incoming-vehicles', icon: Truck },
  { name: 'Processing Stages', href: '/app/processing-stages', icon: Package },
];

export default function Layout() {
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    clearAuth();
    window.location.href = '/';
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside
          className={`${
            isSidebarCollapsed ? 'w-16' : 'w-64'
          } border-r bg-card/95 backdrop-blur transition-all duration-300 relative`}
        >
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center border-b px-6 relative">
              {!isSidebarCollapsed && (
                <div>
                  <h1 className="text-xl font-bold tracking-tight">Proof Arrive</h1>
                  <p className="text-[11px] text-muted-foreground">
                    Live vehicle & arrival overview
                  </p>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={toggleSidebar}
              >
                {isSidebarCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            </div>
            <nav className={`flex-1 space-y-1 ${isSidebarCollapsed ? 'p-2' : 'p-4'}`}>
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center rounded-lg text-sm font-medium transition-colors ${
                      isSidebarCollapsed
                        ? 'justify-center px-0 py-2'
                        : 'gap-3 px-3 py-2'
                    } ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                    title={isSidebarCollapsed ? item.name : undefined}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!isSidebarCollapsed && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </nav>
            {/* Settings link at bottom */}
            <div className={isSidebarCollapsed ? 'p-2' : 'px-4 pb-2'}>
              <Link
                to="/app/settings"
                className={`flex items-center rounded-lg text-sm font-medium transition-colors ${
                  isSidebarCollapsed ? 'justify-center px-0 py-2' : 'gap-3 px-3 py-2'
                } ${
                  location.pathname === '/app/settings'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
                title={isSidebarCollapsed ? 'Settings' : undefined}
              >
                <Settings className="h-5 w-5 flex-shrink-0" />
                {!isSidebarCollapsed && <span>Settings</span>}
              </Link>
            </div>
            {!isSidebarCollapsed && (
              <div className="border-t p-4">
                <div className="mb-2 px-3 text-xs text-muted-foreground">
                  Signed in as
                  <span className="ml-1 font-medium text-foreground">
                    {user?.username ?? 'agent'}
                  </span>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            )}
            {isSidebarCollapsed && (
              <div className="border-t p-2 space-y-1">
                <Link
                  to="/app/settings"
                  className={`flex justify-center rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground ${
                    location.pathname === '/app/settings' ? 'bg-primary text-primary-foreground' : ''
                  }`}
                  title="Settings"
                >
                  <Settings className="h-5 w-5" />
                </Link>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-full"
                  onClick={handleLogout}
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="w-full px-4 py-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
