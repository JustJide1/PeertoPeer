import { z } from 'zod';

export const LEVEL_OPTIONS = ['100', '200', '300', '400'] as const;

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Enter a valid email address')
      .refine((value) => value.toLowerCase().endsWith('@bowen.edu.ng'), {
        message: 'Email must be a valid @bowen.edu.ng address',
      }),
    level: z.enum(LEVEL_OPTIONS, { errorMap: () => ({ message: 'Select your level' }) }),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must include an uppercase letter')
      .regex(/\d/, 'Password must include a number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
