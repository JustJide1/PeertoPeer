import { body, param, query } from 'express-validator';

export const listCoursesValidators = [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('offset must be a non-negative integer'),
];

export const createCourseValidators = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('code').trim().notEmpty().withMessage('Course code is required'),
  body('description').optional().trim(),
];

export const updateCourseValidators = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('code').optional().trim().notEmpty().withMessage('Course code cannot be empty'),
  body('description').optional().trim(),
];

export const courseIdParamValidators = [param('id').isUUID().withMessage('Invalid course id')];
