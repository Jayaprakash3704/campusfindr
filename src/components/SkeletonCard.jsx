import React from 'react';

/**
 * Content-shaped skeleton loader for item cards.
 * Matches the real ItemCard layout so there's no layout shift on load.
 * Dark mode shimmer is handled by stronger contrast in App.css.
 */
export default function SkeletonCard() {
  return (
    <div
      className="skeleton-card"
      aria-hidden="true"
      aria-label="Loading item"
      role="status"
    >
      {/* Top row: two badges + timestamp */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <div className="skeleton skeleton-line" style={{ width: '76px', height: '20px', borderRadius: '9999px' }} />
          <div className="skeleton skeleton-line" style={{ width: '58px', height: '20px', borderRadius: '9999px' }} />
        </div>
        <div className="skeleton skeleton-line" style={{ width: '42px', height: '12px', alignSelf: 'center' }} />
      </div>

      {/* Title */}
      <div className="skeleton skeleton-line" style={{ height: '16px', width: '68%' }} />

      {/* Location */}
      <div className="skeleton skeleton-line" style={{ width: '48%', height: '12px' }} />

      {/* Description lines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <div className="skeleton skeleton-line" style={{ width: '100%', height: '12px' }} />
        <div className="skeleton skeleton-line" style={{ width: '78%',  height: '12px' }} />
      </div>

      {/* Reporter */}
      <div className="skeleton skeleton-line" style={{ width: '44%', height: '11px' }} />
    </div>
  );
}
