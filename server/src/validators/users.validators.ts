import { body, param, query } from 'express-validator';
import { PASSWORD_PATTERN } from '../utils/password';

export const userIdParamValidators = [param('id').isUUID().withMessage('Invalid user id')];

export const updateCurrentUserValidators = [
  body('name').trim().notEmpty().withMessage('Name is required'),
];

export const changePasswordValidators = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .bail()
    .matches(PASSWORD_PATTERN)
    .withMessage('New password must be at least 8 characters and include an uppercase letter and a number'),
];

export const paginationValidators = [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('offset must be a non-negative integer'),
];
