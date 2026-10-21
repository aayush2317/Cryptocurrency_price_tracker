import { Link } from 'react-router-dom';
import Icon from '../components/ui/Icon';
export default function NotFound() {
  return (
    <div className="panel empty-state not-found">
      <span className="empty-icon">
        <Icon name="search" size={30} />
      </span>
      <p className="eyebrow">404 · OFF THE CHARTS</p>
      <h1>We couldn’t find that page.</h1>
      <p>Try a different asset or return to your dashboard.</p>
      <Link to="/" className="button button-primary">
        Back to dashboard
      </Link>
    </div>
  );
}
