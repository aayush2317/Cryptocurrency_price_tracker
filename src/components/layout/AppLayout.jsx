import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useWatchlist } from '../../hooks/useWatchlist';
import { useMarketData } from '../../context/MarketDataContext';
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

  const location = useLocation();
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const menuButtonRef = useRef(null);
  const sidebarRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem('cp_auth');
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
          <div
            className="p-3 bg-[#0D1117] border border-white/5 rounded-xl flex items-center justify-between"
            style={{
              background: '#0D1117',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div className="flex items-center gap-2.5" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs font-semibold"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10B981',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                CP
              </div>
              <div>
                <p className="text-xs font-medium text-white" style={{ fontSize: '12px', fontWeight: 500, color: '#FFFFFF', margin: 0 }}>
                  Institutional
                </p>
                <p className="text-[10px] text-gray-500" style={{ fontSize: '10px', color: '#6B7280', margin: 0 }}>
                  Pro Tier
                </p>
              </div>
            </div>
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              style={{
                fontSize: '10px',
                fontFamily: 'monospace',
                padding: '2px 7px',
                borderRadius: '9999px',
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#10B981',
                border: '1px solid rgba(16, 185, 129, 0.2)',
              }}
            >
              Active
            </span>
          </div>

          <button
            onClick={handleLogout}
            title="Sign out of Terminal"
            className="w-full mt-2 flex items-center justify-center gap-2 py-2 text-xs font-medium text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 border border-white/5 rounded-xl transition-all cursor-pointer"
            style={{
              width: '100%',
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '8px 12px',
              fontSize: '12px',
              color: '#9CA3AF',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#F43F5E';
              e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.25)';
              e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#9CA3AF';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
            }}
          >
            <Icon name="logout" size={13} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
      <div className="app-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              ref={menuButtonRef}
              className="mobile-menu-button"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation"
              aria-expanded={menuOpen}
            >
              <Icon name="menu" size={22} />
            </button>
            <span className="breadcrumb-home">Workspace</span>
            <Icon name="chevronRight" size={13} />
            <span>{page}</span>
          </div>
          <div className="topbar-right">
            <form onSubmit={submit} className="search-field global-search">
              <Icon name="search" size={16} />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search all assets"
                placeholder="Search any asset…"
              />
              <kbd>⌘ K</kbd>
              <button type="submit" className="sr-only">
                Search
              </button>
            </form>

            {/* Live Price Ticker & Refresh Button */}
            <button
              onClick={() => refresh()}
              className="live-indicator"
              title={
                wsConnected
                  ? 'Connected to live WebSocket price stream · Click to manually sync'
                  : `Live polling every 10s · Click to refresh (${secondsAgo}s ago)`
              }
              aria-label="Refresh live price data"
            >
              <span className="live-pulse-dot" />
              <span>{wsConnected ? 'WebSocket Live' : `Live ${secondsAgo > 0 ? `${secondsAgo}s ago` : 'now'}`}</span>
              <Icon
                name="refresh"
                size={12}
                className={isRefreshing ? 'refresh-spin' : ''}
              />
            </button>

            {/* Safe Web3 / MetaMask Wallet Connect */}
            <WalletButton />

            <span className="header-avatar" aria-label="Personal workspace">
              AY
            </span>

            {/* Institutional Top Bar Logout Action */}
            <button
              onClick={handleLogout}
              title="Sign out of Terminal"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 border border-white/5 rounded-lg transition-all cursor-pointer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                color: '#9CA3AF',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#F43F5E';
                e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.3)';
                e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#9CA3AF';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
              }}
            >
              <Icon name="logout" size={13} />
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
