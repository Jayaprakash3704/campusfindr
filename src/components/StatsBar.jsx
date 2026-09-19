import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, PackageCheck, BadgeCheck } from 'lucide-react';

/**
 * Animated counter — counts from 0 to target with ease-out cubic.
 */
function useCountUp(target) {
  const [count, setCount] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    let start;
    const duration = 700;

    const animate = (ts) => {
      if (!start) start = ts;
      const elapsed  = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased    = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target]);

  return count;
}

const cardVariants = {
  hidden:  { opacity: 0, y: 14 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  }),
};

/**
 * Statistics bar — shows total lost, found, and resolved counts
 * with stagger entrance animation and animated count-up numbers.
 */
export default function StatsBar({ lostCount, foundCount, resolvedCount }) {
  const lost     = useCountUp(lostCount);
  const found    = useCountUp(foundCount);
  const resolved = useCountUp(resolvedCount);

  const stats = [
    {
      label: 'Active Lost',
      value: lost,
      ariaLabel: `${lostCount} lost items`,
      cardClass: 'stat-card lost-stat',
      iconClass: 'stat-icon lost',
      valueClass: 'stat-value lost',
      Icon: Search,
    },
    {
      label: 'Reported Found',
      value: found,
      ariaLabel: `${foundCount} found items`,
      cardClass: 'stat-card found-stat',
      iconClass: 'stat-icon found',
      valueClass: 'stat-value found',
      Icon: PackageCheck,
    },
    {
      label: 'Resolved',
      value: resolved,
      ariaLabel: `${resolvedCount} resolved`,
      cardClass: 'stat-card resolved-stat',
      iconClass: 'stat-icon primary',
      valueClass: 'stat-value primary',
      Icon: BadgeCheck,
    },
  ];

  return (
    <section className="stats-bar" aria-label="Dashboard statistics">
      {stats.map(({ label, value, ariaLabel, cardClass, iconClass, valueClass, Icon }, i) => (
        <motion.article
          key={label}
          className={cardClass}
          custom={i}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ y: -2, transition: { type: 'spring', stiffness: 350, damping: 22 } }}
        >
          <div className={iconClass} aria-hidden="true">
            <Icon size={18} strokeWidth={2} />
          </div>
          <div>
            <div className="stat-label">{label}</div>
            <div className={valueClass} aria-label={ariaLabel}>
              {value}
            </div>
          </div>
        </motion.article>
      ))}
    </section>
  );
}
