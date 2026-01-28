import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { dashboardApi, DashboardOverview } from '@/api/dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  Building2,
  Car,
  ArrowRightLeft,
  LogOut,
  Truck,
  Package,
  Activity,
  QrCode,
  TrendingUp,
  Clock,
  BarChart3,
  PieChart,
} from 'lucide-react';
import { formatDate, formatNumber } from '@/lib/utils';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

// Mock data for when backend is unavailable
const getMockDashboardData = (): DashboardOverview => {
  return {
    stats: {
      totalUsers: 156,
      totalCenters: 12,
      totalVehicles: 342,
      totalArrivals: 1247,
      totalExits: 1189,
      totalIncomingVehicles: 23,
      totalProcessingStages: 89,
      activeVehicles: 298,
      vehiclesWithQrCode: 267,
      recentArrivals: 45,
      recentExits: 38,
    },
    recentActivity: {
      latestArrivals: [
        { vehicle: { plate: 'ABC-123' }, center: { name: 'North Center' }, createdAt: new Date().toISOString() },
        { vehicle: { plate: 'XYZ-789' }, center: { name: 'South Center' }, createdAt: new Date(Date.now() - 3600000).toISOString() },
        { vehicle: { plate: 'DEF-456' }, center: { name: 'East Center' }, createdAt: new Date(Date.now() - 7200000).toISOString() },
        { vehicle: { plate: 'GHI-012' }, center: { name: 'West Center' }, createdAt: new Date(Date.now() - 10800000).toISOString() },
        { vehicle: { plate: 'JKL-345' }, center: { name: 'Central Hub' }, createdAt: new Date(Date.now() - 14400000).toISOString() },
      ],
      latestExits: [
        { vehicle: { plate: 'ABC-123' }, center: { name: 'North Center' }, createdAt: new Date(Date.now() - 1800000).toISOString() },
        { vehicle: { plate: 'MNO-678' }, center: { name: 'South Center' }, createdAt: new Date(Date.now() - 5400000).toISOString() },
        { vehicle: { plate: 'PQR-901' }, center: { name: 'East Center' }, createdAt: new Date(Date.now() - 9000000).toISOString() },
        { vehicle: { plate: 'STU-234' }, center: { name: 'West Center' }, createdAt: new Date(Date.now() - 12600000).toISOString() },
        { vehicle: { plate: 'VWX-567' }, center: { name: 'Central Hub' }, createdAt: new Date(Date.now() - 16200000).toISOString() },
      ],
      latestVehicles: [
        { plate: 'NEW-001', brand: 'Toyota', model: 'Camry', isActive: true, thirdPartyId: 1001 },
        { plate: 'NEW-002', brand: 'Honda', model: 'Civic', isActive: true, thirdPartyId: 1002 },
        { plate: 'NEW-003', brand: 'Ford', model: 'F-150', isActive: false, thirdPartyId: 1003 },
        { plate: 'NEW-004', brand: 'Chevrolet', model: 'Silverado', isActive: true, thirdPartyId: 1004 },
        { plate: 'NEW-005', brand: 'Nissan', model: 'Altima', isActive: true, thirdPartyId: 1005 },
      ],
    },
    summary: {
      vehiclesByStatus: {
        active: 298,
        inactive: 44,
      },
      arrivalsByStatus: {
        completed: 1150,
        pending: 97,
      },
      exitsByType: {
        normal: 1100,
        emergency: 89,
      },
    },
  };
};

export default function Dashboard() {
  const { data, isLoading, error } = useQuery<DashboardOverview>({
    queryKey: ['dashboard', 'overview'],
    queryFn: dashboardApi.getOverview,
    refetchInterval: 180000, // Refetch every 3 minutes
    retry: false, // Don't retry on error
  });

  // Use mock data if API fails
  const dashboardData = error ? (() => {
    console.warn('⚠️ Dashboard API unavailable, using mock data:', error);
    return getMockDashboardData();
  })() : data;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Loading overview...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Show loading state only if not using mock data
  if (isLoading && !error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Loading overview...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = dashboardData?.stats || {
    totalUsers: 0,
    totalCenters: 0,
    totalVehicles: 0,
    totalArrivals: 0,
    totalExits: 0,
    totalIncomingVehicles: 0,
    totalProcessingStages: 0,
    activeVehicles: 0,
    vehiclesWithQrCode: 0,
    recentArrivals: 0,
    recentExits: 0,
  };

  const recentActivity = dashboardData?.recentActivity || {
    latestArrivals: [],
    latestExits: [],
    latestVehicles: [],
  };

  const summary = dashboardData?.summary || {
    vehiclesByStatus: {},
    arrivalsByStatus: {},
    exitsByType: {},
  };

  const statCards = [
    {
      title: 'Total Users',
      value: formatNumber(stats.totalUsers),
      icon: Users,
      link: '/app/users',
      description: 'Registered users',
      color: 'text-blue-600',
    },
    {
      title: 'Centers',
      value: formatNumber(stats.totalCenters),
      icon: Building2,
      link: '/app/centers',
      description: 'Processing centers',
      color: 'text-purple-600',
    },
    {
      title: 'Total Vehicles',
      value: formatNumber(stats.totalVehicles),
      icon: Car,
      link: '/app/vehicles',
      description: `${formatNumber(stats.activeVehicles)} active`,
      color: 'text-emerald-600',
    },
    {
      title: 'Arrivals',
      value: formatNumber(stats.totalArrivals),
      icon: ArrowRightLeft,
      link: '/app/arrivals',
      description: `${formatNumber(stats.recentArrivals)} recent (24h)`,
      color: 'text-green-600',
    },
    {
      title: 'Exits',
      value: formatNumber(stats.totalExits),
      icon: LogOut,
      link: '/app/exits',
      description: `${formatNumber(stats.recentExits)} recent (24h)`,
      color: 'text-orange-600',
    },
    {
      title: 'Incoming Vehicles',
      value: formatNumber(stats.totalIncomingVehicles),
      icon: Truck,
      link: '/app/incoming-vehicles',
      description: 'In transit',
      color: 'text-cyan-600',
    },
    {
      title: 'Processing Stages',
      value: formatNumber(stats.totalProcessingStages),
      icon: Package,
      link: '/app/processing-stages',
      description: 'Active stages',
      color: 'text-indigo-600',
    },
    {
      title: 'Vehicles with QR',
      value: formatNumber(stats.vehiclesWithQrCode),
      icon: QrCode,
      link: '/app/vehicles',
      description: `${Math.round((stats.vehiclesWithQrCode / Math.max(stats.totalVehicles, 1)) * 100)}% coverage`,
      color: 'text-pink-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of all entities and recent activity
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Activity className="h-4 w-4" />
          <span>Auto-refreshing every 3 minutes</span>
          {error && (
            <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 rounded text-xs">
              Using demo data
            </span>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.title} to={card.link}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Vehicles by Status - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Vehicles by Status
            </CardTitle>
            <CardDescription>Current vehicle distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(summary.vehiclesByStatus).length > 0 ? (
              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={Object.entries(summary.vehiclesByStatus).map(([name, value]) => ({
                        name: name.charAt(0).toUpperCase() + name.slice(1),
                        value: value as number,
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries(summary.vehiclesByStatus).map((_, index) => {
                        const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatNumber(value)} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-center">
                  <PieChart className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No status data available</p>
                  <p className="text-xs text-muted-foreground mt-1">Charts will appear when data is loaded</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Arrivals vs Exits - Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Arrivals vs Exits
            </CardTitle>
            <CardDescription>Comparison of arrivals and exits</CardDescription>
          </CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    {
                      name: 'Total',
                      Arrivals: stats.totalArrivals,
                      Exits: stats.totalExits,
                    },
                    {
                      name: 'Recent (24h)',
                      Arrivals: stats.recentArrivals,
                      Exits: stats.recentExits,
                    },
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatNumber(value)} />
                  <Legend />
                  <Bar dataKey="Arrivals" fill="#10b981" />
                  <Bar dataKey="Exits" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Activity Overview
          </CardTitle>
          <CardDescription>Key metrics comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={[
                  {
                    name: 'Users',
                    value: stats.totalUsers,
                  },
                  {
                    name: 'Centers',
                    value: stats.totalCenters,
                  },
                  {
                    name: 'Vehicles',
                    value: stats.totalVehicles,
                  },
                  {
                    name: 'Arrivals',
                    value: stats.totalArrivals,
                  },
                  {
                    name: 'Exits',
                    value: stats.totalExits,
                  },
                  {
                    name: 'Incoming',
                    value: stats.totalIncomingVehicles,
                  },
                ]}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatNumber(value)} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Summary Tables */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Arrivals by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4" />
              Arrivals by Status
            </CardTitle>
            <CardDescription>Arrival status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(summary.arrivalsByStatus).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(summary.arrivalsByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{status}</span>
                    <span className="font-semibold">{formatNumber(count as number)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No arrival status data available</p>
            )}
          </CardContent>
        </Card>

        {/* Exits by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Exits by Type
            </CardTitle>
            <CardDescription>Exit type distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(summary.exitsByType).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(summary.exitsByType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{type}</span>
                    <span className="font-semibold">{formatNumber(count as number)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No exit type data available</p>
            )}
          </CardContent>
        </Card>

        {/* Vehicle QR Coverage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              QR Code Coverage
            </CardTitle>
            <CardDescription>Vehicle QR code statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">With QR Code</span>
                <span className="font-semibold">{formatNumber(stats.vehiclesWithQrCode)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Without QR Code</span>
                <span className="font-semibold">
                  {formatNumber(stats.totalVehicles - stats.vehiclesWithQrCode)}
                </span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Coverage</span>
                  <span className="font-bold text-lg">
                    {Math.round((stats.vehiclesWithQrCode / Math.max(stats.totalVehicles, 1)) * 100)}%
                  </span>
                </div>
                <div className="mt-2 w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.round((stats.vehiclesWithQrCode / Math.max(stats.totalVehicles, 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Recent Arrivals */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent Arrivals
                </CardTitle>
                <CardDescription>Latest vehicle arrivals</CardDescription>
              </div>
              <Link to="/app/arrivals">
                <Button variant="ghost" size="sm">View all</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentActivity.latestArrivals.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.latestArrivals.slice(0, 5).map((arrival: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">
                        {arrival.vehicle?.plate || arrival.vehicleId || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {arrival.center?.name || arrival.centerId || 'Unknown center'}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {arrival.createdAt ? formatDate(arrival.createdAt) : 'N/A'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent arrivals</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Exits */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Recent Exits
                </CardTitle>
                <CardDescription>Latest vehicle exits</CardDescription>
              </div>
              <Link to="/app/exits">
                <Button variant="ghost" size="sm">View all</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentActivity.latestExits.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.latestExits.slice(0, 5).map((exit: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">
                        {exit.vehicle?.plate || exit.vehicleId || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {exit.center?.name || exit.centerId || 'Unknown center'}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {exit.createdAt ? formatDate(exit.createdAt) : 'N/A'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent exits</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Vehicles */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Recent Vehicles
                </CardTitle>
                <CardDescription>Latest registered vehicles</CardDescription>
              </div>
              <Link to="/app/vehicles">
                <Button variant="ghost" size="sm">View all</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentActivity.latestVehicles.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.latestVehicles.slice(0, 5).map((vehicle: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">
                        {vehicle.plate || vehicle.thirdPartyId || 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {vehicle.brand} {vehicle.model || ''}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      vehicle.isActive 
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {vehicle.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent vehicles</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
