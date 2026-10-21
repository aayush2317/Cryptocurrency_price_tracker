import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/ui/Icon';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (typeof window !== 'undefined' && localStorage.getItem('cp_auth') === 'true') {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      if (username.trim() === 'admin' && password === 'cryptopulse2026') {
        localStorage.setItem('cp_auth', 'true');
        navigate('/', { replace: true });
      } else {
        setError('Invalid username or password. Please use the demo credentials below.');
        setIsLoading(false);
      }
    }, 250);
  };

  const fillDemoCredentials = () => {
    setUsername('admin');
    setPassword('cryptopulse2026');
    setError('');
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundColor: '#050505',
        backgroundImage: 'radial-gradient(circle at 50% 25%, rgba(16, 185, 129, 0.12), transparent 55%), radial-gradient(circle at 80% 80%, rgba(13, 17, 23, 0.8), transparent 60%)',
        minHeight: '100vh',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Background ambient grid lines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          opacity: 0.6,
        }}
      />

      {/* Glassmorphic card container */}
      <div
        className="relative z-10 bg-[#0D1117]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 max-w-md w-full"
        style={{
          backgroundColor: 'rgba(13, 17, 23, 0.82)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(16, 185, 129, 0.08)',
          padding: '32px',
          maxWidth: '440px',
          width: '100%',
        }}
      >
        {/* Branding Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(0, 230, 118, 0.05))',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#00E676',
              boxShadow: '0 0 16px rgba(16, 185, 129, 0.25)',
            }}
          >
            <Icon name="activity" size={26} />
          </div>
          <h1
            className="text-2xl font-bold tracking-tight text-white mb-1"
            style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', color: '#FFFFFF' }}
          >
            Crypto<span style={{ color: '#00E676' }}>Pulse</span> Terminal
          </h1>
          <p
            className="text-sm text-gray-400 mt-1"
            style={{ fontSize: '13px', color: '#9CA3AF' }}
          >
            Sign in to access real-time institutional markets.
          </p>
        </div>

        {/* Error message alert */}
        {error && (
          <div
            className="mb-4 p-3 rounded-lg flex items-center gap-2 text-xs"
            style={{
              backgroundColor: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.25)',
              color: '#FDA4AF',
            }}
            role="alert"
          >
            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#F43F5E' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="cp-username"
              className="block text-xs font-medium text-gray-300 uppercase tracking-wider mb-1.5"
              style={{ fontSize: '11px', letterSpacing: '0.05em', color: '#D1D5DB', marginBottom: '6px' }}
            >
              Username / Email
            </label>
            <input
              id="cp-username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin"
              required
              className="w-full bg-[#161B22] border border-white/10 text-white placeholder-gray-500 focus:border-emerald-500 rounded-lg py-2.5 px-4 outline-none transition-all"
              style={{
                width: '100%',
                backgroundColor: '#161B22',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="cp-password"
              className="block text-xs font-medium text-gray-300 uppercase tracking-wider mb-1.5"
              style={{ fontSize: '11px', letterSpacing: '0.05em', color: '#D1D5DB', marginBottom: '6px' }}
            >
              Password
            </label>
            <input
              id="cp-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full bg-[#161B22] border border-white/10 text-white placeholder-gray-500 focus:border-emerald-500 rounded-lg py-2.5 px-4 outline-none transition-all"
              style={{
                width: '100%',
                backgroundColor: '#161B22',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold py-2.5 rounded-lg transition-all w-full flex items-center justify-center gap-2 cursor-pointer"
            style={{
              backgroundColor: '#10B981',
              color: '#000000',
              fontWeight: 600,
              padding: '11px',
              borderRadius: '8px',
              border: 'none',
              cursor: isLoading ? 'wait' : 'pointer',
              fontSize: '14px',
              marginTop: '8px',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
              transition: 'background-color 0.2s ease, transform 0.1s ease',
            }}
          >
            {isLoading ? (
              <span>Authenticating…</span>
            ) : (
              <>
                <span>Enter Terminal</span>
                <Icon name="chevronRight" size={16} />
              </>
            )}
          </button>
        </form>

        {/* Discrete Demo Credentials Badge */}
        <div
          onClick={fillDemoCredentials}
          title="Click to auto-fill demo credentials"
          className="mt-6 p-3 bg-white/[0.02] border border-white/5 rounded-lg text-center cursor-pointer transition-all hover:border-emerald-500/30"
          style={{
            marginTop: '24px',
            padding: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            textAlign: 'center',
            cursor: 'pointer',
          }}
        >
          <p
            className="text-[10px] text-gray-400 uppercase tracking-widest font-mono"
            style={{ fontSize: '10px', color: '#9CA3AF', letterSpacing: '0.12em', margin: 0, fontFamily: 'monospace' }}
          >
            Demo Access Credentials (Click to Fill)
          </p>
          <p
            className="text-xs text-emerald-400 font-mono mt-1"
            style={{ fontSize: '12px', color: '#10B981', margin: '4px 0 0', fontFamily: 'monospace' }}
          >
            User: <span className="text-white" style={{ color: '#FFFFFF' }}>admin</span> &nbsp;|&nbsp; Pass: <span className="text-white" style={{ color: '#FFFFFF' }}>cryptopulse2026</span>
          </p>
        </div>
      </div>
    </div>
  );
}
