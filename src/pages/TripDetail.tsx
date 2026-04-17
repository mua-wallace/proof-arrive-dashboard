import { useState, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Truck,
  MapPin,
  Building2,
  AlertTriangle,
  StickyNote,
  Calendar,
  Loader2,
  Phone,
} from 'lucide-react';
import { dashboardApi } from '@/api/dashboard';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import { getStatusStyle, getStatusTheme } from '@/lib/status-theme';
import { useExceptionsByTrip } from '@/hooks/useExceptions';
import { ACTIVE_STATUSES } from '@/types/exceptions';
import { ExceptionBanner } from '@/components/exceptions/ExceptionBanner';
import {
  ReportExceptionDialog,
  ReportTypePickerDialog,
} from '@/components/exceptions/ReportExceptionDialog';
import { AddNoteDialog } from '@/components/exceptions/ActionDialogs';
import { formatRelativeFromNow, formatDuration, getOverdueDelta, displayReportedBy } from '@/components/exceptions/helpers';
import type { ExceptionRecord, ExceptionType } from '@/types/exceptions';
import { ExceptionBadge } from '@/components/exceptions/ExceptionBadge';

export default function TripDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: tripExceptions = [] } = useExceptionsByTrip(id);
  const exception = useMemo(
    () => tripExceptions.find((e) => ACTIVE_STATUSES.includes(e.status)),
    [tripExceptions],
  );
  const resolvedOrClosedForTrip = useMemo(
    () => tripExceptions.find((e) => !!e.resolution),
    [tripExceptions],
  );
  const currentException = exception ?? resolvedOrClosedForTrip;

  const isDemoId = id != null && id.startsWith('DEMO-');
  const numericId = !isDemoId && id != null ? Number(id) : NaN;
  const hasNumericId = Number.isFinite(numericId);

  const { data: apiTrip, isLoading, error } = useQuery({
    queryKey: ['trip', numericId],
    queryFn: () => dashboardApi.getTripById(numericId, 'vehicle,originCenter,destinationCenter,events'),
    enabled: hasNumericId,
    retry: 1,
  });

  const [reportOpen, setReportOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [reportType, setReportType] = useState<ExceptionType>('BREAKDOWN');
  const [noteOpen, setNoteOpen] = useState(false);

  const tripView = useMemo(() => {
    if (apiTrip) {
      return {
        id: String(apiTrip.id),
        plate: apiTrip.vehicle?.plate ?? `#${apiTrip.vehicleId}`,
        originName: apiTrip.originCenter?.name ?? `Center ${apiTrip.originCenterId}`,
        destinationName:
          apiTrip.destinationCenter?.name ??
          (apiTrip.destinationCenterId ? `Center ${apiTrip.destinationCenterId}` : '—'),
        phase: apiTrip.phase ?? apiTrip.status ?? 'IN_TRANSIT',
        purpose: apiTrip.purpose ?? '—',
        startedAt: apiTrip.startedAt ?? apiTrip.createdAt,
        events: Array.isArray(apiTrip.events) ? apiTrip.events : [],
        driverPhone: undefined as string | undefined,
      };
    }
    if (currentException) {
      return {
        id: String(currentException.tripId),
        plate: currentException.vehiclePlate,
        originName: currentException.originName ?? '—',
        destinationName: currentException.destinationName ?? '—',
        phase: 'IN_TRANSIT',
        purpose: 'DELIVERY',
        startedAt: currentException.reportedAt,
        events: [] as Array<{
          id?: string | number;
          eventType?: string;
          createdAt?: string;
          centerId?: number;
        }>,
        driverPhone: currentException.driverPhone,
      };
    }
    return null;
  }, [apiTrip, currentException]);

  if (hasNumericId && isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!tripView) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/app/trips')} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          {t('tripDetail.back')}
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <AlertTriangle className="h-10 w-10 text-muted-foreground" />
            <p className="font-medium text-muted-foreground">{t('tripDetail.notFound')}</p>
            <p className="text-sm text-muted-foreground">{t('tripDetail.notFoundHint')}</p>
            {error && <p className="mt-2 text-xs text-destructive">{String(error)}</p>}
          </CardContent>
        </Card>
      </div>
    );
  }

  const phaseTheme = getStatusTheme(tripView.phase);
  const canReport = !exception && tripView.phase === 'IN_TRANSIT';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card/60 px-4 py-2.5">
        <Link
          to="/app/trips"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-input text-muted-foreground transition hover:bg-muted hover:text-foreground"
          title={t('tripDetail.back')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-base font-bold tracking-tight">
          {t('tripDetail.title', { id: tripView.id })}
        </h1>
        <Badge variant="outline" className="text-[10px]">{tripView.purpose}</Badge>
        <Badge
          variant="secondary"
          className="border text-[10px] font-medium"
          style={getStatusStyle(phaseTheme.hex)}
        >
          {phaseTheme.label}
        </Badge>
        {currentException && (
          <ExceptionBadge type={currentException.type} status={currentException.status} />
        )}
        <div className="ml-auto flex flex-wrap gap-1.5">
          {canReport && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPickerOpen(true)}
              className="h-7 gap-1 border-destructive text-xs text-destructive hover:bg-destructive/10"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              {t('exceptions.reportButton')}
            </Button>
          )}
          {currentException && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setNoteOpen(true)}
              className="h-7 gap-1 text-xs"
            >
              <StickyNote className="h-3.5 w-3.5" />
              {t('exceptions.actions.addNote')}
            </Button>
          )}
        </div>
      </div>

      {exception && <ExceptionBanner exception={exception} />}

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="flex flex-col gap-3 lg:col-span-2">
          <JourneyStrip
            origin={tripView.originName}
            destination={tripView.destinationName}
            exception={exception}
          />
          <Timeline tripEvents={tripView.events} exception={currentException} />
        </div>

        <aside className="flex flex-col gap-3">
          {currentException && <ExceptionSummaryCard exception={currentException} />}
          <Card>
            <CardHeader className="p-3 pb-2">
              <CardTitle className="flex items-center gap-1.5 text-xs font-semibold">
                <Truck className="h-3.5 w-3.5" />
                {t('tripDetail.vehicleCard')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 p-3 pt-0 text-xs">
              <Row label={t('tripDetail.vehicle')} value={tripView.plate} mono />
              {tripView.driverPhone && (
                <Row label={t('tripDetail.driverPhone')} value={tripView.driverPhone} />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="p-3 pb-2">
              <CardTitle className="flex items-center gap-1.5 text-xs font-semibold">
                <Building2 className="h-3.5 w-3.5" />
                {t('tripDetail.cargoCard')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 p-3 pt-0 text-xs">
              <Row label={t('tripDetail.origin')} value={tripView.originName} />
              <Row label={t('tripDetail.destination')} value={tripView.destinationName} />
              <Row label={t('tripDetail.purpose')} value={tripView.purpose} />
              {tripView.startedAt && (
                <Row label={t('tripDetail.startedAt')} value={formatDate(tripView.startedAt)} />
              )}
            </CardContent>
          </Card>
        </aside>
      </div>

      <ReportTypePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onPick={(type) => {
          setReportType(type);
          setReportOpen(true);
        }}
      />
      <ReportExceptionDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        type={reportType}
        tripId={tripView.id}
        vehiclePlate={tripView.plate}
        originName={tripView.originName}
        destinationName={tripView.destinationName}
        driverPhone={tripView.driverPhone}
      />
      {currentException && (
        <AddNoteDialog
          open={noteOpen}
          onOpenChange={setNoteOpen}
          exceptionId={currentException.id}
        />
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={cn('text-right font-medium text-foreground', mono && 'font-mono')}>{value}</dd>
    </div>
  );
}

function JourneyStrip({
  origin,
  destination,
  exception,
}: {
  origin: string;
  destination: string;
  exception?: ExceptionRecord;
}) {
  const { t } = useTranslation();
  const theme = exception ? getStatusTheme(exception.type) : getStatusTheme('IN_TRANSIT');
  return (
    <Card>
      <CardHeader className="p-3 pb-1">
        <CardTitle className="flex items-center gap-1.5 text-xs font-semibold">
          <MapPin className="h-3.5 w-3.5" />
          {t('tripDetail.journeyStrip')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="relative flex items-center">
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Building2 className="h-3.5 w-3.5" />
            </div>
            <span className="max-w-[100px] truncate text-center text-[10px] text-muted-foreground">
              {origin}
            </span>
          </div>
          <div className="relative mx-2 flex-1">
            <div className="h-0.5 w-full rounded-full bg-muted" />
            <div
              className="absolute inset-y-0 left-0 h-0.5 rounded-full"
              style={{
                width: exception ? '55%' : '50%',
                backgroundColor: theme.hex,
              }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 rounded-full border-2 p-1"
              style={{
                left: exception ? '52%' : '47%',
                backgroundColor: `${theme.hex}1A`,
                borderColor: theme.hex,
                color: theme.hex,
              }}
            >
              <Truck className="h-3 w-3" />
            </div>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <MapPin className="h-3.5 w-3.5" />
            </div>
            <span className="max-w-[100px] truncate text-center text-[10px] text-muted-foreground">
              {destination}
            </span>
          </div>
        </div>
        {exception && (
          <p className="mt-2 text-center text-[10px] font-medium" style={{ color: theme.hex }}>
            {theme.label} · {exception.location}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

type TimelineEntry = {
  id: string;
  kind: 'TRIP' | 'EXCEPTION' | 'NOTE' | 'CONTACT';
  at: string;
  title: string;
  subtitle?: string;
  color: string;
  isDivider?: boolean;
};

function Timeline({
  tripEvents,
  exception,
}: {
  tripEvents: Array<{ id?: string | number; eventType?: string; createdAt?: string; centerId?: number }>;
  exception?: ExceptionRecord;
}) {
  const { t } = useTranslation();
  const entries: TimelineEntry[] = [];

  for (const e of tripEvents) {
    entries.push({
      id: `trip-${e.id ?? e.createdAt ?? Math.random()}`,
      kind: 'TRIP',
      at: e.createdAt ?? new Date().toISOString(),
      title: (e.eventType ?? '—').replace(/_/g, ' '),
      color: getStatusTheme('IN_TRANSIT').hex,
    });
  }

  if (exception) {
    const theme = getStatusTheme(exception.type);
    entries.push({
      id: `exc-${exception.id}`,
      kind: 'EXCEPTION',
      at: exception.reportedAt,
      title: t('exceptions.timeline.divider', {
        type: getStatusTheme(exception.type).label,
        time: formatDate(exception.reportedAt),
        by: displayReportedBy(exception.reportedBy),
      }),
      subtitle: exception.location,
      color: theme.hex,
      isDivider: true,
    });
    if (exception.technician) {
      entries.push({
        id: `tech-${exception.id}`,
        kind: 'EXCEPTION',
        at: exception.technician.dispatchedAt,
        title: t('exceptions.timeline.technicianDispatched'),
        subtitle: `${exception.technician.name} · ETA ${exception.technician.etaText}`,
        color: getStatusTheme('AWAITING_REPAIR').hex,
      });
    }
    for (const a of (Array.isArray(exception.contactAttempts) ? exception.contactAttempts : [])) {
      const key =
        a.outcome === 'ANSWERED'
          ? 'exceptions.timeline.callAnswered'
          : a.outcome === 'VOICEMAIL'
            ? 'exceptions.timeline.callVoicemail'
            : 'exceptions.timeline.callNoAnswer';
      entries.push({
        id: `ca-${a.at}`,
        kind: 'CONTACT',
        at: a.at,
        title: t(key),
        subtitle: `${displayReportedBy(a.by)}${a.notes ? ' · ' + a.notes : ''}`,
        color: '#F97316',
      });
    }
    for (const n of (Array.isArray(exception.notes) ? exception.notes : [])) {
      entries.push({
        id: `note-${n.at}-${displayReportedBy(n.by)}`,
        kind: 'NOTE',
        at: n.at,
        title: t('exceptions.timeline.note'),
        subtitle: `${n.text} — ${displayReportedBy(n.by)}`,
        color: '#64748B',
      });
    }
    if (exception.resolution) {
      entries.push({
        id: `res-${exception.id}`,
        kind: 'EXCEPTION',
        at: exception.resolution.at,
        title: exception.resolution.kind,
        subtitle: `${displayReportedBy(exception.resolution.by)}${exception.resolution.notes ? ' · ' + exception.resolution.notes : ''}`,
        color: getStatusTheme('RESOLVED_RESUMED').hex,
      });
    }
  }

  entries.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  return (
    <Card>
      <CardHeader className="p-3 pb-1">
        <CardTitle className="flex items-center gap-1.5 text-xs font-semibold">
          <Calendar className="h-3.5 w-3.5" />
          {t('tripDetail.timeline')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        {entries.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t('tripDetail.noEvents')}</p>
        ) : (
          <ul className="max-h-[280px] space-y-1 overflow-y-auto pr-1">
            {entries.map((entry) => (
              <li
                key={entry.id}
                className={cn(
                  'flex items-start gap-2 rounded-md border px-2 py-1.5 text-xs',
                  entry.isDivider && 'font-semibold',
                )}
                style={
                  entry.isDivider
                    ? {
                        backgroundColor: `${entry.color}14`,
                        borderColor: `${entry.color}4D`,
                      }
                    : undefined
                }
              >
                <div
                  className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{entry.title}</p>
                  {entry.subtitle && (
                    <p className="truncate text-[10px] text-muted-foreground">{entry.subtitle}</p>
                  )}
                </div>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {formatDate(entry.at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ExceptionSummaryCard({ exception }: { exception: ExceptionRecord }) {
  const { t } = useTranslation();
  const theme = getStatusTheme(exception.type);
  const overdueBy = getOverdueDelta(exception);
  const downtime = formatDuration(Date.now() - new Date(exception.reportedAt).getTime());

  return (
    <Card
      className="border-l-4"
      style={{
        borderLeftColor: theme.hex,
        backgroundColor: `${theme.hex}0D`,
      }}
    >
      <CardHeader className="p-3 pb-2">
        <CardTitle className="flex items-center gap-1.5 text-xs font-semibold">
          <AlertTriangle className="h-3.5 w-3.5" style={{ color: theme.hex }} />
          {t('exceptions.detail.summary')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 p-3 pt-0 text-xs">
        <Row label={t('exceptions.detail.incidentRef')} value={exception.id} mono />
        <Row label={t('exceptions.detail.status')} value={getStatusTheme(exception.status).label} />
        <Row label={t('exceptions.detail.location')} value={exception.location} />
        <Row
          label={t('exceptions.detail.reportedAt')}
          value={`${formatDate(exception.reportedAt)} (${formatRelativeFromNow(exception.reportedAt)})`}
        />
        <Row label={t('exceptions.detail.reportedBy')} value={displayReportedBy(exception.reportedBy)} />
        <Row label={t('exceptions.detail.issue')} value={exception.description} />

        {exception.type === 'BREAKDOWN' && exception.technician && (
          <>
            <Row label={t('exceptions.detail.technician')} value={exception.technician.name} />
            <Row label={t('exceptions.detail.technicianEta')} value={exception.technician.etaText} />
          </>
        )}

        {exception.type === 'ACCIDENT' && (
          <>
            {exception.severity && (
              <Row
                label={t('exceptions.detail.severity')}
                value={t(`exceptions.severity.${exception.severity}`)}
              />
            )}
            <Row
              label={t('exceptions.detail.injuries')}
              value={exception.injuries ? t('exceptions.form.yes') : t('exceptions.form.no')}
            />
            <Row
              label={t('exceptions.detail.driveable')}
              value={exception.vehicleDriveable ? t('exceptions.form.yes') : t('exceptions.form.no')}
            />
            {exception.policeRef && (
              <Row label={t('exceptions.detail.policeRef')} value={exception.policeRef} />
            )}
          </>
        )}

        {exception.type === 'OVERDUE' && (
          <>
            {exception.expectedArrival && (
              <Row
                label={t('exceptions.detail.expectedArrival')}
                value={formatDate(exception.expectedArrival)}
              />
            )}
            {overdueBy && <Row label={t('exceptions.detail.overdueBy')} value={overdueBy} />}
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t('exceptions.detail.contactAttempts')}
              </dt>
              {(!Array.isArray(exception.contactAttempts) || exception.contactAttempts.length === 0) ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('exceptions.detail.noContactAttempts')}
                </p>
              ) : (
                <ul className="mt-1 space-y-1 text-xs">
                  {exception.contactAttempts.map((a, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <span>
                        {formatDate(a.at)} · {a.outcome} · {displayReportedBy(a.by)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        {exception.type !== 'OVERDUE' && (
          <div className="flex items-center justify-between gap-3 pt-1 text-xs text-muted-foreground">
            <span>Downtime</span>
            <span className="font-medium">{downtime}</span>
          </div>
        )}

        {exception.driverPhone && (
          <div className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
            <Phone className="h-3 w-3" />
            {exception.driverPhone}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
