import { useWallet } from '../../hooks/useWallet';
import Icon from './Icon';

export default function WalletButton() {
  const { account, isConnected, isConnecting, connectWallet, disconnectWallet } = useWallet();

  if (isConnected) {
    const shortAddress = `${account.substring(0, 6)}...${account.substring(account.length - 4)}`;
    return (
      <button
        onClick={disconnectWallet}
        className="wallet-button wallet-connected flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer bg-white text-slate-800 border border-slate-200/80 shadow-sm hover:bg-slate-50 hover:shadow-md hover:text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border dark:border-emerald-500/30 dark:shadow-none"
        title={`Connected: ${account}. Click to disconnect.`}
        aria-label="Disconnect Web3 Wallet"
      >
        <span className="wallet-dot" />
        <span className="font-mono">{shortAddress}</span>
      </button>
    );
  }

  return (
    <button
      onClick={connectWallet}
      disabled={isConnecting}
      className="wallet-button flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer bg-white text-slate-800 border border-slate-200/80 shadow-sm hover:bg-slate-50 hover:shadow-md hover:text-emerald-600 dark:bg-[#161B22] dark:hover:bg-[#21262D] dark:text-gray-200 dark:border dark:border-white/10 dark:shadow-none"
      title="Connect Web3 Wallet (MetaMask)"
      aria-label="Connect Web3 Wallet"
    >
      <Icon name="coins" size={14} className="text-emerald-500 dark:text-emerald-400" />
      <span>{isConnecting ? 'Connecting…' : 'Connect Wallet'}</span>
    </button>
  );
}
