import Icon from './Icon';

export default function ErrorState({
  title = 'Failed to load market data',
  message = 'Could not establish connection to the CryptoPulse server. Please make sure the backend server is running.',
  onRetry,
}) {
  return (
    <div className="panel error-state-panel" role="alert">
      <div className="error-state-icon">
        <Icon name="info" size={26} />
      </div>
      <div className="error-state-content">
        <h3>{title}</h3>
        <p>{message}</p>
      </div>
      {onRetry && (
        <button className="button button-primary error-retry-btn" onClick={onRetry}>
          <Icon name="refresh" size={15} />
          Retry connection
        </button>
      )}
    </div>
  );
}
