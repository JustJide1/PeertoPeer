import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export default function AuthLayout({
  title,
  subtitle,
  children,
  variant = 'student',
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  variant?: 'student' | 'lecturer';
}) {
  const headerBg = variant === 'lecturer' ? 'bg-slate-900' : 'bg-blue-950';
  const cardBorder = variant === 'lecturer'
    ? 'border border-gray-200 border-t-4 border-t-slate-700'
    : 'border border-gray-200';

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className={`${headerBg} text-white`}>
        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
          <Link to="/" className="text-lg font-semibold">
            Bowen P2P Learning
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className={`w-full max-w-md rounded-lg bg-white p-6 shadow-sm sm:p-8 ${cardBorder}`}>
          <h1 className="text-2xl font-bold text-blue-950">{title}</h1>
          <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
