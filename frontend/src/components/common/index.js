import React from 'react';

export function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  return (
    <div className="loading-overlay" style={{ minHeight: '300px' }}>
      <div className={`spinner ${size === 'lg' ? 'spinner-lg' : ''}`} />
      {text && <p style={{ fontWeight: 500 }}>{text}</p>}
    </div>
  );
}

export function StatusBadge({ status }) {
  const statusMap = {
    OPEN: { className: 'badge-open', icon: '●' },
    FUNDED: { className: 'badge-funded', icon: '●' },
    CONFIRMED: { className: 'badge-confirmed', icon: '✓' },
    PENDING: { className: 'badge-pending', icon: '●' },
  };

  const config = statusMap[status] || { className: 'badge-open', icon: '●' };

  return (
    <span className={`badge ${config.className}`}>
      <span style={{ fontSize: '0.5rem' }}>{config.icon}</span> {status}
    </span>
  );
}

export function EmptyState({ icon = '�', title, message }) {
  return (
    <div className="empty-state fade-in">
      <div className="empty-state-icon" style={{ animation: 'float 3s ease-in-out infinite' }}>{icon}</div>
      <h3>{title || 'Nothing here yet'}</h3>
      <p>{message || 'Check back later'}</p>
    </div>
  );
}

export function TransactionHash({ hash, short = true }) {
  const [copied, setCopied] = React.useState(false);
  const displayHash = short ? `${hash.slice(0, 8)}...${hash.slice(-8)}` : hash;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = hash;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <span className="hash-text" title="Click to copy" onClick={handleCopy}>
      {displayHash} {copied ? '✓' : '⎘'}
    </span>
  );
}

export function ErrorBoundaryFallback({ error }) {
  return (
    <div className="card" style={{ margin: '2rem auto', maxWidth: '500px' }}>
      <div className="card-body" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>⚠️</div>
        <h3 style={{ color: 'var(--error)', marginBottom: '0.5rem' }}>Something went wrong</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{error?.message || 'An unexpected error occurred'}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Reload Page
        </button>
      </div>
    </div>
  );
}
