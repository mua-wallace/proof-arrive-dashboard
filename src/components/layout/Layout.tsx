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

  const handleLogout = () => {
    clearAuth();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-card/95 backdrop-blur">
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center border-b px-6">
              <div>
                <h1 className="text-xl font-bold tracking-tight">Proof Arrive</h1>
                <p className="text-[11px] text-muted-foreground">
                  Live vehicle & arrival overview
                </p>
              </div>
            </div>
            <nav className="flex-1 space-y-1 p-4">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
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
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
