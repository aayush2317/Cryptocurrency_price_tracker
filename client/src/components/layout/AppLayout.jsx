import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useWatchlist } from '../../hooks/useWatchlist';
import { useMarketData } from '../../context/MarketDataContext';
import { useTheme } from '../../context/ThemeContext';
import Icon from '../ui/Icon';
import WalletButton from '../ui/WalletButton';

const links = [
  { to: '/', label: 'Dashboard', icon: 'dashboard' },
  { to: '/markets', label: 'Markets', icon: 'markets' },
  { to: '/watchlist', label: 'Watchlist', icon: 'star' },
];

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const { ids, syncedWithBackend } = useWatchlist();
  const { isRefreshing, refresh, lastUpdated, wsConnected } = useMarketData();
  const { theme, toggleTheme } = useTheme();

  const location = useLocation();
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const menuButtonRef = useRef(null);
  const sidebarRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem('cp_auth');
    localStorage.setItem('cp_theme', 'dark');
    document.documentElement.dataset.theme = 'dark';
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
    navigate('/login', { replace: true });
  };

  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    if (!lastUpdated) return;
    const updateElapsed = () => {
      setSecondsAgo(Math.max(0, Math.floor((Date.now() - lastUpdated) / 1000)));
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const page =
    location.pathname === '/markets'
      ? 'Markets'
      : location.pathname === '/watchlist'
        ? 'Watchlist'
        : location.pathname.startsWith('/coin/')
          ? 'Coin details'
          : 'Dashboard';

  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo(0, 0);
    document.title = `CryptoPulse · ${page}`;
  }, [location.pathname, page]);

  useEffect(() => {
    const keydown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus({ preventScroll: true });
      }
      if (e.key === 'Escape' && menuOpen) {
        setMenuOpen(false);
        menuButtonRef.current?.focus({ preventScroll: true });
      }
      if (e.key === 'Tab' && menuOpen) {
        const items = [...sidebarRef.current.querySelectorAll('a,button')];
        const first = items[0];
        const last = items.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', keydown);
    return () => document.removeEventListener('keydown', keydown);
  }, [menuOpen]);

  useEffect(() => {
    if (menuOpen) {
      sidebarRef.current?.querySelector('a')?.focus({ preventScroll: true });
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  function submit(e) {
    e.preventDefault();
    navigate(`/markets${search.trim() ? `?q=${encodeURIComponent(search.trim())}` : ''}`);
    setSearch('');
    searchRef.current?.blur();
  }

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {menuOpen && (
        <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />
      )}
      <aside
        ref={sidebarRef}
        className={`sidebar ${menuOpen ? 'is-open' : ''}`}
        aria-label="Main navigation"
      >
        <Link to="/" className="brand">
          <span className="brand-mark">
            <Icon name="activity" size={24} />
          </span>
          <span>
            Crypto<span className="brand-light">Pulse</span>
          </span>
        </Link>
        <button
          className="mobile-menu-close"
          onClick={() => {
            setMenuOpen(false);
            menuButtonRef.current?.focus({ preventScroll: true });
          }}
          aria-label="Close navigation"
        >
          <Icon name="close" />
        </button>
        <div className="nav-section-label">WORKSPACE</div>
        <nav>
          {links.map((link) => (
            <NavLink
              to={link.to}
              end={link.to === '/'}
              key={link.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <Icon name={link.icon} size={19} />
              <span>{link.label}</span>
              {link.label === 'Watchlist' && <span className="nav-count">{ids.length}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="p-3 bg-white/80 dark:bg-[#0D1117] border border-slate-200/80 dark:border-white/5 rounded-xl flex items-center justify-between shadow-sm dark:shadow-none">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                CP
              </div>
              <div>
                <p className="text-xs font-medium text-slate-900 dark:text-white m-0">
                  Institutional
                </p>
                <p className="text-[10px] text-slate-500 dark:text-gray-500 m-0">
                  Pro Tier
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Active
            </span>
          </div>

          <button
            onClick={handleLogout}
            title="Sign out of Terminal"
            className="w-full mt-2 flex items-center justify-center gap-2 py-2 text-xs font-medium text-slate-500 dark:text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10 border border-slate-200/80 dark:border-white/5 bg-white/60 dark:bg-white/[0.02] rounded-xl transition-all cursor-pointer"
          >
            <Icon name="logout" size={13} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
      <div className="app-shell">
        <header className="topbar">
          <div className="breadcrumb flex items-center gap-2 text-sm text-slate-700 dark:text-gray-300">
            <button
              ref={menuButtonRef}
              className="mobile-menu-button text-slate-700 dark:text-gray-200"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation"
              aria-expanded={menuOpen}
            >
              <Icon name="menu" size={22} />
            </button>
            <span className="breadcrumb-home text-slate-500 dark:text-gray-400 font-medium">Workspace</span>
            <Icon name="chevronRight" size={13} className="text-slate-400 dark:text-gray-500" />
            <span className="font-semibold text-slate-900 dark:text-white">{page}</span>
          </div>
          <div className="topbar-right">
            <form onSubmit={submit} className="search-field global-search bg-slate-200/90 dark:bg-transparent border border-slate-300/80 dark:border-white/10">
              <Icon name="search" size={16} className="text-slate-500 dark:text-gray-400" />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search all assets"
                placeholder="Search any asset…"
                className="placeholder-slate-500 dark:placeholder-gray-500 text-slate-900 dark:text-white font-medium"
              />
              <kbd className="bg-slate-300/80 dark:bg-white/10 text-slate-700 dark:text-gray-300 border border-slate-300 dark:border-white/10">⌘ K</kbd>
              <button type="submit" className="sr-only">
                Search
              </button>
            </form>

            {/* Live Price Ticker & Refresh Button */}
            <button
              onClick={() => refresh()}
              className="live-indicator bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-500/10 dark:text-[#bbf7d0] dark:border-emerald-500/30"
              title={
                wsConnected
                  ? 'Connected to live WebSocket price stream · Click to manually sync'
                  : `Live polling every 10s · Click to refresh (${secondsAgo}s ago)`
              }
              aria-label="Refresh live price data"
            >
              <span className="live-pulse-dot" />
              <span className="font-semibold">{wsConnected ? 'WebSocket Live' : `Live ${secondsAgo > 0 ? `${secondsAgo}s ago` : 'now'}`}</span>
              <Icon
                name="refresh"
                size={12}
                className={isRefreshing ? 'refresh-spin' : ''}
              />
            </button>

            {/* Light / Dark Neomorphic Theme Toggle */}
            <button
              type="button"
              className="theme-toggle flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer bg-white text-slate-800 border border-slate-200/80 shadow-sm hover:bg-slate-50 hover:shadow-md hover:text-emerald-600 dark:bg-[#161B22] dark:hover:bg-[#21262D] dark:text-gray-200 dark:border dark:border-white/10 dark:shadow-none"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              onClick={toggleTheme}
            >
              <Icon name={theme === 'light' ? 'moon' : 'sun'} size={15} className="text-emerald-500 dark:text-emerald-400" />
              <span className="theme-toggle-label font-medium">{theme === 'light' ? 'Dark' : 'Light'}</span>
            </button>

            {/* Safe Web3 / MetaMask Wallet Connect */}
            <WalletButton />

            <span
              className="header-avatar bg-slate-200 hover:bg-slate-300 text-slate-800 border border-slate-300/40 font-semibold dark:bg-[#21262D] dark:text-emerald-400 dark:border-emerald-500/30"
              aria-label="Personal workspace"
            >
              AY
            </span>

            {/* Institutional Top Bar Logout Action */}
            <button
              onClick={handleLogout}
              title="Sign out of Terminal"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-900 hover:text-rose-600 font-semibold dark:text-gray-300 dark:hover:text-rose-400 hover:bg-rose-500/10 border border-slate-300/80 dark:border-white/5 bg-white dark:bg-white/[0.03] rounded-lg transition-all cursor-pointer shadow-sm dark:shadow-none"
            >
              <Icon name="logout" size={13} className="text-slate-700 dark:text-gray-400" />
              <span>Logout</span>
            </button>
          </div>
        </header>
        <main id="main-content" className="main-content">
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>© 2026 CryptoPulse Full-Stack</span>
          <span>Live REST API & Price Simulator · Prices in USD</span>
        </footer>
      </div>
    </>
  );
}
