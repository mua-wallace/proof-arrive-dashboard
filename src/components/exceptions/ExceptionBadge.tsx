import { Badge } from '@/components/ui/badge';
import { getStatusStyle, getStatusTheme } from '@/lib/status-theme';
import type { ExceptionStatus, ExceptionType } from '@/types/exceptions';
import { cn } from '@/lib/utils';

interface Props {
  type?: ExceptionType;
  status?: ExceptionStatus;
  className?: string;
  withIcon?: boolean;
}

export function ExceptionBadge({ type, status, className, withIcon = true }: Props) {
  const key = status ?? type ?? '';
  const theme = getStatusTheme(key);
  const Icon = theme.icon;
  return (
    <Badge
      variant="secondary"
      className={cn('gap-1 border font-semibold', className)}
      style={getStatusStyle(theme.hex)}
    >
      {withIcon && <Icon className="h-3 w-3" style={{ color: theme.hex }} />}
      <span>{theme.label}</span>
    </Badge>
  );
}
