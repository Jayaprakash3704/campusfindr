import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, PackageCheck, Lock } from 'lucide-react';
import ItemCard from './ItemCard';
import SkeletonCard from './SkeletonCard';
import { STATUS_CONFIG } from '../config/statusConfig';

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
};

const emptyVariants = {
  hidden:  { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export default function ItemGrid({ items, reportType, isAdmin, onResolve, loading }) {
  const isLost  = reportType === 'lost';
  const variant = isLost ? 'lost' : 'found';

  const cfg = isLost ? STATUS_CONFIG.lost : STATUS_CONFIG.found;
  const PanelIcon = isLost ? Search : PackageCheck;

  const emptyTitle = isLost ? 'No lost items reported' : 'Nothing found yet';
  const emptyDesc  = isLost
    ? 'When someone reports a missing item, it will appear here.'
    : 'Recovered items submitted by the campus community will show up here.';

  return (
    <section
      className={`item-grid-panel ${variant}-panel`}
      aria-label={`${isLost ? 'Lost' : 'Found'} items panel`}
    >
      <header className="panel-header">
        <div className="panel-header-left">
          <div className={`panel-indicator ${variant}`} aria-hidden="true" />
          <h2 className={`panel-title ${variant}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <PanelIcon size={14} strokeWidth={2.2} aria-hidden="true" />
            {isLost ? 'Lost Items' : 'Found Items'}
          </h2>
        </div>
        <span className={`panel-count ${variant}`} aria-label={`${items.length} items`}>
          {loading ? '—' : items.length}
        </span>
      </header>

      <div className="panel-items" role="list">
        {loading ? (
          // Skeleton loaders matching real card shape
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : items.length === 0 ? (
          <motion.div
            className="empty-state"
            variants={emptyVariants}
            initial="hidden"
            animate="visible"
            aria-live="polite"
          >
            <div className="empty-state-icon" aria-hidden="true">
              <PanelIcon size={22} strokeWidth={1.5} />
            </div>
            <p className="empty-state-title">{emptyTitle}</p>
            <p className="empty-state-desc">{emptyDesc}</p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            <AnimatePresence>
              {items.map((item, i) => (
                <div key={item._id} role="listitem">
                  <ItemCard
                    item={item}
                    reportType={reportType}
                    isAdmin={isAdmin}
                    onResolve={onResolve}
                    custom={i}
                  />
                </div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {isAdmin && items.length > 0 && (
        <footer className="warden-info">
          <Lock size={10} aria-hidden="true" />
          Warden mode active — resolve buttons enabled
        </footer>
      )}
    </section>
  );
}
