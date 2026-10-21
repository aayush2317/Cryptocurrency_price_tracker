import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import './styles.css';

// Guard against third-party extension and MetaMask inpage.js uncaught rejections
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason?.message || (typeof event?.reason === 'string' ? event.reason : '');
    const isExtensionOrMetaMask =
      typeof reason === 'string' &&
      (reason.toLowerCase().includes('metamask') ||
        reason.toLowerCase().includes('ethereum') ||
        reason.toLowerCase().includes('inpage') ||
        reason.toLowerCase().includes('user rejected') ||
        reason.toLowerCase().includes('network error'));

    if (isExtensionOrMetaMask) {
      console.warn('[CryptoPulse] Handled extension / Web3 promise rejection:', reason);
      event.preventDefault();
    }
  });

  window.addEventListener('error', (event) => {
    const filename = event?.filename || '';
    if (filename.includes('inpage') || filename.includes('chrome-extension')) {
      console.warn('[CryptoPulse] Handled external injected script error:', event?.message);
      event.preventDefault();
    }
  });
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('[CryptoPulse ErrorBoundary] Caught UI render error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="fatal-error" role="alert">
          <h1>Let’s get you back on track.</h1>
          <p>
            CryptoPulse encountered a transient rendering issue.
            {this.state.error?.message ? ` (${this.state.error.message})` : ''}
          </p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button className="button button-primary" onClick={this.handleReset}>
              Try recovering view
            </button>
            <button className="button button-secondary" onClick={() => window.location.reload()}>
              Reload dashboard
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
