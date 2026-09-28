import { Link, Outlet, useNavigate } from '@tanstack/react-router';
import { useEffect, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { BellIcon, BoxIcon, CartIcon, CheckCircleIcon, GridIcon, SearchIcon, SettingsIcon } from './icons';
import { LanguageSwitcher } from './LanguageSwitcher';

const navItemClass =
  'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-surface hover:text-text-primary';
const navItemActiveClass = 'bg-accent-soft text-accent font-semibold hover:bg-accent-soft hover:text-accent';

function NavLink({ to, icon, children }: { to: string; icon: ReactNode; children: ReactNode }) {
  return (
    <Link to={to} className={navItemClass} activeProps={{ className: `${navItemClass} ${navItemActiveClass}` }} activeOptions={{ exact: to === '/' }}>
      {icon}
      {children}
    </Link>
  );
}

function Sidebar() {
  const { t } = useTranslation();
  return (
    <div className="w-60 shrink-0 h-full bg-surface-alt border-r border-border flex flex-col p-3.5 gap-0.5 box-border">
      <div className="flex items-center gap-2.5 px-2 pb-5 pt-1">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white font-bold text-[15px] shrink-0">M</div>
        <div>
          <div className="font-bold text-base leading-tight">{t('app.name')}</div>
          <div className="text-[10.5px] text-text-tertiary tracking-wider uppercase">{t('app.suite')}</div>
        </div>
      </div>
      <NavLink to="/" icon={<GridIcon />}>{t('nav.dashboard')}</NavLink>
      <NavLink to="/purchase-orders/new" icon={<CartIcon />}>{t('nav.purchaseToPay')}</NavLink>
      <NavLink to="/approvals" icon={<CheckCircleIcon />}>{t('nav.approvals')}</NavLink>
      <NavLink to="/inventory" icon={<BoxIcon />}>{t('nav.inventory')}</NavLink>
      <div className="text-[10.5px] font-semibold text-text-tertiary uppercase tracking-wider px-2.5 pt-4 pb-1.5">{t('nav.comingSoon')}</div>
      <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-text-tertiary">
        {t('nav.orderToCash')}
        <span className="ml-auto text-[10px] font-semibold text-text-tertiary bg-surface border border-border rounded-full px-1.5 py-0.5">{t('nav.soon')}</span>
      </div>
      <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-text-tertiary">
        {t('nav.generalLedger')}
        <span className="ml-auto text-[10px] font-semibold text-text-tertiary bg-surface border border-border rounded-full px-1.5 py-0.5">{t('nav.soon')}</span>
      </div>
      <div className="grow" />
      <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-text-tertiary">
        <SettingsIcon />
        {t('nav.settings')}
      </div>
    </div>
  );
}

export function Topbar({ title, live }: { title: string; live?: boolean }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  return (
    <div className="h-16 shrink-0 border-b border-border flex items-center justify-between px-7 bg-surface box-border">
      <div className="flex items-center gap-2.5">
        <h1 className="m-0 text-[17px] font-bold">{title}</h1>
        {live && (
          <>
            <span className="live-dot" />
            <span className="text-[11.5px] text-text-tertiary font-semibold">{t('common.live')}</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center gap-2 bg-surface-alt border border-border rounded-lg px-3 py-1.5 w-[220px]">
          <SearchIcon className="text-text-tertiary shrink-0" />
          <input type="text" placeholder={t('common.search') ?? ''} className="border-none bg-transparent outline-none grow text-sm text-text-primary" />
        </div>
        <LanguageSwitcher />
        <button aria-label={t('common.notifications') ?? ''} className="p-2 rounded-lg hover:bg-surface-alt">
          <BellIcon />
        </button>
        <button onClick={logout} className="flex items-center gap-2 pl-3.5 border-l border-border" title={t('common.logout') ?? ''}>
          <div className="w-[30px] h-[30px] rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold">{user?.initials}</div>
          <div className="text-left">
            <div className="text-[13px] font-semibold leading-tight">{user?.name}</div>
            <div className="text-[11px] text-text-tertiary">{user?.department}</div>
          </div>
        </button>
      </div>
    </div>
  );
}

export function AppLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate({ to: '/login' });
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="w-full h-screen flex bg-bg overflow-hidden">
      <Sidebar />
      <div className="grow h-full flex flex-col min-w-0">
        <Outlet />
      </div>
    </div>
  );
}

export function PageScroll({ children }: { children: ReactNode }) {
  return <div className="grow overflow-y-auto p-7 box-border flex flex-col gap-5">{children}</div>;
}
