import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
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
import { Select } from '@/components/ui/select';
import { useAuthStore } from '@/stores/auth.store';
import { dashboardApi } from '@/api/dashboard';
import {
  useDispatchTechnician,
  useMarkRepaired,
  useLogCallAttempt,
  useSetTripEta,
  useReturnToOrigin,
  useEscalateException,
  useAddExceptionNote,
  useDispatchRescueVehicle,
} from '@/hooks/useExceptions';
import { cn } from '@/lib/utils';
import type { ContactOutcome } from '@/types/exceptions';
import { Loader2 } from 'lucide-react';

const textareaClass =
  'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

function useBy(): string {
  const { user } = useAuthStore();
  return user?.username ?? 'Dispatcher';
}

interface BaseProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  exceptionId: string;
}

interface EtaDialogProps extends BaseProps {
  tripId: number | string;
}

// ---------------------------------------------------------------------------
// Dispatch Technician
// ---------------------------------------------------------------------------

export function DispatchTechnicianDialog({ open, onOpenChange, exceptionId }: BaseProps) {
  const { t } = useTranslation();
  const mutation = useDispatchTechnician();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [etaText, setEtaText] = useState('');
  const [notes, setNotes] = useState('');

  function reset() {
    setName(''); setPhone(''); setEtaText(''); setNotes('');
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !etaText.trim()) return;
    mutation.mutate(
      {
        id: exceptionId,
        data: {
          technicianName: name.trim(),
          technicianPhone: phone.trim(),
          estimatedArrival: etaText.trim(),
          notes: notes.trim() || undefined,
        },
      },
      { onSuccess: () => { onOpenChange(false); reset(); } },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogClose onClick={() => onOpenChange(false)} />
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>{t('exceptions.dispatchTechnician.title')}</DialogTitle>
          <DialogDescription>{t('exceptions.dispatchTechnician.description')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tech-name">{t('exceptions.dispatchTechnician.name')}</Label>
            <Input id="tech-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tech-phone">{t('exceptions.dispatchTechnician.phone')}</Label>
            <Input id="tech-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tech-eta">{t('exceptions.dispatchTechnician.eta')}</Label>
            <Input
              id="tech-eta"
              placeholder={t('exceptions.dispatchTechnician.etaPlaceholder')}
              value={etaText}
              onChange={(e) => setEtaText(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tech-notes">{t('exceptions.dispatchTechnician.notes')}</Label>
            <textarea
              id="tech-notes"
              className={textareaClass}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('exceptions.dispatchTechnician.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Mark Repaired
// ---------------------------------------------------------------------------

export function MarkRepairedDialog({ open, onOpenChange, exceptionId }: BaseProps) {
  const { t } = useTranslation();
  const by = useBy();
  const mutation = useMarkRepaired();
  const [repairedBy, setRepairedBy] = useState(by);
  const [description, setDescription] = useState('');
  const [repairRef, setRepairRef] = useState('');

  function reset() {
    setDescription(''); setRepairRef('');
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    mutation.mutate(
      {
        id: exceptionId,
        data: {
          repairedBy: repairedBy || by,
          description: description.trim(),
          repairReference: repairRef.trim() || undefined,
        },
      },
      { onSuccess: () => { onOpenChange(false); reset(); } },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogClose onClick={() => onOpenChange(false)} />
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>{t('exceptions.markRepaired.title')}</DialogTitle>
          <DialogDescription>{t('exceptions.markRepaired.description')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rep-by">{t('exceptions.markRepaired.repairedBy')}</Label>
            <Input id="rep-by" value={repairedBy} onChange={(e) => setRepairedBy(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rep-desc">{t('exceptions.markRepaired.descriptionLabel')}</Label>
            <textarea
              id="rep-desc"
              className={textareaClass}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rep-ref">{t('exceptions.markRepaired.repairRef')}</Label>
            <Input id="rep-ref" value={repairRef} onChange={(e) => setRepairRef(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('exceptions.markRepaired.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Log Contact Attempt
// ---------------------------------------------------------------------------

export function LogContactAttemptDialog({ open, onOpenChange, exceptionId }: BaseProps) {
  const { t } = useTranslation();
  const mutation = useLogCallAttempt();
  const [outcome, setOutcome] = useState<ContactOutcome>('NO_ANSWER');
  const [notes, setNotes] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate(
      {
        id: exceptionId,
        data: { outcome, notes: notes.trim() || undefined },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setOutcome('NO_ANSWER');
          setNotes('');
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogClose onClick={() => onOpenChange(false)} />
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>{t('exceptions.logContact.title')}</DialogTitle>
          <DialogDescription>{t('exceptions.logContact.description')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t('exceptions.logContact.outcome')}</Label>
            <div className="grid grid-cols-3 gap-2">
              {(['ANSWERED', 'NO_ANSWER', 'VOICEMAIL'] as const).map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOutcome(o)}
                  className={cn(
                    'rounded-md border px-3 py-2 text-xs font-medium transition',
                    outcome === o
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-input text-muted-foreground hover:bg-muted',
                  )}
                >
                  {t(
                    o === 'ANSWERED'
                      ? 'exceptions.logContact.outcomeAnswered'
                      : o === 'NO_ANSWER'
                        ? 'exceptions.logContact.outcomeNoAnswer'
                        : 'exceptions.logContact.outcomeVoicemail',
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ca-notes">{t('exceptions.logContact.notes')}</Label>
            <textarea
              id="ca-notes"
              className={textareaClass}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('exceptions.logContact.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Update ETA
// ---------------------------------------------------------------------------

export function UpdateETADialog({ open, onOpenChange, tripId }: EtaDialogProps) {
  const { t } = useTranslation();
  const mutation = useSetTripEta();
  const [eta, setEta] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!eta) return;
    mutation.mutate(
      { tripId, estimatedArrivalAt: new Date(eta).toISOString() },
      { onSuccess: () => { onOpenChange(false); setEta(''); } },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogClose onClick={() => onOpenChange(false)} />
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>{t('exceptions.updateEta.title')}</DialogTitle>
          <DialogDescription>{t('exceptions.updateEta.description')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="eta">{t('exceptions.updateEta.eta')}</Label>
            <Input
              id="eta"
              type="datetime-local"
              value={eta}
              onChange={(e) => setEta(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('exceptions.updateEta.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Return To Origin
// ---------------------------------------------------------------------------

export function ReturnToOriginDialog({ open, onOpenChange, exceptionId }: BaseProps) {
  const { t } = useTranslation();
  const mutation = useReturnToOrigin();
  const [reason, setReason] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!reason.trim()) return;
    mutation.mutate(
      { id: exceptionId, data: { reason: reason.trim() } },
      { onSuccess: () => { onOpenChange(false); setReason(''); } },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogClose onClick={() => onOpenChange(false)} />
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>{t('exceptions.returnOrigin.title')}</DialogTitle>
          <DialogDescription>{t('exceptions.returnOrigin.description')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ret-reason">{t('exceptions.returnOrigin.reason')}</Label>
            <textarea
              id="ret-reason"
              className={textareaClass}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="destructive" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('exceptions.returnOrigin.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Escalate
// ---------------------------------------------------------------------------

export function EscalateDialog({ open, onOpenChange, exceptionId }: BaseProps) {
  const { t } = useTranslation();
  const mutation = useEscalateException();
  const [reason, setReason] = useState<'DRIVER_UNREACHABLE' | 'SUSPECTED_BREAKDOWN' | 'SUSPECTED_ACCIDENT' | 'UNKNOWN'>('DRIVER_UNREACHABLE');
  const [attempts, setAttempts] = useState(2);
  const [notes, setNotes] = useState('');
  const [policeRef, setPoliceRef] = useState('');
  const [actions, setActions] = useState<string[]>([]);

  function toggle(a: string) {
    setActions((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]));
  }

  function reset() {
    setReason('DRIVER_UNREACHABLE'); setAttempts(2); setNotes(''); setPoliceRef(''); setActions([]);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!notes.trim()) return;
    mutation.mutate(
      {
        id: exceptionId,
        data: {
          reason,
          contactAttemptsMade: attempts,
          notes: notes.trim(),
          actionsTaken: actions.length > 0 ? actions : undefined,
          policeReportReference: policeRef.trim() || undefined,
        },
      },
      { onSuccess: () => { onOpenChange(false); reset(); } },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogClose onClick={() => onOpenChange(false)} />
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>{t('exceptions.escalate.title')}</DialogTitle>
          <DialogDescription>{t('exceptions.escalate.description')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="esc-reason">{t('exceptions.escalate.reason')}</Label>
            <Select id="esc-reason" value={reason} onChange={(e) => setReason(e.target.value as typeof reason)}>
              <option value="DRIVER_UNREACHABLE">{t('exceptions.escalate.reasonDriverUnreachable')}</option>
              <option value="SUSPECTED_BREAKDOWN">{t('exceptions.escalate.reasonSuspectedBreakdown')}</option>
              <option value="SUSPECTED_ACCIDENT">{t('exceptions.escalate.reasonSuspectedAccident')}</option>
              <option value="UNKNOWN">{t('exceptions.escalate.reasonUnknown')}</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="esc-attempts">{t('exceptions.escalate.attempts')}</Label>
            <Input
              id="esc-attempts"
              type="number"
              min={0}
              value={attempts}
              onChange={(e) => setAttempts(Number(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="esc-notes">{t('exceptions.escalate.notes')}</Label>
            <textarea
              id="esc-notes"
              className={textareaClass}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>{t('exceptions.escalate.actions')}</Label>
            <div className="space-y-1">
              {[
                { key: 'REPORTED_TO_POLICE', label: t('exceptions.escalate.actionPolice') },
                { key: 'NOTIFIED_MANAGEMENT', label: t('exceptions.escalate.actionManagement') },
                { key: 'DISPATCHED_REPLACEMENT', label: t('exceptions.escalate.actionReplacement') },
              ].map((a) => (
                <label key={a.key} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={actions.includes(a.key)}
                    onChange={() => toggle(a.key)}
                    className="h-4 w-4 rounded border-input"
                  />
                  {a.label}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="esc-police">{t('exceptions.escalate.policeRef')}</Label>
            <Input id="esc-police" value={policeRef} onChange={(e) => setPoliceRef(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="destructive" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('exceptions.escalate.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Add Note
// ---------------------------------------------------------------------------

export function AddNoteDialog({ open, onOpenChange, exceptionId }: BaseProps) {
  const { t } = useTranslation();
  const mutation = useAddExceptionNote();
  const [text, setText] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    mutation.mutate(
      { id: exceptionId, data: { text: text.trim() } },
      { onSuccess: () => { onOpenChange(false); setText(''); } },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogClose onClick={() => onOpenChange(false)} />
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>{t('exceptions.addNote.title')}</DialogTitle>
          <DialogDescription>{t('exceptions.addNote.description')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="note-text">{t('exceptions.addNote.text')}</Label>
            <textarea
              id="note-text"
              className={textareaClass}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('exceptions.addNote.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Dispatch Rescue Vehicle (NEW)
// ---------------------------------------------------------------------------

export function DispatchRescueVehicleDialog({ open, onOpenChange, exceptionId }: BaseProps) {
  const { t } = useTranslation();
  const mutation = useDispatchRescueVehicle();

  const { data: availableVehicles, isLoading: vehiclesLoading } = useQuery({
    queryKey: ['vehicles-by-status', 'AVAILABLE'],
    queryFn: () => dashboardApi.getVehiclesByStatus('available'),
    enabled: open,
  });

  const [vehicleId, setVehicleId] = useState<number | ''>('');
  const [transferLocation, setTransferLocation] = useState('');
  const [estimatedArrival, setEstimatedArrival] = useState('');
  const [notes, setNotes] = useState('');

  function reset() {
    setVehicleId(''); setTransferLocation(''); setEstimatedArrival(''); setNotes('');
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!vehicleId || !transferLocation.trim()) return;
    mutation.mutate(
      {
        id: exceptionId,
        data: {
          rescueVehicleId: vehicleId as number,
          transferLocation: transferLocation.trim(),
          estimatedArrival: estimatedArrival || undefined,
          notes: notes.trim() || undefined,
        },
      },
      { onSuccess: () => { onOpenChange(false); reset(); } },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogClose onClick={() => onOpenChange(false)} />
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>{t('exceptions.actions.dispatchRescue')}</DialogTitle>
          <DialogDescription>
            {t('exceptions.dispatchRescue.description', 'Select an available vehicle to dispatch for goods transfer.')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rescue-vehicle">
              {t('exceptions.dispatchRescue.selectVehicle', 'Rescue vehicle')}
            </Label>
            {vehiclesLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('common.loading')}
              </div>
            ) : (
              <Select
                id="rescue-vehicle"
                value={String(vehicleId)}
                onChange={(e) => setVehicleId(e.target.value ? Number(e.target.value) : '')}
                required
              >
                <option value="">{t('exceptions.dispatchRescue.selectPlaceholder', '-- Select vehicle --')}</option>
                {(availableVehicles ?? []).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.plate} {v.brand ? `— ${v.brand} ${v.model}` : v.model ? `— ${v.model}` : ''}
                  </option>
                ))}
              </Select>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="transfer-location">
              {t('exceptions.dispatchRescue.transferLocation', 'Transfer location')}
            </Label>
            <Input
              id="transfer-location"
              placeholder={t('exceptions.form.locationPlaceholder')}
              value={transferLocation}
              onChange={(e) => setTransferLocation(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rescue-eta">
              {t('exceptions.dispatchRescue.estimatedArrival', 'Estimated arrival')}
            </Label>
            <Input
              id="rescue-eta"
              placeholder={t('exceptions.dispatchTechnician.etaPlaceholder')}
              value={estimatedArrival}
              onChange={(e) => setEstimatedArrival(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rescue-notes">{t('exceptions.dispatchRescue.notes', 'Notes')}</Label>
            <textarea
              id="rescue-notes"
              className={textareaClass}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending || vehiclesLoading || !vehicleId}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('exceptions.dispatchRescue.submit', 'Dispatch rescue vehicle')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
