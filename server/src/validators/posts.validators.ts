import { body, param, query } from 'express-validator';

export const forumIdParamValidators = [param('forumId').isUUID().withMessage('Invalid forum id')];

export const postIdParamValidators = [param('id').isUUID().withMessage('Invalid post id')];

export const listPostsValidators = [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('offset must be a non-negative integer'),
];

export const contentValidators = [
  body('content').trim().notEmpty().withMessage('Content is required'),
];
