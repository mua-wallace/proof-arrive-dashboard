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
import { Select } from '@/components/ui/select';
import { useExceptionsStore } from '@/stores/exceptions.store';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import type { ContactOutcome } from '@/types/exceptions';

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

export function DispatchTechnicianDialog({ open, onOpenChange, exceptionId }: BaseProps) {
  const { t } = useTranslation();
  const by = useBy();
  const dispatchTechnician = useExceptionsStore((s) => s.dispatchTechnician);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [etaText, setEtaText] = useState('');
  const [notes, setNotes] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !etaText.trim()) return;
    dispatchTechnician(exceptionId, { name: name.trim(), phone: phone.trim(), etaText: etaText.trim() }, by);
    if (notes.trim()) {
      useExceptionsStore.getState().addNote(exceptionId, notes.trim(), by);
    }
    toast.success(t('exceptions.toasts.technicianDispatched'));
    onOpenChange(false);
    setName('');
    setPhone('');
    setEtaText('');
    setNotes('');
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
            <Button type="submit">{t('exceptions.dispatchTechnician.submit')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function MarkRepairedDialog({ open, onOpenChange, exceptionId }: BaseProps) {
  const { t } = useTranslation();
  const by = useBy();
  const markRepaired = useExceptionsStore((s) => s.markRepaired);
  const [repairedBy, setRepairedBy] = useState(by);
  const [description, setDescription] = useState('');
  const [repairRef, setRepairRef] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    markRepaired(exceptionId, {
      repairedBy: repairedBy || by,
      description: description.trim(),
      repairRef: repairRef.trim() || undefined,
    });
    toast.success(t('exceptions.toasts.repaired'), t('exceptions.toasts.repairedDesc'));
    onOpenChange(false);
    setDescription('');
    setRepairRef('');
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
            <Button type="submit">{t('exceptions.markRepaired.submit')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function LogContactAttemptDialog({ open, onOpenChange, exceptionId }: BaseProps) {
  const { t } = useTranslation();
  const by = useBy();
  const addAttempt = useExceptionsStore((s) => s.addContactAttempt);
  const [outcome, setOutcome] = useState<ContactOutcome>('NO_ANSWER');
  const [notes, setNotes] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    addAttempt(exceptionId, { by, outcome, notes: notes.trim() || undefined });
    toast.success(t('exceptions.toasts.contactLogged'));
    onOpenChange(false);
    setOutcome('NO_ANSWER');
    setNotes('');
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
            <Button type="submit">{t('exceptions.logContact.submit')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function UpdateETADialog({ open, onOpenChange, exceptionId }: BaseProps) {
  const { t } = useTranslation();
  const by = useBy();
  const updateETA = useExceptionsStore((s) => s.updateExpectedArrival);
  const [eta, setEta] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!eta) return;
    updateETA(exceptionId, new Date(eta).toISOString(), by);
    toast.success(t('exceptions.toasts.etaUpdated'));
    onOpenChange(false);
    setEta('');
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
            <Button type="submit">{t('exceptions.updateEta.submit')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ReturnToOriginDialog({ open, onOpenChange, exceptionId }: BaseProps) {
  const { t } = useTranslation();
  const by = useBy();
  const returnToOrigin = useExceptionsStore((s) => s.returnToOrigin);
  const [reason, setReason] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!reason.trim()) return;
    returnToOrigin(exceptionId, reason.trim(), by);
    toast.success(t('exceptions.toasts.returned'));
    onOpenChange(false);
    setReason('');
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
            <Button type="submit" variant="destructive">
              {t('exceptions.returnOrigin.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function EscalateDialog({ open, onOpenChange, exceptionId }: BaseProps) {
  const { t } = useTranslation();
  const by = useBy();
  const escalate = useExceptionsStore((s) => s.escalate);
  const [reason, setReason] = useState('Driver unreachable');
  const [attempts, setAttempts] = useState(2);
  const [notes, setNotes] = useState('');
  const [policeRef, setPoliceRef] = useState('');
  const [actions, setActions] = useState<string[]>([]);

  function toggle(a: string) {
    setActions((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!notes.trim()) return;
    escalate(exceptionId, {
      reason,
      attempts,
      notes: notes.trim(),
      actions,
      policeRef: policeRef.trim() || undefined,
      by,
    });
    toast.success(t('exceptions.toasts.escalated'));
    onOpenChange(false);
    setReason('Driver unreachable');
    setAttempts(2);
    setNotes('');
    setPoliceRef('');
    setActions([]);
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
            <Select id="esc-reason" value={reason} onChange={(e) => setReason(e.target.value)}>
              <option value="Driver unreachable">{t('exceptions.escalate.reasonDriverUnreachable')}</option>
              <option value="Suspected breakdown">{t('exceptions.escalate.reasonSuspectedBreakdown')}</option>
              <option value="Suspected accident">{t('exceptions.escalate.reasonSuspectedAccident')}</option>
              <option value="Unknown">{t('exceptions.escalate.reasonUnknown')}</option>
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
                { key: 'police', label: t('exceptions.escalate.actionPolice') },
                { key: 'management', label: t('exceptions.escalate.actionManagement') },
                { key: 'replacement', label: t('exceptions.escalate.actionReplacement') },
              ].map((a) => (
                <label key={a.key} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={actions.includes(a.label)}
                    onChange={() => toggle(a.label)}
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
            <Button type="submit" variant="destructive">
              {t('exceptions.escalate.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddNoteDialog({ open, onOpenChange, exceptionId }: BaseProps) {
  const { t } = useTranslation();
  const by = useBy();
  const addNote = useExceptionsStore((s) => s.addNote);
  const [text, setText] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    addNote(exceptionId, text.trim(), by);
    toast.success(t('exceptions.toasts.noteAdded'));
    onOpenChange(false);
    setText('');
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
            <Button type="submit">{t('exceptions.addNote.submit')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
