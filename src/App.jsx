import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WatchlistProvider } from './context/WatchlistContext';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Markets from './pages/Markets';
import CoinDetails from './pages/CoinDetails';
import Watchlist from './pages/Watchlist';
import NotFound from './pages/NotFound';
import useWebMCP from './hooks/useWebMCP';
function AppRoutes() {
  useWebMCP();
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
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
    <WatchlistProvider>
      <AppRoutes />
    </WatchlistProvider>
  );
}
