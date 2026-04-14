import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import {
  Loader2,
  Truck,
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  QrCode,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      navigate('/app');
    },
    onError: (err: any) => {
      const message = err.response?.data?.message ?? err.message;
      if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
        setError(t('login.networkError'));
      } else {
        setError(message || t('login.genericError'));
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    loginMutation.mutate({ username, password });
  };

  const highlights = [
    { icon: Activity, label: t('login.highlights.realtime') },
    { icon: QrCode, label: t('login.highlights.qr') },
    { icon: ShieldCheck, label: t('login.highlights.secure') },
  ];

  return (
    <div className="min-h-screen app-shell">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left: brand panel (hidden on small screens) */}
        <aside className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-10">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary-foreground/10" />
          <div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-primary-foreground/5" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-foreground/20 ring-1 ring-primary-foreground/30">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-semibold tracking-tight">Proof Arrive</p>
              <p className="text-xs text-primary-foreground/80">
                {t('landing.tagline')}
              </p>
            </div>
          </div>

          <div className="relative z-10 max-w-md">
            <div className="inline-flex items-center rounded-full border border-primary-foreground/30 bg-primary-foreground/15 px-3 py-1 text-xs font-medium">
              <Sparkles className="mr-1 h-3.5 w-3.5" />
              {t('landing.badge')}
            </div>
            <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
              {t('login.welcomeTitle')}
            </h2>
            <p className="mt-3 text-sm text-primary-foreground/85 sm:text-base">
              {t('login.welcomeSubtitle')}
            </p>

            <ul className="mt-8 space-y-3">
              {highlights.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3 text-sm">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-foreground/15 ring-1 ring-primary-foreground/25">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-primary-foreground/95">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="relative z-10 text-xs text-primary-foreground/70">
            {t('landing.footer')} {import.meta.env.VITE_API_BASE_URL}
          </p>
        </aside>

        {/* Right: form panel */}
        <main className="relative flex items-center justify-center px-4 py-10 sm:px-8">
          <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
            <LanguageSwitcher />
          </div>

          <div className="w-full max-w-md">
            {/* Mobile brand */}
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight text-foreground">
                  Proof Arrive
                </p>
                <p className="text-xs text-muted-foreground">{t('landing.tagline')}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
              <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {t('login.title')}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('login.description')}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="username">{t('login.username')}</Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      autoComplete="username"
                      placeholder={t('login.usernamePlaceholder')}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      disabled={loginMutation.isPending}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t('login.password')}</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder={t('login.passwordPlaceholder')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loginMutation.isPending}
                      className="pl-9 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={
                        showPassword ? t('login.hidePassword') : t('login.showPassword')
                      }
                      className={cn(
                        'absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md',
                        'text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
                      )}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('login.signingIn')}
                    </>
                  ) : (
                    t('login.submit')
                  )}
                </Button>
              </form>
            </div>

            <div className="mt-6 text-center">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {t('login.backHome')}
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
