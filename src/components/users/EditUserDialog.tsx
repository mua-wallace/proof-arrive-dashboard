import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { AlertTriangle, Loader2 } from 'lucide-react';
import { dashboardApi, type UpdateUserRequest, type UserRole } from '@/api/dashboard';
import { toast } from '@/lib/toast';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  user: {
    id: string;
    fullname?: string;
    email?: string | null;
    role?: string;
  } | null;
}

interface FormState {
  fullname: string;
  email: string;
  role: UserRole;
}

const initialForm: FormState = {
  fullname: '',
  email: '',
  role: 'agent',
};

function normalizeRole(role: string | undefined): UserRole {
  return role === 'admin' ? 'admin' : 'agent';
}

export function EditUserDialog({ open, onOpenChange, user }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(initialForm);
  const [pendingPayload, setPendingPayload] = useState<UpdateUserRequest | null>(null);

  useEffect(() => {
    if (open && user) {
      setForm({
        fullname: user.fullname ?? '',
        email: user.email ?? '',
        role: normalizeRole(user.role),
      });
      setPendingPayload(null);
    }
  }, [open, user]);

  const mutation = useMutation({
    mutationFn: (payload: UpdateUserRequest) => {
      if (!user) return Promise.reject(new Error('No user selected'));
      return dashboardApi.updateUser(user.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      toast.success(t('users.edit.successTitle'), t('users.edit.successDesc'));
      setPendingPayload(null);
      onOpenChange(false);
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        t('users.edit.errorDefault');
      toast.error(t('users.edit.errorTitle'), message);
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const payload: UpdateUserRequest = {};
    const trimmedName = form.fullname.trim();
    const trimmedEmail = form.email.trim();
    if (trimmedName && trimmedName !== (user.fullname ?? '')) payload.fullname = trimmedName;
    if (trimmedEmail && trimmedEmail !== (user.email ?? '')) payload.email = trimmedEmail;
    if (form.role !== normalizeRole(user.role)) payload.role = form.role;

    if (Object.keys(payload).length === 0) {
      onOpenChange(false);
      return;
    }
    setPendingPayload(payload);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('users.edit.title')}</DialogTitle>
            <DialogDescription>{t('users.edit.description')}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-user-fullname">{t('users.edit.fullname')}</Label>
              <Input
                id="edit-user-fullname"
                value={form.fullname}
                onChange={(e) => setForm((f) => ({ ...f, fullname: e.target.value }))}
                placeholder={t('users.edit.fullnamePlaceholder')}
                autoComplete="off"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-user-email">{t('users.edit.email')}</Label>
              <Input
                id="edit-user-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="user@example.com"
                autoComplete="off"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-user-role">{t('users.edit.role')}</Label>
              <Select
                id="edit-user-role"
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
              >
                <option value="admin">{t('users.edit.roleAdmin')}</option>
                <option value="agent">{t('users.edit.roleAgent')}</option>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={mutation.isPending || !user}>
                {t('users.edit.save')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pendingPayload != null}
        onOpenChange={(v) => {
          if (!v && !mutation.isPending) setPendingPayload(null);
        }}
      >
        <DialogContent className="border-destructive/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {t('users.edit.confirmTitle')}
            </DialogTitle>
            <DialogDescription>{t('users.edit.confirmDescription')}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm font-semibold text-destructive">
              {t('users.edit.consequencesLabel')}
            </p>
            <ul className="list-disc list-inside text-sm text-destructive/90 mt-2 space-y-1">
              <li>{t('users.edit.consequence1')}</li>
              <li>{t('users.edit.consequence2')}</li>
              <li>{t('users.edit.consequence3')}</li>
            </ul>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingPayload(null)}
              disabled={mutation.isPending}
            >
              {t('users.edit.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (pendingPayload) mutation.mutate(pendingPayload);
              }}
              disabled={mutation.isPending || !pendingPayload}
              className="gap-2"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('users.edit.saving')}
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  {t('users.edit.confirm')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
