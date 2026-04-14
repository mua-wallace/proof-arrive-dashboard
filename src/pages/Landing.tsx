import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Truck, QrCode, Radar } from 'lucide-react';

export default function Landing() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen landing-bg">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Truck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold tracking-tight text-emerald-400">
                Proof Arrive
              </p>
              <p className="text-xs text-slate-400">
                {t('landing.tagline')}
              </p>
            </div>
          </div>
          <Link to="/login">
            <Button variant="outline" size="sm" className="border-slate-700 bg-slate-900/50 text-slate-50 hover:bg-slate-800 hover:text-slate-50">
              {t('landing.signIn')}
            </Button>
          </Link>
        </header>

        <main className="mt-16 grid flex-1 gap-10 md:grid-cols-[1.6fr,1.1fr] items-center">
          <section>
            <div className="inline-flex items-center rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400">
              {t('landing.badge')}
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl">
              {t('landing.title1')}
              <span className="text-emerald-400">{t('landing.title2')}</span>
              {t('landing.title3')}
            </h1>
            <p className="mt-4 max-w-xl text-sm text-slate-300 sm:text-base">
              {t('landing.description')}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/login">
                <Button size="lg">
                  {t('landing.ctaDashboard')}
                </Button>
              </Link>
              <span className="text-xs text-slate-400 sm:text-sm">
                {t('landing.ctaNote')}
              </span>
            </div>

            <dl className="mt-10 grid max-w-xl gap-6 text-sm text-slate-300 sm:grid-cols-3">
              <div>
                <dt className="font-medium text-slate-50">{t('landing.entitiesTitle')}</dt>
                <dd>{t('landing.entitiesDesc')}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-50">{t('landing.proofTitle')}</dt>
                <dd>{t('landing.proofDesc')}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-50">{t('landing.securityTitle')}</dt>
                <dd>{t('landing.securityDesc')}</dd>
              </div>
            </dl>
          </section>

          <aside className="space-y-4">
            <Card className="backdrop-blur-sm bg-card/80 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Radar className="h-4 w-4 text-primary" />
                  {t('landing.liveSnapshot')}
                </CardTitle>
                <CardDescription>
                  {t('landing.singlePane')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-muted-foreground">
                <div className="flex items-center justify-between rounded-md border bg-background/60 px-3 py-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {t('landing.activeVehicles')}
                    </p>
                    <p className="text-sm font-semibold text-foreground">{t('landing.trackedRealtime')}</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-500">
                    {t('landing.fleetVisibility')}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-md border bg-background/60 px-3 py-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {t('landing.arrivalsExits')}
                    </p>
                    <p className="text-sm font-semibold text-foreground">{t('landing.fromEveryCenter')}</p>
                  </div>
                  <span className="rounded-full bg-sky-500/10 px-3 py-1 text-[11px] font-medium text-sky-500">
                    {t('landing.timelineView')}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-dashed border-primary/30 bg-card/80">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <QrCode className="h-4 w-4 text-primary" />
                  {t('landing.proofOfArrival')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <p>
                  {t('landing.generateQrDesc')}
                </p>
                <p className="text-[11px] text-primary">
                  {t('landing.adminOnly')}
                </p>
              </CardContent>
            </Card>
          </aside>
        </main>

        <footer className="mt-10 border-t border-slate-800 pt-4 text-xs text-slate-500">
          {t('landing.footer')} {import.meta.env.VITE_API_BASE_URL}
        </footer>
      </div>
    </div>
  );
}
