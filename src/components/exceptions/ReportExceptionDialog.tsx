import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useExceptionsStore } from '@/stores/exceptions.store';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import type { ExceptionSeverity, ExceptionType, ReportExceptionInput } from '@/types/exceptions';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: ExceptionType;
  tripId: number | string;
  vehiclePlate: string;
  originName?: string;
  destinationName?: string;
  driverPhone?: string;
  onReported?: (id: string) => void;
}

interface FormState {
  location: string;
  description: string;
  driverPhone: string;
  reportedBy: string;
  severity: ExceptionSeverity;
  injuries: 'yes' | 'no';
  cargoDamaged: 'yes' | 'no';
  cargoDamageNotes: string;
  vehicleDriveable: 'yes' | 'no';
  policeRef: string;
  expectedArrival: string;
}

function textareaClass() {
  return 'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';
}

export function ReportExceptionDialog({
  open,
  onOpenChange,
  type,
  tripId,
  vehiclePlate,
  originName,
  destinationName,
  driverPhone,
  onReported,
}: Props) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const report = useExceptionsStore((s) => s.report);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<FormState>({
    location: '',
    description: '',
    driverPhone: driverPhone ?? '',
    reportedBy: user?.username ?? 'Dispatcher',
    severity: 'MINOR',
    injuries: 'no',
    cargoDamaged: 'no',
    cargoDamageNotes: '',
    vehicleDriveable: 'yes',
    policeRef: '',
    expectedArrival: '',
  });

  const totalSteps = type === 'ACCIDENT' ? 3 : 1;

  function reset() {
    setStep(1);
    setForm({
      location: '',
      description: '',
      driverPhone: driverPhone ?? '',
      reportedBy: user?.username ?? 'Dispatcher',
      severity: 'MINOR',
      injuries: 'no',
      cargoDamaged: 'no',
      cargoDamageNotes: '',
      vehicleDriveable: 'yes',
      policeRef: '',
      expectedArrival: '',
    });
  }

  function handleClose(v: boolean) {
    if (!v) reset();
    onOpenChange(v);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.location.trim() || !form.description.trim()) {
      toast.error(t('exceptions.form.required'));
      return;
    }
    const input: ReportExceptionInput = {
      tripId,
      vehiclePlate,
      originName,
      destinationName,
      type,
      reportedBy: form.reportedBy || 'Dispatcher',
      location: form.location.trim(),
      description: form.description.trim(),
      driverPhone: form.driverPhone || undefined,
    };
    if (type === 'ACCIDENT') {
      input.severity = form.severity;
      input.injuries = form.injuries === 'yes';
      input.cargoDamaged = form.cargoDamaged === 'yes';
      input.cargoDamageNotes =
        form.cargoDamaged === 'yes' ? form.cargoDamageNotes || undefined : undefined;
      input.vehicleDriveable = form.vehicleDriveable === 'yes';
      input.policeRef = form.policeRef || undefined;
    }
    if (type === 'OVERDUE' && form.expectedArrival) {
      input.expectedArrival = new Date(form.expectedArrival).toISOString();
    }
    const created = report(input);
    toast.success(t('exceptions.toasts.reported'), t('exceptions.toasts.reportedDesc'));
    onReported?.(created.id);
    handleClose(false);
  }

  const typeLabel = t(`exceptions.types.${type}`);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogClose onClick={() => handleClose(false)} />
      <DialogContent className="w-full max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('exceptions.form.reportTitle', { type: typeLabel })}</DialogTitle>
          <DialogDescription>{t('exceptions.form.reportDescription')}</DialogDescription>
        </DialogHeader>

        {totalSteps > 1 && (
          <div className="mb-4 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span>{t('exceptions.form.step', { current: step, total: totalSteps })}</span>
            <div className="flex gap-1">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1.5 w-8 rounded-full',
                    i + 1 <= step ? 'bg-primary' : 'bg-muted',
                  )}
                />
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="ex-location">{t('exceptions.form.location')}</Label>
                <Input
                  id="ex-location"
                  placeholder={t('exceptions.form.locationPlaceholder')}
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">{t('exceptions.form.locationHint')}</p>
              </div>

              {type === 'ACCIDENT' && (
                <div className="space-y-2">
                  <Label>{t('exceptions.form.severity')}</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['MINOR', 'MAJOR', 'CRITICAL'] as const).map((sev) => (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => setForm({ ...form, severity: sev })}
                        className={cn(
                          'rounded-md border px-3 py-2 text-sm font-medium transition',
                          form.severity === sev
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-input text-muted-foreground hover:bg-muted',
                        )}
                      >
                        {t(`exceptions.severity.${sev}`)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="ex-description">{t('exceptions.form.description')}</Label>
                <textarea
                  id="ex-description"
                  className={textareaClass()}
                  placeholder={t('exceptions.form.descriptionPlaceholder')}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                  rows={4}
                />
              </div>

              {type === 'OVERDUE' && (
                <div className="space-y-2">
                  <Label htmlFor="ex-eta">{t('exceptions.form.reportedBy')}</Label>
                  <Input
                    id="ex-eta"
                    type="datetime-local"
                    value={form.expectedArrival}
                    onChange={(e) => setForm({ ...form, expectedArrival: e.target.value })}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ex-phone">{t('exceptions.form.driverPhone')}</Label>
                  <Input
                    id="ex-phone"
                    value={form.driverPhone}
                    onChange={(e) => setForm({ ...form, driverPhone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ex-by">{t('exceptions.form.reportedBy')}</Label>
                  <Input
                    id="ex-by"
                    value={form.reportedBy}
                    onChange={(e) => setForm({ ...form, reportedBy: e.target.value })}
                  />
                </div>
              </div>
            </>
          )}

          {step === 2 && type === 'ACCIDENT' && (
            <>
              <div className="space-y-2">
                <Label>{t('exceptions.form.injuries')}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['no', 'yes'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setForm({ ...form, injuries: v })}
                      className={cn(
                        'rounded-md border px-3 py-2 text-sm font-medium transition',
                        form.injuries === v
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-input text-muted-foreground hover:bg-muted',
                      )}
                    >
                      {t(`exceptions.form.${v}`)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('exceptions.form.cargoDamaged')}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['no', 'yes'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setForm({ ...form, cargoDamaged: v })}
                      className={cn(
                        'rounded-md border px-3 py-2 text-sm font-medium transition',
                        form.cargoDamaged === v
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-input text-muted-foreground hover:bg-muted',
                      )}
                    >
                      {t(`exceptions.form.${v}`)}
                    </button>
                  ))}
                </div>
                {form.cargoDamaged === 'yes' && (
                  <textarea
                    className={textareaClass()}
                    placeholder={t('exceptions.form.cargoDamageNotes')}
                    value={form.cargoDamageNotes}
                    onChange={(e) => setForm({ ...form, cargoDamageNotes: e.target.value })}
                    rows={3}
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label>{t('exceptions.form.driveable')}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {(['yes', 'no'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setForm({ ...form, vehicleDriveable: v })}
                      className={cn(
                        'rounded-md border px-3 py-2 text-sm font-medium transition',
                        form.vehicleDriveable === v
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-input text-muted-foreground hover:bg-muted',
                      )}
                    >
                      {t(`exceptions.form.${v}`)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ex-police">{t('exceptions.form.policeRefOptional')}</Label>
                <Input
                  id="ex-police"
                  value={form.policeRef}
                  onChange={(e) => setForm({ ...form, policeRef: e.target.value })}
                />
              </div>
            </>
          )}

          {step === 3 && type === 'ACCIDENT' && (
            <div className="rounded-md border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
              {t('exceptions.form.photosNote')}
            </div>
          )}

          <DialogFooter>
            {step > 1 && (
              <Button type="button" variant="outline" onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}>
                {t('exceptions.form.back')}
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              {t('common.cancel')}
            </Button>
            {step < totalSteps ? (
              <Button
                type="button"
                onClick={() => {
                  if (step === 1 && (!form.location.trim() || !form.description.trim())) {
                    toast.error(t('exceptions.form.required'));
                    return;
                  }
                  setStep((s) => (s + 1) as 1 | 2 | 3);
                }}
              >
                {t('exceptions.form.next')}
              </Button>
            ) : (
              <Button type="submit">{t('exceptions.form.submit')}</Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ReportTypePickerDialog({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPick: (type: ExceptionType) => void;
}) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogClose onClick={() => onOpenChange(false)} />
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>{t('exceptions.reportButton')}</DialogTitle>
          <DialogDescription>{t('exceptions.form.reportDescription')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {(['BREAKDOWN', 'ACCIDENT', 'OVERDUE'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                onOpenChange(false);
                onPick(type);
              }}
              className="flex w-full items-center gap-3 rounded-md border border-input bg-background p-3 text-left transition hover:border-primary hover:bg-primary/5"
            >
              <span className="text-lg">
                {type === 'BREAKDOWN' && '🔧'}
                {type === 'ACCIDENT' && '🚨'}
                {type === 'OVERDUE' && '⏱'}
              </span>
              <span className="text-sm font-medium text-foreground">
                {t(`exceptions.types.${type}`)}
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
