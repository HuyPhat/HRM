import { useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api/client';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

const DEMO_ACCOUNTS = [
  { email: 'requester@meridian.dev', name: 'D. Alvarez', roleKey: 'requesterProcurement' },
  { email: 'manager@meridian.dev', name: 'R. Osei', roleKey: 'managerOperations' },
  { email: 'finance@meridian.dev', name: 'Jordan Lee', roleKey: 'finance' },
  { email: 'logistics@meridian.dev', name: 'M. Tran', roleKey: 'adminLogistics' }
] as const;

export function LoginPage() {
  const { t } = useTranslation();
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('finance@meridian.dev');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Navigate once the auth context has actually committed the new user,
  // rather than right after login() resolves — calling navigate() in the
  // same tick can race the router's own render against React's pending
  // context update and bounce back to /login with a stale (null) user.
  useEffect(() => {
    if (user) navigate({ to: '/' });
  }, [user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('login.couldNotSignIn'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-bg p-6">
      <div className="w-full max-w-[380px] bg-surface border border-border rounded-xl p-8">
        <div className="flex items-center justify-between gap-2.5 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center text-white font-bold">M</div>
            <div>
              <div className="font-bold text-lg leading-tight">{t('app.name')}</div>
              <div className="text-[10.5px] text-text-tertiary tracking-wider uppercase">{t('app.suite')}</div>
            </div>
          </div>
          <LanguageSwitcher />
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1.5">{t('login.email')}</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="w-full box-border border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1.5">{t('login.password')}</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              className="w-full box-border border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
          </div>
          {error && <div className="text-sm text-danger bg-danger-soft rounded-lg px-3 py-2">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="bg-accent hover:bg-accent-hover text-white font-semibold text-sm rounded-lg py-2.5 disabled:opacity-60"
          >
            {loading ? t('login.signingIn') : t('login.signIn')}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-border">
          <div className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-2">{t('login.demoAccounts', { password: 'demo1234' })}</div>
          <div className="flex flex-col gap-1.5">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => {
                  setEmail(acc.email);
                  setPassword('demo1234');
                }}
                className="text-left text-xs rounded-lg border border-border px-3 py-2 hover:bg-surface-alt"
              >
                <span className="font-semibold">{acc.name}</span>
                <span className="text-text-tertiary"> — {t(`login.roles.${acc.roleKey}`)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
