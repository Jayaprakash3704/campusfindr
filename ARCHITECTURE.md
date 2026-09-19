# CampusFindr — Codebase Guide & Architecture

This document serves as a comprehensive guide to understanding the CampusFindr codebase. It covers the system architecture, frontend and backend structures, data models, routing, and Role-Based Access Control (RBAC).

---

## 1. High-Level Architecture

CampusFindr is a full-stack MERN application (MongoDB, Express, React, Node.js):
- **Frontend**: React 19 single-page application powered by Vite, utilizing `react-router-dom` for navigation, `framer-motion` for animations, and `lucide-react` for icons.
- **Backend**: Node.js/Express REST API serving JSON.
- **Database**: MongoDB via Mongoose ORM.
- **Security**: JWT-based stateless authentication, bcrypt for password hashing, rate limiting for endpoints, and HTML sanitization for XSS prevention.

---

## 2. Directory Structure

```text
campusfindr/
├── server/
│   ├── index.js             # Express app entry point & server configuration
│   ├── config/              # DB connection logic
│   ├── controllers/         # Request handlers (authController, itemController)
│   ├── middleware/          # Express middlewares (auth guards, validators)
│   ├── models/              # Mongoose schemas (User, Item)
│   └── routes/              # Express API routing definitions
├── src/
│   ├── main.jsx             # React DOM entry point
│   ├── App.jsx              # Routing and Context Providers
│   ├── index.css / App.css  # Global design system and component styles
│   ├── components/          # Reusable UI components (Navbar, ItemCard, etc.)
│   ├── config/              # Frontend configuration (statusConfig.js)
│   ├── contexts/            # Global React Contexts (AuthContext, ThemeContext)
│   ├── hooks/               # Custom React hooks (useItems.js)
│   ├── pages/               # Top-level page components (views)
│   └── services/            # Axios API client functions (api.js)
```

---

## 3. Data Models (Database)

### User Model (`server/models/User.js`)
Handles authentication and RBAC.
- **Fields**: `name`, `email` (unique), `password` (hashed), `role` (`user`, `admin`, `superadmin`), `rollOrEmployeeId`, `isActive`.
- **Logic**: Uses a `pre('save')` hook to automatically hash passwords with bcrypt. Contains a `matchPassword` instance method for login verification.

### Item Model (`server/models/Item.js`)
Stores all lost and found reports.
- **Fields**: `reporterId` (links to the submitter), `type` (personal/institutional), `reportType` (lost/found), `title`, `category`, `description`, `location`, `status` (`unclaimed`/`claimed`), `metadata` (serial number, department).
- **Warden Logs**: Tracks resolution metadata (`resolvedByWarden`, `resolvedAt`, `matchedWithId`).
- **Indexes**: Compound index on `{ status: 1, reportType: 1, timestamp: -1 }` to optimize dashboard feed queries.

---

## 4. Frontend State & Contexts

### `AuthContext`
Manages the user session globally.
- **State**: `user` object, `isAuthenticated` boolean, `loading` state.
- **Flow**: On mount, it checks `localStorage` for a JWT token (`cf_token`). If found, it fetches the user profile (`/auth/me`). Provides `login()` and `logout()` functions to all components.

### `ThemeContext`
Manages Light/Dark mode.
- **State**: `theme` string (`light` or `dark`).
- **Flow**: Initializes based on `localStorage` or `window.matchMedia('(prefers-color-scheme: dark)')`. Toggles the `data-theme` attribute on the `<html>` element, which dynamically updates CSS Custom Properties globally.

### `useItems` Hook
Manages the live feed of lost and found items.
- **Features**: Fetches active items on mount, manages `loading`/`error` states, and sets up a background polling interval (`30s`) to keep the feed fresh without manual reloads. Provides `addItem` and `removeItem` functions for optimistic UI updates.

---

## 5. Role-Based Access Control (RBAC) & Routing

The application strictly separates capabilities across three roles: `user` (Student), `admin` (Warden), and `superadmin`.

### Backend Enforcement
- **`protect` Middleware**: Verifies the JWT token and attaches the active `User` document to the `req` object.
- **`requireRole(...roles)` Middleware**: Blocks access if the authenticated user's role isn't in the provided array.
- **Example**: `/api/v1/auth/admins` is protected by `requireRole('superadmin')`.

### Frontend Routing (`App.jsx`)
- **`RoleRedirect`**: A smart redirect at the root (`/`) that sends authenticated users to their correct home page (`/dashboard` for students, `/warden` for wardens, `/admin` for superadmins).
- **`RouteGuard`**: A component wrapper that protects routes. If a user navigates to an unauthorized URL, they are bounced back to their designated home screen.

### Distinct Role Views
1. **Student (`DashboardPage.jsx`)**:
   - **Browse**: Read-only feed of all active items.
   - **My Reports**: Displays only items submitted by the student (fetched via `/items/mine`), including pending/resolved status badges.
   - *Cannot see resolve controls or admin panels.*

2. **Warden (`WardenDashboard.jsx`)**:
   - **Live Feed**: Sees all active items with an actionable "Mark Claimed & Archive" button on every card.
   - **Stats Bar**: Operational oversight of active and resolved counts today.

3. **Super Admin (`AdminPanel.jsx`)**:
   - **Global Stats**: 6 top-level metric cards detailing platform engagement (total users, resolution rate, etc.).
   - **Warden Management**: Capability to provision and deactivate warden (`admin`) accounts.

---

## 6. Design System & Styling

- **Configuration**: Defined entirely in `src/index.css`. Uses semantic CSS variables (e.g., `--clr-lost`, `--clr-found`, `--clr-surface`) mapped to specific colors.
- **Theming**: The `[data-theme="dark"]` selector re-assigns the color variables for dark mode seamlessly.
- **Consistency**: Status colors and labels are centralized in `src/config/statusConfig.js`, ensuring the backend enums match the frontend UI perfectly without hardcoded strings.
- **Animations**: Driven by `framer-motion` for layout transitions (like staggered item cards and spring-based modals) and vanilla CSS keyframes for continuous animations (like the skeleton shimmer).

---

## 7. Security Hardening

- **XSS Prevention**: `server/middleware/validate.js` strips all HTML tags and entities from text inputs.
- **NoSQL Injection**: Express router middleware (`guardObjectId`) strictly validates all URL parameters to prevent malformed CastErrors.
- **Rate Limiting**: `express-rate-limit` is applied to `/auth/login`, `/auth/signup`, and `/items/report` to prevent brute force and spam attacks.
- **Duplicate Spam**: The `createReport` controller enforces a 60-second cooldown on submitting identical report titles from the same user.
