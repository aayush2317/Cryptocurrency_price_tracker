/** Browser-only UI preference. No API or WebSocket changes. */
const STORAGE_KEY = 'cryptopulse-theme';

export function getTheme() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function applyTheme(theme) {
  const next = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = next;
  const meta = document.querySelector('meta[name="theme-color"]');
  meta?.setAttribute('content', next === 'dark' ? '#0c0e10' : '#eaf0f7');
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Theme still switches if browser storage is unavailable.
  }
}
