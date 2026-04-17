import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { useExceptions, useExceptionsSummary } from '@/hooks/useExceptions';
import type { ExceptionRecord, ExceptionType, ExceptionsQuery } from '@/types/exceptions';
import { ExceptionBadge } from '@/components/exceptions/ExceptionBadge';
import { getStatusStyle, getStatusTheme } from '@/lib/status-theme';
import { displayReportedBy } from '@/components/exceptions/helpers';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

type FilterKey = 'all' | 'active' | 'resolved' | ExceptionType;

const TYPE_ICONS: Record<string, typeof Wrench> = {
  BREAKDOWN: Wrench,
  ACCIDENT: AlertTriangle,
  OVERDUE: Clock,
  TRANSFER: Repeat,
};

export default function Incidents() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Build query params based on filter
  const queryParams: ExceptionsQuery = { page, limit };
  if (search) queryParams.search = search;
  if (filter === 'active') queryParams.status = 'ACTIVE';
  else if (filter === 'resolved') queryParams.status = 'RESOLVED';
  else if (filter !== 'all') queryParams.type = filter as ExceptionType;

  const { data: exceptionsData, isLoading } = useExceptions(queryParams);
  const { data: summary } = useExceptionsSummary();

  const filtered = exceptionsData?.data ?? [];
  const meta = exceptionsData?.meta;
  const totalItems = meta?.totalItems ?? 0;
  const totalPages = meta?.totalPages ?? 1;

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
          value={summary?.breakdowns ?? 0}
          icon={Wrench}
          hex="#F59E0B"
        />
        <KpiCard
          labelKey="exceptions.incidents.kpiAccidents"
          value={summary?.accidents ?? 0}
          icon={AlertTriangle}
          hex="#EF4444"
        />
        <KpiCard
          labelKey="exceptions.incidents.kpiTransfers"
          value={summary?.transfers ?? 0}
          icon={Repeat}
          hex="#3B82F6"
        />
        <KpiCard
          labelKey="exceptions.incidents.kpiResolvedToday"
          value={summary?.resolvedToday ?? 0}
          icon={CheckCircle2}
          hex="#10B981"
        />
      </section>

      <Card className="overflow-hidden rounded-xl">
        <CardHeader className="flex flex-col gap-2 space-y-0 p-3 pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold">{t('exceptions.incidents.listTitle')}</CardTitle>
              <CardDescription className="text-[11px]">
                {t('exceptions.incidents.listDescription', { count: totalItems })}
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('common.search', 'Search...')}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {chips.map((chip) => {
              const active = filter === chip.key;
              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => { setFilter(chip.key); setPage(1); }}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition',
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-input bg-background text-muted-foreground hover:bg-muted',
                  )}
                >
                  {t(chip.labelKey)}
                </button>
              );
            })}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 py-6 text-center">
              <AlertTriangle className="h-6 w-6 text-muted-foreground" />
              <p className="mt-1.5 text-xs font-medium text-muted-foreground">
                {t('exceptions.incidents.empty')}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {t('exceptions.incidents.emptyHint')}
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-3 py-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
                className="h-7 text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                {t('common.previous', 'Previous')}
              </Button>
              <span className="text-xs text-muted-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isLoading}
                className="h-7 text-xs"
              >
                {t('common.next', 'Next')}
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
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
          {exception.incidentReference ?? exception.id}
        </Badge>
      </TableCell>
      <TableCell className="max-w-[280px] truncate py-1.5 text-xs text-muted-foreground">
        {exception.location}
      </TableCell>
      <TableCell className="py-1.5 text-xs">{displayReportedBy(exception.reportedBy)}</TableCell>
      <TableCell className="py-1.5 text-xs text-muted-foreground">
        {formatDate(exception.reportedAt)}
      </TableCell>
    </TableRow>
  );
}
