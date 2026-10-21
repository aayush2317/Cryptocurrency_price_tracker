import React, { Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WatchlistProvider } from './context/WatchlistContext';
import { MarketDataProvider } from './context/MarketDataContext';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Markets from './pages/Markets';
import CoinDetails from './pages/CoinDetails';
import Watchlist from './pages/Watchlist';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import useWebMCP from './hooks/useWebMCP';

class GlobalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, isWalletIssue: false };
  }

  static getDerivedStateFromError(error) {
    const msg = error?.message || String(error);
    const isWallet =
      msg.toLowerCase().includes('ethereum') ||
      msg.toLowerCase().includes('metamask') ||
      msg.toLowerCase().includes('wallet') ||
      msg.toLowerCase().includes('inpage');
    return { hasError: true, error, isWalletIssue: isWallet };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('[CryptoPulse ErrorBoundary] Handled runtime error:', error, errorInfo);
  }

  handleDismiss = () => {
    this.setState({ hasError: false, error: null, isWalletIssue: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback-container">
          <div className="web3-fallback-banner" role="alert">
            <div className="web3-fallback-content">
              <span className="web3-fallback-badge">Guest / Demo Mode</span>
              <p>
                {this.state.isWalletIssue
                  ? 'No Web3 wallet extension detected. Running in standard demo mode with full live WebSocket market tracking and charting.'
                  : `Transient rendering notification: ${this.state.error?.message || 'Recovering view.'}`}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={this.handleDismiss} className="button button-primary">
                Dismiss Banner
              </button>
              <button onClick={() => window.location.reload()} className="button button-secondary">
                Reload
              </button>
            </div>
          </div>
          {this.props.children}
        </div>
      );
    }
    return this.props.children;
  }
}

function ProtectedRoute({ children }) {
  const isAuth = typeof window !== 'undefined' && localStorage.getItem('cp_auth') === 'true';
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AppRoutes() {
  useWebMCP();
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="markets" element={<Markets />} />
          <Route path="coin/:coinId" element={<CoinDetails />} />
          <Route path="watchlist" element={<Watchlist />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <GlobalErrorBoundary>
      <MarketDataProvider>
        <WatchlistProvider>
          <AppRoutes />
        </WatchlistProvider>
      </MarketDataProvider>
    </GlobalErrorBoundary>
  );
}
