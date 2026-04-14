import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import {
  Truck,
  QrCode,
  Radar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  Activity,
} from 'lucide-react';

export default function Landing() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen app-shell">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-10">
        {/* Top bar */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-foreground">
                Proof Arrive
              </p>
              <p className="text-xs text-muted-foreground">
                {t('landing.tagline')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link to="/login">
              <Button variant="outline" size="sm">
                {t('landing.signIn')}
              </Button>
            </Link>
          </div>
        </header>

        {/* Hero — matches Dashboard header treatment */}
        <section className="relative mt-10 overflow-hidden rounded-2xl border border-primary/20 bg-primary px-6 py-10 text-primary-foreground shadow-lg sm:px-10 sm:py-12">
          <div className="relative z-10 max-w-2xl">
            <Badge
              variant="secondary"
              className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 font-medium"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              {t('landing.badge')}
            </Badge>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
              {t('landing.title1')}
              <span className="text-primary-foreground/90">{t('landing.title2')}</span>
              {t('landing.title3')}
            </h1>
            <p className="mt-4 max-w-xl text-sm text-primary-foreground/90 sm:text-base">
              {t('landing.description')}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/login">
                <Button
                  size="lg"
                  variant="secondary"
                  className="gap-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                >
                  {t('landing.ctaDashboard')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <span className="text-xs text-primary-foreground/80 sm:text-sm">
                {t('landing.ctaNote')}
              </span>
            </div>
          </div>
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary-foreground/10" />
          <div className="absolute -bottom-12 -right-12 h-48 w-48 rounded-full bg-primary-foreground/5" />
        </section>

        {/* Feature strip — three columns, same chrome as Dashboard KPI cards */}
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <Card className="card-hover border-l-4 border-l-status-info bg-card">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-status-info/15 text-status-info shrink-0">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {t('landing.entitiesTitle')}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('landing.entitiesDesc')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border-l-4 border-l-status-success bg-card">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-status-success/15 text-status-success shrink-0">
                  <QrCode className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {t('landing.proofTitle')}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('landing.proofDesc')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border-l-4 border-l-status-transit bg-card">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-status-transit/15 text-status-transit shrink-0">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {t('landing.securityTitle')}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('landing.securityDesc')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Secondary panels */}
        <section className="mt-6 grid gap-6 lg:grid-cols-5">
          <Card className="card-hover border-border bg-card lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Radar className="h-4 w-4 text-primary" />
                {t('landing.liveSnapshot')}
              </CardTitle>
              <CardDescription>{t('landing.singlePane')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {t('landing.activeVehicles')}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {t('landing.trackedRealtime')}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="border border-status-success/30 bg-status-success/10 text-status-success"
                >
                  <Activity className="h-3.5 w-3.5 mr-1" />
                  {t('landing.fleetVisibility')}
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {t('landing.arrivalsExits')}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">
                    {t('landing.fromEveryCenter')}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="border border-status-info/30 bg-status-info/10 text-status-info"
                >
                  {t('landing.timelineView')}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover border-dashed border-primary/30 bg-card lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <QrCode className="h-4 w-4 text-primary" />
                {t('landing.proofOfArrival')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>{t('landing.generateQrDesc')}</p>
              <p className="text-xs font-medium text-primary">
                {t('landing.adminOnly')}
              </p>
            </CardContent>
          </Card>
        </section>

        <footer className="mt-auto pt-10 text-xs text-muted-foreground">
          {t('landing.footer')} {import.meta.env.VITE_API_BASE_URL}
        </footer>
      </div>
    </div>
  );
}
