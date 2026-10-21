import Icon from './Icon';
import { percent } from '../../utils/format';
export default function ChangeBadge({ value, pill = false, showIcon = true }) {
  return (
    <span className={`change ${value >= 0 ? 'positive' : 'negative'} ${pill ? 'change-pill' : ''}`}>
      {showIcon && <Icon name={value >= 0 ? 'up' : 'down'} size={14} />}
      <span>{percent(value)}</span>
    </span>
  );
}
