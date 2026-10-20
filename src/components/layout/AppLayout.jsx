import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useWatchlist } from '../../hooks/useWatchlist';
import Icon from '../ui/Icon';
import { applyTheme, getTheme } from '../../theme';
const links = [
  { to: '/', label: 'Dashboard', icon: 'dashboard' },
  { to: '/markets', label: 'Markets', icon: 'markets' },
  { to: '/watchlist', label: 'Watchlist', icon: 'star' },
];
export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false),
    [search, setSearch] = useState(''),
    [theme, setTheme] = useState(getTheme);
  const { ids } = useWatchlist();
  const location = useLocation(),
    navigate = useNavigate(),
    searchRef = useRef(null),
    menuButtonRef = useRef(null),
    sidebarRef = useRef(null);
  const page =
    location.pathname === '/markets'
      ? 'Markets'
      : location.pathname === '/watchlist'
        ? 'Watchlist'
        : location.pathname.startsWith('/coin/')
          ? 'Coin details'
          : 'Dashboard';
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);
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
        const first = items[0],
          last = items.at(-1);
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
    } else document.body.style.overflow = '';
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
          <div className="market-note">
            <div className="market-note-icon">
              <Icon name="activity" size={22} />
            </div>
            <strong>The market. In focus.</strong>
            <p>
              Your daily view of crypto,
              <br />
              without the noise.
            </p>
            <div className="sample-label">
              <Icon name="info" size={13} /> Sample data
            </div>
          </div>
          <div className="sidebar-footer">
            <span className="avatar">AY</span>
            <div>
              <strong>Personal workspace</strong>
              <span>Local watchlist</span>
            </div>
            <span className="workspace-dot" />
          </div>
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
            <button
              type="button"
              className="theme-toggle"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              onClick={() => setTheme((current) => (current === 'light' ? 'dark' : 'light'))}
            >
              <Icon name={theme === 'light' ? 'moon' : 'sun'} size={17} />
              <span className="theme-toggle-label">{theme === 'light' ? 'Dark' : 'Light'}</span>
            </button>
            <span className="data-status">
              <span />
              Demo mode
            </span>
            <span className="header-avatar" aria-label="Personal workspace">
              AY
            </span>
          </div>
        </header>
        <main id="main-content" className="main-content">
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>© 2026 CryptoPulse</span>
          <span>Sample data · Prices in USD</span>
        </footer>
      </div>
    </>
  );
}
