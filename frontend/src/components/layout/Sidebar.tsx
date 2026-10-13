import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Shield,
  FileText,
  ClipboardList,
  Users,
  ScrollText,
  LogOut,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  /** extra paths that should also mark this item active */
  matchPaths?: string[];
  roles?: Array<'ADMIN' | 'REVIEWER' | 'CUSTOMER'>;
}

const BASE_NAV: NavItem[] = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: <LayoutDashboard size={16} />,
  },
  {
    label: 'Warranty Policies',
    to: '/policies',
    icon: <Shield size={16} />,
    matchPaths: ['/policies'],
  },
  {
    label: 'New Claim',
    to: '/claims/new',
    icon: <FileText size={16} />,
  },
  {
    label: 'Claim History',
    to: '/claims',
    icon: <ClipboardList size={16} />,
    matchPaths: ['/claims'],
  },
];

const REVIEWER_NAV: NavItem[] = [
  {
    label: 'Upload Policy',
    to: '/policies/upload',
    icon: <Upload size={16} />,
    roles: ['ADMIN', 'REVIEWER'],
  },
];

const ADMIN_NAV: NavItem[] = [
  {
    label: 'Users',
    to: '/admin/users',
    icon: <Users size={16} />,
    roles: ['ADMIN'],
  },
  {
    label: 'Audit Logs',
    to: '/admin/audit-logs',
    icon: <ScrollText size={16} />,
    roles: ['ADMIN'],
  },
];

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const avatarInitial = user?.username?.charAt(0).toUpperCase() ?? '?';
  const role = user?.role ?? 'CUSTOMER';

  /**
   * Determine if a nav item is "active".
   * We use startsWith so /claims/WR-XXXX marks "Claim History" active,
   * but /claims/new marks "New Claim" active (exact match wins).
   */
  function isActive(item: NavItem): boolean {
    const p = location.pathname;
    // Exact match wins for leaf routes like /claims/new or /policies/upload
    if (p === item.to) return true;
    // For /policies, match /policies/* but NOT /policies/upload (handled above)
    if (item.to === '/policies' && p.startsWith('/policies/') && p !== '/policies/upload') return true;
    // For /claims, match /claims/* but NOT /claims/new
    if (item.to === '/claims' && p.startsWith('/claims/') && p !== '/claims/new') return true;
    return false;
  }

  function NavItemLink({ item }: { item: NavItem }) {
    const active = isActive(item);
    return (
      <NavLink
        to={item.to}
        className={active ? 'nav-item active' : 'nav-item'}
        aria-current={active ? 'page' : undefined}
        end={item.to === '/claims'} // prevent /claims matching /claims/new
      >
        <span aria-hidden="true">{item.icon}</span>
        {item.label}
      </NavLink>
    );
  }

  return (
    <aside className="sidebar" aria-label="Main navigation">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-row">
          <div className="sidebar-logo-icon">
            <ShieldCheck size={17} color="#0d1526" aria-hidden="true" />
          </div>
          <div>
            <h1>WarrantyAssist</h1>
            <p>Eligibility Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav" aria-label="Main navigation links">
        <div className="nav-section-label">Main Menu</div>
        {BASE_NAV.map((item) => (
          <NavItemLink key={item.to} item={item} />
        ))}

        {/* Reviewer / Admin: upload shortcut */}
        {(role === 'ADMIN' || role === 'REVIEWER') && (
          <>
            <div className="nav-section-label" style={{ marginTop: 8 }}>Policy Tools</div>
            {REVIEWER_NAV.map((item) => (
              <NavItemLink key={item.to} item={item} />
            ))}
          </>
        )}

        {/* Admin section */}
        {role === 'ADMIN' && (
          <>
            <div className="nav-section-label" style={{ marginTop: 8 }}>Administration</div>
            {ADMIN_NAV.map((item) => (
              <NavItemLink key={item.to} item={item} />
            ))}
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar" aria-hidden="true">{avatarInitial}</div>
          <div style={{ minWidth: 0 }}>
            <div className="user-name truncate">{user?.username}</div>
            <div className="user-role">{role}</div>
          </div>
        </div>
        <button
          className="sidebar-signout"
          onClick={handleLogout}
          aria-label="Sign out"
        >
          <LogOut size={15} aria-hidden="true" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
