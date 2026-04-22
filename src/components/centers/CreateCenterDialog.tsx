import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, Check, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { dashboardApi, type CreateCenterInput, type Geozone, type VehicleGroup } from '@/api/dashboard';
import { toast } from '@/lib/toast';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

interface FormState {
  name: string;
  geozoneId: string;
  manager: string;
  groupId: string;
  time1: string;
  time2: string;
  saturday: string;
  sunday: string;
  breakstart: string;
  breakstop: string;
  timeoutin: string;
  timeoutin_muros: string;
}

const initialForm: FormState = {
  name: '',
  geozoneId: '',
  manager: '',
  groupId: '',
  time1: '00:00',
  time2: '23:59',
  saturday: '00:00',
  sunday: '00:00',
  breakstart: '13:00',
  breakstop: '13:00',
  timeoutin: '',
  timeoutin_muros: '',
};

const TOTAL_STEPS = 3;

function geozoneLabel(g: Geozone): string {
  return g.name ?? g.code ?? `Geozone ${g.id}`;
}

function groupLabel(g: VehicleGroup): string {
  return g.groupName ?? `Group ${g.groupId}`;
}

export function CreateCenterDialog({ open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(initialForm);
  const [step, setStep] = useState(0);
  const [geozoneSearch, setGeozoneSearch] = useState('');
  const [geozoneOpen, setGeozoneOpen] = useState(false);
  const geozoneWrapRef = useRef<HTMLDivElement>(null);
  const [groupSearch, setGroupSearch] = useState('');
  const [groupOpen, setGroupOpen] = useState(false);
  const groupWrapRef = useRef<HTMLDivElement>(null);

  const { data: geozones = [], isLoading: geozonesLoading } = useQuery<Geozone[]>({
    queryKey: ['geozones'],
    queryFn: () => dashboardApi.getGeozones(),
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const { data: vehicleGroups = [], isLoading: groupsLoading } = useQuery<VehicleGroup[]>({
    queryKey: ['vehicle-groups', 'database'],
    queryFn: () => dashboardApi.getVehicleGroups('database'),
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const selectedGeozone = useMemo(() => {
    const id = Number(form.geozoneId);
    if (!id) return undefined;
    return geozones.find((g) => (g.thirdPartyId ?? g.id) === id);
  }, [form.geozoneId, geozones]);

  const filteredGeozones = useMemo(() => {
    const q = geozoneSearch.trim().toLowerCase();
    if (!q) return geozones;
    return geozones.filter((g) => geozoneLabel(g).toLowerCase().includes(q));
  }, [geozones, geozoneSearch]);

  const selectedGroup = useMemo(() => {
    const id = Number(form.groupId);
    if (!id) return undefined;
    return vehicleGroups.find((g) => g.groupId === id);
  }, [form.groupId, vehicleGroups]);

  const filteredGroups = useMemo(() => {
    const q = groupSearch.trim().toLowerCase();
    if (!q) return vehicleGroups;
    return vehicleGroups.filter((g) => groupLabel(g).toLowerCase().includes(q));
  }, [vehicleGroups, groupSearch]);

  useEffect(() => {
    if (!geozoneOpen) return;
    function onDown(e: MouseEvent) {
      if (!geozoneWrapRef.current?.contains(e.target as Node)) setGeozoneOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [geozoneOpen]);

  useEffect(() => {
    if (!groupOpen) return;
    function onDown(e: MouseEvent) {
      if (!groupWrapRef.current?.contains(e.target as Node)) setGroupOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [groupOpen]);

  const createMutation = useMutation({
    mutationFn: (data: CreateCenterInput) => dashboardApi.createCenter(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centers'] });
      toast.success(t('centers.create.toast.created'), t('centers.create.toast.createdDesc'));
      resetAll();
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(
        t('centers.create.toast.error'),
        err?.response?.data?.message || err?.message || t('centers.create.toast.createFailed'),
      );
    },
  });

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetAll() {
    setForm(initialForm);
    setStep(0);
    setGeozoneSearch('');
    setGeozoneOpen(false);
    setGroupSearch('');
    setGroupOpen(false);
  }

  function handleClose(v: boolean) {
    if (!v) resetAll();
    onOpenChange(v);
  }

  function validateStep(index: number): boolean {
    if (index === 0) {
      if (!form.name.trim() || !Number(form.geozoneId)) {
        toast.error(t('centers.create.toast.error'), t('centers.create.toast.required'));
        return false;
      }
    }
    return true;
  }

  function goNext() {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (step < TOTAL_STEPS - 1) {
      goNext();
      return;
    }
    if (!validateStep(0)) {
      setStep(0);
      return;
    }
    const geozoneId = Number(form.geozoneId);
    const selected = geozones.find((g) => (g.thirdPartyId ?? g.id) === geozoneId);
    const groupIdNum = Number(form.groupId);
    const group = groupIdNum ? vehicleGroups.find((g) => g.groupId === groupIdNum) : undefined;
    const trimmedName = form.name.trim();
    const fullname = group ? `${groupLabel(group)} - ${trimmedName}` : trimmedName;
    const payload: CreateCenterInput = {
      name: trimmedName,
      gzone_id: geozoneId,
      geozone: selected ? geozoneLabel(selected) : undefined,
      fullname: fullname || undefined,
      manager: form.manager.trim() || undefined,
      groupid: group?.groupId,
      groupname: group ? groupLabel(group) : undefined,
      time1: form.time1 || undefined,
      time2: form.time2 || undefined,
      saturday: form.saturday || undefined,
      sunday: form.sunday || undefined,
      breakstart: form.breakstart || undefined,
      breakstop: form.breakstop || undefined,
      timeoutin: form.timeoutin ? Number(form.timeoutin) : undefined,
      timeoutin_muros: form.timeoutin_muros ? Number(form.timeoutin_muros) : undefined,
    };
    createMutation.mutate(payload);
  }

  const stepTitles = [
    t('centers.create.sections.general'),
    t('centers.create.sections.hours'),
    t('centers.create.sections.timeouts'),
  ];
  const stepDescriptions = [
    t('centers.create.steps.generalDesc'),
    t('centers.create.steps.hoursDesc'),
    t('centers.create.steps.timeoutsDesc'),
  ];

  const isLastStep = step === TOTAL_STEPS - 1;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[92vh] w-full max-w-lg overflow-y-auto p-0">
        <DialogHeader className="border-b px-6 pb-4 pt-6">
          <DialogTitle>{t('centers.create.title')}</DialogTitle>
          <DialogDescription>{t('centers.create.description')}</DialogDescription>
        </DialogHeader>

        <div className="px-6 pt-5">
          <Stepper current={step} total={TOTAL_STEPS} titles={stepTitles} />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 px-6 py-5">
            <div>
              <h3 className="text-base font-semibold">{stepTitles[step]}</h3>
              <p className="text-sm text-muted-foreground">{stepDescriptions[step]}</p>
            </div>

            {step === 0 && (
              <div className="space-y-4">
                <Field id="cc-geozone" label={t('centers.create.fields.geozone')} required>
                  <div ref={geozoneWrapRef} className="relative">
                    <button
                      id="cc-geozone"
                      type="button"
                      disabled={geozonesLoading}
                      onClick={() => setGeozoneOpen((v) => !v)}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-haspopup="listbox"
                      aria-expanded={geozoneOpen}
                    >
                      <span className={cn('truncate text-left', !selectedGeozone && 'text-muted-foreground')}>
                        {geozonesLoading
                          ? t('common.loading')
                          : selectedGeozone
                            ? geozoneLabel(selectedGeozone)
                            : t('centers.create.placeholders.selectGeozone')}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                    </button>
                    {geozoneOpen && !geozonesLoading && (
                      <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                        <Input
                          autoFocus
                          value={geozoneSearch}
                          onChange={(e) => setGeozoneSearch(e.target.value)}
                          placeholder={t('common.search')}
                          className="mb-1 h-9"
                        />
                        <div className="max-h-60 overflow-y-auto">
                          {filteredGeozones.length === 0 ? (
                            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                              {t('common.noResults')}
                            </div>
                          ) : (
                            filteredGeozones.map((g) => {
                              const value = g.thirdPartyId ?? g.id;
                              const isSelected = Number(form.geozoneId) === value;
                              return (
                                <button
                                  key={g.id}
                                  type="button"
                                  onClick={() => {
                                    set('geozoneId', String(value));
                                    setGeozoneOpen(false);
                                    setGeozoneSearch('');
                                  }}
                                  className={cn(
                                    'flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground',
                                    isSelected && 'bg-accent/60',
                                  )}
                                >
                                  <span className="truncate">{geozoneLabel(g)}</span>
                                  {isSelected && <Check className="ml-2 h-4 w-4 shrink-0" />}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </Field>

                <Field
                  id="cc-name"
                  label={t('centers.create.fields.name')}
                  required
                >
                  <Input
                    id="cc-name"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder={t('centers.create.placeholders.name')}
                    required
                  />
                </Field>

                <Field id="cc-groupname" label={t('centers.create.fields.group')}>
                  <div ref={groupWrapRef} className="relative">
                    <button
                      id="cc-groupname"
                      type="button"
                      disabled={groupsLoading}
                      onClick={() => setGroupOpen((v) => !v)}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-haspopup="listbox"
                      aria-expanded={groupOpen}
                    >
                      <span className={cn('truncate text-left', !selectedGroup && 'text-muted-foreground')}>
                        {groupsLoading
                          ? t('common.loading')
                          : selectedGroup
                            ? groupLabel(selectedGroup)
                            : t('centers.create.placeholders.selectGroup')}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
                    </button>
                    {groupOpen && !groupsLoading && (
                      <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                        <Input
                          autoFocus
                          value={groupSearch}
                          onChange={(e) => setGroupSearch(e.target.value)}
                          placeholder={t('common.search')}
                          className="mb-1 h-9"
                        />
                        <div className="max-h-60 overflow-y-auto">
                          {filteredGroups.length === 0 ? (
                            <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                              {t('common.noResults')}
                            </div>
                          ) : (
                            filteredGroups.map((g) => {
                              const isSelected = Number(form.groupId) === g.groupId;
                              return (
                                <button
                                  key={g.groupId}
                                  type="button"
                                  onClick={() => {
                                    set('groupId', String(g.groupId));
                                    setGroupOpen(false);
                                    setGroupSearch('');
                                  }}
                                  className={cn(
                                    'flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground',
                                    isSelected && 'bg-accent/60',
                                  )}
                                >
                                  <span className="truncate">{groupLabel(g)}</span>
                                  {isSelected && <Check className="ml-2 h-4 w-4 shrink-0" />}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </Field>

                <Field id="cc-manager" label={t('centers.create.fields.manager')}>
                  <Input
                    id="cc-manager"
                    value={form.manager}
                    onChange={(e) => set('manager', e.target.value)}
                  />
                </Field>
              </div>
            )}

            {step === 1 && (
              <div className="grid grid-cols-2 gap-4">
                <Field id="cc-time1" label={t('centers.create.fields.time1')}>
                  <Input id="cc-time1" type="time" value={form.time1} onChange={(e) => set('time1', e.target.value)} />
                </Field>
                <Field id="cc-time2" label={t('centers.create.fields.time2')}>
                  <Input id="cc-time2" type="time" value={form.time2} onChange={(e) => set('time2', e.target.value)} />
                </Field>
                <Field id="cc-saturday" label={t('centers.create.fields.saturday')}>
                  <Input
                    id="cc-saturday"
                    type="time"
                    value={form.saturday}
                    onChange={(e) => set('saturday', e.target.value)}
                  />
                </Field>
                <Field id="cc-sunday" label={t('centers.create.fields.sunday')}>
                  <Input
                    id="cc-sunday"
                    type="time"
                    value={form.sunday}
                    onChange={(e) => set('sunday', e.target.value)}
                  />
                </Field>
                <Field id="cc-breakstart" label={t('centers.create.fields.breakStart')}>
                  <Input
                    id="cc-breakstart"
                    type="time"
                    value={form.breakstart}
                    onChange={(e) => set('breakstart', e.target.value)}
                  />
                </Field>
                <Field id="cc-breakstop" label={t('centers.create.fields.breakStop')}>
                  <Input
                    id="cc-breakstop"
                    type="time"
                    value={form.breakstop}
                    onChange={(e) => set('breakstop', e.target.value)}
                  />
                </Field>
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-2 gap-4">
                <Field id="cc-timeoutin" label={t('centers.create.fields.timeoutIn')}>
                  <Input
                    id="cc-timeoutin"
                    type="number"
                    min={0}
                    value={form.timeoutin}
                    onChange={(e) => set('timeoutin', e.target.value)}
                  />
                </Field>
                <Field id="cc-timeoutin-muros" label={t('centers.create.fields.timeoutMuros')}>
                  <Input
                    id="cc-timeoutin-muros"
                    type="number"
                    min={0}
                    value={form.timeoutin_muros}
                    onChange={(e) => set('timeoutin_muros', e.target.value)}
                  />
                </Field>
              </div>
            )}
          </div>

          <DialogFooter className="flex-row items-center justify-between gap-2 border-t bg-muted/30 px-6 py-4 sm:flex-row sm:justify-between">
            <span className="text-xs text-muted-foreground">
              {t('centers.create.steps.stepOf', { current: step + 1, total: TOTAL_STEPS })}
            </span>
            <div className="flex gap-2">
              {step === 0 ? (
                <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                  {t('common.cancel')}
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={goBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {t('centers.create.steps.back')}
                </Button>
              )}
              {isLastStep ? (
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('centers.create.submit')}
                </Button>
              ) : (
                <Button type="button" onClick={goNext}>
                  {t('centers.create.steps.next')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  id,
  label,
  required,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

function Stepper({ current, total, titles }: { current: number; total: number; titles: string[] }) {
  return (
    <ol className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => {
        const isDone = i < current;
        const isActive = i === current;
        return (
          <li key={i} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
                isActive && 'border-primary bg-primary text-primary-foreground',
                isDone && 'border-primary bg-primary/10 text-primary',
                !isActive && !isDone && 'border-border bg-background text-muted-foreground',
              )}
            >
              {isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span
              className={cn(
                'hidden truncate text-xs font-medium sm:inline',
                isActive ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {titles[i]}
            </span>
            {i < total - 1 && <div className={cn('h-px flex-1', isDone ? 'bg-primary/50' : 'bg-border')} />}
          </li>
        );
      })}
    </ol>
  );
}
