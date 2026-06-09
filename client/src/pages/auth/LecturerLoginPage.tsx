import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Spinner from '../../components/Spinner';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../lib/httpClient';
import { loginSchema, type LoginFormValues } from '../../lib/validation/authSchemas';
import AuthLayout from './AuthLayout';
import FormField from './FormField';

const lecturerInputClass =
  'mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm ' +
  'focus:border-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-700';

export default function LecturerLoginPage() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  const redirectTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/dashboard';

  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      const user = await login(values);
      if (user.role !== 'LECTURER') {
        await logout();
        setServerError('This portal is for lecturers only. Please use the student login.');
        return;
      }
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err, 'Unable to log in. Please try again.'));
    }
  };

  return (
    <AuthLayout
      title="Lecturer Portal"
      subtitle="Sign in to manage your courses and students."
      variant="lecturer"
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        {serverError && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {serverError}
          </p>
        )}

        <FormField label="Email address" htmlFor="email" error={errors.email?.message}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={lecturerInputClass}
            {...registerField('email')}
          />
        </FormField>

        <FormField label="Password" htmlFor="password" error={errors.password?.message}>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className={lecturerInputClass}
            {...registerField('password')}
          />
        </FormField>

        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-slate-700 focus:ring-slate-700"
            {...registerField('rememberMe')}
          />
          Remember me
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting && <Spinner />}
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Not a lecturer?{' '}
        <Link to="/login" className="font-medium text-blue-900 hover:text-blue-950">
          Student login
        </Link>
      </p>
    </AuthLayout>
  );
}
