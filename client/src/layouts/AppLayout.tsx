import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  UserCircle,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import { useAuth } from '../context/AuthContext';
import { useBreadcrumbTrail, type BreadcrumbCrumb } from '../context/BreadcrumbContext';

const LEVEL_LABELS: Record<string, string> = {
  L100: '100 Level',
  L200: '200 Level',
  L300: '300 Level',
  L400: '400 Level',
};

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Pathname this item should be highlighted for; omit for deep-link shortcuts that shouldn't claim their own highlight. */
  matchPath?: string;
  matchPrefix?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, matchPath: '/dashboard' },
  { label: 'My Courses', href: '/dashboard#my-courses', icon: GraduationCap },
  { label: 'Browse Courses', href: '/courses', icon: BookOpen, matchPath: '/courses', matchPrefix: true },
  { label: 'Resources', href: '/resources', icon: FolderOpen, matchPath: '/resources' },
  { label: 'Profile', href: '/profile', icon: UserCircle, matchPath: '/profile', matchPrefix: true },
];

const STATIC_CRUMBS: Record<string, BreadcrumbCrumb[]> = {
  '/dashboard': [{ label: 'Dashboard' }],
  '/courses': [{ label: 'Courses' }],
  '/resources': [{ label: 'Resources' }],
  '/sessions': [{ label: 'Study Sessions' }],
  '/subjects': [{ label: 'Subjects' }],
};

function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (!item.matchPath) return false;
  if (item.matchPrefix) return pathname === item.matchPath || pathname.startsWith(`${item.matchPath}/`);
  return pathname === item.matchPath;
}

function NavLinks({ onNavigate, collapsed }: { onNavigate?: () => void; collapsed?: boolean }) {
  const location = useLocation();

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
      {NAV_ITEMS.map((item) => {
        const active = isNavItemActive(item, location.pathname);
        const Icon = item.icon;

        return (
          <Link
            key={item.label}
            to={item.href}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              active ? 'bg-blue-900 text-white' : 'text-gray-600 hover:bg-blue-900/10 hover:text-blue-900'
            }`}
          >
            <Icon size={20} className="flex-none" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function UserSummary({ collapsed }: { collapsed?: boolean }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="border-t border-gray-200 p-4">
      <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
        <Avatar name={user.name} size="sm" />
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-800">{user.name}</p>
            {user.level && (
              <span className="mt-0.5 inline-flex items-center rounded-full bg-blue-900/10 px-2 py-0.5 text-[10px] font-semibold text-blue-900">
                {LEVEL_LABELS[user.level] ?? user.level}
              </span>
            )}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => void handleLogout()}
        title={collapsed ? 'Log out' : undefined}
        className={`mt-3 flex w-full items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 ${
          collapsed ? 'justify-center' : ''
        }`}
      >
        <LogOut size={16} />
        {!collapsed && 'Log out'}
      </button>
    </div>
  );
}

function Breadcrumbs() {
  const location = useLocation();
  const registeredTrail = useBreadcrumbTrail();
  const trail = registeredTrail ?? STATIC_CRUMBS[location.pathname] ?? null;

  if (!trail || trail.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
      {trail.map((crumb, index) => {
        const isLast = index === trail.length - 1;
        return (
          <span key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
            {index > 0 && <ChevronRight size={14} className="text-gray-300" />}
            {crumb.to && !isLast ? (
              <Link to={crumb.to} className="transition-colors hover:text-blue-900">
                {crumb.label}
              </Link>
            ) : (
              <span className={isLast ? 'font-medium text-blue-950' : ''}>{crumb.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

export default function AppLayout() {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside
        className={`sticky top-0 hidden h-screen flex-none flex-col border-r border-gray-200 bg-white transition-[width] duration-200 md:flex ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-4">
          <GraduationCap className="flex-none text-blue-900" size={28} />
          {!isCollapsed && <span className="truncate text-lg font-bold text-blue-900">Bowen P2P</span>}
        </div>

        <NavLinks collapsed={isCollapsed} />

        <button
          type="button"
          onClick={() => setIsCollapsed((collapsed) => !collapsed)}
          className="flex items-center gap-2 border-t border-gray-200 px-4 py-3 text-sm text-gray-500 transition-colors hover:text-blue-900"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!isCollapsed && 'Collapse'}
        </button>

        <UserSummary collapsed={isCollapsed} />
      </aside>

      {/* Mobile slide-out drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative flex h-full w-72 max-w-[85%] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="text-blue-900" size={26} />
                <span className="text-lg font-bold text-blue-900">Bowen P2P</span>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                aria-label="Close menu"
                className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={22} />
              </button>
            </div>

            <NavLinks onNavigate={() => setIsDrawerOpen(false)} />

            <UserSummary />
          </aside>
        </div>
      )}

      {/* Right column: mobile top navbar + page content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Open menu"
            className="rounded-md p-1.5 text-blue-900 transition-colors hover:bg-blue-900/10"
          >
            <Menu size={22} />
          </button>

          <Link to="/dashboard" className="flex items-center gap-2">
            <GraduationCap className="text-blue-900" size={22} />
            <span className="font-bold text-blue-900">Bowen P2P</span>
          </Link>

          <Link to="/profile" aria-label="Your profile">
            <Avatar name={user?.name ?? '?'} size="sm" />
          </Link>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Breadcrumbs />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
