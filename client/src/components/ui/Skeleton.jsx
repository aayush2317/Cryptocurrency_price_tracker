export function Skeleton({ className = '', style = {} }) {
  return <div className={`skeleton ${className}`} style={style} />;
}

export function SkeletonText({ width = '100%', height = '1rem', className = '' }) {
  return <div className={`skeleton skeleton-text ${className}`} style={{ width, height }} />;
}

export function SkeletonTableRows({ rows = 8, cols = 7 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="skeleton-row">
          <td className="watch-cell">
            <div className="skeleton skeleton-icon" />
          </td>
          <td className="rank-cell">
            <div className="skeleton skeleton-text" style={{ width: '20px' }} />
          </td>
          <td className="asset-cell">
            <div className="skeleton-asset">
              <div className="skeleton skeleton-circle" />
              <div>
                <div className="skeleton skeleton-text" style={{ width: '90px', height: '14px' }} />
                <div className="skeleton skeleton-text" style={{ width: '45px', height: '10px', marginTop: '4px' }} />
              </div>
            </div>
          </td>
          <td className="numeric">
            <div className="skeleton skeleton-text" style={{ width: '80px', marginLeft: 'auto' }} />
          </td>
          <td className="numeric">
            <div className="skeleton skeleton-pill" style={{ marginLeft: 'auto' }} />
          </td>
          <td className="numeric cap-cell">
            <div className="skeleton skeleton-text" style={{ width: '70px', marginLeft: 'auto' }} />
          </td>
          <td className="numeric volume-cell">
            <div className="skeleton skeleton-text" style={{ width: '65px', marginLeft: 'auto' }} />
          </td>
          <td className="trend-cell">
            <div className="skeleton skeleton-sparkline" />
          </td>
        </tr>
      ))}
    </>
  );
}

export function SkeletonStatCards({ count = 3 }) {
  return (
    <div className="stats-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="panel stat-card skeleton-stat-card">
          <div className="stat-top">
            <div className="skeleton skeleton-text" style={{ width: '120px', height: '14px' }} />
            <div className="skeleton skeleton-circle" style={{ width: '32px', height: '32px' }} />
          </div>
          <div className="stat-values" style={{ marginTop: '16px' }}>
            <div className="skeleton skeleton-text" style={{ width: '140px', height: '28px' }} />
            <div className="skeleton skeleton-pill" style={{ width: '60px', height: '22px' }} />
          </div>
          <div className="stat-bottom" style={{ marginTop: '14px' }}>
            <div className="skeleton skeleton-text" style={{ width: '160px', height: '12px' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonMovers() {
  return (
    <div className="panel movers-panel">
      <div className="panel-heading">
        <div className="skeleton skeleton-text" style={{ width: '140px', height: '20px' }} />
      </div>
      <div className="mover-tabs">
        <div className="skeleton skeleton-pill" style={{ width: '70px', height: '30px' }} />
        <div className="skeleton skeleton-pill" style={{ width: '85px', height: '30px' }} />
        <div className="skeleton skeleton-pill" style={{ width: '85px', height: '30px' }} />
      </div>
      <div className="movers-list" style={{ marginTop: '16px' }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="mover-row">
            <div className="skeleton skeleton-text" style={{ width: '16px' }} />
            <div className="skeleton skeleton-circle" style={{ width: '28px', height: '28px' }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton skeleton-text" style={{ width: '80px', height: '14px' }} />
            </div>
            <div>
              <div className="skeleton skeleton-text" style={{ width: '60px', height: '14px' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="panel price-panel">
      <div className="chart-heading">
        <div className="coin-title" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div className="skeleton skeleton-circle" style={{ width: '36px', height: '36px' }} />
          <div>
            <div className="skeleton skeleton-text" style={{ width: '100px', height: '18px' }} />
            <div className="skeleton skeleton-text" style={{ width: '40px', height: '12px', marginTop: '4px' }} />
          </div>
        </div>
      </div>
      <div className="chart-summary" style={{ marginTop: '16px' }}>
        <div>
          <div className="skeleton skeleton-text" style={{ width: '150px', height: '32px' }} />
          <div className="skeleton skeleton-text" style={{ width: '110px', height: '16px', marginTop: '8px' }} />
        </div>
      </div>
      <div className="chart-canvas" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="skeleton skeleton-chart-area" />
      </div>
    </div>
  );
}
