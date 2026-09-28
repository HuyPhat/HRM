import { useTranslation } from 'react-i18next';
import { setLanguage } from '../i18n';

const LANGS: { code: 'en' | 'vi'; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'vi', label: 'VI' }
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language === 'vi' ? 'vi' : 'en';

  return (
    <div className="flex items-center border border-border rounded-lg p-0.5 bg-surface-alt" role="group" aria-label="Language">
      {LANGS.map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => setLanguage(lang.code)}
          className={`px-2 py-1 text-[11px] font-semibold rounded-md transition-colors ${
            current === lang.code ? 'bg-surface text-accent shadow-sm' : 'text-text-tertiary hover:text-text-primary'
          }`}
          aria-pressed={current === lang.code}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
