import { useWallet } from '../../hooks/useWallet';
import Icon from './Icon';

export default function WalletButton() {
  const { account, isConnected, isConnecting, connectWallet, disconnectWallet } = useWallet();

  if (isConnected) {
    const shortAddress = `${account.substring(0, 6)}...${account.substring(account.length - 4)}`;
    return (
      <button
        onClick={disconnectWallet}
        className="wallet-button wallet-connected"
        title={`Connected: ${account}. Click to disconnect.`}
        aria-label="Disconnect Web3 Wallet"
      >
        <span className="wallet-dot" />
        <span>{shortAddress}</span>
      </button>
    );
  }

  return (
    <button
      onClick={connectWallet}
      disabled={isConnecting}
      className="wallet-button"
      title="Connect Web3 Wallet (MetaMask)"
      aria-label="Connect Web3 Wallet"
    >
      <Icon name="coins" size={14} />
      <span>{isConnecting ? 'Connecting…' : 'Connect Wallet'}</span>
    </button>
  );
}
