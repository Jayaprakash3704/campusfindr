import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Clock,
  Laptop,
  FileText,
  ShoppingBag,
  BookOpen,
  Trophy,
  Key,
  Package,
  Hash,
  Building2,
  User,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { resolveItem } from '../services/api';
import { CATEGORY_CONFIG } from '../config/statusConfig';

/** Map category to Lucide icon component */
const CATEGORY_ICONS = {
  'Electronics':   Laptop,
  'Documents':     FileText,
  'Wallets/Bags':  ShoppingBag,
  'Books':         BookOpen,
  'Sports Gear':   Trophy,
  'Keys':          Key,
  'Other':         Package,
};

/** Format a Date/string as a relative time label */
function formatRelativeTime(timestamp) {
  const diff  = Date.now() - new Date(timestamp).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  < 1)  return 'Just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

/**
 * Stagger variants — parent (ItemGrid) passes `custom` index.
 * whileHover is kept separate from the stagger transition to avoid conflicts.
 */
const cardVariants = {
  hidden:  { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.24,
      ease: [0.4, 0, 0.2, 1],
    },
  }),
};

/**
 * Single item card with category badge, details, and warden resolve button.
 *
 * Props:
 *  - item: Item object
 *  - isAdmin: boolean — shows/hides resolve button
 *  - onResolve: (id: string) => void — called AFTER animation completes
 *  - reportType: 'lost' | 'found'
 *  - custom: index for stagger delay
 */
export default function ItemCard({ item, isAdmin, onResolve, reportType, custom }) {
  const [isArchiving, setIsArchiving] = useState(false);
  const [resolving, setResolving]     = useState(false);

  const handleMatchResolution = async () => {
    if (resolving || isArchiving) return;
    setResolving(true);
    try {
      await resolveItem(item._id, {});
      setIsArchiving(true);
      setTimeout(() => { onResolve(item._id); }, 520);
    } catch {
      setResolving(false);
    }
  };

  const CategoryIcon = CATEGORY_ICONS[item.category] || Package;
  const cardClass = [
    'item-card',
    `${reportType}-card`,
    isArchiving ? 'archiving' : '',
  ].filter(Boolean).join(' ');

  return (
    <motion.article
      className={cardClass}
      aria-label={`${reportType === 'lost' ? 'Lost' : 'Found'} item: ${item.title}`}
      role="article"
      custom={custom}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      /* whileHover uses its own spring, independent of the stagger transition */
      whileHover={{ y: -2, transition: { type: 'spring', stiffness: 380, damping: 22 } }}
    >
      {/* Top row: badges + timestamp */}
      <div className="card-top-row">
        <div className="card-badges">
          <span className="badge badge-category">
            <CategoryIcon size={11} strokeWidth={2} aria-hidden="true" />
            {item.category}
          </span>
          <span className={`badge badge-${item.type}`}>
            {item.type === 'institutional'
              ? <><Building2 size={11} strokeWidth={2} aria-hidden="true" /> Institutional</>
              : <><User size={11} strokeWidth={2} aria-hidden="true" /> Personal</>
            }
          </span>
        </div>
        <time
          className="card-time"
          dateTime={new Date(item.timestamp).toISOString()}
          title={new Date(item.timestamp).toLocaleString()}
        >
          <Clock size={10} aria-hidden="true" />
          {formatRelativeTime(item.timestamp)}
        </time>
      </div>

      {/* Title */}
      <h3 className="card-title">{item.title}</h3>

      {/* Location */}
      <p className="card-location">
        <MapPin size={11} aria-hidden="true" />
        <span>{item.location}</span>
      </p>

      {/* Description */}
      {item.description && (
        <p className="card-desc">{item.description}</p>
      )}

      {/* Reporter */}
      <p className="card-reporter">
        Reported by <strong>{item.reporterId}</strong>
      </p>

      {/* Institutional metadata */}
      {item.type === 'institutional' && item.metadata?.serialNumber && (
        <div className="card-meta-row">
          <Hash size={11} aria-hidden="true" />
          <span>S/N: <strong>{item.metadata.serialNumber}</strong></span>
          {item.metadata.associatedDepartment && (
            <span>· {item.metadata.associatedDepartment}</span>
          )}
        </div>
      )}

      {/* Warden Action */}
      {isAdmin && (
        <button
          id={`resolve-btn-${item._id}`}
          className="resolve-btn"
          onClick={handleMatchResolution}
          disabled={resolving || isArchiving}
          aria-busy={resolving}
          aria-label={`Mark ${item.title} as claimed and archive`}
        >
          {resolving ? (
            <><Loader2 size={13} className="spin-icon" /> Archiving…</>
          ) : (
            <><CheckCircle2 size={13} /> Mark Claimed &amp; Archive</>
          )}
        </button>
      )}
    </motion.article>
  );
}
