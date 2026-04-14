import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@/lib/i18n';

export default function LanguageSwitcher({ className }: { className?: string }) {
  const { t, i18n } = useTranslation();
  const current = (SUPPORTED_LANGUAGES as readonly string[]).includes(i18n.language)
    ? (i18n.language as SupportedLanguage)
    : 'fr';

  const change = (lng: SupportedLanguage) => {
    if (lng !== current) i18n.changeLanguage(lng);
  };

  return (
    <div
      className={cn(
        'inline-flex h-10 items-center gap-1 rounded-xl border border-border bg-background p-1',
        className
      )}
      role="group"
      aria-label={t('language.label')}
    >
      <Globe className="ml-1 h-4 w-4 text-muted-foreground" aria-hidden />
      {SUPPORTED_LANGUAGES.map((lng) => (
        <button
          key={lng}
          type="button"
          onClick={() => change(lng)}
          aria-pressed={current === lng}
          title={t(`language.${lng}`)}
          className={cn(
            'rounded-lg px-2.5 py-1 text-xs font-semibold uppercase tracking-wide transition-colors',
            current === lng
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          {t(`language.short.${lng}`)}
        </button>
      ))}
    </div>
  );
}
