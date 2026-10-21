import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WatchlistProvider } from './context/WatchlistContext';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Markets from './pages/Markets';
import CoinDetails from './pages/CoinDetails';
import Watchlist from './pages/Watchlist';
import NotFound from './pages/NotFound';
import useWebMCP from './hooks/useWebMCP';
import useCryptoWebSocket from "./hooks/useCryptoWebSocket";
function AppRoutes() {
  useWebMCP();
  const livePrices = useCryptoWebSocket();
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index
  element={<Dashboard livePrices={livePrices} />}/>
          <Route  path="markets"
  element={<Markets livePrices={livePrices} />} />
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
