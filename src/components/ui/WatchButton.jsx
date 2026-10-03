import { useWatchlist } from '../../hooks/useWatchlist';
import Icon from './Icon';
export default function WatchButton({ coin, expanded = false }) {
  const { ids, toggle } = useWatchlist();
  const saved = ids.includes(coin.id);
  return (
    <button
      type="button"
      onClick={() => toggle(coin.id)}
      className={
        expanded
          ? `button ${saved ? 'button-saved' : 'button-primary'}`
          : `watch-button ${saved ? 'saved' : ''}`
      }
      aria-label={`${saved ? 'Remove' : 'Add'} ${coin.name} ${saved ? 'from' : 'to'} watchlist`}
      aria-pressed={saved}
      title={`${saved ? 'Remove from' : 'Add to'} watchlist`}
    >
      <Icon
        name={saved && expanded ? 'check' : 'star'}
        size={expanded ? 17 : 16}
        fill={saved && !expanded ? 'currentColor' : 'none'}
      />
      {expanded && (saved ? 'On your watchlist' : 'Add to watchlist')}
    </button>
  );
}
