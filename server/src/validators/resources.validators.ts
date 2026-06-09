import { body, param } from 'express-validator';

export const courseIdParamValidators = [param('courseId').isUUID().withMessage('Invalid course id')];

export const resourceIdParamValidators = [param('id').isUUID().withMessage('Invalid resource id')];

export const createResourceValidators = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
];
