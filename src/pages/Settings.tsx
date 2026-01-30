import { useQuery } from '@tanstack/react-query';
import { dashboardApi, CurrentUser } from '@/api/dashboard';
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
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

function getInitials(name: string | undefined): string {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function UserDetailsCard({ user }: { user: CurrentUser }) {
  const displayName = user.fullname ?? user.username ?? '—';
  const initials = getInitials(displayName !== '—' ? displayName : undefined);

  const details = [
    { label: 'Full name', value: displayName, icon: User },
    { label: 'Email', value: user.email ?? '—', icon: Mail },
    { label: 'Company', value: user.company ?? '—', icon: Building2 },
    { label: 'Account ID', value: user.accid ?? '—', icon: User },
    { label: 'Sub ID', value: user.subid ?? '—', icon: User },
    { label: 'Last login', value: user.lastLoginAt ? formatDate(user.lastLoginAt) : '—', icon: Calendar },
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
            <CardDescription>Your account details from the server</CardDescription>
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
  const { data: currentUser, isLoading, error } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => dashboardApi.getCurrentUser(),
  });

  return (
    <div className="space-y-8">
      {/* Hero header */}
      <div className="relative rounded-xl border bg-gradient-to-br from-card to-muted/30 p-6 sm:p-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
        <div className="absolute right-4 top-4 text-muted-foreground/40">
          <Sparkles className="h-16 w-16" />
        </div>
        <div className="relative flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <SettingsIcon className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Settings
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Manage your account and preferences
              </p>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Loading your profile…</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Could not load profile</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'An error occurred. Please try again.'}
          </AlertDescription>
        </Alert>
      ) : currentUser ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <UserDetailsCard user={currentUser} />
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sliders className="h-5 w-5 text-primary" />
                  More options
                </CardTitle>
                <CardDescription>
                  Additional settings will appear here
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Password change, notifications, API keys, and other preferences can be added in this section.
                </p>
              </CardContent>
              <CardFooter className="border-t bg-muted/20">
                <Button variant="outline" size="sm" disabled className="gap-2">
                  Coming soon
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
