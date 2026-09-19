/**
 * CampusFindr — Single source of truth for status and role display config.
 *
 * Every status badge, role badge, and color in the UI should derive from here.
 * Import STATUS_CONFIG or ROLE_CONFIG rather than hard-coding colors inline.
 */

// Lucide icon names are referenced as strings so callers can import
// the specific icon component they need.
export const STATUS_CONFIG = {
  lost: {
    label: 'Lost',
    colorVar: 'var(--clr-lost)',
    dimVar:   'var(--clr-lost-dim)',
    borderVar:'var(--clr-lost-border)',
    iconName: 'Search',        // lucide-react
    cssClass: 'status-lost',
  },
  found: {
    label: 'Found',
    colorVar: 'var(--clr-found)',
    dimVar:   'var(--clr-found-dim)',
    borderVar:'var(--clr-found-border)',
    iconName: 'PackageCheck',
    cssClass: 'status-found',
  },
  claimed: {
    label: 'Claimed',
    colorVar: 'var(--clr-claimed)',
    dimVar:   'var(--clr-claimed-dim)',
    borderVar:'rgba(109,76,126,0.20)',
    iconName: 'CheckCircle2',
    cssClass: 'status-claimed',
  },
  resolved: {
    label: 'Resolved',
    colorVar: 'var(--clr-resolved)',
    dimVar:   'var(--clr-resolved-dim)',
    borderVar:'rgba(45,122,58,0.20)',
    iconName: 'ShieldCheck',
    cssClass: 'status-resolved',
  },
  archived: {
    label: 'Archived',
    colorVar: 'var(--clr-archived)',
    dimVar:   'var(--clr-archived-dim)',
    borderVar:'rgba(107,114,128,0.20)',
    iconName: 'Archive',
    cssClass: 'status-archived',
  },
  unclaimed: {
    label: 'Active',
    colorVar: 'var(--clr-resolved)',
    dimVar:   'var(--clr-resolved-dim)',
    borderVar:'rgba(45,122,58,0.20)',
    iconName: 'Activity',
    cssClass: 'status-active',
  },
};

export const ROLE_CONFIG = {
  superadmin: {
    label:    'Super Admin',
    colorVar: 'var(--clr-superadmin)',
    dimVar:   'var(--clr-superadmin-dim)',
    cssClass: 'role-superadmin',
    iconName: 'ShieldAlert',
  },
  admin: {
    label:    'Warden',
    colorVar: 'var(--clr-admin)',
    dimVar:   'var(--clr-admin-dim)',
    cssClass: 'role-admin',
    iconName: 'Shield',
  },
  user: {
    label:    'Student',
    colorVar: 'var(--clr-user)',
    dimVar:   'var(--clr-user-dim)',
    cssClass: 'role-user',
    iconName: 'GraduationCap',
  },
};

export const CATEGORY_CONFIG = {
  'Electronics':  { iconName: 'Laptop',      label: 'Electronics' },
  'Documents':    { iconName: 'FileText',     label: 'Documents' },
  'Wallets/Bags': { iconName: 'ShoppingBag',  label: 'Wallets / Bags' },
  'Books':        { iconName: 'BookOpen',     label: 'Books' },
  'Sports Gear':  { iconName: 'Trophy',       label: 'Sports Gear' },
  'Keys':         { iconName: 'Key',          label: 'Keys' },
  'Other':        { iconName: 'Package',      label: 'Other' },
};

export const ITEM_CATEGORIES = Object.keys(CATEGORY_CONFIG);
