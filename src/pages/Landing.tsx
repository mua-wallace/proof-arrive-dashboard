import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Truck, QrCode, Radar } from 'lucide-react';

export default function Landing() {
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
                Vehicle arrivals & proof of presence
              </p>
            </div>
          </div>
          <Link to="/login">
            <Button variant="outline" size="sm" className="border-slate-700 bg-slate-900/50 text-slate-50 hover:bg-slate-800 hover:text-slate-50">
              Sign in
            </Button>
          </Link>
        </header>

        <main className="mt-16 grid flex-1 gap-10 md:grid-cols-[1.6fr,1.1fr] items-center">
          <section>
            <div className="inline-flex items-center rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400">
              Real‑time logistics visibility
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl">
              See every vehicle,
              <span className="text-emerald-400"> every arrival</span>,
              in one place.
            </h1>
            <p className="mt-4 max-w-xl text-sm text-slate-300 sm:text-base">
              The Proof Arrive dashboard gives your operations team a single,
              trusted view of vehicles, centers, arrivals, exits, and
              in‑transit units — plus QR codes to prove each arrival.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/login">
                <Button size="lg">
                  Go to dashboard
                </Button>
              </Link>
              <span className="text-xs text-slate-400 sm:text-sm">
                Secure, read‑only views for your team. QR generation for admins.
              </span>
            </div>

            <dl className="mt-10 grid max-w-xl gap-6 text-sm text-slate-300 sm:grid-cols-3">
              <div>
                <dt className="font-medium text-slate-50">Entities</dt>
                <dd>Users, centers, vehicles, arrivals, exits & more.</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-50">Proof</dt>
                <dd>QR codes that tie each vehicle to a verifiable event.</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-50">Security</dt>
                <dd>JWT‑secured API, role‑based QR generation.</dd>
              </div>
            </dl>
          </section>

          <aside className="space-y-4">
            <Card className="backdrop-blur-sm bg-card/80 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Radar className="h-4 w-4 text-primary" />
                  Live operations snapshot
                </CardTitle>
                <CardDescription>
                  A single pane of glass for all your arrivals and departures.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-muted-foreground">
                <div className="flex items-center justify-between rounded-md border bg-background/60 px-3 py-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Active vehicles
                    </p>
                    <p className="text-sm font-semibold text-foreground">Tracked in real time</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-500">
                    Fleet visibility
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-md border bg-background/60 px-3 py-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Arrivals & exits
                    </p>
                    <p className="text-sm font-semibold text-foreground">From every center</p>
                  </div>
                  <span className="rounded-full bg-sky-500/10 px-3 py-1 text-[11px] font-medium text-sky-500">
                    Timeline view
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-dashed border-primary/30 bg-card/80">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <QrCode className="h-4 w-4 text-primary" />
                  Proof of arrival
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <p>
                  Generate QR codes for vehicles so your teams can scan, verify,
                  and store proof that each unit arrived where it should — when it should.
                </p>
                <p className="text-[11px] text-primary">
                  Only admins and managers can generate QR codes.
                </p>
              </CardContent>
            </Card>
          </aside>
        </main>

        <footer className="mt-10 border-t border-slate-800 pt-4 text-xs text-slate-500">
          Proof Arrive Dashboard · API: {import.meta.env.VITE_API_BASE_URL}
        </footer>
      </div>
    </div>
  );
}

