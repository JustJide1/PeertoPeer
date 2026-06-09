import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../lib/authApi';
import FullPageSpinner from './FullPageSpinner';

export default function RoleGuard({ allow }: { allow: UserRole[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (!user || !allow.includes(user.role)) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-blue-950">Access restricted</h1>
        <p className="mt-2 text-sm text-gray-600">
          This page is only available to {allow.join(' and ').toLowerCase()} accounts.
        </p>
        <Link to="/dashboard" className="mt-4 inline-block text-sm font-medium text-blue-900 hover:text-blue-950">
          Back to dashboard
        </Link>
      </section>
    );
  }

  return <Outlet />;
}
