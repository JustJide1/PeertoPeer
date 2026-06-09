import { body, param } from 'express-validator';

export const courseIdParamValidators = [param('courseId').isUUID().withMessage('Invalid course id')];

export const forumIdParamValidators = [param('id').isUUID().withMessage('Invalid forum id')];

export const createForumValidators = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').optional().trim(),
];
