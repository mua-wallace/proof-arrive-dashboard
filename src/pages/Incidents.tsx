import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle,
  Wrench,
  Repeat,
  CheckCircle2,
  Siren,
  Clock,
} from 'lucide-react';
import {
  useExceptionsStore,
  countActiveByType,
  selectResolvedTodayCount,
} from '@/stores/exceptions.store';
import { ACTIVE_STATUSES, CLOSED_STATUSES } from '@/types/exceptions';
import type { ExceptionRecord, ExceptionType } from '@/types/exceptions';
import { ExceptionBadge } from '@/components/exceptions/ExceptionBadge';
import { getStatusStyle, getStatusTheme } from '@/lib/status-theme';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

type FilterKey = 'all' | 'active' | 'resolved' | ExceptionType;

const TYPE_ICONS: Record<ExceptionType, typeof Wrench> = {
  BREAKDOWN: Wrench,
  ACCIDENT: AlertTriangle,
  OVERDUE: Clock,
  TRANSFER: Repeat,
};

export default function Incidents() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const exceptions = useExceptionsStore((s) => s.exceptions);
  const counts = useExceptionsStore((s) => countActiveByType(s));
  const resolvedToday = useExceptionsStore((s) => selectResolvedTodayCount(s));

  const [filter, setFilter] = useState<FilterKey>('all');

  const filtered = useMemo(() => {
    return exceptions.filter((e) => {
      if (filter === 'all') return true;
      if (filter === 'active') return ACTIVE_STATUSES.includes(e.status);
      if (filter === 'resolved') return CLOSED_STATUSES.includes(e.status);
      return e.type === filter;
    });
  }, [exceptions, filter]);

  function filterCount(key: FilterKey): number {
    if (key === 'all') return exceptions.length;
    if (key === 'active') return exceptions.filter((e) => ACTIVE_STATUSES.includes(e.status)).length;
    if (key === 'resolved')
      return exceptions.filter((e) => CLOSED_STATUSES.includes(e.status)).length;
    return exceptions.filter((e) => e.type === key).length;
  }

  const chips: { key: FilterKey; labelKey: string }[] = [
    { key: 'all', labelKey: 'exceptions.incidents.filters.all' },
    { key: 'active', labelKey: 'exceptions.incidents.filters.active' },
    { key: 'resolved', labelKey: 'exceptions.incidents.filters.resolved' },
    { key: 'BREAKDOWN', labelKey: 'exceptions.incidents.filters.breakdown' },
    { key: 'ACCIDENT', labelKey: 'exceptions.incidents.filters.accident' },
    { key: 'OVERDUE', labelKey: 'exceptions.incidents.filters.overdue' },
    { key: 'TRANSFER', labelKey: 'exceptions.incidents.filters.transfer' },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 rounded-xl border bg-card/60 px-4 py-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/15">
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </div>
        <div className="min-w-0 leading-tight">
          <h1 className="text-base font-bold tracking-tight">{t('exceptions.title')}</h1>
          <p className="text-[11px] text-muted-foreground">{t('exceptions.subtitle')}</p>
        </div>
      </div>

      <section className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          labelKey="exceptions.incidents.kpiBreakdowns"
          value={counts.BREAKDOWN}
          icon={Wrench}
          hex="#F59E0B"
        />
        <KpiCard
          labelKey="exceptions.incidents.kpiAccidents"
          value={counts.ACCIDENT}
          icon={AlertTriangle}
          hex="#EF4444"
        />
        <KpiCard
          labelKey="exceptions.incidents.kpiTransfers"
          value={counts.TRANSFER}
          icon={Repeat}
          hex="#3B82F6"
        />
        <KpiCard
          labelKey="exceptions.incidents.kpiResolvedToday"
          value={resolvedToday}
          icon={CheckCircle2}
          hex="#10B981"
        />
      </section>

      <Card className="overflow-hidden rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 p-3 pb-2">
          <div className="min-w-0">
            <CardTitle className="text-sm font-semibold">{t('exceptions.incidents.listTitle')}</CardTitle>
            <CardDescription className="text-[11px]">
              {t('exceptions.incidents.listDescription', { count: filtered.length })}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-1">
            {chips.map((chip) => {
              const count = filterCount(chip.key);
              const active = filter === chip.key;
              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => setFilter(chip.key)}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition',
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input bg-background text-muted-foreground hover:bg-muted',
                  )}
                >
                  {t(chip.labelKey)}
                  <span
                    className={cn(
                      'rounded-full px-1 text-[9px] tabular-nums',
                      active ? 'bg-primary-foreground/20' : 'bg-muted',
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 py-6 text-center">
              <AlertTriangle className="h-6 w-6 text-muted-foreground" />
              <p className="mt-1.5 text-xs font-medium text-muted-foreground">
                {t('exceptions.incidents.empty')}
              </p>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[56px]"></TableHead>
                    <TableHead>{t('exceptions.active.columnVehicle')}</TableHead>
                    <TableHead>{t('exceptions.active.columnType')}</TableHead>
                    <TableHead>{t('exceptions.detail.incidentRef')}</TableHead>
                    <TableHead>{t('exceptions.active.columnLocation')}</TableHead>
                    <TableHead>{t('exceptions.active.columnReportedBy')}</TableHead>
                    <TableHead>{t('exceptions.active.columnReported')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((e) => (
                    <IncidentRow
                      key={e.id}
                      exception={e}
                      onOpen={() => navigate(`/app/trips/${e.tripId}`)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  labelKey,
  value,
  icon: Icon,
  hex,
}: {
  labelKey: string;
  value: number;
  icon: typeof Wrench;
  hex: string;
}) {
  const { t } = useTranslation();
  return (
    <Card
      className="card-hover border-l-4"
      style={{ borderLeftColor: hex, backgroundColor: value > 0 ? `${hex}0D` : undefined }}
    >
      <CardContent className="flex items-center justify-between p-3">
        <div className="min-w-0">
          <p
            className="text-[9px] font-semibold uppercase tracking-wider"
            style={{ color: hex }}
          >
            {t(labelKey)}
          </p>
          <p className="mt-0.5 text-lg font-bold leading-none tabular-nums">{value}</p>
        </div>
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${hex}26` }}
        >
          <Icon className="h-4 w-4" style={{ color: hex }} />
        </div>
      </CardContent>
    </Card>
  );
}

function IncidentRow({
  exception,
  onOpen,
}: {
  exception: ExceptionRecord;
  onOpen: () => void;
}) {
  const theme = getStatusTheme(exception.type);
  const TypeIcon = TYPE_ICONS[exception.type] ?? AlertTriangle;
  const escalated = exception.status === 'ESCALATED';

  return (
    <TableRow
      className="cursor-pointer transition-colors hover:bg-muted/40"
      onClick={onOpen}
      style={{ borderLeft: `4px solid ${theme.hex}` }}
    >
      <TableCell className="py-1.5 align-middle">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-md"
          style={{ backgroundColor: `${theme.hex}26`, color: theme.hex }}
        >
          {escalated ? <Siren className="h-3.5 w-3.5" /> : <TypeIcon className="h-3.5 w-3.5" />}
        </div>
      </TableCell>
      <TableCell className="py-1.5 font-mono text-xs font-semibold">{exception.vehiclePlate}</TableCell>
      <TableCell className="py-1.5">
        <ExceptionBadge type={exception.type} status={exception.status} />
      </TableCell>
      <TableCell className="py-1.5">
        <Badge
          variant="secondary"
          className="font-mono text-[10px]"
          style={getStatusStyle('#94A3B8')}
        >
          {exception.id}
        </Badge>
      </TableCell>
      <TableCell className="max-w-[280px] truncate py-1.5 text-xs text-muted-foreground">
        {exception.location}
      </TableCell>
      <TableCell className="py-1.5 text-xs">{exception.reportedBy}</TableCell>
      <TableCell className="py-1.5 text-xs text-muted-foreground">
        {formatDate(exception.reportedAt)}
      </TableCell>
    </TableRow>
  );
}
