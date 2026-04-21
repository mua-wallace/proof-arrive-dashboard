import { useState, type FormEvent } from 'react';
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
import { Select } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { dashboardApi, type CreateCenterInput, type Geozone } from '@/api/dashboard';
import { toast } from '@/lib/toast';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

interface FormState {
  name: string;
  geozoneId: string;
  fullname: string;
  manager: string;
  groupname: string;
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
  fullname: '',
  manager: '',
  groupname: '',
  time1: '',
  time2: '',
  saturday: '',
  sunday: '',
  breakstart: '',
  breakstop: '',
  timeoutin: '',
  timeoutin_muros: '',
};

function geozoneLabel(g: Geozone): string {
  return g.name ?? g.code ?? `Geozone ${g.id}`;
}

export function CreateCenterDialog({ open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(initialForm);

  const { data: geozones = [], isLoading: geozonesLoading } = useQuery<Geozone[]>({
    queryKey: ['geozones'],
    queryFn: () => dashboardApi.getGeozones(),
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateCenterInput) => dashboardApi.createCenter(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centers'] });
      toast.success(t('centers.create.toast.created'), t('centers.create.toast.createdDesc'));
      setForm(initialForm);
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

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const geozoneId = Number(form.geozoneId);
    if (!form.name.trim() || !geozoneId) {
      toast.error(t('centers.create.toast.error'), t('centers.create.toast.required'));
      return;
    }
    const selected = geozones.find((g) => g.id === geozoneId);
    const payload: CreateCenterInput = {
      name: form.name.trim(),
      geozoneId,
      geozone: selected ? geozoneLabel(selected) : undefined,
      fullname: form.fullname.trim() || undefined,
      manager: form.manager.trim() || undefined,
      groupname: form.groupname.trim() || undefined,
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

  function handleClose(v: boolean) {
    if (!v) setForm(initialForm);
    onOpenChange(v);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('centers.create.title')}</DialogTitle>
          <DialogDescription>{t('centers.create.description')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cc-name">
                {t('centers.create.fields.name')}
                <span className="ml-1 text-destructive">*</span>
              </Label>
              <Input
                id="cc-name"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder={t('centers.create.placeholders.name')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cc-geozone">
                {t('centers.create.fields.geozone')}
                <span className="ml-1 text-destructive">*</span>
              </Label>
              <Select
                id="cc-geozone"
                value={form.geozoneId}
                onChange={(e) => set('geozoneId', e.target.value)}
                required
                disabled={geozonesLoading}
              >
                <option value="">
                  {geozonesLoading
                    ? t('common.loading')
                    : t('centers.create.placeholders.selectGeozone')}
                </option>
                {geozones.map((g) => (
                  <option key={g.id} value={g.id}>
                    {geozoneLabel(g)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cc-fullname">{t('centers.create.fields.fullname')}</Label>
              <Input
                id="cc-fullname"
                value={form.fullname}
                onChange={(e) => set('fullname', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cc-manager">{t('centers.create.fields.manager')}</Label>
              <Input
                id="cc-manager"
                value={form.manager}
                onChange={(e) => set('manager', e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="cc-groupname">{t('centers.create.fields.group')}</Label>
              <Input
                id="cc-groupname"
                value={form.groupname}
                onChange={(e) => set('groupname', e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border bg-muted/20 p-3">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('centers.create.sections.hours')}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cc-time1">{t('centers.create.fields.time1')}</Label>
                <Input
                  id="cc-time1"
                  type="time"
                  value={form.time1}
                  onChange={(e) => set('time1', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cc-time2">{t('centers.create.fields.time2')}</Label>
                <Input
                  id="cc-time2"
                  type="time"
                  value={form.time2}
                  onChange={(e) => set('time2', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cc-saturday">{t('centers.create.fields.saturday')}</Label>
                <Input
                  id="cc-saturday"
                  type="time"
                  value={form.saturday}
                  onChange={(e) => set('saturday', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cc-sunday">{t('centers.create.fields.sunday')}</Label>
                <Input
                  id="cc-sunday"
                  type="time"
                  value={form.sunday}
                  onChange={(e) => set('sunday', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cc-breakstart">{t('centers.create.fields.breakStart')}</Label>
                <Input
                  id="cc-breakstart"
                  type="time"
                  value={form.breakstart}
                  onChange={(e) => set('breakstart', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cc-breakstop">{t('centers.create.fields.breakStop')}</Label>
                <Input
                  id="cc-breakstop"
                  type="time"
                  value={form.breakstop}
                  onChange={(e) => set('breakstop', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cc-timeoutin">{t('centers.create.fields.timeoutIn')}</Label>
              <Input
                id="cc-timeoutin"
                type="number"
                min={0}
                value={form.timeoutin}
                onChange={(e) => set('timeoutin', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cc-timeoutin-muros">
                {t('centers.create.fields.timeoutMuros')}
              </Label>
              <Input
                id="cc-timeoutin-muros"
                type="number"
                min={0}
                value={form.timeoutin_muros}
                onChange={(e) => set('timeoutin_muros', e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('centers.create.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
