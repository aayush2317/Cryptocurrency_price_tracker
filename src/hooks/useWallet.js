import { useState, useEffect, useCallback } from 'react';

/**
 * Defensive utility to check existing wallet authorization without prompting the user.
 * Never requests authorization or invokes modal popups unconditionally on mount.
 */
export const checkWalletConnection = async () => {
  if (typeof window === 'undefined' || !window.ethereum) {
    console.warn('[Web3] No Ethereum provider detected. Demo mode active.');
    return null;
  }
  try {
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    return accounts[0] || null;
  } catch (err) {
    console.warn('[Web3] Handled connection check:', err);
    return null;
  }
};

/**
 * Custom hook to safely manage Web3 / MetaMask wallet connectivity.
 * Protects against uncaught inpage.js promise rejections when MetaMask
 * is missing, unapproved, or closed unexpectedly.
 */
export function useWallet() {
  const [account, setAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [hasMetaMask, setHasMetaMask] = useState(false);

  // Check for window.ethereum existence safely on load using checkWalletConnection
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const existing = await checkWalletConnection();
      if (!isMounted) return;
      if (existing) {
        setAccount(existing);
      }
      setHasMetaMask(typeof window !== 'undefined' && !!window.ethereum);
    };

    init();

    if (
      typeof window !== 'undefined' &&
      window.ethereum &&
      typeof window.ethereum.on === 'function'
    ) {
      const handleAccountsChanged = (accounts) => {
        if (!isMounted) return;
        if (Array.isArray(accounts) && accounts.length > 0) {
          setAccount(accounts[0]);
          setError(null);
        } else {
          setAccount(null);
        }
      };

      try {
        window.ethereum.on('accountsChanged', handleAccountsChanged);
      } catch (err) {
        console.warn('[Web3] Error attaching account listener:', err);
      }

      return () => {
        isMounted = false;
        if (typeof window.ethereum?.removeListener === 'function') {
          try {
            window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          } catch {}
        }
      };
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const connectWallet = useCallback(async () => {
    if (typeof window === 'undefined') return;

    if (!window.ethereum) {
      const msg = 'MetaMask is not installed in this browser. Running in demo mode.';
      console.warn(`[Web3] ${msg}`);
      setError(msg);
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (Array.isArray(accounts) && accounts.length > 0) {
        setAccount(accounts[0]);
      }
    } catch (err) {
      console.warn('[Web3] Connection request was not completed:', err.message);
      setError(err.message || 'Wallet connection was cancelled');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setError(null);
  }, []);

  return {
    account,
    isConnected: !!account,
    isConnecting,
    error,
    hasMetaMask,
    connectWallet,
    disconnectWallet,
  };
}

export default useWallet;
