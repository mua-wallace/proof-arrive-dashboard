import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ExceptionBadge } from './ExceptionBadge';
import {
  DispatchTechnicianDialog,
  MarkRepairedDialog,
  LogContactAttemptDialog,
  UpdateETADialog,
  ReturnToOriginDialog,
  EscalateDialog,
  AddNoteDialog,
} from './ActionDialogs';
import { ReportExceptionDialog } from './ReportExceptionDialog';
import { getStatusStyle, getStatusTheme } from '@/lib/status-theme';
import { formatDate } from '@/lib/utils';
import { formatRelativeFromNow, getOverdueDelta } from './helpers';
import type { ExceptionRecord } from '@/types/exceptions';
import { toast } from '@/lib/toast';
import {
  Wrench,
  AlertTriangle,
  Clock,
  Repeat,
  Phone,
  FileText,
  ArrowLeftCircle,
  StickyNote,
  CheckCircle2,
  Siren,
  Lightbulb,
} from 'lucide-react';

interface Props {
  exception: ExceptionRecord;
}

export function ExceptionBanner({ exception }: Props) {
  const { t } = useTranslation();
  const theme = getStatusTheme(exception.type);
  const style = getStatusStyle(theme.hex);

  const [openDispatch, setOpenDispatch] = useState(false);
  const [openRepair, setOpenRepair] = useState(false);
  const [openContact, setOpenContact] = useState(false);
  const [openEta, setOpenEta] = useState(false);
  const [openReturn, setOpenReturn] = useState(false);
  const [openEscalate, setOpenEscalate] = useState(false);
  const [openNote, setOpenNote] = useState(false);
  const [openReport, setOpenReport] = useState(false);

  function callDriver() {
    if (exception.driverPhone) {
      toast.success(t('exceptions.actions.callDriver'), exception.driverPhone);
    } else {
      toast.error(t('exceptions.actions.callDriver'));
    }
  }

  const iconByType = {
    BREAKDOWN: Wrench,
    ACCIDENT: AlertTriangle,
    OVERDUE: Clock,
    TRANSFER: Repeat,
  } as const;
  const TypeIcon = iconByType[exception.type];

  const title = (() => {
    const location = exception.location || '—';
    if (exception.type === 'BREAKDOWN')
      return t('exceptions.banners.breakdownTitle', { location });
    if (exception.type === 'ACCIDENT')
      return t('exceptions.banners.accidentTitle', {
        location,
        severity: exception.severity ? t(`exceptions.severity.${exception.severity}`) : '—',
      });
    if (exception.type === 'TRANSFER')
      return t('exceptions.banners.transferTitle', { location });
    const delta = getOverdueDelta(exception) ?? '—';
    return t('exceptions.banners.overdueTitle', { delta });
  })();

  return (
    <div
      className="rounded-xl border-2 p-5"
      style={{
        backgroundColor: style.backgroundColor,
        borderColor: style.borderColor,
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${theme.hex}33`, color: theme.hex }}
        >
          <TypeIcon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <ExceptionBadge type={exception.type} status={exception.status} />
            <span className="font-mono text-xs text-muted-foreground">{exception.id}</span>
          </div>
          <h3 className="mt-2 text-base font-bold" style={{ color: theme.hex }}>
            {title}
          </h3>
          <p className="mt-1 text-sm text-foreground/80">{exception.description}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t('exceptions.banners.reportedAt', {
              time: formatRelativeFromNow(exception.reportedAt),
              by: exception.reportedBy,
            })}
            {exception.technician ? (
              <>
                {' · '}
                {t('exceptions.banners.technicianLine', {
                  name: exception.technician.name,
                  eta: exception.technician.etaText,
                })}
              </>
            ) : null}
          </p>
          {exception.type === 'ACCIDENT' && (
            <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
              <span className="rounded-sm bg-background/70 px-2 py-0.5 font-medium">
                {exception.injuries
                  ? t('exceptions.banners.injuriesYes')
                  : t('exceptions.banners.injuriesNo')}
              </span>
              {exception.cargoDamaged && (
                <span className="rounded-sm bg-background/70 px-2 py-0.5 font-medium">
                  {t('exceptions.banners.cargoDamaged')}
                </span>
              )}
              <span className="rounded-sm bg-background/70 px-2 py-0.5 font-medium">
                {exception.vehicleDriveable
                  ? t('exceptions.banners.driveableYes')
                  : t('exceptions.banners.driveableNo')}
              </span>
              {exception.policeRef && (
                <span className="rounded-sm bg-background/70 px-2 py-0.5 font-medium font-mono">
                  {exception.policeRef}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {exception.type === 'BREAKDOWN' && (
          <>
            <Button
              size="sm"
              onClick={() => setOpenRepair(true)}
              className="gap-1.5"
              style={{ backgroundColor: '#0B7B8F', color: '#fff' }}
            >
              <CheckCircle2 className="h-4 w-4" />
              {t('exceptions.actions.markRepaired')}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setOpenDispatch(true)} className="gap-1.5">
              <Lightbulb className="h-4 w-4" />
              {t('exceptions.actions.dispatchTechnician')}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setOpenReturn(true)} className="gap-1.5">
              <ArrowLeftCircle className="h-4 w-4" />
              {t('exceptions.actions.returnOrigin')}
            </Button>
          </>
        )}

        {exception.type === 'ACCIDENT' && (
          <>
            <Button size="sm" variant="outline" onClick={() => setOpenReturn(true)} className="gap-1.5">
              <ArrowLeftCircle className="h-4 w-4" />
              {t('exceptions.actions.returnOrigin')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled
              title={t('exceptions.actions.comingSoon')}
              className="gap-1.5"
            >
              <FileText className="h-4 w-4" />
              {t('exceptions.actions.exportInsurance')}
            </Button>
          </>
        )}

        {exception.type === 'OVERDUE' && (
          <>
            <Button size="sm" variant="outline" onClick={() => setOpenContact(true)} className="gap-1.5">
              <Phone className="h-4 w-4" />
              {t('exceptions.actions.logCallAttempt')}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setOpenEta(true)} className="gap-1.5">
              <Clock className="h-4 w-4" />
              {t('exceptions.actions.updateETA')}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setOpenReport(true)} className="gap-1.5">
              <AlertTriangle className="h-4 w-4" />
              {t('exceptions.actions.reportException')}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setOpenEscalate(true)}
              className="gap-1.5"
            >
              <Siren className="h-4 w-4" />
              {t('exceptions.actions.escalate')}
            </Button>
          </>
        )}

        <Button size="sm" variant="outline" onClick={callDriver} className="gap-1.5">
          <Phone className="h-4 w-4" />
          {t('exceptions.actions.callDriver')}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpenNote(true)} className="gap-1.5">
          <StickyNote className="h-4 w-4" />
          {t('exceptions.actions.addNote')}
        </Button>
      </div>

      <DispatchTechnicianDialog
        open={openDispatch}
        onOpenChange={setOpenDispatch}
        exceptionId={exception.id}
      />
      <MarkRepairedDialog open={openRepair} onOpenChange={setOpenRepair} exceptionId={exception.id} />
      <LogContactAttemptDialog
        open={openContact}
        onOpenChange={setOpenContact}
        exceptionId={exception.id}
      />
      <UpdateETADialog open={openEta} onOpenChange={setOpenEta} exceptionId={exception.id} />
      <ReturnToOriginDialog open={openReturn} onOpenChange={setOpenReturn} exceptionId={exception.id} />
      <EscalateDialog open={openEscalate} onOpenChange={setOpenEscalate} exceptionId={exception.id} />
      <AddNoteDialog open={openNote} onOpenChange={setOpenNote} exceptionId={exception.id} />
      <ReportExceptionDialog
        open={openReport}
        onOpenChange={setOpenReport}
        type="BREAKDOWN"
        tripId={exception.tripId}
        vehiclePlate={exception.vehiclePlate}
        originName={exception.originName}
        destinationName={exception.destinationName}
        driverPhone={exception.driverPhone}
      />
    </div>
  );
}

export function ExceptionBannerMini({ exception }: { exception: ExceptionRecord }) {
  const theme = getStatusTheme(exception.type);
  return (
    <div
      className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
      style={{ ...getStatusStyle(theme.hex), color: theme.hex }}
    >
      <ExceptionBadge type={exception.type} withIcon={false} className="!border-0 !bg-transparent !p-0" />
      <span className="font-mono text-foreground">{exception.vehiclePlate}</span>
      <span className="text-muted-foreground">· {formatDate(exception.reportedAt)}</span>
    </div>
  );
}
