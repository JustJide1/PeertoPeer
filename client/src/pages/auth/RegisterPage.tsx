import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import Spinner from '../../components/Spinner';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../lib/httpClient';
import {
  LEVEL_OPTIONS,
  registerSchema,
  type RegisterFormValues,
} from '../../lib/validation/authSchemas';
import AuthLayout from './AuthLayout';
import FormField, { inputClass } from './FormField';

export default function RegisterPage() {
  const { register: registerAccount } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', level: undefined, password: '', confirmPassword: '' },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null);
    try {
      await registerAccount({
        name: values.name,
        email: values.email,
        password: values.password,
        level: Number(values.level),
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err, 'Unable to create your account. Please try again.'));
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join coursemates in the Computer Science department for peer-to-peer learning."
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        {serverError && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {serverError}
          </p>
        )}

        <FormField label="Full name" htmlFor="name" error={errors.name?.message}>
          <input
            id="name"
            type="text"
            autoComplete="name"
            className={inputClass}
            {...registerField('name')}
          />
        </FormField>

        <FormField label="Email address" htmlFor="email" error={errors.email?.message}>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@bowen.edu.ng"
            className={inputClass}
            {...registerField('email')}
          />
        </FormField>

        <FormField label="Level" htmlFor="level" error={errors.level?.message}>
          <select id="level" className={inputClass} defaultValue="" {...registerField('level')}>
            <option value="" disabled>
              Select your level
            </option>
            {LEVEL_OPTIONS.map((level) => (
              <option key={level} value={level}>
                {level} Level
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Password" htmlFor="password" error={errors.password?.message}>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className={inputClass}
            {...registerField('password')}
          />
          <p className="mt-1 text-xs text-gray-500">
            At least 8 characters, including an uppercase letter and a number.
          </p>
        </FormField>

        <FormField
          label="Confirm password"
          htmlFor="confirmPassword"
          error={errors.confirmPassword?.message}
        >
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            className={inputClass}
            {...registerField('confirmPassword')}
          />
        </FormField>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting && <Spinner />}
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-blue-900 hover:text-blue-950">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
