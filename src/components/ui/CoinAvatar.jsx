const logos = new Set([
  'btc',
  'eth',
  'usdt',
  'bnb',
  'sol',
  'usdc',
  'xrp',
  'doge',
  'ada',
  'avax',
  'link',
  'dot',
  'uni',
]);
const marks = { TON: '▼', NEAR: 'N', PEPE: 'P' };
export default function CoinAvatar({ coin, size = 'normal' }) {
  const ticker = coin.symbol.toLowerCase();
  return (
    <span
      className={`coin-avatar coin-avatar-${size} coin-${ticker}`}
      style={{ '--coin-color': coin.color }}
      aria-hidden="true"
    >
      {logos.has(ticker) ? (
        <img src={`/coins/${ticker}.svg`} alt="" width="32" height="32" />
      ) : (
        marks[coin.symbol] || coin.symbol[0]
      )}
    </span>
  );
}
